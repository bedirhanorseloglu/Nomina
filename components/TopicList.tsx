"use client"

import { Subject, Topic } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { useDraggable } from "@dnd-kit/core"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useEffect, useCallback } from "react"

function DraggableTopicItem({ topic, onToggleTopic, onScheduleTopic, color, subjectIcon }: { topic: Topic, onToggleTopic: (id: string) => void, onScheduleTopic: (id: string) => void, color: string, subjectIcon: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `topic_${topic.id}`,
    data: { topic }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.9 : 1,
  } : undefined

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners} 
      {...attributes}
      style={style}
      layoutId={`topic-${topic.id}`}
      className={`cursor-grab active:cursor-grabbing group relative flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border ${
        topic.done 
          ? "bg-slate-50 border-transparent grayscale" 
          : "bg-white border-slate-100 hover:border-accent/40 hover:bg-white hover:shadow-lg hover:shadow-slate-200"
      }`}
    >
      <div 
        className="text-slate-300 group-hover:text-accent p-1.5 shrink-0 bg-slate-50 rounded-xl transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
      </div>

      <div className="flex-1 flex items-center gap-3 text-left overflow-hidden">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleTopic(topic.id); }}
          className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 ${
            topic.done 
              ? "bg-accent border-accent text-white" 
              : "border-slate-100 group-hover:border-accent/60"
          }`}
        >
          {topic.done && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="w-3 h-3"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </motion.svg>
          )}
        </button>
        <div 
          onClick={() => onToggleTopic(topic.id)}
          className="flex flex-col min-w-0 flex-1 select-none"
        >
          <span className={`text-sm font-bold transition-colors truncate ${
            topic.done ? "text-slate-400 line-through" : "text-slate-900"
          }`}>
            {topic.title}
          </span>
          {topic.questionCount && !topic.done && (
             <span className="text-[10px] text-slate-400 font-black opacity-60">{topic.questionCount} SORU</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!topic.done && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onScheduleTopic(topic.id); }}
            className="w-8 h-8 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm"
            title="Bugüne Ekle"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        )}
        
        {topic.schedules && topic.schedules.length > 0 && (
          <div className="flex gap-1">
            {topic.schedules.slice(0, 1).map((sch, i) => (
              <div 
                key={i}
                className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border shadow-sm shadow-black/5"
                style={{ color: color, backgroundColor: `${color}10`, borderColor: `${color}20` }}
              >
                {format(new Date(sch.date), "dd MMM", { locale: tr })}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface TopicListProps {
  subjects: Subject[]
  activeSubjectId: string
  onSelectSubject: (id: string) => void
  onToggleTopic: (topicId: string, subjectId: string) => void
  onScheduleTopic: (topicId: string, subjectId: string) => void
  onUpdateSubjectName: (subjectId: string, newName: string) => void
}

export default function TopicList({ subjects, activeSubjectId, onSelectSubject, onToggleTopic, onScheduleTopic, onUpdateSubjectName }: TopicListProps) {
  const currentIndex = subjects.findIndex(s => s.id === activeSubjectId)
  const subject = subjects[currentIndex] || subjects[0]

  const goToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % subjects.length
    onSelectSubject(subjects[nextIndex].id)
  }, [currentIndex, subjects, onSelectSubject])

  const goToPrev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + subjects.length) % subjects.length
    onSelectSubject(subjects[prevIndex].id)
  }, [currentIndex, subjects, onSelectSubject])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNext()
      if (e.key === "ArrowLeft") goToPrev()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goToNext, goToPrev])

  return (
    <div className="flex flex-col gap-4">
      {/* Subject Navigation Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
           <button 
             onClick={goToPrev}
             className="w-8 h-8 rounded-xl bg-white border border-slate-100 hover:border-accent transition-all flex items-center justify-center text-slate-400 hover:text-accent shadow-sm"
           >
             ←
           </button>
           <button 
             onClick={goToNext}
             className="w-8 h-8 rounded-xl bg-white border border-slate-100 hover:border-accent transition-all flex items-center justify-center text-slate-400 hover:text-accent shadow-sm"
           >
             →
           </button>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
           {currentIndex + 1} / {subjects.length} DERS
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={subject.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Background Decorative Icon */}
          <div className="absolute top-[-20px] right-[-20px] text-8xl opacity-[0.03] select-none pointer-events-none rotate-12">
            {subject.icon}
          </div>

          <div className="flex flex-col gap-4 mb-8 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner shadow-slate-100 border border-slate-100 shrink-0">
                  {subject.icon}
                </div>
                <div className="flex flex-col flex-1">
                  <input 
                    type="text"
                    value={subject.title}
                    onChange={(e) => onUpdateSubjectName(subject.id, e.target.value)}
                    className="bg-transparent border-0 outline-none text-xl font-black text-slate-900 p-0 w-full tracking-tight"
                  />
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{subject.category}</span>
                     <div className="w-1 h-1 rounded-full bg-slate-200" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: subject.color }}>{subject.subCategory}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end bg-white/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                <span className="text-2xl font-black font-mono tracking-tighter" style={{ color: subject.color }}>
                  {Math.round((subject.topics.filter(t => t.done).length / subject.topics.length) * 100)}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Başarı</span>
              </div>
            </div>
            
            {subject.tip && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed flex gap-3">
                  <span className="text-lg opacity-40 shrink-0">💡</span>
                  <span className="italic">{subject.tip}</span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {subject.topics.map((topic) => (
              <DraggableTopicItem 
                key={topic.id} 
                topic={topic} 
                onToggleTopic={(id) => onToggleTopic(id, subject.id)} 
                onScheduleTopic={(id) => onScheduleTopic(id, subject.id)}
                color={subject.color} 
                subjectIcon={subject.icon}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
