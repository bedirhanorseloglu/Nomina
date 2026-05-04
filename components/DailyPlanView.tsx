"use client"

import { format, addDays, subDays, getDay } from "date-fns"
import { tr } from "date-fns/locale"
import { Topic, Subject } from "@/types"
import { useDroppable } from "@dnd-kit/core"
import { UNIVERSITY_CLASSES } from "@/lib/data"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useMemo } from "react"

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
      className={`group relative rounded-2xl p-4 transition-all duration-300 border flex flex-col gap-3 ${
        isLocked 
          ? 'bg-slate-50 border-slate-100 opacity-60' 
          : 'bg-white border-slate-100 hover:border-accent/40 hover:shadow-md'
      } ${isOver ? 'ring-2 ring-accent border-transparent scale-[1.02] z-10' : ''} ${
        isDragging && !isLocked && !topic ? 'border-dashed border-accent/30 bg-accent/5 animate-pulse' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black font-mono text-slate-400 group-hover:text-slate-900 transition-colors tracking-tighter bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          {hour.toString().padStart(2, '0')}:00
        </span>
        {topic && !isLocked && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTopic(topic.id, dateStr, `${hour.toString().padStart(2, '0')}:00`);
            }}
            className="w-6 h-6 rounded-md bg-slate-50 text-slate-300 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          >
            ✕
          </button>
        )}
      </div>

      <div className="min-h-[50px] flex flex-col justify-center">
        {isLocked && lockedTitle ? (
          <div className="flex items-center gap-3">
             <span className="text-2xl grayscale">{lockedType === 'uni' ? '🎓' : lockedType === 'code' ? '💻' : '🏖'}</span>
             <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">KAPALI</span>
                <span className="text-sm font-bold text-slate-600 leading-tight truncate">{lockedTitle}</span>
             </div>
          </div>
        ) : topic ? (
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: color }} />
             <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest truncate" style={{ color }}>
                  {subjects.find((s: any) => s.topics.some((t: any) => t.id === topic.id))?.title}
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight">{topic.title}</span>
             </div>
          </div>
        ) : revision ? (
          <div className="flex items-center gap-3">
             <div className={`w-1.5 h-8 rounded-full shrink-0 ${revision.level === 3 ? 'bg-amber-400' : 'bg-blue-400'}`} />
             <div className="flex flex-col min-w-0">
                <span className={`text-[10px] font-black uppercase tracking-widest ${revision.level === 3 ? 'text-amber-500' : 'text-blue-500'}`}>
                  {revision.level === 3 ? "Kritik Tekrar" : "Rutin Tekrar"}
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight">{revision.title}</span>
             </div>
          </div>
        ) : (
          <div className="flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl py-4 bg-slate-50/50">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-accent/60 transition-colors">
               {isDragging ? "BURAYA BIRAK" : "BOŞ SLOT"}
             </span>
          </div>
        )}
      </div>

      {!isLocked && (
        <div className={`mt-2 p-3 rounded-xl border transition-all relative ${
          note 
            ? isCompleted 
              ? 'bg-slate-50 border-slate-200 opacity-60' 
              : 'bg-amber-50/50 border-amber-100 shadow-sm' 
            : 'bg-slate-50/50 border-slate-100 group-hover:bg-white'
        }`}>
           <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 opacity-40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span className="text-[8px] font-black uppercase tracking-widest">Özel Not</span>
              </div>
              
              {note && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleNote(slotId);
                  }}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20' 
                      : 'bg-white border-slate-200 hover:border-emerald-400'
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
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
             className={`w-full bg-transparent border-0 outline-none text-xs font-medium transition-all placeholder:text-slate-200 resize-none leading-relaxed ${
               isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 focus:text-slate-900'
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
  const dateStr = format(date, "yyyy-MM-dd")
  const isHoliday = holidays.includes(dateStr)
  const isExamDay = dateStr === EXAM_DATE
  const topicsForDay = topics.filter(t => t.scheduledDate === dateStr)

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
      <div className="glass rounded-3xl p-4 sm:p-6 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full lg:w-auto">
           <div className="bg-accent/10 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border border-accent/20 shadow-sm">
              <span className="text-[10px] font-black uppercase text-accent tracking-tighter">{format(date, "MMM", { locale: tr })}</span>
              <span className="text-2xl font-black text-slate-900 leading-tight">{format(date, "dd")}</span>
           </div>
           <div className="flex flex-col text-center lg:text-left">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {format(date, "EEEE", { locale: tr })}
              </h2>
              <div className="flex items-center justify-center lg:justify-start gap-3 mt-1">
                <button 
                  onClick={() => onToggleHoliday(dateStr)}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                    isHoliday 
                      ? "bg-red-500/10 text-red-500 border-red-500/20" 
                      : "bg-slate-100 text-slate-400 border-slate-200 hover:border-accent/40 hover:text-accent"
                  }`}
                >
                  {isHoliday ? "🏖 Tatili İptal Et" : "🏖 Tatil Modu"}
                </button>
              </div>
           </div>
        </div>

        <div className="flex items-center justify-between sm:justify-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full sm:w-auto">
          <button onClick={() => onDateChange(subDays(new Date(date), 1))} className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl hover:bg-white flex items-center justify-center transition-all shadow-sm shadow-transparent hover:shadow-slate-200 shrink-0">←</button>
          <button onClick={() => onDateChange(new Date())} className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-accent text-white font-black rounded-xl hover:shadow-lg hover:shadow-accent/30 transition-all text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap">Bugün</button>
          <button onClick={() => onDateChange(addDays(new Date(date), 1))} className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl hover:bg-white flex items-center justify-center transition-all shadow-sm shadow-transparent hover:shadow-slate-200 shrink-0">→</button>
        </div>
      </div>

      {/* Timeline with Tabs */}
      <div className="glass rounded-3xl overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-100">
           {(['morning', 'afternoon', 'evening'] as const).map((tab) => {
             const { hasSomething, hasUncompleted } = stats[tab]
             return (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center justify-center gap-2 ${
                   activeTab === tab ? 'text-accent' : 'text-slate-400 hover:text-slate-600 bg-slate-50/30'
                 }`}
               >
                 <span>{tab === 'morning' ? 'Sabah' : tab === 'afternoon' ? 'Öğle' : 'Akşam'}</span>
                 {hasSomething && (
                   <div className={`w-1.5 h-1.5 rounded-full ${
                     hasUncompleted 
                       ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                       : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                   } animate-pulse`} />
                 )}
                 {activeTab === tab && (
                   <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-accent" />
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
