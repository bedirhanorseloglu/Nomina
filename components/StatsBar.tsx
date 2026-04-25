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

  const StatCard = ({ label, value, icon, color, delay }: any) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col justify-between items-start gap-4 hover:shadow-xl hover:shadow-slate-100 transition-all relative overflow-hidden group"
    >
      <div className={`absolute top-[-10px] right-[-10px] text-6xl opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rotate-12`}>
        {icon}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-50 border border-slate-100 shadow-inner shadow-slate-100">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-black font-mono tracking-tighter`} style={{ color }}>{value}</span>
          <span className="text-[10px] font-bold text-slate-300">BİRİM</span>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard label="Toplam Müfredat" value={total} icon="📚" color="#0f172a" delay={0.1} />
      <StatCard label="Başarılan Hedef" value={completed} icon="✅" color="var(--color-accent)" delay={0.2} />
      <StatCard label="Kalan Görevler" value={remaining} icon="⏳" color="var(--color-accent2)" delay={0.3} />
      <StatCard label="Kesintisiz Seri" value={`${streak} GÜN`} icon="🔥" color="#ef4444" delay={0.4} />
    </div>
  )
}
