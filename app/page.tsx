"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { loadData, saveData } from "@/lib/storage"
import { loadFromFirebase, saveToFirebase } from "@/lib/firebaseService"
import { initialData } from "@/lib/data"
import { format } from "date-fns"
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
import MotivationalQuote from "@/components/MotivationalQuote"
import { AppData, Subject } from "@/types"
import DenemeLinkButton from "@/components/deneme/DenemeLinkButton"
import confetti from "canvas-confetti"
import { toast } from "sonner"

export default function Home() {
  const [data, setData] = useState<AppData | null>(null)
  const [activeSubjectId, setActiveSubjectId] = useState<string>("turkce")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isAutoPlanOpen, setIsAutoPlanOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeView, setActiveView] = useState<'daily'|'monthly'>('daily')
  const [isSaving, setIsSaving] = useState(false)
  const isInitialLoad = useRef(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const dailyPlanRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  )

  useEffect(() => {
    const initData = async () => {
      const local = loadData()
      setData(local)
      const remote = await loadFromFirebase()
      if (remote) {
        setData(remote)
        saveData(remote)
      }
      isInitialLoad.current = false
    }
    initData()
  }, [])

  useEffect(() => {
    if (data && !isInitialLoad.current) {
      saveData(data)
      setIsSaving(true)
      saveToFirebase(data).then(() => {
        setTimeout(() => setIsSaving(false), 2000)
      })
    }
  }, [data])

  if (!data) return (
    <div className="min-h-screen bg-bg text-text-main flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,168,132,0.1)]" />
       <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Sistem Hazırlanıyor...</span>
    </div>
  )

  const toggleTopic = (topicId: string, subjectId?: string) => {
    if (!data) return
    let wasCompleted = false
    const newSubjects = data.subjects.map(subject => {
      if (subjectId && subject.id !== subjectId) return subject
      return {
        ...subject,
        topics: subject.topics.map(t => {
          if (t.id === topicId) {
            wasCompleted = !t.done
            return { ...t, done: wasCompleted }
          }
          return t
        })
      }
    })
    setData({ ...data, subjects: newSubjects })
    if (wasCompleted) {
      toast.success("Müfredat konusu tamamlandı! Başarılar! 📘")
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      })
    }
  }

  const handleReset = () => {
    setData({ subjects: initialData, streak: 0, lastActiveDate: null })
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString())
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || !active.data.current) return
    if (!over.data.current?.acceptsDrop) return

    const draggedTopicId = active.id.toString().replace("topic_", "")
    const targetId = over.id.toString()
    let scheduledDate = ""
    let scheduledTime = ""

    if (targetId.includes("_")) {
      [scheduledDate, scheduledTime] = targetId.split("_")
    } else {
      scheduledDate = targetId
    }

    const newSubjects = data.subjects.map(subject => {
      return {
        ...subject,
        topics: subject.topics.map(t => {
          if (t.id === draggedTopicId) {
            const newSchedule = { date: scheduledDate, time: scheduledTime || "" }
            const existingSchedules = t.schedules || []
            const isDuplicate = existingSchedules.some(s => s.date === newSchedule.date && s.time === newSchedule.time)
            return { 
              ...t, 
              schedules: isDuplicate ? existingSchedules : [...existingSchedules, newSchedule]
            }
          }
          return t
        })
      }
    })
    setData({ ...data, subjects: newSubjects })
  }

  const scheduleTopic = (topicId: string, dateStr: string, timeStr?: string) => {
    if (!data) return
    const newSubjects = data.subjects.map(subject => ({
      ...subject,
      topics: subject.topics.map(t => {
        if (t.id === topicId) {
          const newSchedule = { date: dateStr, time: timeStr || "" }
          const existingSchedules = t.schedules || []
          const isDuplicate = existingSchedules.some(s => s.date === newSchedule.date && s.time === newSchedule.time)
          return { 
            ...t, 
            schedules: isDuplicate ? existingSchedules : [...existingSchedules, newSchedule]
          }
        }
        return t
      })
    }))
    setData({ ...data, subjects: newSubjects })
  }

  const removeTopic = (topicId: string, dateStr?: string, timeStr?: string) => {
    if (!data) return
    const newSubjects = data.subjects.map(subject => {
      return {
        ...subject,
        topics: subject.topics.map(t => {
          if (t.id === topicId) {
            if (dateStr) {
              return { 
                ...t, 
                schedules: t.schedules?.filter(s => !(s.date === dateStr && s.time === (timeStr || "")))
              }
            }
            return { ...t, schedules: [] }
          }
          return t
        })
      }
    })
    setData({ ...data, subjects: newSubjects })
  }

  const updateSlotNote = (slotId: string, note: string) => {
    if (!data) return
    const newSlotNotes = { ...(data.slotNotes || {}), [slotId]: note }
    if (!note) {
      delete newSlotNotes[slotId]
      // Also clean up completed status if note is deleted
      const newCompletedNotes = { ...(data.completedNotes || {}) }
      delete newCompletedNotes[slotId]
      setData({ ...data, slotNotes: newSlotNotes, completedNotes: newCompletedNotes })
    } else {
      setData({ ...data, slotNotes: newSlotNotes })
    }
  }

  const toggleNote = (slotId: string) => {
    if (!data) return
    const currentCompleted = data.completedNotes || {}
    const isNowCompleted = !currentCompleted[slotId]
    const newCompletedNotes = { ...currentCompleted, [slotId]: isNowCompleted }
    setData({ ...data, completedNotes: newCompletedNotes })
    if (isNowCompleted) {
      toast.success("Günlük görev tamamlandı! Harika gidiyorsun! 🚀")
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.75 }
      })
    }
  }

  const updateSubjectName = (subjectId: string, newName: string) => {
    if (!data) return
    const newSubjects = data.subjects.map(s => s.id === subjectId ? { ...s, title: newName } : s)
    setData({ ...data, subjects: newSubjects })
  }

  const toggleHoliday = (dateStr: string) => {
    if (!data) return
    const currentHolidays = data.holidays || []
    const isHoliday = currentHolidays.includes(dateStr)
    const newHolidays = isHoliday ? currentHolidays.filter(d => d !== dateStr) : [...currentHolidays, dateStr]
    setData({ ...data, holidays: newHolidays })
  }

  const handleApplyAutoPlan = (newSubjects: Subject[]) => {
    setData({ ...data, subjects: newSubjects })
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setActiveView('daily')
    setTimeout(() => {
      if (dailyPlanRef.current) {
        dailyPlanRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  const activeSubject = data.subjects.find(s => s.id === activeSubjectId) || data.subjects[0]
  const allTopicsFlat = data.subjects.flatMap(s => s.topics.flatMap(t => {
    if (t.schedules && t.schedules.length > 0) {
      return t.schedules.map(sch => ({ ...t, scheduledDate: sch.date, scheduledTime: sch.time }))
    }
    return [t]
  }))
  const activeTopic = activeId ? allTopicsFlat.find(t => `topic_${t.id}` === activeId) : null

  const totalTopics = data.subjects.reduce((acc, curr) => acc + curr.topics.length, 0)
  const completedTopics = data.subjects.reduce((acc, curr) => acc + curr.topics.filter(t => t.done).length, 0)
  const totalPercent = totalTopics === 0 ? 0 : (completedTopics / totalTopics) * 100

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen overflow-hidden bg-bg text-text-main font-sans selection:bg-accent/30">
        <Sidebar 
          subjects={data.subjects} 
          activeSubjectId={activeSubjectId}
          onSelect={setActiveSubjectId}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#f5f5f7]">
          {/* Top Header */}
          <header className="h-20 border-b border-slate-200/40 bg-[#f5f5f7]/80 backdrop-blur-md sticky top-0 flex items-center justify-between px-4 md:px-12 z-40 shrink-0 gap-4">
            <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden bg-slate-100 p-2 rounded-xl text-slate-900 hover:bg-accent/10 hover:text-accent transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              <div className="hidden md:block w-full max-w-xs md:w-80">
                <SearchBar subjects={data.subjects} onSelectSubject={setActiveSubjectId} />
              </div>
            </div>
            
            <div className="flex items-center gap-4 lg:gap-10">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-xl border border-red-100">
                 <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Busis ❤️</span>
              </div>
              
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100">
                 <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Durum: <span className="text-accent">Operasyonel</span></span>
              </div>

              {isSaving && (
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/5 px-3 py-1.5 rounded-xl border border-emerald-400/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Eşitleniyor
                </div>
              )}
              
              <div className="hidden md:block">
                <KPSSCountdown />
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={() => setIsResetModalOpen(true)} className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center font-black shrink-0">✕</button>
              </div>
            </div>
          </header>

          {/* Main Scroll Area */}
          <main ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-12 md:space-y-16">
              
              {/* Motivation Section */}
              <MotivationalQuote />
              
              {/* Overview Section */}
              <section className="flex flex-col gap-8">
                 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-0">
                    <div className="flex flex-col gap-4">
                       <div>
                         <h1 className="text-3xl md:text-4xl font-black font-heading text-text-main tracking-tighter">GÖSTERGE PANELİ</h1>
                         <p className="text-muted text-sm font-medium">Hedeflerinize ulaşmak için bugün harika bir gün.</p>
                       </div>
                       <DenemeLinkButton variant="card" />
                    </div>
                    <div className="hidden md:flex items-center gap-4 glass p-3 rounded-[2rem]">
                        <ProgressRing percentage={totalPercent} size={80} strokeWidth={8} color={activeSubject?.color} />
                        <div className="flex flex-col pr-4">
                           <span className="text-[10px] font-black text-muted uppercase tracking-widest">Genel İlerleme</span>
                           <span className="text-xl font-black text-text-main">{Math.round(totalPercent)}%</span>
                        </div>
                    </div>
                 </div>
                 <StatsBar total={totalTopics} completed={completedTopics} streak={data.streak} />
              </section>

              {/* Strategy Details (Collapsible) */}
              <section>
                <details className="group glass rounded-[2rem] overflow-hidden border border-white/5">
                  <summary className="list-none cursor-pointer p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">💡</div>
                      <span className="text-sm font-black uppercase tracking-widest text-text-main">Sınav Stratejileri & Bilgi Kartları</span>
                    </div>
                    <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <KPSSInfoCards />
                  </div>
                </details>
              </section>

              {/* Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12 items-start">
                
                {/* Left Col: Knowledge Base */}
                <div className="xl:col-span-4 flex flex-col gap-6 xl:sticky xl:top-24">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted opacity-60">Müfredat Havuzu</h3>
                     <span className="text-[10px] font-bold text-accent bg-accent/5 px-2 py-0.5 rounded-full ring-1 ring-accent/20">Sürüklenebilir</span>
                  </div>
                  <TopicList 
                    subjects={data.subjects} 
                    activeSubjectId={activeSubjectId}
                    onSelectSubject={setActiveSubjectId}
                    onToggleTopic={toggleTopic} 
                    onScheduleTopic={(topicId, subjectId) => scheduleTopic(topicId, format(selectedDate, "yyyy-MM-dd"))} 
                    onUpdateSubjectName={updateSubjectName}
                  />
                </div>
                
                {/* Right Col: Timeline & Context */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                  {/* View Switcher Tabs */}
                  <div className="glass rounded-[2rem] p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button 
                      onClick={() => setActiveView('daily')}
                      className={`flex-1 py-3 sm:py-4 rounded-[1.5rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden ${
                        activeView === 'daily' 
                          ? 'text-white' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {activeView === 'daily' && (
                        <motion.div 
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-accent"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">Günlük Operasyon</span>
                      {activeView === 'daily' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-white animate-pulse relative z-10" />}
                    </button>
                    <button 
                      onClick={() => setActiveView('monthly')}
                      className={`flex-1 py-3 sm:py-4 rounded-[1.5rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden ${
                        activeView === 'monthly' 
                          ? 'text-white' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {activeView === 'monthly' && (
                        <motion.div 
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-accent"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">Aylık Projeksiyon</span>
                      {activeView === 'monthly' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-white animate-pulse relative z-10" />}
                    </button>
                  </div>

                  <div className="relative">
                    <AnimatePresence mode="wait">
                      {activeView === 'daily' ? (
                        <motion.div 
                          key="daily"
                          ref={dailyPlanRef}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <DailyPlanView 
                            date={selectedDate} 
                            topics={allTopicsFlat} 
                            subjects={data.subjects} 
                            isDragging={!!activeId} 
                            onDateChange={setSelectedDate} 
                            onRemoveTopic={removeTopic} 
                            slotNotes={data.slotNotes || {}}
                            completedNotes={data.completedNotes || {}}
                            onUpdateNote={updateSlotNote}
                            onToggleNote={toggleNote}
                            holidays={data.holidays || []}
                            onToggleHoliday={toggleHoliday}
                          />
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="monthly"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <MonthlyCalendar 
                            topics={allTopicsFlat} 
                            subjects={data.subjects} 
                            slotNotes={data.slotNotes || {}}
                            completedNotes={data.completedNotes || {}}
                            isDragging={!!activeId} 
                            onDayClick={handleDayClick} 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Footer Spacer */}
              <div className="h-24" />
            </div>
          </main>
        </div>

        {/* Drag Overlay Redesign */}
        <DragOverlay>
          {activeTopic ? (
            <div className="glass p-4 rounded-2xl border-2 border-accent shadow-2xl cursor-grabbing w-72 z-[100] flex items-center gap-4 rotate-2">
               <div className="w-12 h-12 rounded-xl bg-accent text-bg flex items-center justify-center text-xl font-black">
                  {data.subjects.find(s => s.topics.some(t => t.id === activeTopic.id))?.icon || '📚'}
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent">Yerleştiriliyor</span>
                  <span className="text-sm font-bold text-text-main truncate">{activeTopic.title}</span>
               </div>
            </div>
          ) : null}
        </DragOverlay>

        <ResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleReset} />
        <AutoPlanGenerator isOpen={isAutoPlanOpen} onClose={() => setIsAutoPlanOpen(false)} subjects={data.subjects} onApplyPlan={handleApplyAutoPlan} />
      </div>
    </DndContext>
  )
}
