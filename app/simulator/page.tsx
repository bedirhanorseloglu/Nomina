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
  // Simulated real-world time (Fixed start at 10:15)
  const currentSimulatedSeconds = 36900 + elapsedSeconds;
  
  const simulatedHour = Math.floor((currentSimulatedSeconds / 3600) % 24);
  const simulatedMin = Math.floor((currentSimulatedSeconds % 3600) / 60);
  const simulatedSec = currentSimulatedSeconds % 60;

  const progressPercentage = (elapsedSeconds / totalExamSeconds) * 100;
  const circleRadius = 120;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (progressPercentage / 100) * circleCircumference;

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-lg border border-slate-100"
        >
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Sınav Tamamlandı!</h2>
          <p className="text-slate-500 font-medium mb-8">Gerçek bir sınav deneyimi yaşadın. Şimdi derin bir nefes al ve sonuçlarını deneme merkezine kaydet.</p>
          <button 
            onClick={() => router.push("/liderlik")} 
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            Sonuçları Kaydetmeye Git
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center p-6 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Header */}
        <div className="w-full max-w-4xl flex items-center justify-between z-10 mb-12 mt-4">
           <button 
             onClick={() => setupStep === "mode" ? router.back() : setSetupStep("mode")}
             className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium"
           >
             <ArrowLeft className="w-5 h-5" /> Geri
           </button>
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-accent/20 text-accent rounded-xl flex items-center justify-center border border-accent/30">
               <Shield className="w-5 h-5" />
             </div>
             <span className="font-bold tracking-widest text-sm text-slate-300">ÖSYM ODAK MODU</span>
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
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Ne Çözeceksin?</h1>
                <p className="text-lg text-slate-400 mb-12 max-w-2xl">
                  Odaklanmak istediğin sınav tipini seç. Simülatör seni dış dünyadan soyutlayarak gerçek bir sınav atmosferi yaşatacak.
                </p>

                <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
                  <button 
                    onClick={() => {
                      setExamMode("genel");
                      setCustomDuration(130);
                      setSetupStep("duration");
                    }}
                    className="group bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700/50 hover:border-emerald-500/50 rounded-3xl p-8 text-left transition-all hover:scale-105"
                  >
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Target className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Genel Deneme</h3>
                    <p className="text-slate-400 font-medium">120 soru, 130 dakika. Tam teşekküllü GY-GK KPSS provası.</p>
                  </button>

                  <button 
                    onClick={() => {
                      setExamMode("brans");
                      setSetupStep("duration");
                    }}
                    className="group bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700/50 hover:border-blue-500/50 rounded-3xl p-8 text-left transition-all hover:scale-105"
                  >
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Layers className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Branş Denemesi</h3>
                    <p className="text-slate-400 font-medium">Spesifik bir derse odaklan. Süreni konuya göre sen belirle.</p>
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
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Süreni Belirle</h1>
                  <p className="text-lg text-slate-400">
                    {examMode === "genel" ? "Genel deneme için varsayılan süre 130 dakikadır. İstersen değiştirebilirsin." : "Çözeceğin branşı seç veya doğrudan süreni gir."}
                  </p>
                </div>

                {examMode === "brans" && (
                  <div className="flex flex-wrap justify-center gap-3 mb-10 w-full">
                    {SUBJECTS.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubject(sub);
                          setCustomDuration(sub.defaultDuration);
                        }}
                        className={`px-6 py-3 rounded-2xl font-bold border-2 transition-all ${selectedSubject?.id === sub.id ? "bg-blue-500 border-blue-500 text-white" : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-blue-500/50"}`}
                      >
                        {sub.name} ({sub.defaultDuration} Dk)
                      </button>
                    ))}
                  </div>
                )}

                <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 w-full max-w-md mx-auto text-center mb-10">
                  <label className="block text-slate-400 font-bold mb-6 text-sm uppercase tracking-widest">{examMode === "genel" ? "Sabit Süre" : "Özel Süre (Dakika)"}</label>
                  <div className="flex items-center justify-center gap-6">
                    <button 
                      onClick={() => setCustomDuration(Math.max(1, customDuration - 5))}
                      disabled={examMode === "genel"}
                      className="w-16 h-16 rounded-2xl bg-slate-700 text-white font-black text-3xl hover:bg-slate-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >-</button>
                    <div className="text-6xl font-black text-white w-32 tabular-nums">
                      {customDuration}
                    </div>
                    <button 
                      onClick={() => setCustomDuration(customDuration + 5)}
                      disabled={examMode === "genel"}
                      className="w-16 h-16 rounded-2xl bg-slate-700 text-white font-black text-3xl hover:bg-slate-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >+</button>
                  </div>
                  {examMode === "genel" && (
                     <p className="mt-6 text-emerald-400 text-sm font-medium">Genel deneme süresi gerçek sınavla aynıdır ve değiştirilemez.</p>
                  )}
                </div>

                <button 
                  onClick={startExam}
                  className="bg-accent w-full max-w-md text-white font-black text-xl py-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)]"
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
               animate={{ rotate: (simulatedHour % 12) * 30 + simulatedMin * 0.5 }}
               transition={{ type: "tween", ease: "linear", duration: 0.5 }}
             />

             {/* Minute Hand */}
             <motion.div
               className="absolute w-1.5 sm:w-2 rounded-full origin-bottom"
               style={{ bottom: '50%', height: '35%', backgroundColor: isDarkMode ? '#94a3b8' : '#64748b' }}
               animate={{ rotate: simulatedMin * 6 + simulatedSec * 0.1 }}
               transition={{ type: "tween", ease: "linear", duration: 0.5 }}
             />

             {/* Second Hand */}
             <motion.div
               className="absolute w-1 sm:w-1.5 bg-red-500 rounded-full origin-bottom"
               style={{ bottom: '50%', height: '42%' }}
               animate={{ rotate: simulatedSec * 6 }}
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
            <div className={`text-lg font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>10:15</div>
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
              {formatDigit(Math.floor((36900 + customDuration * 60) / 3600) % 24)}:{formatDigit(Math.floor((36900 + customDuration * 60) % 3600 / 60))}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Emin misiniz?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                Odaklanmayı şimdi bırakırsanız sınav atmosferinden kopacaksınız. Kalan süreniz: {hours > 0 ? `${formatDigit(hours)}:` : ''}{formatDigit(mins)}:{formatDigit(secs)}
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setShowExitWarning(false)}
                  className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Odaklanmaya Devam Et
                </button>
                <button 
                  onClick={finishExam}
                  className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors"
                >
                  Sınavı Erken Bitir
                </button>
                <button 
                  onClick={forceExit}
                  className="w-full text-slate-400 dark:text-slate-500 font-bold py-2 text-sm hover:text-slate-600 dark:hover:text-slate-400"
                >
                  Anasayfaya Dön (İptal)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
