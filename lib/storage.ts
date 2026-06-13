import { Subject, AppData, LocalDashboardData } from "@/types"
import { initialData } from "./data"

const STORAGE_KEY = "kpss_2026_data"

export const loadData = (): LocalDashboardData => {
  if (typeof window === "undefined") {
    return { subjects: initialData, streak: 0, lastActiveDate: null }
  }
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as LocalDashboardData
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

const mergeWithInitialData = (savedSubjects: Subject[] = []) => {
  const safeSubjects = savedSubjects || [];
  return initialData.map(initialSubject => {
    const savedSubject = safeSubjects.find(s => s.id === initialSubject.id)
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

export const saveData = (data: LocalDashboardData) => {
  if (typeof window === "undefined") return
  
  // Her kayıtta lastUpdated damgasını yenile
  const dataToSave = { ...data, lastUpdated: Date.now() }
  
  const jsonString = JSON.stringify(dataToSave)
  localStorage.setItem(STORAGE_KEY, jsonString)
  
  // Günlük yedekleme (Rolling Backups)
  try {
    const today = new Date().toISOString().split('T')[0]
    const backupKey = `kpss_backup_${today}`
    // Sadece günde bir kez yedek al, böylece gün içinde bozulsa bile gün başındaki hali kalsın
    if (!localStorage.getItem(backupKey)) {
      localStorage.setItem(backupKey, jsonString)
      
      // Eski yedekleri temizle (Sadece son 7 günü tut)
      cleanupOldBackups()
    }
  } catch (e) {
    console.error("Backup failed", e)
  }
}

const cleanupOldBackups = () => {
  const keys = Object.keys(localStorage)
  const backupKeys = keys.filter(k => k.startsWith('kpss_backup_')).sort()
  
  // Eğer 7'den fazla yedek varsa, en eskileri sil
  if (backupKeys.length > 7) {
    const toDelete = backupKeys.slice(0, backupKeys.length - 7)
    toDelete.forEach(key => localStorage.removeItem(key))
  }
}

export const getAvailableBackups = (): string[] => {
  if (typeof window === "undefined") return []
  const keys = Object.keys(localStorage)
  return keys.filter(k => k.startsWith('kpss_backup_')).map(k => k.replace('kpss_backup_', '')).sort().reverse()
}

export const restoreBackup = (dateString: string): boolean => {
  if (typeof window === "undefined") return false
  try {
    const backupData = localStorage.getItem(`kpss_backup_${dateString}`)
    if (backupData) {
      localStorage.setItem(STORAGE_KEY, backupData)
      return true
    }
  } catch (e) {
    console.error("Restore failed", e)
  }
  return false
}
