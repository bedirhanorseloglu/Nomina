export type Topic = {
  id: string
  title: string
  done: boolean
  scheduledDate?: string
  scheduledTime?: string
  revisions?: {
    date: string
    time: string
    level: 1 | 2 | 3 // 3, 7, 14 days
  }[]
}

export type Subject = {
  id: string
  title: string
  category: "Genel Yetenek" | "Genel Kültür" | "Vatandaşlık"
  subCategory: "Sayısal" | "Sözel" | "Sosyal" | "Hukuk"
  icon: string
  topics: Topic[]
}

export type AppData = {
  subjects: Subject[]
  streak: number
  lastActiveDate: string | null
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
