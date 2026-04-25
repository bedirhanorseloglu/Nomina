"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

const EXAM_DATE = new Date("2026-05-18T10:15:00").getTime()

export default function CountdownTimer() {
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

  const isUrgent = timeLeft.days < 30

  return (
    <div className={`flex items-center gap-4 bg-card/50 backdrop-blur-md px-4 py-2 rounded-lg border border-border-custom ${isUrgent ? 'shadow-[0_0_15px_rgba(240,165,0,0.2)] border-accent2/30' : ''}`}>
      <div className="flex flex-col items-center">
        <span className={`font-mono text-xl font-bold ${isUrgent ? 'text-accent2' : 'text-accent'}`}>
          {timeLeft.days.toString().padStart(3, '0')}
        </span>
        <span className="text-[10px] uppercase text-muted tracking-wider">Gün</span>
      </div>
      <span className="text-muted/50 pb-3">:</span>
      <div className="flex flex-col items-center">
        <span className={`font-mono text-xl font-bold ${isUrgent ? 'text-accent2' : 'text-accent'}`}>
          {timeLeft.hours.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] uppercase text-muted tracking-wider">Saat</span>
      </div>
      <span className="text-muted/50 pb-3">:</span>
      <div className="flex flex-col items-center">
        <span className={`font-mono text-xl font-bold ${isUrgent ? 'text-accent2' : 'text-accent'}`}>
          {timeLeft.minutes.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] uppercase text-muted tracking-wider">Dk</span>
      </div>
      <span className="text-muted/50 pb-3">:</span>
      <div className="flex flex-col items-center">
        <motion.span 
          key={timeLeft.seconds}
          initial={{ opacity: 0.5, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-mono text-xl font-bold ${isUrgent ? 'text-accent2' : 'text-accent'}`}
        >
          {timeLeft.seconds.toString().padStart(2, '0')}
        </motion.span>
        <span className="text-[10px] uppercase text-muted tracking-wider">Sn</span>
      </div>
    </div>
  )
}
