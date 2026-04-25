import { Subject, AppData } from "@/types"
import { initialData } from "./data"

const STORAGE_KEY = "kpss_2026_data"

export const loadData = (): AppData => {
  if (typeof window === "undefined") {
    return { subjects: initialData, streak: 0, lastActiveDate: null }
  }
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as AppData
      // Need to handle missing subjects/topics if we update data.ts later
      // But for this SPA, we just use it directly.
      return {
        ...parsed,
        subjects: mergeWithInitialData(parsed.subjects),
        slotNotes: parsed.slotNotes || {}
      }
    }
  } catch (err) {
    console.error("Error parsing local data", err)
  }
  
  return { subjects: initialData, streak: 0, lastActiveDate: null }
}

const mergeWithInitialData = (savedSubjects: Subject[]) => {
  return initialData.map(initialSubject => {
    const savedSubject = savedSubjects.find(s => s.id === initialSubject.id)
    if (!savedSubject) return initialSubject
    
    return {
      ...initialSubject,
      topics: initialSubject.topics.map(initialTopic => {
        const savedTopic = savedSubject.topics.find(t => t.id === initialTopic.id)
        if (!savedTopic) return initialTopic
        return { 
          ...initialTopic, 
          done: savedTopic.done,
          schedules: savedTopic.schedules,
          revisions: savedTopic.revisions,
          scheduledDate: savedTopic.scheduledDate,
          scheduledTime: savedTopic.scheduledTime
        }
      })
    }
  })
}

export const saveData = (data: AppData) => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
