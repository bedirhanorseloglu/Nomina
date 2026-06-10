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
 * Branş denemesinin hangi derse ait olduğunu skorlardan çıkar.
 * Kurallar (öncelik sırasıyla):
 * 1. bransSubjectId zaten doluysa dokunma
 * 2. Sadece tek skor varsa o ders
 * 3. En yüksek (correct+wrong) toplamına sahip ders — branş denemesinde
 *    yalnızca o ders doldurulur, diğerleri 0'dır
 */
export function inferBransSubjectId(d: DenemeRecord): string | undefined {
  if (d.bransSubjectId) return d.bransSubjectId;
  if (d.examType !== "brans") return undefined;
  if (d.scores.length === 0) return undefined;
  if (d.scores.length === 1) return d.scores[0].subjectId;

  // En yüksek girilen soru sayısına sahip derse göre belirle
  const best = d.scores.reduce((prev, curr) => {
    const prevTotal = prev.correct + prev.wrong;
    const currTotal = curr.correct + curr.wrong;
    return currTotal > prevTotal ? curr : prev;
  });
  // Hiç cevap girilmemişse ilk skoru al
  return (best.correct + best.wrong) > 0 ? best.subjectId : d.scores[0].subjectId;
}

export function migrateDenemeler(denemeler: DenemeRecord[]): DenemeRecord[] {
  return denemeler.map(d => {
    let record = { ...d };

    // 1. Geometri → Matematik birleştirme (eski format)
    const geometriScore = record.scores.find(s => s.subjectId === "geometri");
    if (geometriScore) {
      const newScores = record.scores.filter(s => s.subjectId !== "geometri");
      const matematikIdx = newScores.findIndex(s => s.subjectId === "matematik");
      if (matematikIdx !== -1) {
        newScores[matematikIdx] = {
          ...newScores[matematikIdx],
          correct: newScores[matematikIdx].correct + geometriScore.correct,
          wrong: newScores[matematikIdx].wrong + geometriScore.wrong,
          empty: newScores[matematikIdx].empty + geometriScore.empty,
        };
      } else {
        newScores.push({
          subjectId: "matematik",
          correct: geometriScore.correct,
          wrong: geometriScore.wrong,
          empty: geometriScore.empty + 23,
        });
      }
      record = { ...record, scores: newScores };
    }

    // 2. Eksik bransSubjectId tamamla (branş denemesi ama id kaydedilmemiş)
    if (record.examType === "brans" && !record.bransSubjectId) {
      const inferred = inferBransSubjectId(record);
      if (inferred) {
        record = { ...record, bransSubjectId: inferred };
      }
    }

    return record;
  });
}

/**
 * 2024 KPSS Lisans gerçek sonuçlarından (11 onaylanmış ÖSYM belgesi)
 * en küçük kareler regresyonu ile türetilmiş puan tahmin formülleri.
 *
 * P3 = 54.42 + 0.4512 × GY_net + 0.3475 × GK_net  (R²=0.983, RMSE=0.94)
 * P1 = 53.48 + 0.6286 × GY_net + 0.1998 × GK_net  (R²=0.997, RMSE=0.52)
 * P2 = 53.68 + 0.5449 × GY_net + 0.2772 × GK_net  (R²=0.993, RMSE=0.67)
 *
 * GY katsayısı tüm puan türlerinde GK'dan yüksektir çünkü GY testinin
 * standart sapması daha düşüktür (her net daha değerli).
 */

const P3_INTERCEPT = 54.41787;
const P3_GY_COEFF = 0.45117;
const P3_GK_COEFF = 0.34747;

const P1_INTERCEPT = 53.47528;
const P1_GY_COEFF = 0.62863;
const P1_GK_COEFF = 0.19984;

const P2_INTERCEPT = 53.67540;
const P2_GY_COEFF = 0.54493;
const P2_GK_COEFF = 0.27715;

function clampPuan(value: number): number {
  if (value <= 0) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * GY ve GK netlerini ayrı ayrı alarak KPSS P3 puanı tahmini yapar.
 * 2024 KPSS Lisans gerçek verileriyle kalibre edilmiştir (R²=0.983).
 */
export function estimateP3Score(gyNet: number, gkNet: number): number;
/**
 * Toplam net üzerinden yaklaşık P3 tahmini yapar.
 * GY/GK ayrımı bilinmediğinde kullanılır (hedef net slider vb.)
 * Toplam neti 50/50 oranında GY ve GK'ya bölerek hesaplar.
 */
export function estimateP3Score(totalNet: number): number;
export function estimateP3Score(gyNetOrTotal: number, gkNet?: number): number {
  if (gkNet !== undefined) {
    // İki parametreli çağrı: estimateP3Score(gyNet, gkNet)
    return clampPuan(P3_INTERCEPT + P3_GY_COEFF * gyNetOrTotal + P3_GK_COEFF * gkNet);
  }
  // Tek parametreli çağrı: estimateP3Score(totalNet)
  // Toplam neti eşit bölerek yaklaşık tahmin üret
  const half = gyNetOrTotal / 2;
  return clampPuan(P3_INTERCEPT + P3_GY_COEFF * half + P3_GK_COEFF * half);
}

/** KPSS P1 puanı tahmini (GY ağırlıklı). R²=0.997 */
export function estimateP1Score(gyNet: number, gkNet: number): number {
  return clampPuan(P1_INTERCEPT + P1_GY_COEFF * gyNet + P1_GK_COEFF * gkNet);
}

/** KPSS P2 puanı tahmini (dengeli). R²=0.993 */
export function estimateP2Score(gyNet: number, gkNet: number): number {
  return clampPuan(P2_INTERCEPT + P2_GY_COEFF * gyNet + P2_GK_COEFF * gkNet);
}
