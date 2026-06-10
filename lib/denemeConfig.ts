export type DenemeCategory = "Genel Yetenek" | "Genel Kültür" | "Vatandaşlık";

export type DenemeSubjectConfig = {
  id: string;
  title: string;
  icon: string;
  color: string;
  category: DenemeCategory;
  questionCount: number;
};

/** KPSS GY-GK deneme ders dağılımı (120 soru) */
export const DENEME_SUBJECTS: DenemeSubjectConfig[] = [
  {
    id: "turkce",
    title: "Türkçe",
    icon: "📘",
    color: "#3b82f6", // Blue
    category: "Genel Yetenek",
    questionCount: 30,
  },
  {
    id: "matematik",
    title: "Matematik",
    icon: "🔢",
    color: "#8b5cf6", // Violet
    category: "Genel Yetenek",
    questionCount: 30,
  },
  {
    id: "tarih",
    title: "Tarih",
    icon: "🏛",
    color: "#d97706", // Amber
    category: "Genel Kültür",
    questionCount: 27,
  },
  {
    id: "cografya",
    title: "Coğrafya",
    icon: "🗺",
    color: "#10b981", // Emerald
    category: "Genel Kültür",
    questionCount: 18,
  },
  {
    id: "vatandaslik",
    title: "Vatandaşlık",
    icon: "⚖️",
    color: "#64748b", // Slate
    category: "Vatandaşlık",
    questionCount: 9,
  },
  {
    id: "guncel-bilgiler",
    title: "Güncel Bilgiler",
    icon: "🌍",
    color: "#f43f5e", // Rose
    category: "Genel Kültür",
    questionCount: 6,
  },
];

export const TOTAL_QUESTIONS = DENEME_SUBJECTS.reduce(
  (sum, s) => sum + s.questionCount,
  0
);

export const getSubjectConfig = (id: string) =>
  DENEME_SUBJECTS.find((s) => s.id === id);
