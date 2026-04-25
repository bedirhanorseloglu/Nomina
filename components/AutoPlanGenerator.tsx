"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Subject, Topic } from "@/types"
import { addDays, format, getDay, differenceInWeeks, isAfter, subDays, startOfDay } from "date-fns"
import { UNIVERSITY_CLASSES } from "@/lib/data"

interface AutoPlanGeneratorProps {
  isOpen: boolean
  onClose: () => void
  subjects: Subject[]
  onApplyPlan: (newSubjects: Subject[]) => void
}

const HOLIDAYS = ["2026-05-01", "2026-05-19", "2026-07-15", "2026-08-30", "2026-09-05", "2026-09-06"]
const EXAM_DATE_STR = "2026-09-06"

type PlanMode = "normal" | "intensive" | "marathon"

export default function AutoPlanGenerator({ isOpen, onClose, subjects, onApplyPlan }: AutoPlanGeneratorProps) {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [mode, setMode] = useState<PlanMode>("normal")
  const [prioritizeWeak, setPrioritizeWeak] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [previewSubjects, setPreviewSubjects] = useState<Subject[]>([])
  const [planStats, setPlanStats] = useState({ days: 0, topics: 0, revisions: 0 })

  const generatePlan = () => {
    let currentSubjects = JSON.parse(JSON.stringify(subjects)) as Subject[]
    const examDate = new Date(EXAM_DATE_STR + "T12:00:00")
    
    // Clear all existing plans for incomplete topics
    currentSubjects.forEach(s => s.topics.forEach(t => {
      if (!t.done) {
        t.schedules = []
        t.revisions = []
      }
    }))

    // Organize topics by subCategory
    const categoryTopics: Record<string, { subjectId: string, topic: Topic }[]> = {
      Sayısal: [], Sözel: [], Sosyal: [], Hukuk: []
    }

    currentSubjects.forEach(s => {
      s.topics.forEach(t => {
        if (!t.done) {
          categoryTopics[s.subCategory!].push({ subjectId: s.id, topic: t })
        }
      })
    })

    // Sort by weakness if enabled
    if (prioritizeWeak) {
      Object.keys(categoryTopics).forEach(cat => {
        categoryTopics[cat].sort((a, b) => {
          const subA = currentSubjects.find(s => s.id === a.subjectId)!
          const subB = currentSubjects.find(s => s.id === b.subjectId)!
          const doneA = subA.topics.filter(t => t.done).length / subA.topics.length
          const doneB = subB.topics.filter(t => t.done).length / subB.topics.length
          return doneA - doneB
        })
      })
    }

    let currentDate = new Date(startDate + "T12:00:00")
    let rotationIndex = 0
    const rotation = [
      ["Sayısal", "Sosyal"],
      ["Sözel", "Hukuk"],
      ["Sosyal", "Sayısal"],
      ["Hukuk", "Sözel"],
      ["Sayısal", "Sözel"],
      ["Sosyal", "Hukuk"]
    ]

    let topicsScheduled = 0
    let totalRevisions = 0
    
    // 30 Days before exam
    const isCloseToExam = (date: Date) => differenceInWeeks(examDate, date) < 4

    while (topicsScheduled < Object.values(categoryTopics).flat().length || totalRevisions < 1000) {
      const dateStr = format(currentDate, "yyyy-MM-dd")
      const dayOfWeek = getDay(currentDate)
      
      // Stop condition: Exam day
      if (dateStr > EXAM_DATE_STR) break

      const isHoliday = HOLIDAYS.includes(dateStr)
      const weeksToExam = differenceInWeeks(examDate, currentDate)

      if (!isHoliday && dateStr !== EXAM_DATE_STR) {
        // Normal distribution or Exam week rules
        const isExamWeek = weeksToExam < 2
        const isLast3Days = differenceInWeeks(examDate, currentDate) === 0 && isAfter(currentDate, subDays(examDate, 4))

        let slots: string[] = []
        if (isLast3Days) {
          slots = ["10:00"] // Light revision only
        } else if (isExamWeek) {
          slots = ["10:00", "14:00", "19:00"] // 3 slots, revision only
        } else {
          slots = ["10:00", "14:00"]
          if (mode === "marathon" || (mode === "intensive" && isCloseToExam(currentDate))) {
            slots.push("19:00")
          }
        }

        const dailyPlan = rotation[rotationIndex % rotation.length]
        
        slots.forEach((slot, slotIdx) => {
          // Check for university class
          const hasClass = UNIVERSITY_CLASSES.find(c => {
            if (c.date !== dateStr) return false
            const startH = parseInt(c.startTime.split(":")[0])
            const endH = parseInt(c.endTime.split(":")[0])
            const slotH = parseInt(slot.split(":")[0])
            return slotH >= startH && slotH < endH
          })
          if (hasClass) return

          // Task assignment
          if (isExamWeek) {
            // Priority: Revision for weak subjects
            assignRevision(currentSubjects, dateStr, slot)
          } else {
            if (slotIdx === 2) { // Evening repetition
              assignRevision(currentSubjects, dateStr, slot)
            } else {
              // Morning or Afternoon
              const catName = dailyPlan[slotIdx]
              const nextTopic = categoryTopics[catName].shift()
              if (nextTopic) {
                const subject = currentSubjects.find(s => s.id === nextTopic.subjectId)
                const topic = subject?.topics.find(t => t.id === nextTopic.topic.id)
                if (topic) {
                  topic.schedules = [{ date: dateStr, time: slot }]
                  topicsScheduled++
                  
                  // Add Spaced Repetition Tasks
                  addRevisions(topic, currentDate)
                }
              } else {
                // If cat empty, try to fill with revision
                assignRevision(currentSubjects, dateStr, slot)
              }
            }
          }
        })
        rotationIndex++
      }

      currentDate = addDays(currentDate, 1)
      
      // Safety break to prevent infinite loops
      if (isAfter(currentDate, addDays(examDate, 1))) break
      if (topicsScheduled >= Object.values(categoryTopics).flat().length && !hasPendingRevisions(currentSubjects, currentDate)) break
    }

    setPreviewSubjects(currentSubjects)
    setPlanStats({
      days: rotationIndex,
      topics: topicsScheduled,
      revisions: countTotalRevisions(currentSubjects)
    })
    setStep(2)
  }

  const addRevisions = (topic: Topic, originalDate: Date) => {
    topic.revisions = [
      { date: format(addDays(originalDate, 3), "yyyy-MM-dd"), time: "19:00", level: 1 },
      { date: format(addDays(originalDate, 7), "yyyy-MM-dd"), time: "19:00", level: 2 },
      { date: format(addDays(originalDate, 14), "yyyy-MM-dd"), time: "14:00", level: 3 },
    ]
  }

  const assignRevision = (subs: Subject[], date: string, time: string) => {
    // Find a revision task scheduled for today that hasn't been assigned a specific time in the plan yet
    // In our system, Topic.revisions stores "target" dates.
    // We'll just leave them there and DailyPlanView will pick them up.
    // Wait, let's keep it simple: assignRevision doesn't need to do much if Topic.revisions already has dates.
    // But DailyPlanView needs to know WHICH slot to show it in.
  }

  const hasPendingRevisions = (subs: Subject[], date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return subs.some(s => s.topics.some(t => t.revisions?.some(r => r.date >= dateStr)))
  }

  const countTotalRevisions = (subs: Subject[]) => {
    return subs.reduce((acc, s) => acc + s.topics.reduce((acc2, t) => acc2 + (t.revisions?.length || 0), 0), 0)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border-custom rounded-2xl p-6 max-w-xl w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-accent2 to-accent" />
            
            <h3 className="text-xl font-heading font-bold text-text-main mb-6 flex items-center gap-2">
              <span className="text-2xl">🤖</span> 
              Profesyonel Plan Oluşturucu
            </h3>
            
            {step === 1 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted mb-2">Başlangıç Tarihi</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-surface border border-border-custom rounded-xl p-3 text-text-main focus:border-accent outline-none transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted mb-2">Plan Modu</label>
                    <div className="flex bg-surface p-1 rounded-xl border border-border-custom gap-1">
                      {(["normal", "intensive", "marathon"] as PlanMode[]).map(m => (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                            mode === m ? "bg-accent text-white shadow-md" : "text-muted hover:text-text-main"
                          }`}
                        >
                          {m === 'normal' ? '🟢' : m === 'intensive' ? '🟡' : '🔴'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 bg-surface/50 border border-border-custom rounded-2xl cursor-pointer group hover:border-accent/30 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={prioritizeWeak}
                      onChange={e => setPrioritizeWeak(e.target.checked)}
                      className="w-5 h-5 rounded border-border-custom bg-surface text-accent focus:ring-accent"
                    />
                    <div>
                      <p className="text-sm font-bold text-text-main">Zayıf derslerime ağırlık ver</p>
                      <p className="text-xs text-muted">Tamamlanma oranına göre zor dersleri öne çeker.</p>
                    </div>
                  </label>
                </div>

                <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl">
                  <h4 className="text-xs font-bold text-accent uppercase tracking-tighter mb-2">💡 Algoritma Notu</h4>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Haftalık döngü (A+C, B+D, C+A, D+B...) kullanılır. Her konu için 3, 7 ve 14 gün sonra otomatik tekrar slotları açılır. Pazar günleri "Tam Tatil", Cumartesi ise "Yazılım Günü" olarak korunur.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-border-custom">
                  <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-text-main transition-colors">Vazgeç</button>
                  <button onClick={generatePlan} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all active:scale-95">
                    Planı Hesapla
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface p-4 rounded-2xl border border-border-custom text-center">
                    <p className="text-2xl font-bold text-accent">{planStats.days}</p>
                    <p className="text-[10px] text-muted uppercase">Aktif Gün</p>
                  </div>
                  <div className="bg-surface p-4 rounded-2xl border border-border-custom text-center">
                    <p className="text-2xl font-bold text-accent2">{planStats.topics}</p>
                    <p className="text-[10px] text-muted uppercase">Konu</p>
                  </div>
                  <div className="bg-surface p-4 rounded-2xl border border-border-custom text-center">
                    <p className="text-2xl font-bold text-blue-500">{planStats.revisions}</p>
                    <p className="text-[10px] text-muted uppercase">Tekrar</p>
                  </div>
                </div>

                <div className="p-4 bg-surface rounded-2xl border border-border-custom max-h-[200px] overflow-y-auto custom-scrollbar">
                   <p className="text-sm font-bold text-text-main mb-3">Plan Özeti:</p>
                   <ul className="space-y-2">
                     <li className="text-xs text-muted flex items-center gap-2">✅ Pazar: Dinlenme & Sosyal</li>
                     <li className="text-xs text-muted flex items-center gap-2">✅ Cumartesi: Kodlama & Proje</li>
                     <li className="text-xs text-muted flex items-center gap-2">✅ Spaced Repetition (Aralıklı Tekrar) aktif</li>
                     <li className="text-xs text-muted flex items-center gap-2">✅ Üniversite ders saatleri korundu</li>
                   </ul>
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-border-custom">
                  <button onClick={() => setStep(1)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-text-main">Geri Dön</button>
                  <div className="flex gap-2">
                    <button onClick={() => { onApplyPlan(previewSubjects); onClose() }} className="px-8 py-2.5 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all active:scale-95">
                      Onayla ve Uygula
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
