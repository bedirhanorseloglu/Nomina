"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { loadData, saveData } from "@/lib/storage"
import { loadFromFirebase, saveToFirebase } from "@/lib/firebaseService"
import { initialData } from "@/lib/data"
import { format } from "date-fns"
import TopicList from "@/components/TopicList"
import ProgressRing from "@/components/ProgressRing"
import KPSSCountdown from "@/components/KPSSCountdown"
import StatsBar from "@/components/StatsBar"
import ResetModal from "@/components/ResetModal"
import KPSSInfoCards from "@/components/KPSSInfoCards"
import MonthlyCalendar from "@/components/MonthlyCalendar"
import DailyPlanView from "@/components/DailyPlanView"
import AutoPlanGenerator from "@/components/AutoPlanGenerator"
import DailyGoalWidget from "@/components/DailyGoalWidget"
import { AppData, Subject } from "@/types"
import DenemeLinkButton from "@/components/deneme/DenemeLinkButton"
import confetti from "canvas-confetti"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/components/ThemeProvider"

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Suspense } from 'react'

function HomeContent() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [data, setData] = useState<AppData | null>(null)
  
  const [activeSubjectId, setActiveSubjectIdState] = useState(searchParams.get('subject') || "turkce")
  
  useEffect(() => {
    const subject = searchParams.get('subject');
    if (subject && subject !== activeSubjectId) {
      setActiveSubjectIdState(subject);
    }
  }, [searchParams]);

  const setActiveSubjectId = (id: string) => {
    setActiveSubjectIdState(id)
  }
  const [activeId, setActiveId] = useState<string | null>(null)
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
      if (user?.uid) {
        const remote = await loadFromFirebase(user.uid)
        if (remote) {
          setData(remote)
          saveData(remote)
        }
      }
      isInitialLoad.current = false
    }
    initData()
  }, [user])

  useEffect(() => {
    if (data && !isInitialLoad.current) {
      saveData(data)
      setIsSaving(true)
      if (user?.uid) {
        saveToFirebase(user.uid, data).then(() => {
          setTimeout(() => setIsSaving(false), 2000)
        })
      } else {
        setTimeout(() => setIsSaving(false), 2000)
      }
    }
  }, [data, user])

  if (!data) return (
    <div className="min-h-screen bg-bg text-text-main flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,168,132,0.1)]" />
       <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Sistem Hazırlanıyor...</span>
    </div>
  )

  const safeSubjects = data.subjects || initialData

  const toggleTopic = (topicId: string, subjectId?: string) => {
    if (!data) return
    let wasCompleted = false
    const newSubjects = safeSubjects.map(subject => {
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

    const newSubjects = safeSubjects.map(subject => {
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
    const newSubjects = safeSubjects.map(subject => ({
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
    const newSubjects = safeSubjects.map(subject => {
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
    const newSubjects = safeSubjects.map(s => s.id === subjectId ? { ...s, title: newName } : s)
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

  const handleUpdateDailyGoal = (dateStr: string, solved: number) => {
    if (!data) return
    const currentGoals = data.dailyGoals || {}
    const newGoals = { ...currentGoals, [dateStr]: solved }
    
    // Check if goal met to increase streak
    let newStreak = data.streak
    const target = data.dailyGoalTarget || 100
    if (solved >= target && (currentGoals[dateStr] || 0) < target) {
      newStreak += 1
      toast.success(`Hedefe Ulaşıldı! Seri +1 🔥`)
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    }
    
    setData({ ...data, dailyGoals: newGoals, streak: newStreak, lastActiveDate: format(new Date(), "yyyy-MM-dd") })
  }

  const handleSetGoalTarget = (target: number) => {
    if (!data) return
    setData({ ...data, dailyGoalTarget: target })
    toast.success(`Günlük hedef ${target} soru olarak güncellendi!`)
  }

  const activeSubject = safeSubjects.find(s => s.id === activeSubjectId) || safeSubjects[0]
  const allTopicsFlat = safeSubjects.flatMap(s => s.topics.flatMap(t => {
    if (t.schedules && t.schedules.length > 0) {
      return t.schedules.map(sch => ({ ...t, scheduledDate: sch.date, scheduledTime: sch.time }))
    }
    return [t]
  }))
  const activeTopic = activeId ? allTopicsFlat.find(t => `topic_${t.id}` === activeId) : null

  const totalTopics = safeSubjects.reduce((acc, curr) => acc + curr.topics.length, 0)
  const completedTopics = safeSubjects.reduce((acc, curr) => acc + curr.topics.filter(t => t.done).length, 0)
  const totalPercent = totalTopics === 0 ? 0 : (completedTopics / totalTopics) * 100

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col min-h-screen bg-bg text-text-main font-sans selection:bg-accent/30">

          {/* Main Content Area */}
          <main ref={scrollAreaRef} className="flex-1 px-4 sm:px-6 md:px-12 pb-24">
            <div className="max-w-7xl mx-auto space-y-12 md:space-y-16">
              
              {/* Overview Section */}
              <section className="flex flex-col gap-8">
                 {/* Status Tags */}
                 <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Busis ❤️</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-[#1e293b]/80 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sistem: <span className="text-blue-600 dark:text-blue-400">Aktif</span></span>
                    </div>
                    {isSaving && (
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Senkronize
                      </div>
                    )}
                 </div>

                 <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
                    <div className="flex flex-col gap-3 flex-1">
                       <div>
                         <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">Gösterge Paneli</h1>
                         <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Hedeflerinize ulaşmak için bugün harika bir gün.</p>
                       </div>
                       <div className="mt-2">
                         <DenemeLinkButton variant="card" />
                       </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full lg:w-auto">
                        <KPSSCountdown />
                        <div className="relative group overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 px-6 py-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center min-w-[140px]">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <ProgressRing percentage={totalPercent} size={84} strokeWidth={8} color={activeSubject?.color || "#3b82f6"} hideLabel={true} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3 relative z-10">Genel İlerleme</span>
                            </div>
                        </div>
                    </div>
                 </div>
                 <StatsBar 
                   total={totalTopics} 
                   completed={completedTopics} 
                   dailySolved={data.dailyGoals?.[format(new Date(), "yyyy-MM-dd")] || 0}
                   dailyTarget={data.dailyGoalTarget || 100}
                   onUpdateGoal={handleUpdateDailyGoal}
                 />
              </section>

              {/* Strategy Details (Collapsible) */}
              <section>
                <details className="group bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm">
                  <summary className="list-none cursor-pointer p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">💡</div>
                      <span className="text-sm font-semibold uppercase tracking-widest text-gray-900 dark:text-white">Sınav Stratejileri & Bilgi Kartları</span>
                    </div>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
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
                    subjects={safeSubjects} 
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
                  <div className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm border border-gray-100 dark:border-white/5 rounded-3xl p-2 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button 
                      onClick={() => setActiveView('daily')}
                      className={`flex-1 py-3 sm:py-4 rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden ${
                        activeView === 'daily' 
                          ? 'text-white' 
                          : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {activeView === 'daily' && (
                        <motion.div 
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-blue-500"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">Günlük Operasyon</span>
                      {activeView === 'daily' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-white animate-pulse relative z-10" />}
                    </button>
                    <button 
                      onClick={() => setActiveView('monthly')}
                      className={`flex-1 py-3 sm:py-4 rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden ${
                        activeView === 'monthly' 
                          ? 'text-white' 
                          : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {activeView === 'monthly' && (
                        <motion.div 
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-blue-500"
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
                            subjects={safeSubjects} 
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
                            subjects={safeSubjects} 
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


        {/* Drag Overlay Redesign */}
        <DragOverlay>
          {activeTopic ? (
            <div className="glass p-4 rounded-2xl border-2 border-accent shadow-2xl cursor-grabbing w-72 z-[100] flex items-center gap-4 rotate-2">
               <div className="w-12 h-12 rounded-xl bg-accent text-bg flex items-center justify-center text-xl font-black">
                  {safeSubjects.find(s => s.topics.some(t => t.id === activeTopic.id))?.icon || '📚'}
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent">Yerleştiriliyor</span>
                  <span className="text-sm font-bold text-text-main truncate">{activeTopic.title}</span>
               </div>
            </div>
          ) : null}
        </DragOverlay>

        <ResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleReset} />
        <AutoPlanGenerator isOpen={isAutoPlanOpen} onClose={() => setIsAutoPlanOpen(false)} subjects={safeSubjects} onApplyPlan={handleApplyAutoPlan} />
      </div>
    </DndContext>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg text-text-main flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,168,132,0.1)]" />
        <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Sistem Yükleniyor...</span>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
