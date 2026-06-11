"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { loadData, saveData } from "@/lib/storage"
import { loadFromFirebase, saveToFirebase, forceUploadToFirebase, updateUserProfile } from "@/lib/firebaseService"
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
  // isSyncing: Firebase'den ilk yükleme tamamlanana kadar geri kaydetmeyi engeller
  const isSyncing = useRef(false)
  // syncedUserId: hangi kullanıcı için sync yapıldığını takip eder
  const syncedUserId = useRef<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const dailyPlanRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  )

  useEffect(() => {
    const initData = async () => {
      isSyncing.current = true
      const local = loadData()
      
      if (user?.uid) {
        try {
          const remote = await loadFromFirebase(user.uid)
          if (remote) {
            const localTime = local.lastUpdated || 0
            const remoteTime = remote.lastUpdated || 0
            
            if (remoteTime > localTime) {
              // Bulut verisi daha güncel
              setData(remote)
              saveData(remote)
            } else if (localTime > remoteTime) {
              // Lokal veri daha güncel — buluta eşitle
              setData(local)
              saveToFirebase(user.uid, local)
            } else {
              setData(local)
            }
          } else {
            // Firebase'de henüz hiç veri yok
            setData(local)
            saveToFirebase(user.uid, local)
          }
        } catch (e) {
          console.error("Sync error:", e)
          setData(local)
        }
        updateUserProfile(user.uid, user.displayName, user.email)
      } else {
        setData(local)
      }

      syncedUserId.current = user?.uid ?? null
      isSyncing.current = false
    }
    initData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]) // Sadece UID değişince yeniden çalış — token yenilenince tetiklenme

  useEffect(() => {
    // İlk async yükleme bitene kadar veya kullanıcı değişene kadar geri yazma yapma
    if (!data || isSyncing.current) return
    if (user?.uid && user.uid !== syncedUserId.current) return

    saveData(data)
    setIsSaving(true)

    // Debounce: 1.5 sn bekle, sürekli sunucuyu yormamak için
    const timeoutId = setTimeout(() => {
      if (user?.uid) {
        saveToFirebase(user.uid, data).then(() => {
          setIsSaving(false)
        }).catch(() => setIsSaving(false))
      } else {
        setIsSaving(false)
      }
    }, 1500)

    return () => clearTimeout(timeoutId)
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
      toast.custom((t) => (
        <div className="flex items-center justify-center w-full mt-2">
          <div className="bg-slate-900/80 dark:bg-white/80 backdrop-blur-xl text-white dark:text-slate-900 flex items-center gap-4 px-6 py-4 rounded-full shadow-2xl shadow-black/20 border border-slate-700/50 dark:border-white/50 min-w-[340px]">
            <div className="w-10 h-10 bg-[#1cb0f6] rounded-full flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-xl">📘</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-black tracking-tight leading-tight">Müfredat Konusu Tamamlandı!</span>
              <span className="text-sm text-slate-200 dark:text-slate-600 font-bold mt-0.5">Başarılar! 🚀</span>
            </div>
          </div>
        </div>
      ), { position: 'top-center', duration: 3000 })
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
      toast.custom((t) => (
        <div className="flex items-center justify-center w-full mt-2">
          <div className="bg-slate-900/80 dark:bg-white/80 backdrop-blur-xl text-white dark:text-slate-900 flex items-center gap-4 px-6 py-4 rounded-full shadow-2xl shadow-black/20 border border-slate-700/50 dark:border-white/50 min-w-[340px]">
            <div className="w-10 h-10 bg-[#58cc02] rounded-full flex items-center justify-center shrink-0 shadow-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-black tracking-tight leading-tight">Günlük görev tamamlandı!</span>
              <span className="text-sm text-slate-200 dark:text-slate-600 font-bold mt-0.5">Harika gidiyorsun! 🚀</span>
            </div>
          </div>
        </div>
      ), { position: 'top-center', duration: 4000 })
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
              {/* Unified EdTech Header */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-4"
              >
                <div className="flex items-center gap-5">
                  <div className="relative w-16 h-16 rounded-full border-[3px] border-white dark:border-slate-800 shadow-sm overflow-hidden shrink-0 bg-white dark:bg-slate-800">
                    {user?.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photoURL} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
                        {user?.displayName?.charAt(0)?.toUpperCase() || "K"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                      Merhaba, {user?.displayName?.split(" ")[0] || "Şampiyon"}!
                    </h1>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">
                        Sınava Hazırlık Merkezi
                      </p>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-100 dark:border-rose-500/20">
                         <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Busis ❤️</span>
                      </div>
                      <AnimatePresence mode="wait">
                        {isSaving ? (
                          <motion.div 
                            key="saving"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Senkronize ediliyor...
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="synced"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Bulutla Eşitlendi ✓
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 mt-4 xl:mt-0">
                  <div 
                    className="flex items-center gap-3.5 bg-white dark:bg-[#1e293b] backdrop-blur-xl pl-2.5 pr-6 py-2.5 rounded-[2rem] shadow-md border-2 transition-colors"
                    style={{ borderColor: `${activeSubject?.color || "#3b82f6"}30` }}
                  >
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-[inset_0_-2px_6px_rgba(0,0,0,0.2)] shrink-0" style={{ backgroundImage: `linear-gradient(135deg, ${activeSubject?.color || "#3b82f6"}, ${activeSubject?.color ? activeSubject.color + 'dd' : "#60a5fa"})` }}>
                      <span className="text-xs font-black tracking-tight">%{Math.round(totalPercent)}</span>
                    </div>
                    <div className="flex flex-col w-36">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300 mb-1.5">Müfredat İlerlemesi</span>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                        <motion.div 
                          className="h-full rounded-full"
                          style={{ backgroundColor: activeSubject?.color || "#3b82f6", boxShadow: `0 0 10px ${activeSubject?.color || "#3b82f6"}80` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${totalPercent}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                className="mb-2"
              >
                <KPSSCountdown />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              >
                <StatsBar 
                   total={totalTopics} 
                   completed={completedTopics} 
                   dailySolved={data.dailyGoals?.[format(new Date(), "yyyy-MM-dd")] || 0}
                   dailyTarget={data.dailyGoalTarget || 100}
                   onUpdateGoal={handleUpdateDailyGoal}
                 />
              </motion.div>

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
                  <div className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm border-2 border-slate-100 dark:border-white/5 rounded-3xl p-1.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                    <button 
                      onClick={() => setActiveView('daily')}
                      className={`flex-1 py-3.5 sm:py-4 rounded-[1.25rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden ${
                        activeView === 'daily' 
                          ? 'text-white shadow-md' 
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {activeView === 'daily' && (
                        <motion.div 
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-[#1cb0f6] border-b-[3px] border-[#1899d6]"
                          transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                        />
                      )}
                      <span className={`relative z-10 ${activeView === 'daily' ? 'mt-[3px]' : ''}`}>Günlük Operasyon</span>
                      {activeView === 'daily' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-white relative z-10 mt-[3px]" />}
                    </button>
                    <button 
                      onClick={() => setActiveView('monthly')}
                      className={`flex-1 py-3.5 sm:py-4 rounded-[1.25rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden ${
                        activeView === 'monthly' 
                          ? 'text-white shadow-md' 
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {activeView === 'monthly' && (
                        <motion.div 
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-[#1cb0f6] border-b-[3px] border-[#1899d6]"
                          transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                        />
                      )}
                      <span className={`relative z-10 ${activeView === 'monthly' ? 'mt-[3px]' : ''}`}>Aylık Projeksiyon</span>
                      {activeView === 'monthly' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-white relative z-10 mt-[3px]" />}
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
