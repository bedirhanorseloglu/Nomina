"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, CheckCircle2, Moon, Sun, ArrowLeft, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { loadPlannerYeniden } from "@/lib/firebaseService";
import { format } from "date-fns";
import { getStudyDate } from "@/lib/dateUtils";
import AppleEmoji from "@/components/AppleEmoji";

type SetupStep = "mode" | "duration";
type ExamMode = "genel" | "brans" | null;
type Subject = { id: string; name: string; emoji: string; defaultDuration: number; color: string };

const SUBJECTS: Subject[] = [
  { id: "turkce", name: "Türkçe", emoji: "📘", defaultDuration: 45, color: "#fa5fea" },
  { id: "matematik", name: "Matematik", emoji: "🔢", defaultDuration: 50, color: "#af52de" },
  { id: "tarih", name: "Tarih", emoji: "🏛️", defaultDuration: 15, color: "#ff9500" },
  { id: "cografya", name: "Coğrafya", emoji: "🗺️", defaultDuration: 10, color: "#10B981" },
  { id: "vatandaslik", name: "Vatandaşlık", emoji: "⚖️", defaultDuration: 5, color: "#5856d6" },
];

export default function ExamSimulatorPage() {
  const router = useRouter();
  
  // Setup States
  const [setupStep, setSetupStep] = useState<SetupStep>("mode");
  const [examMode, setExamMode] = useState<ExamMode>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [customDuration, setCustomDuration] = useState<number>(130);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(130 * 60);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [realStartTimeSeconds, setRealStartTimeSeconds] = useState(36900); // 10:15 default

  const { user } = useAuth();
  const [, setDailyGoalTarget] = useState(0);
  const [, setTodaySolved] = useState(0);
  
  const today = format(getStudyDate(), "yyyy-MM-dd");

  useEffect(() => {
    const fetchGoal = async () => {
      if (user?.uid) {
        const data = await loadPlannerYeniden(user.uid);
        if (data) {
          setDailyGoalTarget(data.dailyGoalTarget || 0);
          setTodaySolved(data.dailyGoals?.[today] || 0);
        }
      }
    };
    fetchGoal();
  }, [user, today]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasStarted && !isFinished) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasStarted, isFinished]);

  useEffect(() => {
    if ((hasStarted || countdown !== null) && !isFinished) {
      document.body.classList.add("simulator-active");
    } else {
      document.body.classList.remove("simulator-active");
    }

    return () => {
      document.body.classList.remove("simulator-active");
    };
  }, [hasStarted, countdown, isFinished]);

  useEffect(() => {
    if (!hasStarted || isFinished) return;
    
    if (timeLeft <= 0) {
      setIsFinished(true);
      if (typeof window !== "undefined" && document.fullscreenElement) {
        document.exitFullscreen().catch(e => console.log(e));
      }
      document.body.classList.remove("simulator-active");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeLeft, isFinished]);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      setHasStarted(true);
    }
  }, [countdown]);

  const startExam = async () => {
    setTimeLeft(customDuration * 60);
    if (examMode === "brans") {
      const now = new Date();
      setRealStartTimeSeconds(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
    } else {
      setRealStartTimeSeconds(36900); // 10:15
    }
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.log("Fullscreen not supported", e);
    }
    setCountdown(3);
  };

  const forceExit = async () => {
    if (typeof window !== "undefined" && document.fullscreenElement) {
      await document.exitFullscreen().catch(e => console.log(e));
    }
    document.body.classList.remove("simulator-active");
    setHasStarted(false);
    setIsFinished(false);
    router.push("/");
  };

  const finishExam = async () => {
    setIsFinished(true);
    if (typeof window !== "undefined" && document.fullscreenElement) {
      await document.exitFullscreen().catch(e => console.log(e));
    }
    document.body.classList.remove("simulator-active");
  };

  const handleSaveResults = async () => {
    if (typeof window !== "undefined" && document.fullscreenElement) {
      await document.exitFullscreen().catch(e => console.log(e));
    }
    document.body.classList.remove("simulator-active");
    setHasStarted(false);
    setIsFinished(false);
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    router.push(examMode === "brans" ? `/deneme?mode=brans&subject=${selectedSubject?.id}&duration=${elapsedMinutes}` : `/deneme?mode=genel&duration=${elapsedMinutes}`);
  };

  const handleReturnHome = async () => {
    if (typeof window !== "undefined" && document.fullscreenElement) {
      await document.exitFullscreen().catch(e => console.log(e));
    }
    document.body.classList.remove("simulator-active");
    setHasStarted(false);
    setIsFinished(false);
    router.push("/");
  };

  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  
  const formatDigit = (d: number) => d.toString().padStart(2, "0");

  const totalExamSeconds = customDuration * 60;
  const elapsedSeconds = totalExamSeconds - timeLeft;
  const currentSimulatedSeconds = realStartTimeSeconds + elapsedSeconds;

  const progressPercentage = (elapsedSeconds / totalExamSeconds) * 100;

  // Finished Screen
  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 fixed inset-0 z-50">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
          className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-[2.5rem] border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-[#58cc02] text-white border-2 border-b-4 border-[#58cc02] border-b-[#46a302] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-3">Süre Doldu!</h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold mb-8 leading-relaxed text-sm">
            Harika bir odaklanmaydı! Gerçek bir sınav deneyimi yaşadın. Şimdi derin bir nefes al ve sonuçlarını deneme merkezine kaydet.
          </p>
          <button 
            type="button"
            onClick={handleSaveResults} 
            className="w-full bg-[#58cc02] text-white border-2 border-b-4 border-[#58cc02] border-b-[#46a302] hover:bg-[#4ecc00] font-black py-4 rounded-2xl shadow-xs transition-all active:translate-y-0.5 text-base cursor-pointer"
          >
            Sonuçları Kaydet
          </button>
          <button 
            type="button"
            onClick={handleReturnHome} 
            className="w-full mt-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white border-2 border-b-4 border-slate-200 dark:border-slate-600 hover:bg-slate-200 font-black py-3.5 rounded-2xl transition-all active:translate-y-0.5 text-base cursor-pointer"
          >
            Anasayfaya Dön
          </button>
        </motion.div>
      </div>
    );
  }

  // Countdown Screen
  if (countdown !== null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white fixed inset-0 z-50">
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-[15rem] font-black tabular-nums tracking-tighter"
        >
          {countdown}
        </motion.div>
      </div>
    );
  }

  // Setup Screen (Ne Çözeceksin?)
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center p-6 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-500 pt-24">
        
        {/* Header Bar */}
        <div className="w-full max-w-4xl flex items-center justify-between z-10 mb-8">
           <button 
             type="button"
             onClick={() => setupStep === "mode" ? router.back() : setSetupStep("mode")}
             className="bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-2.5 font-black text-xs text-slate-700 dark:text-slate-200 shadow-2xs hover:border-[#1cb0f6] dark:hover:border-[#1cb0f6] active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
           >
             <ArrowLeft className="w-4 h-4 text-[#1cb0f6]" />
             <span>Geri</span>
           </button>

           {/* 3D ÖSYM Odak Modu Badge */}
           <div className="bg-[#e8f7ff] dark:bg-[#1cb0f6]/10 border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] rounded-2xl px-5 py-2.5 font-black text-xs text-[#1cb0f6] flex items-center gap-2 shadow-2xs">
             <AppleEmoji emoji="🛡️" size={18} />
             <span>ÖSYM ODAK MODU</span>
           </div>
        </div>

        <div className="relative z-10 w-full max-w-4xl flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {setupStep === "mode" && (
              <motion.div 
                key="step-mode"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center text-center mt-6"
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <AppleEmoji emoji="⏱️" size={40} />
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-800 dark:text-white">
                    Ne Çözeceksin?
                  </h1>
                </div>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-10 max-w-xl font-semibold leading-relaxed">
                  Odaklanmak istediğin sınav tipini seç. Simülatör seni dış dünyadan soyutlayarak gerçek bir sınav atmosferi yaşatacak.
                </p>

                {/* 3D Selection Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
                  {/* Genel Deneme Card (Mavi) */}
                  <button 
                    type="button"
                    onClick={() => {
                      setExamMode("genel");
                      setCustomDuration(130);
                      setSetupStep("duration");
                    }}
                    className="group bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border-2 border-b-6 border-slate-200 dark:border-slate-700 shadow-sm hover:border-[#1cb0f6] hover:border-b-[#1899d6] dark:hover:border-[#1cb0f6] dark:hover:border-b-[#1899d6] hover:shadow-xl hover:-translate-y-1 transition-all text-center flex flex-col items-center justify-between h-full cursor-pointer block"
                  >
                    <div className="flex flex-col items-center text-center gap-5 w-full">
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#1cb0f6] text-white border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform mx-auto">
                        <AppleEmoji emoji="🌍" size={38} className="text-white" />
                      </div>
                      <div className="w-full">
                        <h3 className="text-2xl font-black mb-2 text-slate-800 dark:text-white group-hover:text-[#1cb0f6] transition-colors">
                          Genel Deneme
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                          120 soru, 130 dakika. Tam teşekküllü GY-GK KPSS provası.
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center justify-center gap-2 bg-[#1cb0f6] text-white hover:bg-[#159ee0] font-black px-6 py-3 rounded-2xl text-xs border-2 border-b-4 border-[#1899d6] shadow-xs group-hover:scale-105 group-active:translate-y-0.5 transition-all mx-auto mt-6 cursor-pointer">
                      <span>Seç & Başlat</span>
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </button>

                  {/* Branş Denemesi Card (Yeşil) */}
                  <button 
                    type="button"
                    onClick={() => {
                      setExamMode("brans");
                      setSelectedSubject(SUBJECTS[0]);
                      setCustomDuration(SUBJECTS[0].defaultDuration);
                      setSetupStep("duration");
                    }}
                    className="group bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border-2 border-b-6 border-slate-200 dark:border-slate-700 shadow-sm hover:border-[#58cc02] hover:border-b-[#46a302] dark:hover:border-[#58cc02] dark:hover:border-b-[#46a302] hover:shadow-xl hover:-translate-y-1 transition-all text-center flex flex-col items-center justify-between h-full cursor-pointer block"
                  >
                    <div className="flex flex-col items-center text-center gap-5 w-full">
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#58cc02] text-white border-2 border-b-4 border-[#58cc02] border-b-[#46a302] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform mx-auto">
                        <AppleEmoji emoji="🎯" size={38} className="text-white" />
                      </div>
                      <div className="w-full">
                        <h3 className="text-2xl font-black mb-2 text-slate-800 dark:text-white group-hover:text-[#58cc02] transition-colors">
                          Branş Denemesi
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                          Spesifik bir derse odaklan. Süreni konuya göre sen belirle.
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center justify-center gap-2 bg-[#58cc02] text-white hover:bg-[#4ecc00] font-black px-6 py-3 rounded-2xl text-xs border-2 border-b-4 border-[#46a302] shadow-xs group-hover:scale-105 group-active:translate-y-0.5 transition-all mx-auto mt-6 cursor-pointer">
                      <span>Dersi Seç</span>
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {setupStep === "duration" && (
              <motion.div 
                key="step-duration"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center mt-6 w-full max-w-3xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-slate-800 dark:text-white flex items-center justify-center gap-3">
                    <AppleEmoji emoji="⏱️" size={32} />
                    <span>{examMode === "genel" ? "Sınav Süresi" : "Süreni Belirle"}</span>
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                    {examMode === "genel"
                      ? "Genel deneme süresi gerçek KPSS (ÖSYM) sınav formatında sabit 130 dakikadır."
                      : "Çözeceğin branşı seç veya doğrudan süreni gir."}
                  </p>
                </div>

                {/* 3D Subject Selector Pills (Branş Denemesi için) */}
                {examMode === "brans" && (
                  <div className="flex flex-wrap justify-center gap-3 mb-8 w-full max-w-2xl">
                    {SUBJECTS.map((sub) => {
                      const isSelected = selectedSubject?.id === sub.id;

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setSelectedSubject(sub);
                            setCustomDuration(sub.defaultDuration);
                          }}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer border-2 border-b-4 active:translate-y-0.5 shadow-2xs ${
                            isSelected
                              ? "scale-105 shadow-xs"
                              : "bg-white dark:bg-slate-800 border-slate-200 border-b-slate-300 dark:border-slate-700 dark:border-b-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                          style={isSelected ? {
                            backgroundColor: `${sub.color}20`,
                            borderColor: `${sub.color}`,
                            borderBottomColor: `${sub.color}`,
                            color: sub.color
                          } : undefined}
                        >
                          <AppleEmoji emoji={sub.emoji} size={16} color={sub.color} />
                          <span>{sub.name} ({sub.defaultDuration} Dk)</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 3D Duration Card */}
                {examMode === "genel" ? (
                  /* Genel Deneme: Sabit 130 Dakika Kartı */
                  <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 sm:p-10 border-2 border-b-6 border-slate-200 dark:border-slate-700 shadow-md w-full max-w-md mx-auto text-center mb-8">
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#1cb0f6] border-2 border-b-2 border-sky-200 dark:border-sky-800 font-black text-xs uppercase tracking-widest mb-6 shadow-2xs">
                      <AppleEmoji emoji="🔒" size={14} color="#1cb0f6" />
                      <span>Sabit Sınav Süresi</span>
                    </div>

                    <div className="flex flex-col items-center justify-center my-3 select-none">
                      <span className="text-7xl font-black text-[#1cb0f6] tracking-tight font-mono leading-none">
                        130
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-2.5">
                        DAKİKA (2 SAAT 10 DK)
                      </span>
                    </div>

                    <div className="mt-6 px-4 py-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 text-slate-700 dark:text-slate-300 border-2 border-b-2 border-sky-200 dark:border-sky-900/60 text-xs font-bold text-center shadow-2xs">
                      <span>Genel deneme süresi gerçek KPSS sınavı ile birebir sabit 130 dakikadır.</span>
                    </div>
                  </div>
                ) : (
                  /* Branş Denemesi: Ayarlanabilir Sayaç Kartı */
                  <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 sm:p-10 border-2 border-b-6 border-slate-200 dark:border-slate-700 shadow-md w-full max-w-md mx-auto text-center mb-8">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-2 border-b-2 border-slate-200 dark:border-slate-600/80 font-black text-xs uppercase tracking-widest mb-6">
                      <span>Özel Branş Süresi</span>
                    </div>

                    <div className="flex items-center justify-center gap-6 my-2">
                      <button 
                        type="button"
                        onClick={() => setCustomDuration(Math.max(5, customDuration - 5))}
                        disabled={customDuration <= 5}
                        className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700/80 border-2 border-b-4 border-slate-200 border-b-slate-300 dark:border-slate-600 dark:border-b-slate-700 text-slate-700 dark:text-white font-black text-2xl hover:bg-slate-200 dark:hover:bg-slate-600 active:translate-y-0.5 transition-all flex items-center justify-center shadow-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer select-none"
                        title="Süreyi 5 Dk Azalt"
                      >
                        -
                      </button>
                      <div className="flex flex-col items-center justify-center min-w-[120px] select-none">
                        <span className="text-6xl font-black text-slate-800 dark:text-white tracking-tight font-mono">
                          {customDuration}
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">
                          DAKİKA
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setCustomDuration(customDuration + 5)}
                        className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700/80 border-2 border-b-4 border-slate-200 border-b-slate-300 dark:border-slate-600 dark:border-b-slate-700 text-slate-700 dark:text-white font-black text-2xl hover:bg-slate-200 dark:hover:bg-slate-600 active:translate-y-0.5 transition-all flex items-center justify-center shadow-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer select-none"
                        title="Süreyi 5 Dk Artır"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* 3D Start Button */}
                <button 
                  type="button"
                  onClick={startExam}
                  disabled={customDuration <= 0}
                  className="bg-[#1cb0f6] border-2 border-b-6 border-[#1899d6] hover:bg-[#159ee0] text-white font-black text-lg py-4 px-8 rounded-2xl w-full max-w-md shadow-lg active:translate-y-0.5 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Sınavı Başlat</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Active Simulator Room Screen
  return (
    <div className={`min-h-screen w-full flex flex-col relative select-none transition-colors duration-700 font-sans ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Minimal Header */}
      <header className="w-full p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-[#1cb0f6] text-white border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] flex items-center justify-center shadow-xs">
             <AppleEmoji emoji="⏱️" size={20} className="text-white" />
           </div>
           <div>
             <div className="font-black tracking-widest text-[10px] uppercase text-slate-400">Odak Odası</div>
             <div className="text-sm font-black">{examMode === "genel" ? "Genel Deneme" : selectedSubject?.name + " Denemesi"}</div>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-10 h-10 rounded-2xl border-2 border-b-4 flex items-center justify-center shadow-2xs hover:scale-105 active:translate-y-0.5 transition-all cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
          >
            <AppleEmoji emoji={isDarkMode ? '☀️' : '🌙'} size={18} />
          </button>
          
          <button 
            type="button"
            onClick={() => setShowExitWarning(true)}
            className="font-black px-5 py-2.5 rounded-2xl text-xs bg-red-50 dark:bg-red-500/10 text-[#ff4b4b] border-2 border-b-4 border-[#ff4b4b] border-b-[#e03030] shadow-2xs active:translate-y-0.5 transition-all cursor-pointer"
          >
            Sınavı Bitir
          </button>
        </div>
      </header>

      {/* Main Focus Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-6 pb-20 z-10">
        
        {/* Analog Clock */}
        <div className="relative flex items-center justify-center mb-10">
           <div className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-[10px] flex items-center justify-center shadow-2xl transition-all duration-700 ${isDarkMode ? 'border-slate-800 bg-slate-900 shadow-[0_0_80px_rgba(30,41,59,0.5)]' : 'border-slate-200 bg-white shadow-xl'}`}>
             
             <div className={`absolute inset-2 rounded-full border-2 ${isDarkMode ? 'border-slate-800/50' : 'border-slate-100'}`} />

             {/* Clock Markers */}
             {[...Array(60)].map((_, i) => (
               <div
                 key={i}
                 className="absolute w-full h-full p-3 sm:p-4"
                 style={{ transform: `rotate(${i * 6}deg)` }}
               >
                 <div className={`mx-auto rounded-full ${i % 5 === 0 ? 'w-1.5 h-4 sm:h-5' : 'w-1 h-2'} ${isDarkMode ? (i % 5 === 0 ? 'bg-slate-500' : 'bg-slate-700') : (i % 5 === 0 ? 'bg-slate-400' : 'bg-slate-200')}`} />
               </div>
             ))}

             {/* Hour Hand */}
             <motion.div
               className="absolute w-2 sm:w-2.5 rounded-full origin-bottom"
               style={{ bottom: '50%', height: '22%', backgroundColor: isDarkMode ? '#f8fafc' : '#0f172a' }}
               initial={{ rotate: (currentSimulatedSeconds / 3600) * 30 }}
               animate={{ rotate: (currentSimulatedSeconds / 3600) * 30 }}
               transition={{ type: "tween", ease: "linear", duration: 0.5 }}
             />

             {/* Minute Hand */}
             <motion.div
               className="absolute w-1.5 sm:w-2 rounded-full origin-bottom"
               style={{ bottom: '50%', height: '35%', backgroundColor: isDarkMode ? '#94a3b8' : '#64748b' }}
               initial={{ rotate: (currentSimulatedSeconds / 60) * 6 }}
               animate={{ rotate: (currentSimulatedSeconds / 60) * 6 }}
               transition={{ type: "tween", ease: "linear", duration: 0.5 }}
             />

             {/* Second Hand */}
             <motion.div
               className="absolute w-1 sm:w-1.5 bg-[#ff4b4b] rounded-full origin-bottom"
               style={{ bottom: '50%', height: '42%' }}
               initial={{ rotate: currentSimulatedSeconds * 6 }}
               animate={{ rotate: currentSimulatedSeconds * 6 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
             />

             <div className="absolute w-5 h-5 bg-[#ff4b4b] rounded-full border-4 z-10 transition-colors duration-700" style={{ borderColor: isDarkMode ? '#0f172a' : '#ffffff' }} />
           </div>
        </div>

        {/* Digital Clock */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <span className="text-xs font-black uppercase tracking-[0.2em] mb-2 text-slate-400">
            Kalan Süre
          </span>
          <div className={`text-6xl sm:text-7xl font-black font-mono tracking-tighter tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            {hours > 0 && `${formatDigit(hours)}:`}{formatDigit(mins)}:{formatDigit(secs)}
          </div>
          
          <div className={`mt-4 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-b-2 shadow-2xs ${isDarkMode ? 'bg-slate-900 text-slate-200 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            %{Math.floor(progressPercentage)} Tamamlandı
          </div>
        </div>

        {/* Real Exam Timeline Card */}
        <div className={`w-full max-w-md p-6 rounded-3xl border-2 border-b-4 flex items-center justify-between transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white shadow-xl' : 'bg-white border-slate-200 border-b-slate-300 text-slate-800 shadow-xs'}`}>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest font-black mb-1 text-slate-400">Başlangıç</div>
            <div className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {formatDigit(Math.floor(realStartTimeSeconds / 3600) % 24)}:{formatDigit(Math.floor(realStartTimeSeconds % 3600 / 60))}
            </div>
          </div>
          
          <div className="flex-1 flex items-center px-4">
            <div className={`h-2 w-full rounded-full relative overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div 
                className="absolute top-0 left-0 h-full bg-[#1cb0f6] transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest font-black mb-1 text-slate-400">Bitiş</div>
            <div className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {formatDigit(Math.floor((realStartTimeSeconds + customDuration * 60) / 3600) % 24)}:{formatDigit(Math.floor((realStartTimeSeconds + customDuration * 60) % 3600 / 60))}
            </div>
          </div>
        </div>
        
      </main>

      {/* Exit Warning Dialog */}
      <AnimatePresence>
        {showExitWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
              className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-[2.5rem] border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-[#ff4b4b] border-2 border-b-4 border-[#ff4b4b] border-b-[#e03030] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xs">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Pes mi ediyorsun?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-semibold mb-6 leading-relaxed text-xs">
                Odaklanmayı şimdi bırakırsan sınav atmosferinden kopacaksın.<br/>
                <span className="block mt-3 text-[10px] uppercase tracking-widest font-black text-slate-400">Kalan Süreniz</span>
                <strong className="text-slate-800 dark:text-white text-3xl block mt-1 font-mono tracking-tighter tabular-nums">{hours > 0 ? `${formatDigit(hours)}:` : ''}{formatDigit(mins)}:{formatDigit(secs)}</strong>
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  type="button"
                  onClick={() => setShowExitWarning(false)}
                  className="w-full bg-[#1cb0f6] border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] hover:bg-[#1899d6] text-white font-black py-3.5 rounded-2xl shadow-xs transition-all active:translate-y-0.5 text-sm cursor-pointer"
                >
                  Odaklanmaya Devam Et
                </button>
                <button 
                  type="button"
                  onClick={finishExam}
                  className="w-full bg-white dark:bg-slate-700 text-slate-700 dark:text-white border-2 border-b-4 border-slate-200 dark:border-slate-600 hover:bg-slate-50 font-black py-3 rounded-2xl transition-all active:translate-y-0.5 text-sm cursor-pointer"
                >
                  Sınavı Erken Bitir
                </button>
                <button 
                  type="button"
                  onClick={forceExit}
                  className="w-full text-slate-400 hover:text-[#ff4b4b] font-black py-2 mt-1 text-xs transition-colors cursor-pointer"
                >
                  Anasayfaya Dön
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
