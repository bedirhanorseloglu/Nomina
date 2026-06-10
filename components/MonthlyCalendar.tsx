"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useDroppable } from "@dnd-kit/core"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns"
import { tr } from "date-fns/locale"
import { Topic, Subject } from "@/types"
import { UNIVERSITY_CLASSES } from "@/lib/data"

interface MonthlyCalendarProps {
  topics: Topic[]
  subjects: Subject[]
  slotNotes: Record<string, string>
  completedNotes: Record<string, boolean>
  isDragging: boolean
  onDayClick: (date: Date) => void
}

const HOLIDAYS = [
  "2026-05-01", "2026-05-19", "2026-07-15", "2026-08-30", "2026-09-05"
]
const EXAM_DATE = "2026-09-06"

function DroppableDayCell({ 
  date, 
  isCurrentMonth, 
  topicsForDay, 
  allTopics, 
  subjects, 
  slotNotes,
  completedNotes,
  isDragging, 
  onClick 
}: { 
  date: Date, 
  isCurrentMonth: boolean, 
  topicsForDay: Topic[], 
  allTopics: Topic[], 
  subjects: Subject[], 
  slotNotes: Record<string, string>,
  completedNotes: Record<string, boolean>,
  isDragging: boolean, 
  onClick: () => void 
}) {
  const dateStr = format(date, "yyyy-MM-dd")
  const dayOfWeek = getDay(date)
  const isHoliday = HOLIDAYS.includes(dateStr) || dayOfWeek === 0
  const isExamDay = dateStr === EXAM_DATE
  const classesForDay = UNIVERSITY_CLASSES.filter(c => c.date === dateStr)
  const notesForDay = Object.entries(slotNotes)
    .filter(([key, val]) => key.startsWith(dateStr) && val.trim() !== "")
    .map(([key, val]) => ({ 
      time: key.split("_")[1], 
      text: val,
      isCompleted: completedNotes[key] || false 
    }))

  const { isOver, setNodeRef } = useDroppable({
    id: dateStr,
    data: { acceptsDrop: !isHoliday && !isExamDay },
    disabled: isHoliday || isExamDay
  })

  const isToday = isSameDay(date, new Date())

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`min-h-[120px] p-2.5 border-2 rounded-[1.5rem] transition-all duration-300 cursor-pointer flex flex-col gap-1.5 relative group overflow-hidden ${
        !isCurrentMonth ? 'opacity-30 pointer-events-none border-slate-100 dark:border-slate-800' : 'hover:-translate-y-1 hover:shadow-lg'
      } ${isToday ? 'bg-[#1cb0f6]/5 border-[#1cb0f6] shadow-sm' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-[#1e293b]/80 hover:border-[#1cb0f6]/50'} ${
        isOver ? 'scale-105 z-20 ring-4 ring-[#1cb0f6]/30 bg-[#1cb0f6]/10 border-[#1cb0f6] shadow-xl' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className={`text-[11px] font-black font-mono px-2.5 py-1 rounded-[0.75rem] border-2 transition-colors ${
          isToday ? 'bg-[#1cb0f6] text-white border-[#1cb0f6] shadow-sm' : isExamDay ? 'bg-[#ff2d55] text-white border-[#ff2d55]' : 'bg-transparent border-transparent text-slate-400 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 group-hover:text-slate-700 dark:group-hover:text-white group-hover:border-slate-200 dark:group-hover:border-slate-700'
        }`}>
          {format(date, "d")}
        </span>
        {isExamDay && <span className="text-[8px] font-black uppercase text-red-500 tracking-tighter">KPSS</span>}
        {isHoliday && !isExamDay && isCurrentMonth && <span className="text-[8px] font-black uppercase text-slate-300 tracking-tighter">🏖</span>}
      </div>

      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
        {classesForDay.map(cls => (
          <div key={cls.id} className="w-full h-1.5 bg-indigo-500/20 rounded-full" title={cls.courseName} />
        ))}
        
        {topicsForDay.slice(0, 3).map((topic, idx) => {
          const subject = subjects.find(s => s.topics.some(t => t.id === topic.id))
          return (
            <div 
              key={`${topic.id}-${topic.scheduledTime || idx}`} 
              className="text-[9px] font-black px-2 py-1 rounded-[0.5rem] truncate opacity-100 border-2 shadow-sm transition-transform hover:scale-105"
              style={{ backgroundColor: `${subject?.color || '#1cb0f6'}15`, borderColor: `${subject?.color || '#1cb0f6'}30`, color: subject?.color || '#1cb0f6' }}
            >
              {topic.title}
            </div>
          )
        })}

        <div className="mt-auto flex flex-wrap gap-1 items-center">
           {notesForDay.length > 0 && (
             <div className={`flex items-center gap-0.5 p-1 rounded-md border shadow-sm ${
               notesForDay.every(n => n.isCompleted) 
                 ? 'bg-emerald-50 border-emerald-100' 
                 : 'bg-red-50 border-red-100'
             }`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={notesForDay.every(n => n.isCompleted) ? "#10b981" : "#FF0000"}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
             </div>
           )}
           {allTopics.some(t => t.revisions?.some(r => r.date === dateStr)) && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm" />}
        </div>
      </div>
      
      {isDragging && !isHoliday && !isExamDay && isCurrentMonth && (
        <div className="absolute inset-0 bg-accent/5 border border-dashed border-accent/20 rounded-2xl animate-pulse" />
      )}
    </div>
  )
}

export default function MonthlyCalendar({ topics, subjects, slotNotes, completedNotes, isDragging, onDayClick }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return (
    <div className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-white/5">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black capitalize text-slate-800 dark:text-white tracking-tight">
          {format(currentDate, "MMMM yyyy", { locale: tr })}
        </h2>
        <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-black/20 rounded-[1.5rem] border-2 border-slate-100 dark:border-white/5">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="w-12 h-12 rounded-[1rem] hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shadow-sm shadow-transparent hover:shadow-slate-200 dark:hover:shadow-none font-bold">→</button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="w-12 h-12 rounded-[1rem] hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shadow-sm shadow-transparent hover:shadow-slate-200 dark:hover:shadow-none font-bold">→</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-4">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
          <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {days.map(day => {
          const dayStr = format(day, "yyyy-MM-dd")
          const topicsForDay = topics.filter(t => t.scheduledDate === dayStr)
          return (
            <DroppableDayCell 
              key={day.toString()}
              date={day}
              isCurrentMonth={isSameMonth(day, monthStart)}
              topicsForDay={topicsForDay}
              allTopics={topics}
              subjects={subjects}
              slotNotes={slotNotes}
              completedNotes={completedNotes}
              isDragging={isDragging}
              onClick={() => onDayClick(day)}
            />
          )
        })}
      </div>
      
      <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6 pt-6 border-t-2 border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-700">
             <div className="flex items-center justify-center w-6 h-6 bg-[#ff2d55]/10 rounded-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff2d55"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
             </div>
             <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">Youtube Notları</span>
          </div>
         <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-700">
            <div className="w-4 h-4 rounded-full bg-[#1cb0f6] border-4 border-[#1cb0f6]/20" />
            <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">Tekrarlar</span>
         </div>
         <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-700">
            <div className="w-4 h-4 rounded-full bg-[#af52de] border-4 border-[#af52de]/20" />
            <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">Dersler</span>
         </div>
      </div>
    </div>
  )
}
