import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  deleteDoc,
} from "firebase/firestore";

const LEADERBOARD_COLLECTION = "leaderboard";
const BRANCH_LEADERBOARD_COLLECTION = "branch_leaderboards";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string;
  averageNet: number;
  maxNet: number;
  totalTrials: number;
  updatedAt: unknown; // Firestore serverTimestamp (FieldValue)
}

export interface BranchLeaderboardEntry extends LeaderboardEntry {
  subjectId: string;
}

// ─── Genel Liderlik ────────────────────────────────────────────────────────

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
    await setDoc(
      docRef,
      {
        userId,
        displayName: displayName || "Kpss Uzmanı",
        photoURL: photoURL || "",
        averageNet,
        maxNet,
        totalTrials,
        // serverTimestamp() → manipüle edilemeyen Firestore sunucu saati
        updatedAt: serverTimestamp(),
      },
      // merge:false → tüm alanları güncel değerlerle sıfırla;
      // eski/artık geçersiz alanların kalmasını önler.
      { merge: false }
    );
  } catch (error) {
    console.error("❌ Liderlik tablosu güncelleme hatası:", error);
    throw error;
  }
};

export const getLeaderboard = async (
  limitCount: number = 10
): Promise<LeaderboardEntry[]> => {
  try {
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      orderBy("averageNet", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const results: LeaderboardEntry[] = [];
    querySnapshot.forEach((d) => {
      results.push(d.data() as LeaderboardEntry);
    });

    return results;
  } catch (error) {
    console.error("❌ Liderlik tablosu yükleme hatası:", error);
    return [];
  }
};

export const removeFromLeaderboard = async (userId: string) => {
  if (!userId) return;
  try {
    await deleteDoc(doc(db, LEADERBOARD_COLLECTION, userId));
  } catch (error) {
    console.error("❌ Liderlik tablosundan silme hatası:", error);
    throw error;
  }
};

// ─── Branş Liderlik ────────────────────────────────────────────────────────

export const updateBranchLeaderboard = async (
  userId: string,
  displayName: string | null,
  photoURL: string | null,
  subjectId: string,
  averageNet: number,
  maxNet: number,
  totalTrials: number
) => {
  if (!userId || !subjectId) return;
  try {
    const docId = `${userId}_${subjectId}`;
    const docRef = doc(db, BRANCH_LEADERBOARD_COLLECTION, docId);
    await setDoc(
      docRef,
      {
        userId,
        subjectId,
        displayName: displayName || "Kpss Uzmanı",
        photoURL: photoURL || "",
        averageNet,
        maxNet,
        totalTrials,
        updatedAt: serverTimestamp(),
      },
      { merge: false }
    );
  } catch (error) {
    console.error(`❌ Branş liderlik tablosu güncelleme hatası (${subjectId}):`, error);
    throw error;
  }
};

export const getBranchLeaderboard = async (
  subjectId: string,
  limitCount: number = 10
): Promise<BranchLeaderboardEntry[]> => {
  try {
    const q = query(
      collection(db, BRANCH_LEADERBOARD_COLLECTION),
      where("subjectId", "==", subjectId),
      orderBy("averageNet", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const results: BranchLeaderboardEntry[] = [];
    querySnapshot.forEach((d) => {
      results.push(d.data() as BranchLeaderboardEntry);
    });

    return results;
  } catch (error) {
    console.error("❌ Branş liderlik tablosu yükleme hatası:", error);
    return [];
  }
};

export const removeFromBranchLeaderboard = async (
  userId: string,
  subjectId: string
) => {
  if (!userId || !subjectId) return;
  try {
    await deleteDoc(
      doc(db, BRANCH_LEADERBOARD_COLLECTION, `${userId}_${subjectId}`)
    );
  } catch (error) {
    console.error("❌ Branş liderlik tablosundan silme hatası:", error);
    throw error;
  }
};
