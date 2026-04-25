"use client"

import { format, addDays, subDays, getDay } from "date-fns"
import { tr } from "date-fns/locale"
import { Topic } from "@/types"
import { useDroppable } from "@dnd-kit/core"
import { UNIVERSITY_CLASSES } from "@/lib/data"

interface DailyPlanViewProps {
  date: Date
  topics: Topic[]
  onDateChange: (date: Date) => void
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 08 to 22
const HOLIDAYS = ["2026-05-01", "2026-05-19", "2026-07-15", "2026-08-30", "2026-09-05"]
const EXAM_DATE = "2026-09-06"

function TimeSlot({ hour, dateStr, topic, revision, isLocked, lockedTitle, lockedType }: any) {
  const slotId = `${dateStr}_${hour.toString().padStart(2, '0')}:00`
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { acceptsDrop: !isLocked },
    disabled: isLocked
  })

  let bgColor = "bg-surface"
  if (isLocked) {
    if (lockedType === 'uni') bgColor = "bg-indigo-500/10 border-indigo-500/30"
    if (lockedType === 'code') bgColor = "bg-cyan-500/10 border-cyan-500/30"
    if (lockedType === 'holiday') bgColor = "bg-red-500/10 border-red-500/30"
  } else if (isOver) bgColor = "bg-accent/20 border-accent"
  else if (topic) bgColor = "bg-accent/10 border-accent/40"
  else if (revision) bgColor = revision.level === 3 ? "bg-accent2/10 border-accent2/30" : "bg-blue-500/10 border-blue-500/30"

  return (
    <div className="flex gap-4 min-h-[60px] group">
      <div className="w-16 flex flex-col items-end pt-2 shrink-0">
        <span className="text-sm font-mono text-muted">{hour.toString().padStart(2, '0')}:00</span>
      </div>
      <div 
        ref={setNodeRef}
        className={`flex-1 border rounded-lg p-3 transition-colors ${bgColor} ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:border-accent/30'}`}
      >
        {isLocked && lockedTitle && (
          <div className="flex items-center gap-2">
            <span className={lockedType === 'uni' ? 'text-indigo-400' : lockedType === 'code' ? 'text-cyan-400' : 'text-red-400'}>
              {lockedType === 'uni' ? '🟣' : lockedType === 'code' ? '🔵' : '🏖'}
            </span>
            <span className={`font-medium ${lockedType === 'uni' ? 'text-indigo-300' : lockedType === 'code' ? 'text-cyan-300' : 'text-red-300'}`}>
              {lockedTitle}
            </span>
          </div>
        )}
        {topic && !isLocked && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-accent">🟢</span>
              <span className="text-text-main font-medium">{topic.title}</span>
            </div>
          </div>
        )}
        {revision && !isLocked && !topic && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={revision.level === 3 ? "text-accent2" : "text-blue-500"}>🔄</span>
              <span className={`font-medium ${revision.level === 3 ? "text-text-main" : "text-blue-400"}`}>
                {revision.title} {revision.level === 3 ? "(Son Tekrar)" : "(Tekrar)"}
              </span>
            </div>
          </div>
        )}
        {!isLocked && !topic && !revision && (
          <span className="text-muted text-sm opacity-0 group-hover:opacity-100 transition-opacity">Boş Slot (Sürükle & Bırak)</span>
        )}
      </div>
    </div>
  )
}

export default function DailyPlanView({ date, topics, onDateChange }: DailyPlanViewProps) {
  const dateStr = format(date, "yyyy-MM-dd")
  const dayOfWeek = getDay(date)
  
  const isHoliday = HOLIDAYS.includes(dateStr) || dayOfWeek === 0
  const isExamDay = dateStr === EXAM_DATE
  const isCodingDay = dayOfWeek === 6

  const topicsForDay = topics.filter(t => t.scheduledDate === dateStr)

  return (
    <div className="bg-card/40 border border-border-custom rounded-xl p-6 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border-custom">
        <h2 className="text-xl font-heading text-2xl font-bold text-text-main flex items-center gap-3">
          {format(date, "d MMMM yyyy, EEEE", { locale: tr })}
          {isExamDay && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">Sınav Günü!</span>}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => onDateChange(subDays(date, 1))} className="px-3 py-1 bg-surface hover:bg-surface/80 rounded border border-border-custom text-sm">Önceki</button>
          <button onClick={() => onDateChange(new Date())} className="px-3 py-1 bg-surface hover:bg-surface/80 rounded border border-border-custom text-sm">Bugün</button>
          <button onClick={() => onDateChange(addDays(date, 1))} className="px-3 py-1 bg-surface hover:bg-surface/80 rounded border border-border-custom text-sm">Sonraki</button>
        </div>
      </div>

      <div className="space-y-2 relative">
        {HOURS.map(hour => {
          let lockedTitle = ""
          let lockedType = ""
          let isLocked = false

          // Check for university classes at this specific hour
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
            lockedTitle = "Tatil / Dinlenme"
            lockedType = "holiday"
          } else if (isCodingDay) {
            isLocked = true
            lockedTitle = "Yazılım Projeleri"
            lockedType = "code"
          } else if (universityClass) {
            isLocked = true
            lockedTitle = `${universityClass.courseCode} — ${universityClass.courseName}`
            lockedType = "uni"
          }

          const slotTimeStr = `${hour.toString().padStart(2, '0')}:00`
          const topic = topicsForDay.find(t => t.scheduledTime === slotTimeStr)
          
          // Find revision for this slot
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
            />
          )
        })}
      </div>
    </div>
  )
}
