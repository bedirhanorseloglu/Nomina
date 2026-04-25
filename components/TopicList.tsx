"use client"

import { Subject, Topic } from "@/types"
import { motion } from "framer-motion"
import { useDraggable } from "@dnd-kit/core"

interface TopicListProps {
  subject: Subject
  onToggleTopic: (topicId: string) => void
}

function DraggableTopicItem({ topic, onToggleTopic }: { topic: Topic, onToggleTopic: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `topic_${topic.id}`,
    data: { topic }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  } : undefined

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layoutId={`topic-${topic.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full flex items-center gap-4 p-3 rounded-lg border transition-all text-left group ${
        topic.done 
          ? "bg-accent/5 border-accent/20" 
          : "bg-surface/50 border-transparent hover:border-border-custom hover:bg-surface"
      }`}
    >
      <div 
        {...listeners} 
        {...attributes}
        className="cursor-grab active:cursor-grabbing text-muted hover:text-text-main pr-2 shrink-0"
        title="Takvime Sürükle"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
      </div>

      <button
        onClick={() => onToggleTopic(topic.id)}
        className="flex-1 flex items-center gap-3 text-left"
      >
        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
          topic.done 
            ? "bg-accent border-accent text-bg" 
            : "border-muted group-hover:border-text-main"
        }`}>
          {topic.done && (
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3 h-3"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </motion.svg>
          )}
        </div>
        <span className={`text-sm md:text-base transition-colors ${
          topic.done ? "text-muted line-through" : "text-text-main"
        }`}>
          {topic.title}
        </span>
      </button>

      {topic.scheduledDate && (
        <div className="text-[10px] text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20 shrink-0">
          {topic.scheduledDate.slice(5)}
        </div>
      )}
    </motion.div>
  )
}

export default function TopicList({ subject, onToggleTopic }: TopicListProps) {
  const completedCount = subject.topics.filter(t => t.done).length
  const totalCount = subject.topics.length

  return (
    <div className="bg-card/40 border border-border-custom rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-custom">
        <h2 className="text-xl font-heading font-bold flex items-center gap-2">
          <span>{subject.icon}</span> {subject.title}
        </h2>
        <div className="text-sm font-mono text-muted">
          <span className="text-accent">{completedCount}</span> / {totalCount}
        </div>
      </div>

      <div className="space-y-2">
        {subject.topics.map((topic) => (
          <DraggableTopicItem key={topic.id} topic={topic} onToggleTopic={onToggleTopic} />
        ))}
      </div>
    </div>
  )
}
