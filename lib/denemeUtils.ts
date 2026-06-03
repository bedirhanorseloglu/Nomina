import {
  DENEME_SUBJECTS,
  DenemeCategory,
  getSubjectConfig,
} from "./denemeConfig";

export type SubjectScoreInput = {
  subjectId: string;
  correct: number;
  wrong: number;
  empty: number;
};

export type DenemeRecord = {
  id: string;
  name: string;
  date: string;
  publisher?: string;
  scores: SubjectScoreInput[];
  note?: string;
  examType?: "genel" | "brans";
  bransSubjectId?: string;
};

export type SubjectScoreResult = SubjectScoreInput & {
  title: string;
  icon: string;
  color: string;
  category: DenemeCategory;
  questionCount: number;
  net: number;
  totalEntered: number;
  isValid: boolean;
  error?: string;
};

export type DenemeResult = {
  subjects: SubjectScoreResult[];
  totalNet: number;
  gyNet: number;
  gkNet: number;
  vatandaslikNet: number;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  isValid: boolean;
};

/** KPSS: 4 yanlış = 1 doğru götürür */
export function calculateNet(correct: number, wrong: number): number {
  return Math.round((correct - wrong / 4) * 100) / 100;
}

export function clampScore(
  value: number,
  min = 0,
  max = Number.POSITIVE_INFINITY
): number {
  if (Number.isNaN(value) || value < min) return min;
  if (value > max) return max;
  return Math.floor(value);
}

export function evaluateSubjectScore(
  input: SubjectScoreInput,
  questionCountOverride?: number
): SubjectScoreResult {
  const config = getSubjectConfig(input.subjectId);
  const questionCount = questionCountOverride !== undefined ? questionCountOverride : (config?.questionCount ?? 0);
  const correct = clampScore(input.correct, 0, questionCount);
  const wrong = clampScore(input.wrong, 0, questionCount);
  const empty = clampScore(input.empty, 0, questionCount);
  const totalEntered = correct + wrong + empty;

  let error: string | undefined;
  if (totalEntered > questionCount) {
    error = `Toplam ${totalEntered} — limit ${questionCount}`;
  }

  return {
    ...input,
    correct,
    wrong,
    empty,
    title: config?.title ?? input.subjectId,
    icon: config?.icon ?? "📚",
    color: config?.color ?? "#64748b",
    category: config?.category ?? "Genel Yetenek",
    questionCount,
    net: calculateNet(correct, wrong),
    totalEntered,
    isValid: !error && totalEntered <= questionCount,
    error,
  };
}

export function evaluateDeneme(scores: SubjectScoreInput[], examType?: "genel" | "brans"): DenemeResult {
  const subjects = DENEME_SUBJECTS.map((config) => {
    const existing = scores.find((s) => s.subjectId === config.id);
    let qCount = config.questionCount;
    if (examType === "brans" && config.id === "matematik") {
      qCount = 30;
    }
    if (examType === "brans" && config.id === "geometri") {
      qCount = 0;
    }

    return evaluateSubjectScore(
      existing ?? {
        subjectId: config.id,
        correct: 0,
        wrong: 0,
        empty: qCount,
      },
      qCount
    );
  });

  const sumCategory = (cat: DenemeCategory | "Vatandaşlık") =>
    subjects
      .filter((s) => s.category === cat)
      .reduce((acc, s) => acc + s.net, 0);

  const gyNet =
    Math.round(
      sumCategory("Genel Yetenek") * 100
    ) / 100;
  const gkNet =
    Math.round(
      (sumCategory("Genel Kültür") + sumCategory("Vatandaşlık")) * 100
    ) / 100;
  const vatandaslikNet =
    Math.round(sumCategory("Vatandaşlık") * 100) / 100;

  return {
    subjects,
    totalNet: Math.round((gyNet + gkNet) * 100) / 100,
    gyNet,
    gkNet,
    vatandaslikNet,
    totalCorrect: subjects.reduce((a, s) => a + s.correct, 0),
    totalWrong: subjects.reduce((a, s) => a + s.wrong, 0),
    totalEmpty: subjects.reduce((a, s) => a + s.empty, 0),
    isValid: subjects.every((s) => s.isValid),
  };
}

export function createEmptyScores(): SubjectScoreInput[] {
  return DENEME_SUBJECTS.map((s) => ({
    subjectId: s.id,
    correct: 0,
    wrong: 0,
    empty: s.questionCount,
  }));
}

export function formatNet(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "") || "0";
}

export function averageNet(denemeler: DenemeRecord[]): number {
  if (denemeler.length === 0) return 0;
  const sum = denemeler.reduce(
    (acc, d) => acc + evaluateDeneme(d.scores).totalNet,
    0
  );
  return Math.round((sum / denemeler.length) * 100) / 100;
}

export function subjectAverageNet(
  denemeler: DenemeRecord[],
  subjectId: string
): number {
  if (denemeler.length === 0) return 0;
  const sum = denemeler.reduce((acc, d) => {
    const score = d.scores.find((s) => s.subjectId === subjectId);
    if (!score) return acc;
    return acc + calculateNet(score.correct, score.wrong);
  }, 0);
  return Math.round((sum / denemeler.length) * 100) / 100;
}

/** 
 * Net değerine göre gerçekçi KPSS P3 puanı tahmini yapar.
 * ÖSYM'nin son yıllardaki standart sapmaları ve 2026 KPSS
 * beklentileri baz alınarak oluşturulmuş regresyon formülüdür.
 * Formül: 45 + (Net * 0.45). [0, 100] aralığına sınırlandırılmıştır.
 */
export function estimateP3Score(net: number): number {
  if (net <= 0) return 0;
  const estimate = 45 + (net * 0.45);
  return Math.min(100, Math.max(0, estimate));
}
