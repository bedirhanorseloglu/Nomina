export type TopicSchedule = {
  date: string
  time: string
}

export type Topic = {
  id: string
  title: string
  questionCount?: string
  isRoutine?: boolean
  done: boolean
  schedules?: TopicSchedule[]
  scheduledDate?: string // For virtual instances in views
  scheduledTime?: string // For virtual instances in views
  revisions?: {
    date: string
    time: string
    level: 1 | 2 | 3 // 3, 7, 14 days
  }[]
}

export type Subject = {
  id: string
  title: string
  tip?: string
  color: string
  category: "Genel Yetenek" | "Genel Kültür" | "Vatandaşlık"
  subCategory: "Sayısal" | "Sözel" | "Sosyal" | "Hukuk"
  icon: string
  topics: Topic[]
}

export type DenemeSubjectScore = {
  subjectId: string
  correct: number
  wrong: number
  empty: number
}

export type DenemeRecordData = {
  id: string
  name: string
  date: string
  publisher?: string
  scores: DenemeSubjectScore[]
  note?: string
  examType?: "genel" | "brans"
  bransSubjectId?: string
}

export type AppData = {
  subjects: Subject[]
  streak: number
  lastActiveDate: string | null
  slotNotes?: Record<string, string> // Key: "YYYY-MM-DD_HH:mm"
  completedNotes?: Record<string, boolean> // Key: "YYYY-MM-DD_HH:mm"
  holidays?: string[] // Array of "YYYY-MM-DD"
  denemeler?: DenemeRecordData[]
  denemeTargetNet?: number
}

export type UniversityClass = {
  id: string
  courseCode: string
  courseName: string
  date: string
  startTime: string
  endTime: string
  lessonNumber: number
  locked: boolean
}
