"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { loadData, saveData } from "@/lib/storage"
import { initialData } from "@/lib/data"
import Sidebar from "@/components/Sidebar"
import TopicList from "@/components/TopicList"
import ProgressRing from "@/components/ProgressRing"
import KPSSCountdown from "@/components/KPSSCountdown"
import StatsBar from "@/components/StatsBar"
import SearchBar from "@/components/SearchBar"
import ResetModal from "@/components/ResetModal"
import KPSSInfoCards from "@/components/KPSSInfoCards"
import MonthlyCalendar from "@/components/MonthlyCalendar"
import DailyPlanView from "@/components/DailyPlanView"
import AutoPlanGenerator from "@/components/AutoPlanGenerator"
import { AppData, Subject } from "@/types"

export default function Home() {
  const [data, setData] = useState<AppData | null>(null)
  const [activeSubjectId, setActiveSubjectId] = useState<string>("turkce")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isAutoPlanOpen, setIsAutoPlanOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date("2026-09-01"))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  useEffect(() => {
    setData(loadData())
  }, [])

  useEffect(() => {
    if (data) saveData(data)
  }, [data])

  if (!data) return <div className="min-h-screen bg-bg text-text-main flex items-center justify-center">Yükleniyor...</div>

  const toggleTopic = (topicId: string) => {
    if (!data) return

    const newSubjects = data.subjects.map(subject => {
      if (subject.id !== activeSubjectId) return subject
      
      return {
        ...subject,
        topics: subject.topics.map(t => 
          t.id === topicId ? { ...t, done: !t.done } : t
        )
      }
    })

    let newStreak = data.streak
    let newLastActive = data.lastActiveDate
    const today = new Date().toISOString().split('T')[0]
    
    if (newLastActive !== today) {
      const isChecking = newSubjects
        .find(s => s.id === activeSubjectId)
        ?.topics.find(t => t.id === topicId)?.done

      if (isChecking) {
        if (!newLastActive) {
          newStreak = 1
        } else {
          const lastDate = new Date(newLastActive)
          const currentDate = new Date(today)
          const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays === 1) newStreak += 1
          else if (diffDays > 1) newStreak = 1
        }
        newLastActive = today
      }
    }

    setData({ ...data, subjects: newSubjects, streak: newStreak, lastActiveDate: newLastActive })
  }

  const handleReset = () => {
    setData({ subjects: initialData, streak: 0, lastActiveDate: null })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !active.data.current) return

    if (!over.data.current?.acceptsDrop) return // Rejected

    const draggedTopicId = active.id.toString().replace("topic_", "")
    const targetId = over.id.toString()
    
    let scheduledDate = ""
    let scheduledTime = ""

    if (targetId.includes("_")) {
      // It's a DailyPlanView slot (YYYY-MM-DD_HH:mm)
      [scheduledDate, scheduledTime] = targetId.split("_")
    } else {
      // It's a MonthlyCalendar day cell (YYYY-MM-DD)
      scheduledDate = targetId
    }

    const newSubjects = data.subjects.map(subject => {
      return {
        ...subject,
        topics: subject.topics.map(t => {
          if (t.id === draggedTopicId) {
            return { ...t, scheduledDate, scheduledTime: scheduledTime || t.scheduledTime }
          }
          return t
        })
      }
    })

    setData({ ...data, subjects: newSubjects })
  }

  const handleApplyAutoPlan = (newSubjects: Subject[]) => {
    setData({ ...data, subjects: newSubjects })
  }

  const activeSubject = data.subjects.find(s => s.id === activeSubjectId) || data.subjects[0]

  const totalTopics = data.subjects.reduce((acc, curr) => acc + curr.topics.length, 0)
  const completedTopics = data.subjects.reduce((acc, curr) => acc + curr.topics.filter(t => t.done).length, 0)
  const totalPercent = totalTopics === 0 ? 0 : (completedTopics / totalTopics) * 100

  // All topics flat array for Calendar & Timeline
  const allTopics = data.subjects.flatMap(s => s.topics)

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-screen overflow-hidden bg-bg text-text-main font-sans">
        <Sidebar 
          subjects={data.subjects} 
          activeSubjectId={activeSubjectId}
          onSelect={setActiveSubjectId}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <header className="h-20 border-b border-border-custom bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-text-main p-2 hover:bg-surface rounded-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              <div className="hidden md:block w-64">
                <SearchBar subjects={data.subjects} onSelectSubject={setActiveSubjectId} />
              </div>
            </div>
            
            <div className="flex items-center gap-4 md:gap-8">
              <div className="hidden lg:block">
                <KPSSCountdown />
              </div>
              <button 
                onClick={() => setIsAutoPlanOpen(true)}
                className="bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden md:block"
              >
                ✨ Otomatik Plan
              </button>
              <button onClick={() => setIsResetModalOpen(true)} className="text-muted hover:text-red-400 transition-colors text-sm font-medium">Sıfırla</button>
            </div>
          </header>

          <div className="md:hidden p-4 flex flex-col gap-4 border-b border-border-custom bg-bg z-10">
            <SearchBar subjects={data.subjects} onSelectSubject={setActiveSubjectId} />
            <KPSSCountdown />
            <button 
                onClick={() => setIsAutoPlanOpen(true)}
                className="bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full"
              >
                ✨ Otomatik Plan
            </button>
          </div>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              <KPSSInfoCards />

              <div className="flex flex-col xl:flex-row gap-8 mb-8">
                <div className="flex-1">
                  <StatsBar total={totalTopics} completed={completedTopics} streak={data.streak} />
                </div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card/40 border border-border-custom backdrop-blur-md rounded-xl p-6 flex items-center justify-center shrink-0"
                >
                  <ProgressRing percentage={totalPercent} size={140} strokeWidth={10} />
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeSubjectId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                      <TopicList subject={activeSubject} onToggleTopic={toggleTopic} />
                    </motion.div>
                  </AnimatePresence>
                </div>
                
                <div className="lg:col-span-2 flex flex-col gap-8">
                  <MonthlyCalendar topics={allTopics} onDayClick={setSelectedDate} />
                  <DailyPlanView date={selectedDate} topics={allTopics} onDateChange={setSelectedDate} />
                </div>
              </div>
            </div>
          </main>
        </div>

        <ResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleReset} />
        <AutoPlanGenerator isOpen={isAutoPlanOpen} onClose={() => setIsAutoPlanOpen(false)} subjects={data.subjects} onApplyPlan={handleApplyAutoPlan} />
      </div>
    </DndContext>
  )
}
