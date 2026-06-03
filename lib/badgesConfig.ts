export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
};

export const BADGES: Badge[] = [
  {
    id: "first_deneme",
    title: "İlk Adım",
    description: "İlk denemeni başarıyla kaydettin.",
    icon: "🌱",
    color: "emerald"
  },
  {
    id: "streak_5",
    title: "İstikrar Abidesi",
    description: "5 gün boyunca seriyi bozmadın.",
    icon: "🔥",
    color: "orange"
  },
  {
    id: "math_genius",
    title: "Matematik Kurdu",
    description: "Matematikte 25 netin üzerine çıktın.",
    icon: "🔢",
    color: "blue"
  },
  {
    id: "history_master",
    title: "Tarih Üstadı",
    description: "Tarihte 22 netin üzerine çıktın.",
    icon: "📜",
    color: "amber"
  },
  {
    id: "high_score",
    title: "90+ Kulübü",
    description: "Genel denemede 90 net barajını aştın.",
    icon: "🚀",
    color: "purple"
  }
];

export const getEarnedBadges = (userData: any): string[] => {
  if (!userData) return [];
  const earned: string[] = [];

  const denemeler = userData.denemeler || [];
  const streak = userData.streak || 0;

  // 1. İlk Adım
  if (denemeler.length > 0) {
    earned.push("first_deneme");
  }

  // 2. İstikrar Abidesi
  if (streak >= 5) {
    earned.push("streak_5");
  }

  // Check from denemeler
  for (const d of denemeler) {
    // 3. 90+ Kulübü
    const totalNet = d.scores.reduce((acc: number, s: any) => acc + (s.correct - s.wrong / 4), 0);
    if (totalNet >= 90 && !earned.includes("high_score")) {
      earned.push("high_score");
    }

    // 4 & 5. Math/History Masters
    for (const s of d.scores) {
      const net = s.correct - s.wrong / 4;
      if (s.subjectId === "matematik" && net >= 25 && !earned.includes("math_genius")) {
        earned.push("math_genius");
      }
      if (s.subjectId === "tarih" && net >= 22 && !earned.includes("history_master")) {
        earned.push("history_master");
      }
    }
  }

  return earned;
};
