"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Users, Play, Pause, RotateCcw, X, Coffee, Brain, Settings2, Target, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updatePresence, getOnlineUsersCount } from "@/lib/firebaseService";

type Mode = "focus" | "break" | "stopwatch";

export default function FloatingPomodoro() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [mode, setMode] = useState<Mode>("stopwatch");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [isFinishedAlert, setIsFinishedAlert] = useState(false);
  const [lapsCompleted, setLapsCompleted] = useState(0);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(240);
  
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const secondsElapsedRef = useRef(0);
  const isInitializedRef = useRef(false);
  const lastTickRef = useRef(Date.now());
  
  // Gece 04:00'a kadar olan çalışmaları önceki güne say (Öğrenci dostu gün atlama mantığı)
  const getStudyDay = () => {
    const now = new Date();
    if (now.getHours() < 4) {
      now.setDate(now.getDate() - 1);
    }
    return now.toDateString();
  };
  const currentStudyDayRef = useRef(getStudyDay());

  const [isRestored, setIsRestored] = useState(false);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [earnedBreakData, setEarnedBreakData] = useState<{workedMins: number, earnedMins: number} | null>(null);
  const [bankingAnim, setBankingAnim] = useState(false);
  const [displayTotalFocus, setDisplayTotalFocus] = useState(totalFocusMinutes);

  useEffect(() => {
    setDisplayTotalFocus(totalFocusMinutes);
  }, [totalFocusMinutes]);

  useEffect(() => {
    if (earnedBreakData) {
      setDisplayTotalFocus(Math.max(0, totalFocusMinutes - earnedBreakData.workedMins));
      const timer1 = setTimeout(() => {
        setBankingAnim(true);
        setDisplayTotalFocus(totalFocusMinutes);
      }, 600);
      const timer2 = setTimeout(() => {
        setBankingAnim(false);
      }, 2500);
      return () => { clearTimeout(timer1); clearTimeout(timer2); };
    } else {
      setDisplayTotalFocus(totalFocusMinutes);
      setBankingAnim(false);
    }
  }, [earnedBreakData]);

  // Initialize timer with local storage values if present
  useEffect(() => {
    const savedFocus = localStorage.getItem("pomodoro_focus");
    const savedBreak = localStorage.getItem("pomodoro_break");
    const savedGoal = localStorage.getItem("pomodoro_daily_goal");
    
    if (savedFocus) setFocusDuration(parseInt(savedFocus));
    if (savedBreak) setBreakDuration(parseInt(savedBreak));
    if (savedGoal) setDailyGoalMinutes(parseInt(savedGoal));

    // Günlük Sıfırlama Mantığı (Daily Reset)
    const todayStr = getStudyDay();
    const savedDate = localStorage.getItem("pomodoro_last_date");
    
    if (savedDate !== todayStr) {
      // Yeni gün! Eski verileri sıfırla
      localStorage.setItem("pomodoro_last_date", todayStr);
      localStorage.setItem("pomodoro_total_focus", "0");
      localStorage.setItem("pomodoro_total_break", "0");
      localStorage.setItem("pomodoro_laps", "0");
    } else {
      // Aynı gün, verileri yükle
      const savedTotalFocus = localStorage.getItem("pomodoro_total_focus");
      const savedTotalBreak = localStorage.getItem("pomodoro_total_break");
      const savedLaps = localStorage.getItem("pomodoro_laps");
      
      if (savedTotalFocus) setTotalFocusMinutes(parseInt(savedTotalFocus));
      if (savedTotalBreak) setTotalBreakMinutes(parseInt(savedTotalBreak));
      if (savedLaps) setLapsCompleted(parseInt(savedLaps));
    }

    // Restore timer state
    const savedIsActive = localStorage.getItem("pomodoro_is_active") === "true";
    const savedMode = localStorage.getItem("pomodoro_mode") as Mode;
    const actualMode = savedMode === "focus" ? "stopwatch" : (savedMode || "stopwatch");
    setMode(actualMode);
    
    // Set time left based on the resolved mode
    const savedTime = localStorage.getItem("pomodoro_time_left");
    let initialTimeLeft = savedTime ? parseInt(savedTime, 10) : (actualMode === "stopwatch" ? 0 : parseInt(savedBreak || "5") * 60);

    if (savedIsActive) {
      const savedLastTick = localStorage.getItem("pomodoro_last_tick");
      if (savedLastTick) {
        const elapsedSeconds = Math.floor((Date.now() - parseInt(savedLastTick)) / 1000);
        if (actualMode === "stopwatch") {
          initialTimeLeft += elapsedSeconds;
        } else {
          initialTimeLeft = Math.max(0, initialTimeLeft - elapsedSeconds);
        }
      }
    }

    setTimeLeft(initialTimeLeft);
    setIsActive(savedIsActive);
    lastTickRef.current = Date.now();
    setIsRestored(true); 
  }, []);

  useEffect(() => {
    if (!isRestored) return; 
    localStorage.setItem("pomodoro_time_left", timeLeft.toString());
    localStorage.setItem("pomodoro_is_active", isActive.toString());
    localStorage.setItem("pomodoro_mode", mode);
    localStorage.setItem("pomodoro_last_tick", Date.now().toString());
  }, [timeLeft, isActive, mode, isRestored]);

  const saveSettings = (f: number, b: number) => {
    setFocusDuration(f);
    setBreakDuration(b);
    localStorage.setItem("pomodoro_focus", f.toString());
    localStorage.setItem("pomodoro_break", b.toString());
  };

  // Real-time online user tracking
  useEffect(() => {
    if (!user?.uid) return; 
    const trackPresence = async () => {
      await updatePresence(user.uid);
      const count = await getOnlineUsersCount();
      setOnlineUsers(count);
    };
    
    trackPresence();
    const interval = setInterval(trackPresence, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isActive && (timeLeft > 0 || mode === "stopwatch")) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const deltaMs = now - lastTickRef.current;
        const deltaSeconds = Math.floor(deltaMs / 1000);

        if (deltaSeconds >= 1) {
          // Gece yarısı / Yeni gün kontrolü
          const currentDay = getStudyDay();
          if (currentDay !== currentStudyDayRef.current) {
             currentStudyDayRef.current = currentDay;
             localStorage.setItem("pomodoro_last_date", currentDay);
             localStorage.setItem("pomodoro_total_focus", "0");
             localStorage.setItem("pomodoro_total_break", "0");
             localStorage.setItem("pomodoro_laps", "0");
             setTotalFocusMinutes(0);
             setTotalBreakMinutes(0);
             setLapsCompleted(0);
          }

          secondsElapsedRef.current += deltaSeconds;
          if (secondsElapsedRef.current >= 60) {
             const earnedMins = Math.floor(secondsElapsedRef.current / 60);
             secondsElapsedRef.current = secondsElapsedRef.current % 60;
             if (mode === "stopwatch") {
                setTotalFocusMinutes(prev => {
                  const newVal = prev + earnedMins;
                  localStorage.setItem("pomodoro_total_focus", newVal.toString());
                  return newVal;
                });
             } else {
                setTotalBreakMinutes(prev => {
                  const newVal = prev + earnedMins;
                  localStorage.setItem("pomodoro_total_break", newVal.toString());
                  return newVal;
                });
             }
          }
          
          lastTickRef.current = now - (deltaMs % 1000);

          setTimeLeft(prev => {
             if (mode === "stopwatch") {
                 return prev + deltaSeconds;
             } else {
                 return prev > deltaSeconds ? prev - deltaSeconds : 0;
             }
          });
        }
      }, 500);
    } else if (timeLeft === 0 && isActive && mode !== "stopwatch") {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
      audio.volume = 1.0; 
      audio.play().catch(e => console.log("Otomatik ses çalma tarayıcı tarafından engellendi", e));
      
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 3000);
      
      setIsFinishedAlert(true);
      secondsElapsedRef.current = 0;
      setMode("stopwatch");
      setTimeLeft(0);
      setIsActive(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, focusDuration, breakDuration]);

  const toggleTimer = () => {
    if (!isActive) {
      lastTickRef.current = Date.now();
    }
    setIsActive(!isActive);
    setIsFinishedAlert(false);
  };
  const resetTimer = () => {
    setIsActive(false);
    setIsFinishedAlert(false);
    secondsElapsedRef.current = 0;
    setTimeLeft(mode === "stopwatch" ? 0 : breakDuration * 60);
  };

  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    setIsActive(false);
    setIsFinishedAlert(false);
    secondsElapsedRef.current = 0;
    setTimeLeft(newMode === "stopwatch" ? 0 : breakDuration * 60);
  };

  const requestModeChange = (newMode: Mode) => {
    if (mode === newMode) return;
    
    let isAborting = false;
    if (mode === "break" && timeLeft > 0) isAborting = true;
    if (mode === "stopwatch" && timeLeft > 0) isAborting = true;

    if (isAborting && !isFinishedAlert) {
      setPendingMode(newMode);
    } else {
      if (mode === "stopwatch" && newMode === "break") {
         const workedMins = Math.floor(timeLeft / 60);
         if (workedMins >= 1) {
            const earnedMins = Math.max(1, Math.round(workedMins * (breakDuration / focusDuration)));
            setEarnedBreakData({ workedMins, earnedMins });
            return;
         }
      }
      changeMode(newMode);
    }
  };

  const getStopwatchColor = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    if (m < 15) return { text: "text-rose-500", textDark: "dark:text-rose-400", bg: "bg-rose-500", glow: "bg-rose-500/50", shadow: "shadow-rose-500/40" };
    if (m < 30) return { text: "text-amber-500", textDark: "dark:text-amber-400", bg: "bg-amber-500", glow: "bg-amber-500/50", shadow: "shadow-amber-500/40" };
    if (m < 45) return { text: "text-lime-500", textDark: "dark:text-lime-400", bg: "bg-lime-500", glow: "bg-lime-500/50", shadow: "shadow-lime-500/40" };
    if (m < 60) return { text: "text-emerald-500", textDark: "dark:text-emerald-400", bg: "bg-emerald-500", glow: "bg-emerald-500/50", shadow: "shadow-emerald-500/40" };
    return { text: "text-teal-500", textDark: "dark:text-teal-400", bg: "bg-teal-500", glow: "bg-teal-500/50", shadow: "shadow-teal-500/40" };
  };

  const swColor = getStopwatchColor(mode === "stopwatch" ? timeLeft : 0);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const displayHours = Math.floor(timeLeft / 3600);
  const displayMinutes = Math.floor((timeLeft % 3600) / 60);
  const displaySeconds = timeLeft % 60;
  
  let formatTime = "";
  if (mode === "stopwatch") {
    formatTime = displayHours > 0 
      ? `${displayHours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`
      : `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
  } else {
    formatTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  let progress = 0;
  if (mode === "stopwatch") {
    progress = (timeLeft % 3600) / 3600 * 100; // 1 saatte tamamlanır
  } else {
    const totalSeconds = breakDuration * 60;
    progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  }
  
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const totalMinutesAll = totalFocusMinutes + totalBreakMinutes;
  const efficiencyScore = totalMinutesAll > 0 ? Math.round((totalFocusMinutes / totalMinutesAll) * 100) : 0;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isFinishedAlert) {
      let toggle = false;
      interval = setInterval(() => {
        document.title = toggle ? "⏰ SÜRE BİTTİ!" : "⚠️ ZAMAN DOLDU";
        toggle = !toggle;
      }, 1000);
      document.title = "⏰ SÜRE BİTTİ!";
    } else if (isActive) {
      document.title = `(${formatTime}) ${mode === 'stopwatch' ? '⏱️ Kronometre' : '☕ Mola'}`;
    } else {
      document.title = "KPSS 2026 Komuta Merkezi";
    }

    return () => {
      if (interval) clearInterval(interval);
      document.title = "KPSS 2026 Komuta Merkezi";
    };
  }, [isActive, formatTime, isFinishedAlert, mode]);

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={() => { setIsOpen(true); setIsFinishedAlert(false); }}
            className="fixed bottom-6 right-6 z-50 overflow-hidden flex items-center gap-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-5 py-4 rounded-full shadow-2xl hover:scale-105 transition-all border border-slate-200/50 dark:border-slate-800/50 group backdrop-blur-md"
          >
            {isActive && (
               <div 
                 className={`absolute left-0 top-0 bottom-0 opacity-15 dark:opacity-20 transition-all duration-1000 ${mode === 'stopwatch' ? swColor.bg : 'bg-orange-500'}`} 
                 style={{ width: `${progress}%` }} 
               />
            )}

            <div className="relative flex items-center justify-center z-10">
              <div className={`absolute inset-0 rounded-full blur-md ${isActive ? (mode === 'stopwatch' ? swColor.glow : 'bg-orange-500/50') : 'bg-accent/30'} group-hover:blur-xl transition-all`} />
              <Timer className={`w-5 h-5 relative z-10 ${isActive ? (mode === 'stopwatch' ? swColor.text : 'text-orange-500') : 'text-accent'}`} />
              {isActive && (
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping z-20 ${mode === 'stopwatch' ? swColor.bg : 'bg-orange-500'}`} />
              )}
            </div>
            
            <div className="relative z-10 flex flex-col items-start justify-center">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black tracking-widest uppercase hidden sm:block ${isActive ? 'font-mono' : ''}`}>
                  {isFinishedAlert ? 'Süre Bitti!' : (isActive ? formatTime : (mode === 'stopwatch' ? 'Kronometre' : 'Mola'))}
                </span>
              </div>
              {!isActive && totalFocusMinutes > 0 && (
                <span className="text-[10px] mt-0.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">
                  Bugün: %{Math.min(100, Math.round((totalFocusMinutes / dailyGoalMinutes) * 100))} İlerleme
                </span>
              )}
            </div>
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
              <AnimatePresence>
                {pendingMode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-5"
                  >
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-2xl border border-rose-100 dark:border-rose-900/50 w-full transform transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                          <RotateCcw className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">
                             {mode === "stopwatch" ? "Dersi bitirmek ister misin?" : "Seansı İptal Et?"}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                             {mode === "stopwatch" ? "Mevcut çalışmanız sonlandırılıp molaya geçilecek." : "Mevcut seansınız henüz tamamlanmadı. Yeni moda geçerseniz bu seans iptal edilecek."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-5">
                        <button 
                          onClick={() => setPendingMode(null)}
                          className="flex-1 py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          {mode === "stopwatch" ? "Derse Devam Et 🚀" : "Vazgeç"}
                        </button>
                        <button 
                          onClick={() => {
                            if (mode === "stopwatch" && pendingMode === "break") {
                                const workedMins = Math.floor(timeLeft / 60);
                                if (workedMins >= 1) {
                                    const earnedMins = Math.max(1, Math.round(workedMins * (breakDuration / focusDuration)));
                                    setEarnedBreakData({ workedMins, earnedMins });
                                    setPendingMode(null);
                                    return;
                                }
                            }
                            if (pendingMode) changeMode(pendingMode);
                            setPendingMode(null);
                          }}
                          className="flex-1 py-3 px-4 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30 rounded-xl"
                        >
                          {mode === "stopwatch" ? "Molaya Çık ☕" : "Yine de Geç"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">Ayarlar</h3>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                          Ödül Oranı Çarpanı (dk)
                        </label>
                        <input 
                          type="number" 
                          value={focusDuration}
                          onChange={(e) => setFocusDuration(Number(e.target.value))}
                          className="w-full bg-slate-100 dark:bg-slate-900 border-0 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 font-black focus:ring-2 focus:ring-emerald-500/50"
                          min="1"
                        />
                        <p className="text-[9px] text-slate-400 mt-1 ml-1 leading-tight">Bu süreye karşılık yandaki mola kazanılır (Örn: {focusDuration} dk çalış = {breakDuration} dk mola hak et)</p>
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
                      </div>

                      <div>
                        <label className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">
                          <span className="flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" /> Günlük Hedef</span>
                          <span className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md text-[10px]">
                             {Math.floor(dailyGoalMinutes/60) > 0 ? `${Math.floor(dailyGoalMinutes/60)}s ` : ''}{dailyGoalMinutes%60}dk
                          </span>
                        </label>
                        <input 
                          type="range" 
                          min="30" max="600" step="30"
                          value={dailyGoalMinutes}
                          onChange={(e) => {
                             setDailyGoalMinutes(parseInt(e.target.value));
                             localStorage.setItem("pomodoro_daily_goal", e.target.value);
                          }}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
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
                      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 relative overflow-hidden group">
                         <div className="absolute right-0 top-0 opacity-5">
                            <Target className="w-24 h-24 -mr-4 -mt-4 text-emerald-500" />
                         </div>
                         <div className="flex justify-between items-end mb-3 relative z-10">
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Günlük Hedef</div>
                              <div className="text-sm font-black text-slate-800 dark:text-slate-100">
                                 {Math.floor(displayTotalFocus/60)}s {displayTotalFocus%60}dk <span className="text-slate-400 text-xs">/ {Math.floor(dailyGoalMinutes/60)}s {dailyGoalMinutes%60 > 0 ? `${dailyGoalMinutes%60}dk` : ''}</span>
                              </div>
                            </div>
                            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg shadow-sm border border-emerald-200/50 dark:border-emerald-500/30 relative">
                               %{Math.min(100, Math.round((displayTotalFocus / dailyGoalMinutes) * 100))}
                               
                               <AnimatePresence>
                                 {bankingAnim && earnedBreakData && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10, scale: 0.5 }}
                                      animate={{ opacity: 1, y: -25, scale: 1.5 }}
                                      exit={{ opacity: 0, y: -35 }}
                                      transition={{ duration: 1.2, ease: "easeOut" }}
                                      className="absolute -top-2 right-0 text-emerald-500 dark:text-emerald-400 font-black drop-shadow-md z-50 whitespace-nowrap"
                                    >
                                      +{earnedBreakData.workedMins} dk
                                    </motion.div>
                                 )}
                               </AnimatePresence>
                            </div>
                         </div>
                         <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                            <div 
                               className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 rounded-full relative"
                               style={{ width: `${Math.min(100, (displayTotalFocus / dailyGoalMinutes) * 100)}%` }}
                            >
                               <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                            </div>
                         </div>
                      </div>

                      <AnimatePresence>
                        {earnedBreakData && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute top-[108px] inset-x-0 bottom-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center border-t-2 border-emerald-50 dark:border-slate-800"
                          >
                             <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-[radial-gradient(circle,rgba(52,211,153,0.15)_0%,transparent_60%)] animate-[spin_10s_linear_infinite]" />
                             </div>

                             <motion.div 
                               initial={{ scale: 0, y: 20 }}
                               animate={{ scale: 1, y: 0 }}
                               transition={{ type: "spring", bounce: 0.6, delay: 0.4 }}
                               className="relative z-10 w-20 h-20 mb-5"
                             >
                               <div className="absolute inset-0 bg-emerald-200 dark:bg-emerald-500/30 rounded-full animate-ping opacity-50" />
                               <div className="relative w-full h-full bg-gradient-to-tr from-emerald-400 to-emerald-300 rounded-3xl rotate-12 flex items-center justify-center shadow-xl shadow-emerald-500/30 border-4 border-white dark:border-slate-800">
                                  <span className="text-3xl -rotate-12 drop-shadow-md">💎</span>
                               </div>
                             </motion.div>
                             
                             <h3 className="relative z-10 text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Harika İş!</h3>
                             
                             <p className="relative z-10 text-xs text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed px-2">
                               Tam <strong className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md mx-1 shadow-sm">{earnedBreakData.workedMins} dk</strong> odaklandınız. 
                               Karşılığında <br/>
                               <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-md mx-1 shadow-sm mt-1 inline-block">{earnedBreakData.earnedMins} DAKİKA</strong> mola kazandınız! ☕
                             </p>

                             <div className="relative z-10 w-full space-y-2">
                               <button 
                                 onClick={() => {
                                   changeMode("break");
                                   setTimeLeft(earnedBreakData.earnedMins * 60);
                                   setEarnedBreakData(null);
                                   setIsActive(true);
                                 }}
                                 className="w-full group relative py-3 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/30 overflow-hidden"
                               >
                                 <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                 <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/10" />
                                 <span className="relative drop-shadow-sm">Ödül Molasını Başlat</span>
                               </button>
                               <button 
                                 onClick={() => {
                                   changeMode("break");
                                   setEarnedBreakData(null);
                                 }}
                                 className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/50 dark:border-slate-700/50"
                               >
                                 Standart Mola ({breakDuration} dk)
                               </button>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    {/* Mode Tabs */}
                    <div className="flex p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl mb-8 border border-slate-200/50 dark:border-slate-700/50">
                      <button
                        onClick={() => requestModeChange("stopwatch")}
                        className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                          mode === "stopwatch" 
                            ? "bg-white dark:bg-slate-700 text-emerald-500 dark:text-emerald-400 shadow-sm" 
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        Krono
                      </button>
                      <button
                        onClick={() => requestModeChange("break")}
                        className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                          mode === "break" 
                            ? "bg-white dark:bg-slate-700 text-teal-500 dark:text-teal-400 shadow-sm" 
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        Mola
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
                          className={`${mode === "focus" ? "text-emerald-500" : (mode === "stopwatch" ? swColor.text : "text-orange-500")}`}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          animate={{ strokeDashoffset }}
                          transition={{ duration: 1, ease: "linear" }}
                        />
                      </svg>
                      
                      {/* Timer Text Inside */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <p className={`text-5xl font-black font-mono tracking-tighter transition-colors duration-1000 ${mode === "focus" ? "text-emerald-500 dark:text-emerald-400" : (mode === "stopwatch" ? `${swColor.text} ${swColor.textDark}` : "text-orange-500 dark:text-orange-400")}`}>
                           {formatTime}
                         </p>
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-2">
                           {mode === "focus" ? "Kesintisiz Odak" : (mode === "stopwatch" ? "Serbest Çalışma" : "Dinlenme Vakti")}
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
                             : (mode === "focus" ? "bg-emerald-500 shadow-emerald-500/40" : (mode === "stopwatch" ? `${swColor.bg} ${swColor.shadow}` : "bg-orange-500 shadow-orange-500/40"))
                         }`}
                       >
                         {isActive ? <Pause className="w-7 h-7" fill="currentColor" /> : <Play className="w-7 h-7 ml-1" fill="currentColor" />}
                       </button>
                    </div>

                    {/* Visual Laps (Turlar) */}
                    <div className="pt-5 mt-2 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center justify-between mb-3">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tamamlanan Turlar</h4>
                         <span className="text-xs font-black text-slate-700 dark:text-slate-300">{lapsCompleted} Tur</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {Array.from({ length: Math.ceil((lapsCompleted + 1) / 5) * 5 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                                i < lapsCompleted 
                                  ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-500 shadow-sm border border-orange-200/50 dark:border-orange-500/30 scale-110' 
                                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border border-transparent'
                              }`}
                            >
                               {i < lapsCompleted ? '🔥' : ''}
                            </div>
                         ))}
                      </div>
                       <p className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 mt-4 leading-tight border-t border-slate-100 dark:border-slate-800/50 pt-2">
                         * <span className="font-bold">Not:</span> Kronometre (serbest çalışma) modunda tur kazanılmaz; ancak çalışılan her dakika üstteki Günlük Hedefinize yansır.
                       </p>
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
