"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const EXAM_DATE = new Date("2026-09-06T10:15:00").getTime()

const FlipNumber = ({ value, label, isDanger, isWarning }: { value: number, label: string, isDanger: boolean, isWarning: boolean }) => {
  const colorClass = isDanger ? "text-red-500" : isWarning ? "text-accent2" : "text-accent"
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-8 overflow-hidden flex justify-center items-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0, rotateX: -90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: -20, opacity: 0, rotateX: 90 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`font-mono text-2xl font-bold ${colorClass} block`}
            style={{ transformOrigin: "bottom" }}
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] uppercase text-muted tracking-wider mt-1">{label}</span>
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

  const borderClass = isDanger 
    ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse' 
    : isWarning 
    ? 'border-accent2/40 shadow-[0_0_15px_rgba(240,165,0,0.2)]' 
    : 'border-border-custom'

  return (
    <div className={`flex items-center gap-4 bg-card/50 backdrop-blur-md px-4 py-2 rounded-xl border ${borderClass} transition-colors duration-1000`}>
      <FlipNumber value={timeLeft.days} label="Gün" isDanger={isDanger} isWarning={isWarning} />
      <span className="text-muted/30 pb-4 font-mono">:</span>
      <FlipNumber value={timeLeft.hours} label="Saat" isDanger={isDanger} isWarning={isWarning} />
      <span className="text-muted/30 pb-4 font-mono">:</span>
      <FlipNumber value={timeLeft.minutes} label="Dk" isDanger={isDanger} isWarning={isWarning} />
      <span className="text-muted/30 pb-4 font-mono">:</span>
      <FlipNumber value={timeLeft.seconds} label="Sn" isDanger={isDanger} isWarning={isWarning} />
    </div>
  )
}
