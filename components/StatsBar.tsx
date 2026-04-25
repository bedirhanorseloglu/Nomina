"use client"

import { motion } from "framer-motion"

interface StatsBarProps {
  total: number
  completed: number
  streak: number
}

export default function StatsBar({ total, completed, streak }: StatsBarProps) {
  const remaining = total - completed
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
    >
      <div className="bg-card/40 border border-border-custom backdrop-blur-md rounded-xl p-4 flex flex-col justify-center items-center hover:scale-[1.02] hover:border-accent/30 transition-all">
        <span className="text-muted text-xs uppercase tracking-widest mb-1">Toplam Konu</span>
        <span className="font-mono text-2xl text-text-main font-bold">{total}</span>
      </div>
      <div className="bg-card/40 border border-border-custom backdrop-blur-md rounded-xl p-4 flex flex-col justify-center items-center hover:scale-[1.02] hover:border-accent/30 transition-all">
        <span className="text-muted text-xs uppercase tracking-widest mb-1">Tamamlanan</span>
        <span className="font-mono text-2xl text-accent font-bold">{completed}</span>
      </div>
      <div className="bg-card/40 border border-border-custom backdrop-blur-md rounded-xl p-4 flex flex-col justify-center items-center hover:scale-[1.02] hover:border-accent/30 transition-all">
        <span className="text-muted text-xs uppercase tracking-widest mb-1">Kalan Konu</span>
        <span className="font-mono text-2xl text-accent2 font-bold">{remaining}</span>
      </div>
      <div className="bg-card/40 border border-border-custom backdrop-blur-md rounded-xl p-4 flex flex-col justify-center items-center hover:scale-[1.02] hover:border-accent/30 transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 text-xl opacity-20">🔥</div>
        <span className="text-muted text-xs uppercase tracking-widest mb-1">Günlük Seri</span>
        <span className="font-mono text-2xl text-orange-400 font-bold">{streak}</span>
      </div>
    </motion.div>
  )
}
