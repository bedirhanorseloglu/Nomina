"use client"

import { motion } from "framer-motion"
import { BookOpen, CheckCircle2, Hourglass } from "lucide-react"
import StudyAnalytics from "./StudyAnalytics"

interface StatsBarProps {
  total: number
  completed: number
}

const StatCard = ({ label, value, icon: Icon, color, delay, hex }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    whileHover={{ y: -4, transition: { duration: 0.25 } }}
    className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm border border-gray-100 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between items-start gap-5 hover:shadow-xl transition-all duration-300 relative overflow-hidden group shadow-sm"
  >
    {/* Animated background glow */}
    <div
      className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-700"
      style={{ background: hex }}
    />

    {/* Large faded icon decoration */}
    <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 rotate-12 scale-150 pointer-events-none text-slate-800 dark:text-white">
      <Icon className="w-32 h-32" />
    </div>

    {/* Icon with gradient bg */}
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br" style={{ background: `linear-gradient(to bottom right, ${hex}22, ${hex}0a)` }} />
      <div className="relative z-10" style={{ color: hex }}>
        <Icon className="w-7 h-7" />
      </div>
    </div>

    <div className="flex flex-col z-10">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-black tracking-tighter ${color}`}>{value}</span>
      </div>
    </div>
  </motion.div>
)

export default function StatsBar({ total, completed }: StatsBarProps) {
  const remaining = total - completed
  const stats = [
    { 
      label: "Toplam Müfredat", 
      value: total, 
      icon: BookOpen, 
      color: "text-slate-800 dark:text-white",
      hex: "#af52de"
    },
    { 
      label: "Tamamlanan", 
      value: completed, 
      icon: CheckCircle2, 
      color: "text-[#58cc02]",
      hex: "#58cc02"
    },
    { 
      label: "Kalan Görevler", 
      value: remaining, 
      icon: Hourglass, 
      color: "text-[#ff9500]",
      hex: "#ff9500"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} {...stat} delay={0.1 + (i * 0.1)} />
      ))}
      <StudyAnalytics />
    </div>
  )
}
