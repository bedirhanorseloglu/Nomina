"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const EXAM_DATE = new Date("2026-09-06T10:15:00").getTime()

const FlipNumber = ({ value, label, isDanger, isWarning }: { value: number, label: string, isDanger: boolean, isWarning: boolean }) => {
  const colorClass = isDanger ? "text-red-500" : isWarning ? "text-amber-500" : "text-blue-500"
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-10 overflow-hidden flex justify-center items-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`font-mono text-3xl font-black ${colorClass} block tracking-tighter drop-shadow-sm`}
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">{label}</span>
    </div>
  )
}

export default function KPSSCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = EXAM_DATE - now

      if (distance < 0) {
        clearInterval(interval)
        return
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!isClient) return null

  const isWarning = timeLeft.days < 30
  const isDanger = timeLeft.days < 7

  return (
    <div 
      className="relative group overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 px-6 py-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-6 flex-1 min-w-[280px]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex flex-col items-start pr-5 border-r-2 border-slate-100 dark:border-slate-700/50 relative z-10 shrink-0">
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hedef</span>
         <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">06 Eylül</span>
      </div>
      <div className="flex items-center gap-3 relative z-10 flex-1 justify-around">
        <FlipNumber value={timeLeft.days} label="Gün" isDanger={isDanger} isWarning={isWarning} />
        <span className="text-slate-200 dark:text-slate-600 font-black mb-4 text-2xl">:</span>
        <FlipNumber value={timeLeft.hours} label="Saat" isDanger={isDanger} isWarning={isWarning} />
        <span className="text-slate-200 dark:text-slate-600 font-black mb-4 text-2xl">:</span>
        <FlipNumber value={timeLeft.minutes} label="Dk" isDanger={isDanger} isWarning={isWarning} />
        <span className="text-slate-200 dark:text-slate-600 font-black mb-4 text-2xl animate-pulse">:</span>
        <FlipNumber value={timeLeft.seconds} label="Sn" isDanger={isDanger} isWarning={isWarning} />
      </div>
    </div>
  )
}
