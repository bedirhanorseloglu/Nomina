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
    color: "#1cb0f6", // Duolingo Blue
    category: "Genel Yetenek",
    questionCount: 30,
  },
  {
    id: "matematik",
    title: "Matematik",
    icon: "🔢",
    color: "#af52de", // Apple Purple
    category: "Genel Yetenek",
    questionCount: 30,
  },
  {
    id: "tarih",
    title: "Tarih",
    icon: "🏛",
    color: "#ff9500", // Apple Orange
    category: "Genel Kültür",
    questionCount: 27,
  },
  {
    id: "cografya",
    title: "Coğrafya",
    icon: "🗺",
    color: "#58cc02", // Duolingo Green
    category: "Genel Kültür",
    questionCount: 18,
  },
  {
    id: "vatandaslik",
    title: "Vatandaşlık",
    icon: "⚖️",
    color: "#5856d6", // Apple Indigo
    category: "Vatandaşlık",
    questionCount: 9,
  },
  {
    id: "guncel-bilgiler",
    title: "Güncel Bilgiler",
    icon: "🌍",
    color: "#ff2d55", // Apple Pink
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
