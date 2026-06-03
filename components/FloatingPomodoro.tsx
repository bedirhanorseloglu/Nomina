"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Users, Play, Pause, RotateCcw, X, Coffee, Brain, Settings2, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updatePresence, getOnlineUsersCount } from "@/lib/firebaseService";

type Mode = "focus" | "break";

export default function FloatingPomodoro() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(1);
  
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const secondsElapsedRef = useRef(0);

  // Initialize timer with local storage values if present
  useEffect(() => {
    const savedFocus = localStorage.getItem("pomodoro_focus");
    const savedBreak = localStorage.getItem("pomodoro_break");
    const savedTotalFocus = localStorage.getItem("pomodoro_total_focus");
    const savedTotalBreak = localStorage.getItem("pomodoro_total_break");
    
    if (savedFocus) {
      setFocusDuration(parseInt(savedFocus));
      setTimeLeft(parseInt(savedFocus) * 60);
    }
    if (savedBreak) {
      setBreakDuration(parseInt(savedBreak));
    }
    if (savedTotalFocus) setTotalFocusMinutes(parseInt(savedTotalFocus));
    if (savedTotalBreak) setTotalBreakMinutes(parseInt(savedTotalBreak));
  }, []);

  const saveSettings = (f: number, b: number) => {
    setFocusDuration(f);
    setBreakDuration(b);
    localStorage.setItem("pomodoro_focus", f.toString());
    localStorage.setItem("pomodoro_break", b.toString());
    if (!isActive) {
      setTimeLeft(mode === "focus" ? f * 60 : b * 60);
    }
  };

  // Real-time online user tracking
  useEffect(() => {
    const trackPresence = async () => {
      if (user?.uid) {
        await updatePresence(user.uid);
      }
      const count = await getOnlineUsersCount();
      setOnlineUsers(count);
    };
    
    trackPresence();
    const interval = setInterval(trackPresence, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        secondsElapsedRef.current += 1;
        if (secondsElapsedRef.current >= 60) {
           secondsElapsedRef.current = 0;
           if (mode === "focus") {
              setTotalFocusMinutes(prev => {
                const newVal = prev + 1;
                localStorage.setItem("pomodoro_total_focus", newVal.toString());
                return newVal;
              });
           } else {
              setTotalBreakMinutes(prev => {
                const newVal = prev + 1;
                localStorage.setItem("pomodoro_total_break", newVal.toString());
                return newVal;
              });
           }
        }
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
      audio.volume = 0.5;
      audio.play().catch(e => console.log(e));
      
      secondsElapsedRef.current = 0;
      if (mode === "focus") {
        setMode("break");
        setTimeLeft(breakDuration * 60);
      } else {
        setMode("focus");
        setTimeLeft(focusDuration * 60);
      }
      setIsActive(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, focusDuration, breakDuration]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    secondsElapsedRef.current = 0;
    setTimeLeft(mode === "focus" ? focusDuration * 60 : breakDuration * 60);
  };

  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    setIsActive(false);
    secondsElapsedRef.current = 0;
    setTimeLeft(newMode === "focus" ? focusDuration * 60 : breakDuration * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const totalSeconds = mode === "focus" ? focusDuration * 60 : breakDuration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const totalMinutesAll = totalFocusMinutes + totalBreakMinutes;
  const efficiencyScore = totalMinutesAll > 0 ? Math.round((totalFocusMinutes / totalMinutesAll) * 100) : 0;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-5 py-4 rounded-full shadow-2xl hover:scale-105 transition-all border border-slate-200/50 dark:border-slate-800/50 group backdrop-blur-md"
          >
            <div className="relative flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full blur-md ${isActive ? (mode === 'focus' ? 'bg-emerald-500/50' : 'bg-orange-500/50') : 'bg-accent/30'} group-hover:blur-xl transition-all`} />
              <Timer className={`w-5 h-5 relative z-10 ${isActive ? (mode === 'focus' ? 'text-emerald-500' : 'text-orange-500') : 'text-accent'}`} />
              {isActive && (
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping z-20 ${mode === 'focus' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
              )}
            </div>
            <span className="text-sm font-black tracking-widest uppercase hidden sm:block">
              {isActive ? formatTime : 'Odak Odası'}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                <div className="relative flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse absolute" />
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  Canlı Çalışma
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showSettings ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Settings2 className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => { setIsOpen(false); setShowSettings(false); }}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="p-6 pt-4 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {showSettings ? (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="mb-6">
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">Zamanlayıcı Ayarları</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Süreleri dakikalar cinsinden belirleyin</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">
                          <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-emerald-500" /> Odak Süresi</span>
                          <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md text-[10px]">{focusDuration} dk</span>
                        </label>
                        <input 
                          type="range" 
                          min="5" max="120" step="5"
                          value={focusDuration}
                          onChange={(e) => saveSettings(parseInt(e.target.value), breakDuration)}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                           <span>5</span>
                           <span>120</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">
                          <span className="flex items-center gap-2"><Coffee className="w-4 h-4 text-orange-500" /> Mola Süresi</span>
                          <span className="text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-md text-[10px]">{breakDuration} dk</span>
                        </label>
                        <input 
                          type="range" 
                          min="1" max="30" step="1"
                          value={breakDuration}
                          onChange={(e) => saveSettings(focusDuration, parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                           <span>1</span>
                           <span>30</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowSettings(false)}
                      className="w-full mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-white/10"
                    >
                      Bitti
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="timer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Online Users */}
                    <div className="flex items-center justify-between mb-6 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 px-4 py-3 rounded-2xl">
                       <div className="flex -space-x-3">
                          <img src="https://i.pravatar.cc/100?img=1" alt="user" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
                          <img src="https://i.pravatar.cc/100?img=2" alt="user" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
                          <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 shadow-sm bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            +{onlineUsers > 2 ? onlineUsers - 2 : 0}
                          </div>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">{onlineUsers} Kişi</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400/80 dark:text-blue-500/80">Odaklanıyor</span>
                       </div>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl mb-8 border border-slate-200/50 dark:border-slate-700/50">
                      <button
                        onClick={() => changeMode("focus")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                          mode === "focus" 
                            ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border-slate-200/50" 
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/30 dark:hover:bg-slate-700/30"
                        }`}
                      >
                        <Brain className="w-4 h-4" /> Odak
                      </button>
                      <button
                        onClick={() => changeMode("break")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                          mode === "break" 
                            ? "bg-white dark:bg-slate-900 text-orange-500 dark:text-orange-400 shadow-sm border-slate-200/50" 
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/30 dark:hover:bg-slate-700/30"
                        }`}
                      >
                        <Coffee className="w-4 h-4" /> Mola
                      </button>
                    </div>

                    {/* Timer SVG Ring */}
                    <div className="relative w-56 h-56 mx-auto mb-8 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 drop-shadow-xl" viewBox="0 0 200 200">
                        <circle 
                          cx="100" cy="100" r={radius} 
                          fill="none" 
                          className="stroke-slate-100 dark:stroke-slate-800" 
                          strokeWidth="8" 
                        />
                        <motion.circle 
                          cx="100" cy="100" r={radius} 
                          fill="none" 
                          stroke="currentColor"
                          className={`${mode === "focus" ? "text-emerald-500" : "text-orange-500"}`}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          animate={{ strokeDashoffset }}
                          transition={{ duration: 1, ease: "linear" }}
                        />
                      </svg>
                      
                      {/* Timer Text Inside */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <p className={`text-5xl font-black font-mono tracking-tighter ${mode === "focus" ? "text-emerald-500 dark:text-emerald-400" : "text-orange-500 dark:text-orange-400"}`}>
                           {formatTime}
                         </p>
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-2">
                           {mode === "focus" ? "Kesintisiz Odak" : "Dinlenme Vakti"}
                         </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-6 mb-6">
                       <button 
                         onClick={resetTimer}
                         className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shadow-sm"
                         title="Sıfırla"
                       >
                         <RotateCcw className="w-5 h-5" />
                       </button>
                       <button 
                         onClick={toggleTimer}
                         className={`w-16 h-16 flex items-center justify-center rounded-[2rem] text-white shadow-xl hover:scale-105 active:scale-95 transition-all ${
                           isActive 
                             ? "bg-slate-900 dark:bg-slate-100 dark:text-slate-900 shadow-slate-900/30 dark:shadow-slate-100/30" 
                             : (mode === "focus" ? "bg-emerald-500 shadow-emerald-500/40" : "bg-orange-500 shadow-orange-500/40")
                         }`}
                       >
                         {isActive ? <Pause className="w-7 h-7" fill="currentColor" /> : <Play className="w-7 h-7 ml-1" fill="currentColor" />}
                       </button>
                    </div>

                    {/* Stats */}
                    <div className="pt-5 mt-2 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center justify-between mb-3">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">İstatistikler</h4>
                         <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                            <Target className="w-3 h-3" /> %{efficiencyScore} Verim
                         </span>
                      </div>
                      <div className="flex gap-2">
                         <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800">
                            <Brain className="w-4 h-4 text-emerald-500 mb-1" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Odak</span>
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300">{totalFocusMinutes} dk</span>
                         </div>
                         <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800">
                            <Coffee className="w-4 h-4 text-orange-500 mb-1" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Mola</span>
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300">{totalBreakMinutes} dk</span>
                         </div>
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
