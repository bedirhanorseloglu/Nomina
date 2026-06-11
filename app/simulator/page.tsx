"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle, Shield, CheckCircle2, Moon, Sun, Target, Layers, ArrowLeft, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { loadFromFirebase, saveToFirebase } from "@/lib/firebaseService";
import { format } from "date-fns";

type SetupStep = "mode" | "duration";
type ExamMode = "genel" | "brans" | null;
type Subject = { id: string; name: string; defaultDuration: number };

const SUBJECTS: Subject[] = [
  { id: "tarih", name: "Tarih", defaultDuration: 30 },
  { id: "cografya", name: "Coğrafya", defaultDuration: 20 },
  { id: "vatandaslik", name: "Vatandaşlık", defaultDuration: 15 },
  { id: "turkce", name: "Türkçe", defaultDuration: 40 },
  { id: "matematik", name: "Matematik", defaultDuration: 40 },
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [realStartTimeSeconds, setRealStartTimeSeconds] = useState(36900); // 10:15 default

  const { user } = useAuth();
  const [dailyGoalTarget, setDailyGoalTarget] = useState(0);
  const [todaySolved, setTodaySolved] = useState(0);
  
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const fetchGoal = async () => {
      if (user?.uid) {
        const data = await loadFromFirebase(user.uid);
        if (data) {
          setDailyGoalTarget(data.dailyGoalTarget || 0);
          setTodaySolved(data.dailyGoals?.[today] || 0);
        }
      }
    };
    fetchGoal();
  }, [user, today]);

  useEffect(() => {
    // Prevent default exit behavior
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
    if (!hasStarted || isFinished) return;
    
    if (timeLeft <= 0) {
      setIsFinished(true);
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
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(e => console.log(e));
    }
    router.push("/");
  };

  const finishExam = async () => {
    setIsFinished(true);
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(e => console.log(e));
    }
  };

  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  
  const formatDigit = (d: number) => d.toString().padStart(2, "0");

  const totalExamSeconds = customDuration * 60;
  const elapsedSeconds = totalExamSeconds - timeLeft;
  const currentSimulatedSeconds = realStartTimeSeconds + elapsedSeconds;
  
  const simulatedHour = Math.floor((currentSimulatedSeconds / 3600) % 24);
  const simulatedMin = Math.floor((currentSimulatedSeconds % 3600) / 60);
  const simulatedSec = currentSimulatedSeconds % 60;

  const progressPercentage = (elapsedSeconds / totalExamSeconds) * 100;
  const circleRadius = 120;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (progressPercentage / 100) * circleCircumference;

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 fixed inset-0 z-50">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
          className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border-4 border-white/50 dark:border-white/10"
        >
          <div className="w-24 h-24 bg-[#58cc02]/10 text-[#58cc02] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner relative">
            <div className="absolute inset-0 bg-[#58cc02]/20 rounded-[1.5rem] animate-ping opacity-50" />
            <CheckCircle2 className="w-12 h-12 relative z-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-4">Süre Doldu!</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed text-lg">
            Harika bir odaklanmaydı! Gerçek bir sınav deneyimi yaşadın. Şimdi derin bir nefes al ve sonuçlarını deneme merkezine kaydet.
          </p>
          <button 
            onClick={() => router.push(examMode === "brans" ? `/deneme?mode=brans&subject=${selectedSubject?.id}` : "/deneme?mode=genel")} 
            className="w-full bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#46a302] text-white font-black py-4 rounded-2xl transition-all active:translate-y-1 active:border-b-0 active:mb-1 text-lg"
          >
            Sonuçları Kaydet
          </button>
          <button 
            onClick={() => router.push("/")} 
            className="w-full mt-4 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 text-lg"
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

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col items-center p-6 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Header */}
        <div className="w-full max-w-4xl flex items-center justify-between z-10 mb-12 mt-4">
           <button 
             onClick={() => setupStep === "mode" ? router.back() : setSetupStep("mode")}
             className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-bold"
           >
             <ArrowLeft className="w-5 h-5" /> Geri
           </button>
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
               <Shield className="w-5 h-5" />
             </div>
             <span className="font-black tracking-widest text-sm text-slate-500 dark:text-slate-300 uppercase">ÖSYM Odak Modu</span>
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
                className="flex flex-col items-center text-center mt-12"
              >
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-800 dark:text-white">Ne Çözeceksin?</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mb-12 max-w-2xl font-medium">
                  Odaklanmak istediğin sınav tipini seç. Simülatör seni dış dünyadan soyutlayarak gerçek bir sınav atmosferi yaşatacak.
                </p>

                <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
                  <button 
                    onClick={() => {
                      setExamMode("genel");
                      setCustomDuration(130);
                      setSetupStep("duration");
                    }}
                    className="group bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-700/50 hover:border-[#58cc02] dark:hover:border-[#58cc02] rounded-3xl p-8 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#58cc02]/10"
                  >
                    <div className="w-16 h-16 bg-[#58cc02]/10 text-[#58cc02] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#58cc02] group-hover:text-white transition-colors">
                      <Target className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 text-slate-800 dark:text-white">Genel Deneme</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">120 soru, 130 dakika. Tam teşekküllü GY-GK KPSS provası.</p>
                  </button>

                  <button 
                    onClick={() => {
                      setExamMode("brans");
                      setCustomDuration(0);
                      setSetupStep("duration");
                    }}
                    className="group bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-700/50 hover:border-[#1cb0f6] dark:hover:border-[#1cb0f6] rounded-3xl p-8 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1cb0f6]/10"
                  >
                    <div className="w-16 h-16 bg-[#1cb0f6]/10 text-[#1cb0f6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#1cb0f6] group-hover:text-white transition-colors">
                      <Layers className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 text-slate-800 dark:text-white">Branş Denemesi</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Spesifik bir derse odaklan. Süreni konuya göre sen belirle.</p>
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
                className="flex flex-col items-center mt-12 w-full max-w-3xl mx-auto"
              >
                <div className="text-center mb-12">
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-800 dark:text-white">Süreni Belirle</h1>
                  <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                    {examMode === "genel" ? "Genel deneme için varsayılan süre 130 dakikadır. İstersen değiştirebilirsin." : "Çözeceğin branşı seç veya doğrudan süreni gir."}
                  </p>
                </div>

                {examMode === "brans" && (
                  <div className="flex flex-wrap justify-center gap-3 mb-10 w-full">
                    {SUBJECTS.map((sub) => {
                      // Apple/Duolingo colors mapping
                      const colorMap: Record<string, string> = {
                        "tarih": "#ff9500",
                        "cografya": "#58cc02",
                        "vatandaslik": "#5856d6",
                        "turkce": "#1cb0f6",
                        "matematik": "#af52de"
                      };
                      const color = colorMap[sub.id] || "#1cb0f6";
                      const isSelected = selectedSubject?.id === sub.id;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubject(sub);
                            setCustomDuration(sub.defaultDuration);
                          }}
                          style={isSelected ? { backgroundColor: color, borderColor: color, color: "white" } : {}}
                          className={`px-6 py-3 rounded-2xl font-black border-2 transition-all hover:-translate-y-0.5 ${isSelected ? "shadow-lg" : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"}`}
                        >
                          {sub.name} ({sub.defaultDuration} Dk)
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-8 w-full max-w-md mx-auto text-center mb-10 shadow-sm">
                  <label className="block text-slate-400 dark:text-slate-500 font-black mb-6 text-sm uppercase tracking-widest">{examMode === "genel" ? "Sabit Süre" : "Özel Süre (Dakika)"}</label>
                  <div className="flex items-center justify-center gap-6">
                    <button 
                      onClick={() => setCustomDuration(Math.max(1, customDuration - 5))}
                      disabled={examMode === "genel"}
                      className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black text-3xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >-</button>
                    <div className="text-6xl font-black text-slate-800 dark:text-white w-32 tabular-nums">
                      {customDuration}
                    </div>
                    <button 
                      onClick={() => setCustomDuration(customDuration + 5)}
                      disabled={examMode === "genel"}
                      className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black text-3xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >+</button>
                  </div>
                  {examMode === "genel" && (
                     <p className="mt-6 text-[#58cc02] text-sm font-bold">Genel deneme süresi gerçek sınavla aynıdır ve değiştirilemez.</p>
                  )}
                </div>

                <button 
                  onClick={startExam}
                  disabled={customDuration <= 0}
                  className="bg-[#1cb0f6] border-b-4 border-[#1899d6] w-full max-w-md text-white font-black text-xl py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#1899d6] active:translate-y-1 active:border-b-0 active:mb-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:border-b-0 disabled:translate-y-0"
                >
                  <Play className="w-6 h-6 fill-current" />
                  Sınavı Başlat
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col relative select-none transition-colors duration-700 font-sans ${isDarkMode ? 'bg-[#0b0f19] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Minimal Header */}
      <header className={`w-full p-6 flex items-center justify-between z-10 transition-colors duration-700 ${isDarkMode ? '' : ''}`}>
        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
           <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
             <Target className="w-5 h-5" />
           </div>
           <div>
             <div className="font-bold tracking-widest text-xs uppercase">Odak Odası</div>
             <div className="text-sm font-medium">{examMode === "genel" ? "Genel Deneme" : selectedSubject?.name + " Denemesi"}</div>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white shadow-sm text-slate-400 hover:text-slate-600 hover:shadow-md'}`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowExitWarning(true)}
            className={`font-bold px-6 py-3 rounded-full text-sm transition-all ${isDarkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
          >
            Sınavı Bitir
          </button>
        </div>
      </header>

      {/* Main Focus Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-6 pb-20 z-10">
        
        {/* EdTech Style Analog Clock */}
        <div className="relative flex items-center justify-center mb-12">
           <div className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-[12px] flex items-center justify-center shadow-2xl transition-all duration-700 ${isDarkMode ? 'border-slate-800 bg-slate-900 shadow-[0_0_80px_rgba(30,41,59,0.5)]' : 'border-slate-100 bg-white shadow-[0_0_80px_rgba(226,232,240,0.5)]'}`}>
             
             {/* Subtle Inner Ring */}
             <div className={`absolute inset-2 rounded-full border-2 ${isDarkMode ? 'border-slate-800/50' : 'border-slate-50'}`} />

             {/* Clock Face Markers */}
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
               className="absolute w-1 sm:w-1.5 bg-red-500 rounded-full origin-bottom"
               style={{ bottom: '50%', height: '42%' }}
               initial={{ rotate: currentSimulatedSeconds * 6 }}
               animate={{ rotate: currentSimulatedSeconds * 6 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
             />

             {/* Center Dot */}
             <div className="absolute w-5 h-5 bg-red-500 rounded-full border-4 z-10 transition-colors duration-700" style={{ borderColor: isDarkMode ? '#0f172a' : '#ffffff' }} />
           </div>
        </div>

        {/* Digital Clock */}
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <span className={`text-sm font-bold uppercase tracking-[0.2em] mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Kalan Süre
          </span>
          <div className={`text-6xl sm:text-7xl font-black font-mono tracking-tighter tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            {hours > 0 && `${formatDigit(hours)}:`}{formatDigit(mins)}:{formatDigit(secs)}
          </div>
          
          <div className={`mt-6 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            {Math.floor(progressPercentage)}% Tamamlandı
          </div>
        </div>

        {/* Real Exam Timeline Minimalist */}
        <div className={`w-full max-w-md p-6 rounded-3xl flex items-center justify-between transition-colors duration-700 ${isDarkMode ? 'bg-slate-800/50' : 'bg-white shadow-xl shadow-slate-200/40'}`}>
          <div className="text-center">
            <div className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Başlangıç</div>
            <div className={`text-lg font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {formatDigit(Math.floor(realStartTimeSeconds / 3600) % 24)}:{formatDigit(Math.floor(realStartTimeSeconds % 3600 / 60))}
            </div>
          </div>
          
          <div className="flex-1 flex items-center px-4">
            <div className={`h-1 w-full rounded-full relative overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <div 
                className="absolute top-0 left-0 h-full bg-accent transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <div className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Bitiş</div>
            <div className={`text-lg font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {formatDigit(Math.floor((realStartTimeSeconds + customDuration * 60) / 3600) % 24)}:{formatDigit(Math.floor((realStartTimeSeconds + customDuration * 60) % 3600 / 60))}
            </div>
          </div>
        </div>
        
      </main>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <div className={`absolute w-[1000px] h-[1000px] rounded-full blur-[150px] opacity-20 transition-colors duration-700 ${isDarkMode ? 'bg-accent/20' : 'bg-accent/10'}`} />
      </div>

      <AnimatePresence>
        {showExitWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
              className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border-4 border-white/50 dark:border-white/10"
            >
              <div className="w-20 h-20 bg-[#ff2d55]/10 text-[#ff2d55] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Pes mi ediyorsun?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                Odaklanmayı şimdi bırakırsanız sınav atmosferinden kopacaksınız.<br/>
                <span className="block mt-4 text-sm uppercase tracking-widest font-bold">Kalan Süreniz</span>
                <strong className="text-slate-800 dark:text-white text-3xl block mt-1 font-mono tracking-tighter tabular-nums">{hours > 0 ? `${formatDigit(hours)}:` : ''}{formatDigit(mins)}:{formatDigit(secs)}</strong>
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowExitWarning(false)}
                  className="w-full bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#1899d6] text-white font-black py-4 rounded-2xl transition-all active:translate-y-1 active:border-b-0 active:mb-1"
                >
                  Odaklanmaya Devam Et
                </button>
                <button 
                  onClick={finishExam}
                  className="w-full bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  Sınavı Erken Bitir
                </button>
                <button 
                  onClick={forceExit}
                  className="w-full text-slate-400 hover:text-[#ff2d55] font-bold py-2 mt-2 text-sm transition-colors"
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
