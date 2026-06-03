"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { format } from "date-fns"

interface StatsBarProps {
  total: number
  completed: number
  dailySolved: number
  dailyTarget: number
  onUpdateGoal?: (dateStr: string, totalSolved: number) => void
}

const StatCard = ({ label, value, icon, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm border border-gray-100 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between items-start gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-300 relative overflow-hidden group shadow-sm"
  >
    <div className={`absolute -top-4 -right-4 text-8xl opacity-[0.02] group-hover:opacity-[0.04] transition-opacity rotate-12`}>
      {icon}
    </div>
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
      {icon}
    </div>
    <div className="flex flex-col z-10">
      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-bold tracking-tight ${color}`}>{value}</span>
      </div>
    </div>
  </motion.div>
)

export default function StatsBar({ total, completed, dailySolved, dailyTarget, onUpdateGoal }: StatsBarProps) {
  const remaining = total - completed
  const stats = [
    { label: "Toplam Müfredat", value: total, icon: "📚", color: "text-gray-900 dark:text-white" },
    { label: "Tamamlanan", value: completed, icon: "✅", color: "text-emerald-500 dark:text-emerald-400" },
    { label: "Kalan Görevler", value: remaining, icon: "⏳", color: "text-blue-500 dark:text-blue-400" }
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
        className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm border border-gray-100 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between items-start gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-300 relative overflow-hidden group shadow-sm"
      >
        <div className={`absolute -top-4 -right-4 text-8xl opacity-[0.02] group-hover:opacity-[0.04] transition-opacity rotate-12`}>
          🎯
        </div>
        <div className="w-full flex items-center justify-between z-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 shadow-sm">
            🎯
          </div>
        </div>
        <div className="flex flex-col w-full z-10">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">Bugün Çözülen</span>
          <div className="flex items-baseline gap-1 mb-4">
            <span className={`text-4xl font-bold tracking-tight text-orange-500`}>{dailySolved}</span>
            <span className="text-sm font-medium text-gray-300 dark:text-gray-600">/ {dailyTarget} Soru</span>
          </div>
          
          <div className="flex gap-2 w-full mt-auto">
            <input 
              type="number" 
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="+ Soru Ekle"
              className="flex-1 min-w-0 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
            />
            <button 
              onClick={handleAdd}
              disabled={!inputVal}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:scale-[1.02] shadow-sm shadow-orange-500/20"
            >
              Ekle
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
