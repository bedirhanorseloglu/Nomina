"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { format } from "date-fns"
import { BookOpen, CheckCircle2, Hourglass, Target } from "lucide-react"

interface StatsBarProps {
  total: number
  completed: number
  dailySolved: number
  dailyTarget: number
  onUpdateGoal?: (dateStr: string, totalSolved: number) => void
}

const StatCard = ({ label, value, icon, color, delay, bgClass, iconColorClass }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm border border-gray-100 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between items-start gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative overflow-hidden group shadow-sm"
  >
    <div className={`absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rotate-12 scale-150`}>
      {icon}
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bgClass} ${iconColorClass} shadow-sm border border-black/5 dark:border-white/5`}>
      {icon}
    </div>
    <div className="flex flex-col z-10">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-black tracking-tighter ${color}`}>{value}</span>
      </div>
    </div>
  </motion.div>
)

export default function StatsBar({ total, completed, dailySolved, dailyTarget, onUpdateGoal }: StatsBarProps) {
  const remaining = total - completed
  const stats = [
    { 
      label: "Toplam Müfredat", 
      value: total, 
      icon: <BookOpen className="w-7 h-7" />, 
      color: "text-slate-800 dark:text-white",
      bgClass: "bg-[#1cb0f6]/10",
      iconColorClass: "text-[#1cb0f6]"
    },
    { 
      label: "Tamamlanan", 
      value: completed, 
      icon: <CheckCircle2 className="w-7 h-7" />, 
      color: "text-[#58cc02]",
      bgClass: "bg-[#58cc02]/10",
      iconColorClass: "text-[#58cc02]"
    },
    { 
      label: "Kalan Görevler", 
      value: remaining, 
      icon: <Hourglass className="w-7 h-7" />, 
      color: "text-[#ff9500]",
      bgClass: "bg-[#ff9500]/10",
      iconColorClass: "text-[#ff9500]"
    }
  ]

  const [inputVal, setInputVal] = useState("")

  const handleAdd = () => {
    const num = parseInt(inputVal)
    if (!isNaN(num) && num > 0 && onUpdateGoal) {
      onUpdateGoal(format(new Date(), "yyyy-MM-dd"), dailySolved + num)
      setInputVal("")
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} {...stat} delay={0.1 + (i * 0.1)} />
      ))}
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm border border-gray-100 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between items-start gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative overflow-hidden group shadow-sm"
      >
        <div className={`absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rotate-12 scale-150`}>
          <Target className="w-32 h-32" />
        </div>
        <div className="w-full flex items-center justify-between z-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[#ff2d55] bg-[#ff2d55]/10 shadow-sm border border-black/5 dark:border-white/5">
            <Target className="w-7 h-7" />
          </div>
        </div>
        <div className="flex flex-col w-full z-10 mt-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Bugün Çözülen</span>
          <div className="flex items-baseline gap-1 mb-4">
            <span className={`text-4xl font-black tracking-tighter text-[#ff2d55]`}>{dailySolved}</span>
            <span className="text-sm font-bold text-slate-300 dark:text-slate-600">/ {dailyTarget} Soru</span>
          </div>
          
          <div className="flex gap-2 w-full mt-auto">
            <input 
              type="number" 
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="+ Soru Ekle"
              className="flex-1 min-w-0 bg-slate-50 dark:bg-black/20 border-2 border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#ff2d55] transition-all"
            />
            <button 
              onClick={handleAdd}
              disabled={!inputVal}
              className="bg-[#ff2d55] border-b-4 border-[#d0193e] hover:bg-[#d0193e] disabled:opacity-50 disabled:border-[#ff2d55] text-white rounded-2xl px-5 py-2.5 text-sm font-black transition-all hover:-translate-y-0.5 active:translate-y-1 active:border-b-0 active:mb-1"
            >
              Ekle
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
