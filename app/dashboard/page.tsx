"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { loadData, saveData, mergeWithInitialData } from "@/lib/storage"
import { loadFromFirebase, saveToFirebase, forceUploadToFirebase, updateUserProfile, loadPlannerYeniden, savePlannerYeniden } from "@/lib/firebaseService"
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
import { LocalDashboardData, Subject } from "@/types"
import DenemeLinkButton from "@/components/deneme/DenemeLinkButton"
import { notify } from "@/lib/notify"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/components/ThemeProvider"
import { getStudyDate } from "@/lib/dateUtils"
import AppleEmoji from "@/components/AppleEmoji"
import GlobalLoading from "@/components/GlobalLoading"

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Suspense } from 'react'

function HomeContent() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [data, setData] = useState<LocalDashboardData | null>(null)
  
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
  const [selectedDate, setSelectedDate] = useState<Date>(getStudyDate())
  const [activeView, setActiveView] = useState<'daily'|'monthly'>('daily')
  const [isSaving, setIsSaving] = useState(false)
  // isSyncing: Firebase'den ilk yükleme tamamlanana kadar geri kaydetmeyi engeller
  const isSyncing = useRef(false)
  // syncedUserId: hangi kullanıcı için sync yapıldığını takip eder
  const syncedUserId = useRef<string | null>(null)
  const lastSavedDataString = useRef<string>("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const dailyPlanRef = useRef<HTMLDivElement>(null)
  const monthlyCalendarRef = useRef<HTMLDivElement>(null)

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
          const remoteData = await loadFromFirebase(user.uid)
          const remotePlanner = await loadPlannerYeniden(user.uid)
          
          let remote = null;
          if (remoteData || remotePlanner) {
            remote = { ...(remoteData || {}), ...(remotePlanner || {}) } as LocalDashboardData;
            
            // Eğer remotePlanner yoksa (yeni migration), eski remoteData içindeki verileri kullanarak kaydet
            if (!remotePlanner && remoteData && (remoteData as any).subjects) {
               console.log("Migration: Saving planner data from old structure");
               const plannerPayload = {
                  subjects: (remoteData as any).subjects,
                  slotNotes: (remoteData as any).slotNotes || {},
                  completedNotes: (remoteData as any).completedNotes || {},
                  holidays: (remoteData as any).holidays || [],
                  dailyGoals: (remoteData as any).dailyGoals || {},
                  dailyGoalTarget: (remoteData as any).dailyGoalTarget || 100,
               };
               savePlannerYeniden(user.uid, plannerPayload);
            }
          }
          
          if (remote) {
            const localTime = local.lastUpdated || 0
            const remoteTime = remote.lastUpdated || 0
            
            if (remoteTime > localTime) {
              // Bulut verisi daha güncel
              setData(remote)
              saveData(remote)
              lastSavedDataString.current = JSON.stringify(remote)
            } else if (localTime > remoteTime) {
              // Lokal veri daha güncel — buluta eşitle
              setData(local)
              lastSavedDataString.current = JSON.stringify(local)
              
              const appDataPayload = { streak: local.streak, lastActiveDate: local.lastActiveDate, denemeTargetNet: local.denemeTargetNet };
              const plannerPayload = { subjects: local.subjects, slotNotes: local.slotNotes, completedNotes: local.completedNotes, holidays: local.holidays, dailyGoals: local.dailyGoals, dailyGoalTarget: local.dailyGoalTarget };
              
              saveToFirebase(user.uid, appDataPayload as any)
              savePlannerYeniden(user.uid, plannerPayload)
            } else {
              setData(local)
              lastSavedDataString.current = JSON.stringify(local)
            }
          } else {
            // Firebase'de henüz hiç veri yok
            setData(local)
            lastSavedDataString.current = JSON.stringify(local)
            const appDataPayload = { streak: local.streak, lastActiveDate: local.lastActiveDate, denemeTargetNet: local.denemeTargetNet };
            const plannerPayload = { subjects: local.subjects, slotNotes: local.slotNotes, completedNotes: local.completedNotes, holidays: local.holidays, dailyGoals: local.dailyGoals, dailyGoalTarget: local.dailyGoalTarget };
            saveToFirebase(user.uid, appDataPayload as any)
            savePlannerYeniden(user.uid, plannerPayload)
          }
        } catch (e) {
          console.error("Sync error:", e)
          setData(local)
          lastSavedDataString.current = JSON.stringify(local)
        }
        updateUserProfile(user.uid, user.displayName, user.email)
      } else {
        setData(local)
        lastSavedDataString.current = JSON.stringify(local)
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

    const currentDataString = JSON.stringify(data)
    if (currentDataString === lastSavedDataString.current) {
      // Veri değişmediyse boşuna sunucuya kaydetme (ekstra yük ve okuma/yazma kotasını korur)
      return
    }

    lastSavedDataString.current = currentDataString
    saveData(data)
    setIsSaving(true)

    // Debounce: 1.5 sn bekle, sürekli sunucuyu yormamak için
    const timeoutId = setTimeout(() => {
      if (user?.uid) {
        const appDataPayload = { streak: data.streak, lastActiveDate: data.lastActiveDate, denemeTargetNet: data.denemeTargetNet };
        const plannerPayload = { subjects: data.subjects, slotNotes: data.slotNotes, completedNotes: data.completedNotes, holidays: data.holidays, dailyGoals: data.dailyGoals, dailyGoalTarget: data.dailyGoalTarget };
        
        Promise.all([
          saveToFirebase(user.uid, appDataPayload as any),
          savePlannerYeniden(user.uid, plannerPayload)
        ]).then(() => {
          setIsSaving(false)
        }).catch(() => setIsSaving(false))
      } else {
        setIsSaving(false)
      }
    }, 1500)

    return () => clearTimeout(timeoutId)
  }, [data, user])

  if (!data) return (
    <GlobalLoading
      title="Sistem Hazırlanıyor..."
      description="Kişiselleştirilmiş KPSS çalışma verileriniz yükleniyor, lütfen bekleyin."
      emoji="🚀"
    />
  )

  const safeSubjects = mergeWithInitialData(data.subjects || [])

  const toggleTopic = (topicId: string, subjectId?: string) => {
    if (!data) return
    let wasCompleted = false
    let completedTopicTitle = ""
    let completedSubjectTitle = ""
    const newSubjects = safeSubjects.map(subject => {
      if (subjectId && subject.id !== subjectId) return subject
      return {
        ...subject,
        topics: subject.topics.map(t => {
          if (t.id === topicId) {
            wasCompleted = !t.done
            if (wasCompleted) {
              completedTopicTitle = t.title
              completedSubjectTitle = subject.title
            }
            return { ...t, done: wasCompleted }
          }
          return t
        })
      }
    })
    setData({ ...data, subjects: newSubjects })
    if (wasCompleted) {
      notify.info(completedTopicTitle, {
        badge: `${completedSubjectTitle} · Konu Tamamlandı`,
        emoji: "📘",
        description: "Harika! Bir adım daha attın.",
      });
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
      scheduledTime = "09:00"
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
                schedules: t.schedules?.filter(s => s.date !== dateStr)
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
      notify.success("Günlük Görev Tamamlandı!", {
        badge: "TEBRİKLER",
        emoji: "✅",
        description: "Harika gidiyorsun, hedefe bir adım daha yaklaştın.",
      });
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
      notify.purple("Hedefe Ulaşıldı! Seri +1", {
        badge: "SERİ KAZANDIN",
        emoji: "🔥",
        description: "Günlük soru hedefini başarıyla tamamladın.",
      });
    }
    
    setData({ ...data, dailyGoals: newGoals, streak: newStreak, lastActiveDate: format(getStudyDate(), "yyyy-MM-dd") })
  }

  const handleSetGoalTarget = (target: number) => {
    if (!data) return
    setData({ ...data, dailyGoalTarget: target })
    notify.purple(`Günlük hedef ${target} soru olarak güncellendi!`, {
      badge: "HEDEF GÜNCELLENDİ",
      emoji: "🎯",
    });
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
          <main ref={scrollAreaRef} className="flex-1 px-4 sm:px-6 md:px-12 pb-16">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
              
              {/* Overview Section */}
              {/* Responsive 2-Column Hero Header */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">
                {/* Left Hero: Welcome Greeting */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="lg:col-span-7 bg-white dark:bg-slate-800/95 backdrop-blur-md rounded-[2.25rem] p-6 sm:p-7 border-2 border-b-4 border-slate-200 dark:border-slate-700/80 shadow-md flex items-center justify-between relative overflow-hidden transition-all group"
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] shadow-sm overflow-hidden shrink-0 bg-sky-50 dark:bg-slate-700 flex items-center justify-center">
                      {user?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.photoURL} alt="Profil" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#1cb0f6] text-white flex items-center justify-center text-2xl sm:text-3xl font-black">
                          {user?.displayName?.charAt(0)?.toUpperCase() || "K"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                        Merhaba, {user?.displayName?.split(" ")[0] || "Şampiyon"}!
                      </h1>
                      <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Sınava Hazırlık Merkezi
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Right Hero: Countdown Widget */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                  className="lg:col-span-5 relative z-30"
                >
                  <KPSSCountdown />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              >
                <StatsBar 
                   total={totalTopics} 
                   completed={completedTopics} 
                 />
              </motion.div>

              {/* Strategy Details (Collapsible) */}
              <section>
                <details className="group bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-md">
                  <summary className="list-none cursor-pointer p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#ff9500] border-2 border-b-4 border-[#ff9500] border-b-[#e08400] text-white flex items-center justify-center shadow-xs shrink-0">
                        <AppleEmoji emoji="💡" size={24} className="text-white" />
                      </div>
                      <span className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">
                        Sınav Stratejileri & Bilgi Kartları
                      </span>
                    </div>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform text-xs font-black">▼</span>
                  </summary>
                  <div className="p-6 sm:p-8 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <KPSSInfoCards />
                  </div>
                </details>
              </section>

              {/* Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12 items-start">
                
                {/* Left Col: Knowledge Base */}
                <div className="xl:col-span-4 flex flex-col gap-6 xl:sticky xl:top-24">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">MÜFREDAT HAVUZU</h3>
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#1cb0f6] bg-[#e8f7ff] dark:bg-[#1cb0f6]/10 px-3 py-1 rounded-xl border-2 border-b-2 border-[#1cb0f6]/30 shadow-2xs">
                       Sürüklenebilir
                     </span>
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
                  {/* 3D View Switcher Tabs */}
                  <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setActiveView('daily')}
                      className={`flex-1 py-3 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-3 relative cursor-pointer ${
                        activeView === 'daily' 
                          ? 'bg-white dark:bg-slate-800 text-[#1cb0f6] border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white border-2 border-transparent'
                      }`}
                    >
                      <span>Günlük Takvim</span>
                      {activeView === 'daily' && <div className="w-2 h-2 rounded-full bg-[#1cb0f6]" />}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setActiveView('monthly');
                        setTimeout(() => {
                          if (monthlyCalendarRef.current) {
                            monthlyCalendarRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }, 100);
                      }}
                      className={`flex-1 py-3 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-3 relative cursor-pointer ${
                        activeView === 'monthly' 
                          ? 'bg-white dark:bg-slate-800 text-[#1cb0f6] border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white border-2 border-transparent'
                      }`}
                    >
                      <span>Aylık Takvim</span>
                      {activeView === 'monthly' && <div className="w-2 h-2 rounded-full bg-[#1cb0f6]" />}
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
                          ref={monthlyCalendarRef}
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
                            dailyGoals={data.dailyGoals || {}}
                            dailyGoalTarget={data.dailyGoalTarget || 100}
                            isDragging={!!activeId} 
                            onDayClick={handleDayClick} 
                            onToggleTopic={toggleTopic}
                            onToggleNote={toggleNote}
                            onUpdateDailyGoal={handleUpdateDailyGoal}
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


        {/* Drag Overlay Redesign with Dynamic Subject Identity Color */}
        <DragOverlay>
          {activeTopic ? (() => {
            const activeSub = safeSubjects.find(s => s.topics.some(t => t.id === activeTopic.id));
            const subColor = activeSub?.color || '#1cb0f6';
            return (
              <div 
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-b-4 shadow-2xl cursor-grabbing w-80 z-[100] flex items-center gap-4 rotate-2"
                style={{
                  borderColor: `${subColor}60`,
                  borderBottomColor: subColor,
                }}
              >
                 <div 
                   className="w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-xs shrink-0 border-2 border-b-4"
                   style={{
                     backgroundColor: subColor,
                     borderColor: subColor,
                     borderBottomColor: subColor,
                   }}
                 >
                    <AppleEmoji emoji={activeSub?.icon || '📚'} size={28} className="text-white" />
                 </div>
                 <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: subColor }}>Yerleştirildiği Ders</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white truncate">{activeTopic.title}</span>
                 </div>
              </div>
            );
          })() : null}
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
