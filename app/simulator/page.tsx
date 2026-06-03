"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle, Shield, CheckCircle2, Moon, Sun, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { loadFromFirebase, saveToFirebase } from "@/lib/firebaseService";
import { format } from "date-fns";

export default function ExamSimulatorPage() {
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(130 * 60); // 130 minutes default for KPSS GY-GK
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

  // Request fullscreen on start
  const startExam = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.log("Fullscreen not supported", e);
    }
    setHasStarted(true);
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

  // Simulated real-world time
  const totalExamSeconds = 130 * 60;
  const elapsedSeconds = totalExamSeconds - timeLeft;
  // 10:15 in seconds = 10 * 3600 + 15 * 60 = 36900
  const currentSimulatedSeconds = 36900 + elapsedSeconds;
  
  const simulatedHour = Math.floor((currentSimulatedSeconds / 3600) % 24);
  const simulatedMin = Math.floor((currentSimulatedSeconds % 3600) / 60);
  const simulatedSec = currentSimulatedSeconds % 60;

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

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl text-center">
          <div className="w-20 h-20 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-8 border border-accent/30">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">ÖSYM Odak Modu</h1>
          <p className="text-lg text-slate-300 font-medium mb-12">
            Gerçek bir sınav simülasyonuna girmek üzeresiniz. Sınav başladığında ekran tam ekran moduna geçecek ve 130 dakikalık kronometre çalışacaktır. Sınav esnasında durdurma (pause) yapılamaz.
          </p>

          <button 
            onClick={startExam}
            className="bg-accent text-white font-black text-lg px-12 py-5 rounded-2xl hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)]"
          >
            Sınavı Başlat (130 Dk)
          </button>
          
          <button 
            onClick={() => router.back()}
            className="block w-full mt-6 text-slate-400 font-bold hover:text-white transition-colors"
          >
            Vazgeç ve Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center relative select-none transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* OSYM Style Header */}
      <div className={`absolute top-0 w-full p-6 flex items-center justify-between shadow-sm transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-white border-b border-slate-200'}`}>
        <div className="flex items-center gap-4 opacity-50">
           <div className={`w-12 h-12 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
           <div>
             <div className={`h-4 w-32 rounded mb-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
             <div className={`h-3 w-24 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
           </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowExitWarning(true)}
            className={`font-bold px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}
          >
            Sınavı Bitir
          </button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="text-center flex flex-col items-center">
        {/* Analog Clock */}
        <div className="mb-12 relative flex flex-col items-center">
           <div className={`relative w-48 h-48 rounded-full border-8 flex items-center justify-center shadow-2xl transition-colors duration-500 ${isDarkMode ? 'border-slate-800 bg-slate-900 shadow-slate-900/50' : 'border-slate-100 bg-white shadow-slate-200/50'}`}>
             {/* Clock Face Markers */}
             {[...Array(12)].map((_, i) => (
               <div
                 key={i}
                 className="absolute w-full h-full p-2"
                 style={{ transform: `rotate(${i * 30}deg)` }}
               >
                 <div className={`mx-auto rounded-full ${i % 3 === 0 ? 'w-1.5 h-4' : 'w-1 h-2'} ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />
               </div>
             ))}

             {/* Hour Hand */}
             <motion.div
               className="absolute w-2 rounded-full origin-bottom"
               style={{ bottom: '50%', height: '25%', backgroundColor: isDarkMode ? '#e2e8f0' : '#1e293b' }}
               animate={{ rotate: (simulatedHour % 12) * 30 + simulatedMin * 0.5 }}
               transition={{ type: "tween", ease: "linear", duration: 0.5 }}
             />

             {/* Minute Hand */}
             <motion.div
               className="absolute w-1.5 rounded-full origin-bottom"
               style={{ bottom: '50%', height: '35%', backgroundColor: isDarkMode ? '#94a3b8' : '#64748b' }}
               animate={{ rotate: simulatedMin * 6 + simulatedSec * 0.1 }}
               transition={{ type: "tween", ease: "linear", duration: 0.5 }}
             />

             {/* Second Hand */}
             <motion.div
               className="absolute w-1 bg-red-500 rounded-full origin-bottom"
               style={{ bottom: '50%', height: '40%' }}
               animate={{ rotate: simulatedSec * 6 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
             />

             {/* Center Dot */}
             <div className="absolute w-4 h-4 bg-red-500 rounded-full border-4 z-10 transition-colors duration-500" style={{ borderColor: isDarkMode ? '#0f172a' : '#ffffff' }} />
           </div>
        </div>

        <p className={`text-sm font-black uppercase tracking-[0.3em] mb-4 flex items-center justify-center gap-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <Clock className="w-4 h-4" /> Kalan Süre
        </p>
        
        <div className={`text-[6rem] md:text-[8rem] font-black font-mono tracking-tighter leading-none tabular-nums mb-8 transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
          {formatDigit(hours)}:{formatDigit(mins)}:{formatDigit(secs)}
        </div>

        {/* Real Exam Info */}
        <div className={`flex items-center gap-8 font-bold px-6 py-4 rounded-2xl transition-colors ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-200/50 text-slate-500'}`}>
           <div className="text-center">
             <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Başlangıç</p>
             <p className="text-xl">10:15</p>
           </div>
           <div className={`w-px h-8 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />
           <div className="text-center">
             <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Şu An</p>
             <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{formatDigit(simulatedHour)}:{formatDigit(simulatedMin)}</p>
           </div>
           <div className={`w-px h-8 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />
           <div className="text-center">
             <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Bitiş</p>
             <p className="text-xl">12:25</p>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showExitWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-2 border-red-100 text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Emin misiniz?</h3>
              <p className="text-slate-500 font-medium mb-8">
                Sınavı erken bitirirseniz gerçek bir sınav hissiyatını kaybedebilirsiniz. Kalan süreniz: {formatDigit(hours)}:{formatDigit(mins)}:{formatDigit(secs)}
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setShowExitWarning(false)}
                  className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Geri Dön ve Çözmeye Devam Et
                </button>
                <button 
                  onClick={finishExam}
                  className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors"
                >
                  Evet, Sınavı Bitir
                </button>
                <button 
                  onClick={forceExit}
                  className="w-full text-slate-400 font-bold py-2 text-sm hover:text-slate-600"
                >
                  Anasayfaya Dön (Kaydetmeden)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
