import { db } from "./firebase";
import { doc, getDoc, getDocFromServer, getDocFromCache, setDoc, collection, query, where, getDocs, serverTimestamp, deleteDoc } from "firebase/firestore";
import { AppData } from "@/types";

const DATA_COLLECTION = "user_data";

export const isLocalhost = typeof window !== "undefined" && (
  window.location.hostname === "localhost" || 
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.startsWith("192.168.") ||
  window.location.hostname.startsWith("10.") ||
  window.location.hostname.startsWith("172.")
);

// Firestore doesn't allow undefined values — strip them recursively
function stripUndefined(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  }
  if (obj !== null && typeof obj === "object") {
    if (obj.constructor && obj.constructor.name !== "Object" && obj.constructor.name !== "Array") {
      return obj;
    }
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    );
  }
  return obj;
}

export const saveToFirebase = async (userId: string, data: AppData) => {
  if (!userId) return;
  try {
    const docRef = doc(db, DATA_COLLECTION, userId);
    const sanitized = stripUndefined(data) as AppData;
    await setDoc(docRef, sanitized, { merge: true });
    console.log("✅ Firebase'e kaydedildi");
  } catch (error) {
    console.error("❌ Firebase kayıt hatası:", error);
  }
};

// Lokal ortamdan da Firebase'e zorla yükler (manuel sync için)
export const forceUploadToFirebase = async (userId: string, data: AppData) => {
  if (!userId) return;
  try {
    const docRef = doc(db, DATA_COLLECTION, userId);
    const sanitized = stripUndefined(data) as AppData;
    await setDoc(docRef, sanitized, { merge: false }); // merge:false → tamamen üstüne yazar
    console.log("✅ Veriler zorla Firebase'e yüklendi");
  } catch (error) {
    console.error("❌ Force upload hatası:", error);
    throw error;
  }
};


export const updateUserProfile = async (userId: string, displayName: string | null, email: string | null) => {
  if (!userId) return;
  if (isLocalhost) return;
  try {
    const docRef = doc(db, DATA_COLLECTION, userId);
    await setDoc(docRef, { displayName, email }, { merge: true });
  } catch (error) {
    console.error("Profile update error:", error);
  }
};

export const saveDenemeDataToFirebase = async (
  userId: string,
  denemeler: AppData["denemeler"],
  denemeTargetNet?: number
) => {
  if (!userId) return;
  try {
    const docRef = doc(db, DATA_COLLECTION, userId);
    const payload = stripUndefined({
      denemeler,
      ...(denemeTargetNet !== undefined ? { denemeTargetNet } : {}),
    }) as Pick<AppData, "denemeler" | "denemeTargetNet">;
    await setDoc(docRef, payload, { merge: true });
    console.log("✅ Deneme verileri Firebase'e kaydedildi");
  } catch (error) {
    console.error("❌ Deneme Firebase kayıt hatası:", error);
  }
};

export const loadFromFirebase = async (userId: string): Promise<AppData | null> => {
  if (!userId) return null;
  try {
    const docRef = doc(db, DATA_COLLECTION, userId);
    // getDocFromServer: cache'i bypass edip her zaman sunucudan taze veri çeker
    const docSnap = await getDocFromServer(docRef);
    if (docSnap.exists()) {
      console.log("✅ Firebase'den yüklendi (sunucu)");
      return docSnap.data() as AppData;
    }
  } catch (error) {
    // Sunucu erişimi başarısız olursa cache'den dene
    try {
      const docRef = doc(db, DATA_COLLECTION, userId);
      const docSnap = await getDocFromCache(docRef);
      if (docSnap.exists()) {
        console.log("✅ Firebase'den yüklendi (cache)");
        return docSnap.data() as AppData;
      }
    } catch (fallbackError) {
      console.error("❌ Firebase yükleme hatası:", fallbackError);
    }
  }
  return null;
};

export const updatePresence = async (userId: string) => {
  if (!userId) return;
  if (isLocalhost) return;
  try {
    const docRef = doc(db, "active_users", userId);
    await setDoc(docRef, { lastActive: Date.now() }, { merge: true });
  } catch (error) {
    console.error("Presence update error:", error);
  }
};

export const getOnlineUsersCount = async (): Promise<number> => {
  try {
    const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
    const q = query(
      collection(db, "active_users"),
      where("lastActive", ">", fiveMinsAgo)
    );
    const snapshot = await getDocs(q);
    return Math.max(1, snapshot.size); // Always show at least 1 (themselves)
  } catch (error) {
    console.error("Online users fetch error:", error);
    return 1;
  }
};

export const deleteUserAllData = async (userId: string): Promise<void> => {
  if (!userId) return;
  if (isLocalhost) {
    console.log("🛠️ Lokal ortamdasınız: Silme işlemi iptal edildi.");
    return;
  }
  const collections = ["user_data", "leaderboard", "active_users"];
  const branchSubjects = ["turkce", "matematik", "tarih", "cografya", "vatandaslik", "guncel"];

  await Promise.all([
    ...collections.map((col) => deleteDoc(doc(db, col, userId))),
    ...branchSubjects.map((s) => deleteDoc(doc(db, "branch_leaderboards", `${userId}_${s}`)))
  ]);
  console.log("✅ Kullanıcı verileri Firestore'dan silindi.");
};

