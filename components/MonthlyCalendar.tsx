"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useDroppable } from "@dnd-kit/core"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isWeekend, getDay } from "date-fns"
import { tr } from "date-fns/locale"
import { Topic } from "@/types"
import { UNIVERSITY_CLASSES } from "@/lib/data"

interface MonthlyCalendarProps {
  topics: Topic[]
  onDayClick: (date: Date) => void
}

const HOLIDAYS = [
  "2026-05-01", // İşçi Bayramı
  "2026-05-19", // Atatürk'ü Anma
  "2026-07-15", // Demokrasi ve Milli Birlik
  "2026-08-30", // Zafer Bayramı
  "2026-09-05", // Sınav öncesi
]

const EXAM_DATE = "2026-09-06"

function DroppableDayCell({ date, isCurrentMonth, topicsForDay, allTopics, onClick }: { date: Date, isCurrentMonth: boolean, topicsForDay: Topic[], allTopics: Topic[], onClick: () => void }) {
  const dateStr = format(date, "yyyy-MM-dd")
  const dayOfWeek = getDay(date) // 0 is Sunday, 6 is Saturday
  
  const isHoliday = HOLIDAYS.includes(dateStr) || dayOfWeek === 0 // Sunday is holiday
  const isCodingDay = dayOfWeek === 6 // Saturday is Coding
  const isExamDay = dateStr === EXAM_DATE

  const classesForDay = UNIVERSITY_CLASSES.filter(c => c.date === dateStr)

  const { isOver, setNodeRef } = useDroppable({
    id: dateStr,
    data: {
      acceptsDrop: !isHoliday && !isExamDay
    },
    disabled: isHoliday || isExamDay
  })

  let bgColor = "bg-surface"
  if (!isCurrentMonth) bgColor = "bg-surface/30 opacity-50"
  else if (isExamDay) bgColor = "bg-red-500/20 border-red-500/50"
  else if (isHoliday) bgColor = "bg-card/50"
  else if (isOver) bgColor = "bg-accent/20 border-accent"

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`min-h-[100px] p-2 border border-border-custom rounded-lg transition-colors cursor-pointer hover:border-accent/30 flex flex-col gap-1 ${bgColor}`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-sm font-medium ${isExamDay ? 'text-red-400' : 'text-text-main'}`}>
          {format(date, "d")}
        </span>
        {isExamDay && <span className="text-xs font-bold text-red-400">KPSS!</span>}
        {isHoliday && !isExamDay && <span className="text-[10px] text-muted uppercase">Tatil</span>}
      </div>

      <div className="flex-1 flex flex-col gap-1 overflow-hidden mt-1">
        {classesForDay.map(cls => (
          <div key={cls.id} className="text-[10px] bg-indigo-500/20 text-indigo-500 px-1.5 py-0.5 rounded truncate border border-indigo-500/30" title={`${cls.courseName} — Düzenlenemez`}>
            🟣 {cls.courseCode}
          </div>
        ))}
        {isCodingDay && !isHoliday && (
          <div className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded truncate border border-cyan-500/30">
            🔵 Yazılım Günü
          </div>
        )}

        {topicsForDay.slice(0, 4).map(topic => (
          <div key={topic.id} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded truncate border border-accent/20">
            {topic.title}
          </div>
        ))}
        {allTopics.map(t => t.revisions?.filter(r => r.date === dateStr).map((r, i) => (
          <div key={`${t.id}-rev-${i}`} className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${
            r.level === 3 ? "bg-accent2/20 text-accent2 border-accent2/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"
          }`}>
            🔄 {t.title}
          </div>
        )))}
      </div>
    </div>
  )
}

export default function MonthlyCalendar({ topics, onDayClick }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date("2026-09-01"))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  return (
    <div className="bg-card/40 border border-border-custom rounded-xl p-6 backdrop-blur-sm mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-bold capitalize text-text-main">
          {format(currentDate, "MMMM yyyy", { locale: tr })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 bg-surface hover:bg-surface/80 rounded-lg transition-colors text-text-main border border-border-custom">
            &larr;
          </button>
          <button onClick={nextMonth} className="p-2 bg-surface hover:bg-surface/80 rounded-lg transition-colors text-text-main border border-border-custom">
            &rarr;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
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
              onClick={() => onDayClick(day)}
            />
          )
        })}
      </div>
    </div>
  )
}
