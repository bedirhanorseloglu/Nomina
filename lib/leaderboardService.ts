import { db } from "./firebase";
import { isLocalhost } from "./firebaseService";
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
  if (isLocalhost) return;
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

    // Lokalde gerçek veri zaten gelmez; sadece mock göster
    if (isLocalhost) {
      for (let i = 1; i <= 10; i++) {
        results.push({
          userId: `mock-user-${i}`,
          displayName: `Rakibin ${i}`,
          photoURL: "",
          averageNet: 95 - i * 3 + Math.random() * 2,
          maxNet: 100,
          totalTrials: 5 + i,
          updatedAt: null,
        });
      }
      results.sort((a, b) => (b.averageNet as number) - (a.averageNet as number));
    }

    return results;
  } catch (error) {
    console.error("❌ Liderlik tablosu yükleme hatası:", error);
    return [];
  }
};

export const removeFromLeaderboard = async (userId: string) => {
  if (!userId) return;
  if (isLocalhost) return;
  try {
    await deleteDoc(doc(db, LEADERBOARD_COLLECTION, userId));
  } catch (error) {
    console.error("❌ Liderlik tablosundan silme hatası:", error);
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
  if (isLocalhost) return;
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

    if (isLocalhost) {
      for (let i = 1; i <= 10; i++) {
        results.push({
          userId: `mock-branch-user-${i}`,
          subjectId,
          displayName: `Branş Rakibi ${i}`,
          photoURL: "",
          averageNet: 25 - i + Math.random() * 2,
          maxNet: 30,
          totalTrials: 3 + i,
          updatedAt: null,
        });
      }
      results.sort((a, b) => (b.averageNet as number) - (a.averageNet as number));
    }

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
  if (isLocalhost) return;
  try {
    await deleteDoc(
      doc(db, BRANCH_LEADERBOARD_COLLECTION, `${userId}_${subjectId}`)
    );
  } catch (error) {
    console.error("❌ Branş liderlik tablosundan silme hatası:", error);
  }
};
