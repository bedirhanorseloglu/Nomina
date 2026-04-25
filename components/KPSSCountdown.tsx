"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const EXAM_DATE = new Date("2026-09-06T10:15:00").getTime()

const FlipNumber = ({ value, label, isDanger, isWarning }: { value: number, label: string, isDanger: boolean, isWarning: boolean }) => {
  const colorClass = isDanger ? "text-red-500" : isWarning ? "text-amber-500" : "text-accent"
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-6 overflow-hidden flex justify-center items-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`font-mono text-xl font-black ${colorClass} block tracking-tighter`}
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1 opacity-60">{label}</span>
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

  const glowColor = isDanger ? 'rgba(239, 68, 68, 0.05)' : isWarning ? 'rgba(245, 158, 11, 0.05)' : 'rgba(0, 168, 132, 0.05)'

  return (
    <div 
      className={`flex items-center gap-3 bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-slate-100 transition-all duration-1000 group shadow-sm shadow-black/[0.02]`}
      style={{ background: `linear-gradient(135deg, #ffffff 0%, ${glowColor} 100%)` }}
    >
      <div className="flex flex-col items-start pr-2 border-r border-slate-100">
         <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Hedef</span>
         <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">06 EYLÜL</span>
      </div>
      <div className="flex items-center gap-3">
        <FlipNumber value={timeLeft.days} label="Gün" isDanger={isDanger} isWarning={isWarning} />
        <span className="text-slate-200 font-black mb-4">:</span>
        <FlipNumber value={timeLeft.hours} label="Saat" isDanger={isDanger} isWarning={isWarning} />
        <span className="text-slate-200 font-black mb-4">:</span>
        <FlipNumber value={timeLeft.minutes} label="Dk" isDanger={isDanger} isWarning={isWarning} />
        <span className="text-slate-200 font-black mb-4 animate-pulse">:</span>
        <FlipNumber value={timeLeft.seconds} label="Sn" isDanger={isDanger} isWarning={isWarning} />
      </div>
    </div>
  )
}
