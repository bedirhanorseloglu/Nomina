import { db } from "./firebase";
import { collection, doc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";

const LEADERBOARD_COLLECTION = "leaderboard";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  averageNet: number;
  maxNet: number;
  totalTrials: number;
  updatedAt: string;
}

export const updateLeaderboard = async (
  userId: string,
  displayName: string | null,
  photoURL: string | null,
  averageNet: number,
  maxNet: number,
  totalTrials: number
) => {
  if (!userId) return;
  try {
    const docRef = doc(db, LEADERBOARD_COLLECTION, userId);
    const data: LeaderboardEntry = {
      userId,
      displayName: displayName || "Kpss Uzmanı",
      photoURL: photoURL || "",
      averageNet,
      maxNet,
      totalTrials,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, data, { merge: true });
    console.log("✅ Liderlik tablosu güncellendi");
  } catch (error) {
    console.error("❌ Liderlik tablosu güncelleme hatası:", error);
  }
};

export const getLeaderboard = async (limitCount: number = 10): Promise<LeaderboardEntry[]> => {
  try {
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      orderBy("averageNet", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const results: LeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as LeaderboardEntry);
    });
    return results;
  } catch (error) {
    console.error("❌ Liderlik tablosu yükleme hatası:", error);
    return [];
  }
};
