import { db } from "./firebase";
import { collection, doc, getDocs, limit, orderBy, query, setDoc, where, deleteDoc } from "firebase/firestore";

const LEADERBOARD_COLLECTION = "leaderboard";

const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

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
  if (isLocalhost) return;
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
    
    if (isLocalhost) {
      for (let i = 1; i <= 10; i++) {
        results.push({
          userId: `mock-user-${i}`,
          displayName: `Rakiplerin ${i}`,
          photoURL: "",
          averageNet: 95 - (i * 3) + Math.random() * 2,
          maxNet: 100,
          totalTrials: 5 + i,
          updatedAt: new Date().toISOString()
        });
      }
      results.sort((a, b) => b.averageNet - a.averageNet);
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
    const docRef = doc(db, LEADERBOARD_COLLECTION, userId);
    await deleteDoc(docRef);
    console.log("✅ Liderlik tablosundan silindi");
  } catch (error) {
    console.error("❌ Liderlik tablosundan silme hatası:", error);
  }
};

const BRANCH_LEADERBOARD_COLLECTION = "branch_leaderboards";

export interface BranchLeaderboardEntry extends LeaderboardEntry {
  subjectId: string;
}

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
    const data: BranchLeaderboardEntry = {
      userId,
      subjectId,
      displayName: displayName || "Kpss Uzmanı",
      photoURL: photoURL || "",
      averageNet,
      maxNet,
      totalTrials,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, data, { merge: true });
    console.log(`✅ Branş liderlik tablosu güncellendi (${subjectId})`);
  } catch (error) {
    console.error(`❌ Branş liderlik tablosu güncelleme hatası (${subjectId}):`, error);
  }
};

export const getBranchLeaderboard = async (subjectId: string, limitCount: number = 10): Promise<BranchLeaderboardEntry[]> => {
  try {
    const q = query(
      collection(db, BRANCH_LEADERBOARD_COLLECTION),
      where("subjectId", "==", subjectId),
      orderBy("averageNet", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const results: BranchLeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as BranchLeaderboardEntry);
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
          updatedAt: new Date().toISOString()
        });
      }
      results.sort((a, b) => b.averageNet - a.averageNet);
    }
    
    return results;
  } catch (error) {
    console.error("❌ Branş liderlik tablosu yükleme hatası:", error);
    return [];
  }
};

export const removeFromBranchLeaderboard = async (userId: string, subjectId: string) => {
  if (!userId || !subjectId) return;
  if (isLocalhost) return;
  try {
    const docId = `${userId}_${subjectId}`;
    const docRef = doc(db, BRANCH_LEADERBOARD_COLLECTION, docId);
    await deleteDoc(docRef);
    console.log(`✅ Branş liderlik tablosundan silindi (${subjectId})`);
  } catch (error) {
    console.error("❌ Branş liderlik tablosundan silme hatası:", error);
  }
};
