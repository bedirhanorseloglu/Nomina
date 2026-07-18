"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BarChart3, ChevronDown, Clock, TrendingUp, Zap, Flame, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { format, addDays, startOfWeek } from "date-fns"
import { tr } from "date-fns/locale"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts"
import { getStudyDate } from "@/lib/dateUtils"

const formatMins = (mins: number): string => {
  if (mins <= 0) return "—"
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h > 0 && m > 0) return `${h}s ${m}dk`
  if (h > 0) return `${h}s`
  return `${m}dk`
}

/* ─── Stagger animation variants ──────────────────────── */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
}
const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }
}

/* ─── Chart Tooltip ───────────────────────────────────── */
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.[0]) {
    return (
      <div className="bg-white dark:bg-[#1e293b] px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 border-2 border-[#1cb0f6]/20" style={{ borderBottomWidth: '4px', borderBottomColor: '#1cb0f6' }}>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-xl font-black text-[#1cb0f6] font-mono tracking-tighter">
          {formatMins(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

/* ─── Mini Stat Card ──────────────────────────────────── */
const MiniStat = ({ icon: Icon, label, value, color, delay }: { icon: any, label: string, value: string, color: string, delay: number }) => (
  <motion.div
    variants={staggerItem}
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className="rounded-2xl p-4 border shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group"
    style={{ backgroundColor: `${color}08`, borderColor: `${color}18` }}
  >
    {/* Subtle background glow */}
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ backgroundColor: color }} />
    
    <div className="flex items-center gap-2 mb-2.5 relative z-10">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
    </div>
    <p className="text-xl font-black font-mono tracking-tighter relative z-10" style={{ color }}>{value}</p>
  </motion.div>
)

export default function StudyAnalytics() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [history, setHistory] = useState<Record<string, number>>({})

  useEffect(() => {
    const loadHistory = () => {
      try {
        const raw = localStorage.getItem("pomodoro_history")
        if (raw) setHistory(prev => ({ ...prev, ...JSON.parse(raw) }))
      } catch {}

      const getStudyDay = () => {
        const now = new Date()
        if (now.getHours() < 4) now.setDate(now.getDate() - 1)
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      }

      try {
        const saved = localStorage.getItem("pomodoro_total_focus")
        if (saved) {
          const parsed = parseInt(saved)
          const dayKey = getStudyDay()
          setHistory(prev => ({ ...prev, [dayKey]: Math.max(prev[dayKey] || 0, parsed) }))
        }
      } catch {}
    }

    loadHistory()

    const handleUpdate = (e: any) => {
      if (e.detail) setHistory(prev => ({ ...prev, [e.detail.date]: e.detail.focus }))
    }
    window.addEventListener("pomodoro_update", handleUpdate)
    return () => window.removeEventListener("pomodoro_update", handleUpdate)
  }, [])

  const { days, weekTotal, dailyAvg, bestDay, consistency, todayMins, yesterdayMins, trend } = useMemo(() => {
    const studyToday = getStudyDate()
    const todayStr = format(studyToday, "yyyy-MM-dd")

    const weekStart = startOfWeek(studyToday, { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i)
      const key = format(d, "yyyy-MM-dd")
      const abbr = format(d, "EEE", { locale: tr })
      return {
        date: d, key,
        label: abbr.charAt(0).toUpperCase() + abbr.slice(1),
        fullLabel: format(d, "d MMMM EEEE", { locale: tr }),
        minutes: history[key] || 0,
        isToday: key === todayStr
      }
    })

    const weekTotal = days.reduce((sum, d) => sum + d.minutes, 0)
    const dailyAvg = Math.round(weekTotal / 7)
    const bestDay = days.reduce((best, d) => d.minutes > best.minutes ? d : best, days[0])
    const consistency = days.filter(d => d.minutes > 0).length
    const todayMins = days.find(d => d.isToday)?.minutes || 0
    const todayIdx = days.findIndex(d => d.isToday)
    const yesterdayMins = todayIdx > 0 ? days[todayIdx - 1].minutes : 0
    const trend = yesterdayMins > 0
      ? Math.round(((todayMins - yesterdayMins) / yesterdayMins) * 100)
      : todayMins > 0 ? 100 : 0

    return { days, weekTotal, dailyAvg, bestDay, consistency, todayMins, yesterdayMins, trend }
  }, [history])

  const maxMins = Math.max(...days.map(d => d.minutes), 1)

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          COLLAPSED CARD — same grid position as other StatCards
          ═══════════════════════════════════════════════════════ */}
      <motion.div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(!isExpanded) } }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        whileHover={{ y: -4, transition: { duration: 0.25 } }}
        className={`bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm border rounded-3xl p-6 flex flex-col justify-between items-start gap-5 hover:shadow-xl transition-all duration-300 relative overflow-hidden group shadow-sm cursor-pointer select-none ${
          isExpanded
            ? 'border-[#1cb0f6]/40 shadow-[0_0_20px_rgba(28,176,246,0.08)]'
            : 'border-gray-100 dark:border-white/5'
        }`}
      >
        {/* Animated background glow */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          todayMins > 0 ? 'opacity-[0.08]' : 'opacity-[0.02]'
        }`} style={{ background: '#1cb0f6' }} />

        {/* Background decoration */}
        <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 rotate-12 scale-150 pointer-events-none">
          <BarChart3 className="w-32 h-32" />
        </div>

        {/* Icon with gradient bg */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1cb0f6]/15 to-[#1cb0f6]/5" />
          <BarChart3 className="w-7 h-7 text-[#1cb0f6] relative z-10" />
        </div>

        <div className="flex flex-col z-10 w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Çalışma Analizi</span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                isExpanded ? 'bg-[#1cb0f6]/10 text-[#1cb0f6]' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-400'
              }`}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </div>

          {/* Today's study time — big hero number */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tighter text-[#1cb0f6] font-mono">
              {formatMins(todayMins)}
            </span>
            {todayMins > 0 && yesterdayMins > 0 && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-[10px] font-black flex items-center gap-0.5 ${
                  trend >= 0 ? 'text-[#58cc02]' : 'text-[#ff2d55]'
                }`}
              >
                {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trend)}%
              </motion.span>
            )}
          </div>

          {/* Mini 7-day bars with day initials */}
          <div className="flex items-end gap-[5px] mt-3">
            {days.map((d, i) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-7 flex items-end">
                  <motion.div
                    className={`w-full rounded-t-sm rounded-b-[1px] ${
                      d.isToday
                        ? 'bg-gradient-to-t from-[#1cb0f6] to-[#1cb0f6]/70'
                        : d.minutes > 0
                          ? 'bg-gradient-to-t from-[#1cb0f6]/35 to-[#1cb0f6]/15 dark:from-[#1cb0f6]/45 dark:to-[#1cb0f6]/20'
                          : 'bg-slate-100 dark:bg-slate-700/40'
                    }`}
                    initial={{ height: 0 }}
                    animate={{ height: `${d.minutes > 0 ? Math.max(20, (d.minutes / maxMins) * 100) : 12}%` }}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </div>
                <span className={`text-[7px] font-black leading-none ${
                  d.isToday ? 'text-[#1cb0f6]' : 'text-slate-300 dark:text-slate-600'
                }`}>
                  {d.label.charAt(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Activity / consistency indicator */}
          <div className="flex items-center gap-2 mt-2.5">
            {consistency > 0 && (
              <div className="flex items-center gap-1">
                <Flame className={`w-3 h-3 ${consistency >= 5 ? 'text-[#ff9500]' : 'text-slate-300 dark:text-slate-600'}`} />
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {consistency}/7
                </span>
              </div>
            )}
            <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600">•</span>
            <span className="text-[9px] font-bold text-[#1cb0f6]/60 uppercase tracking-widest">
              Detay ↓
            </span>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          EXPANDED PANEL — full grid width with staggered enter
          ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="col-span-full overflow-hidden"
          >
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden"
            >

              {/* ── Header ────────────────────────────────── */}
              <motion.div variants={staggerItem} className="p-6 pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1cb0f6]/15 to-[#1cb0f6]/5 flex items-center justify-center">
                    <BarChart3 className="w-4.5 h-4.5 text-[#1cb0f6]" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Haftalık Çalışma Raporu</h3>
                </div>
                {todayMins > 0 && yesterdayMins > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${
                      trend >= 0
                        ? 'bg-[#58cc02]/5 text-[#58cc02] border-[#58cc02]/15'
                        : 'bg-[#ff2d55]/5 text-[#ff2d55] border-[#ff2d55]/15'
                    }`}
                  >
                    {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {trend >= 0 ? '+' : ''}{trend}% düne göre
                  </motion.div>
                )}
              </motion.div>

              {/* ── Stats Row ─────────────────────────────── */}
              <motion.div variants={staggerItem} className="px-6 pt-5">
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                >
                  <MiniStat icon={Clock} label="Bu Hafta" value={formatMins(weekTotal)} color="#1cb0f6" delay={0} />
                  <MiniStat icon={TrendingUp} label="Günlük Ort." value={formatMins(dailyAvg)} color="#ff2d55" delay={0.05} />
                  <MiniStat icon={Zap} label="En Verimli" value={bestDay.minutes > 0 ? bestDay.label : '—'} color="#58cc02" delay={0.1} />
                  <MiniStat icon={Flame} label="Tutarlılık" value={`${consistency}/7`} color="#ff9500" delay={0.15} />
                </motion.div>
              </motion.div>

              {/* ── Bar Chart ─────────────────────────────── */}
              <motion.div variants={staggerItem} className="px-6 pt-6 pb-2">
                <div className="bg-slate-50/50 dark:bg-black/15 rounded-2xl border border-slate-100 dark:border-white/5 p-4 sm:p-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Günlük Çalışma Dağılımı</p>
                  <div className="h-44 sm:h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={days.map(d => ({ name: d.label, dakika: d.minutes }))}
                        margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1cb0f6" stopOpacity={1} />
                            <stop offset="100%" stopColor="#1cb0f6" stopOpacity={0.5} />
                          </linearGradient>
                          <linearGradient id="barGradientPast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1cb0f6" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#1cb0f6" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.06)" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }}
                          tickFormatter={(v: number) => {
                            if (v === 0) return '0'
                            if (v < 60) return `${v}dk`
                            return `${Math.floor(v / 60)}s`
                          }}
                        />
                        <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(28,176,246,0.04)', radius: 8 }} />
                        <Bar dataKey="dakika" radius={[10, 10, 3, 3]} barSize={28} animationDuration={900} animationEasing="ease-out">
                          {days.map((d) => (
                            <Cell
                              key={d.key}
                              fill={d.isToday ? 'url(#barGradientActive)' : d.minutes > 0 ? 'url(#barGradientPast)' : 'rgba(100,116,139,0.06)'}
                              stroke={d.isToday ? '#1cb0f6' : 'transparent'}
                              strokeWidth={d.isToday ? 1.5 : 0}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* ── 7-Day Heatmap ─────────────────────────── */}
              <motion.div variants={staggerItem} className="px-6 pt-4 pb-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-black/15 rounded-2xl border border-slate-100 dark:border-white/5 p-4 sm:p-5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Aktivite Haritası</span>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {days.map((d, i) => {
                      const intensity = d.minutes > 0 ? Math.max(0.15, d.minutes / maxMins) : 0
                      return (
                        <motion.div
                          key={d.key}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + i * 0.06, duration: 0.35, ease: "easeOut" }}
                          className="flex flex-col items-center gap-1.5 group/heat"
                          title={`${d.fullLabel}: ${formatMins(d.minutes)}`}
                        >
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl transition-all duration-300 flex items-center justify-center group-hover/heat:scale-110 group-hover/heat:shadow-md ${
                              d.minutes > 0
                                ? ''
                                : 'bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700'
                            } ${d.isToday ? 'ring-2 ring-[#1cb0f6] ring-offset-2 dark:ring-offset-[#0f172a]' : ''}`}
                            style={d.minutes > 0 ? {
                              background: `linear-gradient(135deg, rgba(28,176,246,${0.15 + intensity * 0.85}), rgba(28,176,246,${0.1 + intensity * 0.6}))`,
                              boxShadow: intensity > 0.5 ? `0 2px 12px rgba(28,176,246,${intensity * 0.25})` : 'none'
                            } : {}}
                          >
                            {d.minutes > 0 && (
                              <span className={`text-[8px] font-black transition-transform duration-200 group-hover/heat:scale-110 ${
                                intensity > 0.4 ? 'text-white' : 'text-[#1cb0f6]'
                              }`}>
                                {d.minutes < 60 ? `${d.minutes}` : `${Math.floor(d.minutes / 60)}s`}
                              </span>
                            )}
                          </div>
                          <span className={`text-[8px] font-bold transition-colors duration-200 ${
                            d.isToday ? 'text-[#1cb0f6]' : 'text-slate-400 dark:text-slate-500 group-hover/heat:text-slate-600 dark:group-hover/heat:text-slate-300'
                          }`}>
                            {d.label.substring(0, 3)}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="hidden sm:flex items-center gap-1.5 text-[8px] font-bold text-slate-400 shrink-0">
                    <span>Az</span>
                    {[0.15, 0.35, 0.6, 0.85].map((op, i) => (
                      <div key={i} className="w-3.5 h-3.5 rounded-[4px]" style={{ background: `linear-gradient(135deg, rgba(28,176,246,${op}), rgba(28,176,246,${op}))` }} />
                    ))}
                    <span>Çok</span>
                  </div>
                </div>
              </motion.div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
