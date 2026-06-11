"use client"

import { format, addDays, subDays, getDay } from "date-fns"
import { tr } from "date-fns/locale"
import { Topic, Subject } from "@/types"
import { useDroppable } from "@dnd-kit/core"
import { UNIVERSITY_CLASSES } from "@/lib/data"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useMemo, useEffect } from "react"

interface DailyPlanViewProps {
  date: Date
  topics: Topic[]
  subjects: Subject[]
  isDragging: boolean
  onDateChange: (date: Date) => void
  onRemoveTopic: (topicId: string, dateStr?: string, timeStr?: string) => void
  slotNotes: Record<string, string>
  completedNotes: Record<string, boolean>
  onUpdateNote: (slotId: string, note: string) => void
  onToggleNote: (slotId: string) => void
  holidays: string[]
  onToggleHoliday: (dateStr: string) => void
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 08 to 22
const EXAM_DATE = "2026-09-06"

function TimeSlot({ hour, dateStr, topic, revision, isLocked, lockedTitle, lockedType, color, isDragging, onRemoveTopic, note, isCompleted, onUpdateNote, onToggleNote, subjects }: any) {
  const slotId = `${dateStr}_${hour.toString().padStart(2, '0')}:00`
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { acceptsDrop: !isLocked },
    disabled: isLocked
  })

  return (
    <div 
      ref={setNodeRef}
      className={`group relative rounded-[1.5rem] p-5 transition-all duration-300 border-2 flex flex-col gap-4 ${
        isLocked 
          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-60' 
          : 'bg-white dark:bg-[#1e293b]/80 border-slate-100 dark:border-white/5 hover:border-[#1cb0f6] dark:hover:border-[#1cb0f6] hover:shadow-xl hover:-translate-y-1'
      } ${isOver ? 'ring-4 ring-[#1cb0f6]/30 border-[#1cb0f6] scale-[1.02] z-10' : ''} ${
        isDragging && !isLocked && !topic ? 'border-dashed border-[#1cb0f6]/50 bg-[#1cb0f6]/5 animate-pulse' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black font-mono text-[#1cb0f6] tracking-tighter bg-[#1cb0f6]/10 px-3 py-1.5 rounded-[0.75rem] border-2 border-[#1cb0f6]/20">
          {hour.toString().padStart(2, '0')}:00
        </span>
        {topic && !isLocked && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTopic(topic.id, dateStr, `${hour.toString().padStart(2, '0')}:00`);
            }}
            className="w-7 h-7 rounded-[0.75rem] bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-[#ff2d55] hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90 shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
      </div>

      <div className="min-h-[50px] flex flex-col justify-center">
        {isLocked && lockedTitle ? (
          <div className="flex items-center gap-3">
             <span className="text-2xl grayscale">{lockedType === 'uni' ? '🎓' : lockedType === 'code' ? '💻' : '🏖'}</span>
             <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">KAPALI</span>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-tight truncate">{lockedTitle}</span>
             </div>
          </div>
        ) : topic ? (
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: color }} />
             <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest truncate" style={{ color }}>
                  {subjects.find((s: any) => s.topics.some((t: any) => t.id === topic.id))?.title}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{topic.title}</span>
             </div>
          </div>
        ) : revision ? (
          <div className="flex items-center gap-3">
             <div className={`w-1.5 h-8 rounded-full shrink-0 ${revision.level === 3 ? 'bg-amber-400' : 'bg-blue-400'}`} />
             <div className="flex flex-col min-w-0">
                <span className={`text-[10px] font-black uppercase tracking-widest ${revision.level === 3 ? 'text-amber-500' : 'text-blue-500'}`}>
                  {revision.level === 3 ? "Kritik Tekrar" : "Rutin Tekrar"}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{revision.title}</span>
             </div>
          </div>
        ) : (
          <div className="flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-[1rem] py-5 bg-slate-50 dark:bg-slate-800/30 group-hover:bg-[#1cb0f6]/5 group-hover:border-[#1cb0f6]/30 transition-all">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-[#1cb0f6] transition-colors">
               {isDragging ? "BURAYA BIRAK" : "BOŞ SLOT"}
             </span>
          </div>
        )}
      </div>

      {!isLocked && (
        <div className={`p-3.5 rounded-[1.25rem] border-2 transition-all relative ${
          note 
            ? isCompleted 
              ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60' 
              : 'bg-[#ffc800]/10 dark:bg-[#ffc800]/5 border-[#ffc800]/30 shadow-sm' 
            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-slate-800/50'
        }`}>
           <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-2 ${note ? (isCompleted ? 'opacity-40' : 'text-[#ffc800]') : 'opacity-40 text-slate-400'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span className="text-[9px] font-black uppercase tracking-widest">Özel Not</span>
              </div>
              
              {note && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleNote(slotId);
                  }}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-[#58cc02] border-[#58cc02] text-white scale-110 shadow-lg shadow-[#58cc02]/20' 
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-[#58cc02] hover:bg-[#58cc02]/10'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )}
           </div>
           <textarea 
             value={note || ""}
             onChange={(e) => onUpdateNote(slotId, e.target.value)}
             placeholder="Bir not bırakın..."
             rows={2}
             className={`w-full bg-transparent border-0 outline-none text-xs font-bold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none leading-relaxed ${
               isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200 focus:text-slate-900 dark:focus:white'
             }`}
             onClick={(e) => e.stopPropagation()}
           />
        </div>
      )}
    </div>
  )
}

export default function DailyPlanView({ date, topics, subjects, isDragging, onDateChange, onRemoveTopic, slotNotes, completedNotes, onUpdateNote, onToggleNote, holidays, onToggleHoliday }: DailyPlanViewProps) {
  const [activeTab, setActiveTab] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [pomodoroFocusMins, setPomodoroFocusMins] = useState(0)

  const dateStr = format(date, "yyyy-MM-dd")
  const isHoliday = holidays.includes(dateStr)
  const isExamDay = dateStr === EXAM_DATE
  const topicsForDay = topics.filter(t => t.scheduledDate === dateStr)

  useEffect(() => {
    // Initial load
    try {
      const historyRaw = localStorage.getItem("pomodoro_history")
      if (historyRaw) {
        const history = JSON.parse(historyRaw)
        if (history[dateStr]) {
          setPomodoroFocusMins(history[dateStr])
        } else {
          setPomodoroFocusMins(0)
        }
      } else {
        // Fallback for current day if history not yet saved but current day is today
        const getStudyDay = () => {
          const now = new Date();
          if (now.getHours() < 4) {
            now.setDate(now.getDate() - 1);
          }
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        };
        if (dateStr === getStudyDay()) {
          const savedTotalFocus = localStorage.getItem("pomodoro_total_focus");
          if (savedTotalFocus) setPomodoroFocusMins(parseInt(savedTotalFocus));
          else setPomodoroFocusMins(0);
        } else {
          setPomodoroFocusMins(0)
        }
      }
    } catch (e) {}

    // Event listener
    const handlePomodoroUpdate = (e: any) => {
      if (e.detail && e.detail.date === dateStr) {
        setPomodoroFocusMins(e.detail.focus)
      }
    }

    window.addEventListener("pomodoro_update", handlePomodoroUpdate)
    return () => window.removeEventListener("pomodoro_update", handlePomodoroUpdate)
  }, [dateStr])

  const morningHours = [8, 9, 10, 11, 12]
  const afternoonHours = [13, 14, 15, 16, 17]
  const eveningHours = [18, 19, 20, 21, 22]

  const stats = useMemo(() => {
    const check = (hours: number[]) => {
      let hasSomething = false
      let hasUncompleted = false

      hours.forEach(h => {
        const timeStr = `${h.toString().padStart(2, '0')}:00`
        const slotId = `${dateStr}_${timeStr}`
        
        const topic = topicsForDay.find(t => t.scheduledTime === timeStr)
        const revisionTopic = topics.find(t => t.revisions?.some(r => r.date === dateStr && r.time === timeStr))
        const hasUni = UNIVERSITY_CLASSES.some(c => {
          if (c.date !== dateStr) return false
          const startH = parseInt(c.startTime.split(":")[0])
          const endH = parseInt(c.endTime.split(":")[0])
          return h >= startH && h < endH
        })
        const hasNote = slotNotes[slotId] && slotNotes[slotId].trim() !== ""
        const isNoteCompleted = completedNotes[slotId]

        if (topic || revisionTopic || hasUni || hasNote) {
          hasSomething = true
          // INDICATOR LOGIC: Only notes determine the "uncompleted" (red) status now.
          if (hasNote && !isNoteCompleted) {
            hasUncompleted = true
          }
        }
      })

      return { hasSomething, hasUncompleted }
    }
    return {
      morning: check(morningHours),
      afternoon: check(afternoonHours),
      evening: check(eveningHours)
    }
  }, [topics, topicsForDay, dateStr, slotNotes, completedNotes])

  const getHoursForTab = () => {
    if (activeTab === 'morning') return morningHours
    if (activeTab === 'afternoon') return afternoonHours
    return eveningHours
  }

  const tabContent = (hours: number[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {hours.map(hour => {
        let lockedTitle = ""
        let lockedType = ""
        let isLocked = false

        const universityClass = UNIVERSITY_CLASSES.find(c => {
          if (c.date !== dateStr) return false
          const startH = parseInt(c.startTime.split(":")[0])
          const endH = parseInt(c.endTime.split(":")[0])
          return hour >= startH && hour < endH
        })

        if (isExamDay) {
          isLocked = true
          lockedTitle = "KPSS Sınavı"
          lockedType = "holiday"
        } else if (isHoliday) {
          isLocked = true
          lockedTitle = "Dinlenme Günü"
          lockedType = "holiday"
        } else if (universityClass) {
          isLocked = true
          lockedTitle = `${universityClass.courseCode}`
          lockedType = "uni"
        }

        const slotTimeStr = `${hour.toString().padStart(2, '0')}:00`
        const topic = topicsForDay.find(t => t.scheduledTime === slotTimeStr)
        
        let color = "var(--accent)"
        if (topic) {
          const subject = subjects.find(s => s.topics.some(t => t.id === topic.id))
          if (subject) color = subject.color
        }

        let revision = null
        for (const t of topics) {
          const rev = t.revisions?.find(r => r.date === dateStr && r.time === slotTimeStr)
          if (rev) {
            revision = { ...rev, title: t.title }
            break
          }
        }

        return (
          <TimeSlot 
            key={hour} 
            hour={hour} 
            dateStr={dateStr}
            topic={topic}
            revision={revision}
            isLocked={isLocked}
            lockedTitle={lockedTitle}
            lockedType={lockedType}
            color={color}
            isDragging={isDragging}
            onRemoveTopic={onRemoveTopic}
            note={slotNotes[`${dateStr}_${hour.toString().padStart(2, '0')}:00`]}
            isCompleted={completedNotes[`${dateStr}_${hour.toString().padStart(2, '0')}:00`]}
            onUpdateNote={onUpdateNote}
            onToggleNote={onToggleNote}
            subjects={subjects}
          />
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Date Header */}
      <div className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm rounded-[2rem] p-4 sm:p-6 flex flex-col lg:flex-row justify-between items-center gap-6 shadow-sm border border-slate-100 dark:border-white/5">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full lg:w-auto">
           <div className="bg-[#1cb0f6]/10 w-16 h-16 rounded-[1.25rem] flex flex-col items-center justify-center border-2 border-[#1cb0f6]/20 shadow-sm">
              <span className="text-[10px] font-black uppercase text-[#1cb0f6] tracking-widest">{format(date, "MMM", { locale: tr })}</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white leading-tight mt-0.5">{format(date, "dd")}</span>
           </div>
           <div className="flex flex-col text-center lg:text-left">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                {format(date, "EEEE", { locale: tr })}
              </h2>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-2">
                <button 
                  onClick={() => onToggleHoliday(dateStr)}
                  className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 transition-all ${
                    isHoliday 
                      ? "bg-[#ff2d55]/10 text-[#ff2d55] border-[#ff2d55]/20 hover:bg-[#ff2d55]/20" 
                      : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#1cb0f6] hover:text-[#1cb0f6]"
                  }`}
                >
                  {isHoliday ? "🏖 Tatili İptal Et" : "🏖 Tatil Modu"}
                </button>
                {pomodoroFocusMins > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#1cb0f6]/10 text-[#1cb0f6] px-3 py-1.5 rounded-full border-2 border-[#1cb0f6]/20 shadow-sm transition-all hover:bg-[#1cb0f6]/20 cursor-default">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {Math.floor(pomodoroFocusMins / 60) > 0 && `${Math.floor(pomodoroFocusMins / 60)}s `}
                      {pomodoroFocusMins % 60}dk Çalışıldı
                    </span>
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="flex items-center justify-between sm:justify-center gap-2 bg-slate-50 dark:bg-black/20 p-2 rounded-[1.5rem] border-2 border-slate-100 dark:border-white/5 w-full sm:w-auto">
          <button onClick={() => onDateChange(subDays(new Date(date), 1))} className="w-10 sm:w-12 h-10 sm:h-12 rounded-[1rem] hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shadow-sm shadow-transparent hover:shadow-slate-200 dark:hover:shadow-none shrink-0 font-bold">→</button>
          <button onClick={() => onDateChange(new Date())} className="flex-1 sm:flex-none px-6 py-2.5 bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#1899d6] text-white font-black rounded-[1rem] transition-all active:translate-y-1 active:border-b-0 active:mb-1 text-xs uppercase tracking-widest whitespace-nowrap">Bugün</button>
          <button onClick={() => onDateChange(addDays(new Date(date), 1))} className="w-10 sm:w-12 h-10 sm:h-12 rounded-[1rem] hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shadow-sm shadow-transparent hover:shadow-slate-200 dark:hover:shadow-none shrink-0 font-bold">→</button>
        </div>
      </div>

      {/* Timeline with Tabs */}
      <div className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm rounded-[2rem] overflow-hidden flex flex-col shadow-sm border border-slate-100 dark:border-white/5 mt-2">
        <div className="flex bg-slate-50 dark:bg-black/20 p-2 m-4 rounded-[1.5rem] border-2 border-slate-100 dark:border-white/5 gap-2 overflow-x-auto snap-x">
           {(['morning', 'afternoon', 'evening'] as const).map((tab) => {
             const { hasSomething, hasUncompleted } = stats[tab]
             return (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`flex-1 py-3.5 px-6 min-w-max text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative flex items-center justify-center gap-3 rounded-[1rem] snap-center ${
                   activeTab === tab 
                    ? 'text-[#1cb0f6] bg-white dark:bg-slate-800 shadow-sm border-2 border-[#1cb0f6]' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5 border-2 border-transparent'
                 }`}
               >
                 <span>{tab === 'morning' ? 'Sabah' : tab === 'afternoon' ? 'Öğle' : 'Akşam'}</span>
                 {hasSomething && (
                   <div className={`w-2.5 h-2.5 rounded-full ${
                     hasUncompleted 
                       ? 'bg-[#ff2d55] shadow-[0_0_8px_rgba(255,45,85,0.5)]' 
                       : 'bg-[#58cc02] shadow-[0_0_8px_rgba(88,204,2,0.5)]'
                   } ${hasUncompleted ? 'animate-pulse' : ''}`} />
                 )}
               </button>
             )
           })}
        </div>
        <div className="p-6">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
             >
               {tabContent(getHoursForTab())}
             </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
