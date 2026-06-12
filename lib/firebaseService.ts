import { db } from "./firebase";
import {
  doc,
  getDoc,
  getDocFromCache,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { AppData } from "@/types";

const DATA_COLLECTION = "user_data";



// Firestore undefined değerlere izin vermez — özyinelemeli temizle
function stripUndefined(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  }
  if (obj !== null && typeof obj === "object") {
    if (
      obj.constructor &&
      obj.constructor.name !== "Object" &&
      obj.constructor.name !== "Array"
    ) {
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
    // merge:false → tüm belgeyi sıfırdan yazar
    await setDoc(docRef, sanitized, { merge: false });
  } catch (error) {
    console.error("❌ Force upload hatası:", error);
    throw error;
  }
};

export const updateUserProfile = async (
  userId: string,
  displayName: string | null,
  email: string | null
) => {
  if (!userId) return;
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
  } catch (error) {
    // alert() yerine sadece konsola yaz — kullanıcıya ham hata göstermek güvensiz
    console.error("❌ Deneme Firebase kayıt hatası:", error);
  }
};

export const loadFromFirebase = async (
  userId: string
): Promise<AppData | null> => {
  if (!userId) return null;
  try {
    const docRef = doc(db, DATA_COLLECTION, userId);
    // getDoc: persistence açıkken hem ağı hem cache'i birleştirerek döner.
    // Ağ kesilirse IndexedDB'deki son sürümü kullanır.
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppData;
    }
    return null;
  } catch (error) {
    // Ağ tamamen erişilemezse cache'den son bilinen veriyi al
    try {
      const docRef = doc(db, DATA_COLLECTION, userId);
      const docSnap = await getDocFromCache(docRef);
      if (docSnap.exists()) {
        console.warn("⚠️ Sunucu erişilemedi, cache'den yüklendi.");
        return docSnap.data() as AppData;
      }
    } catch {
      // Cache de boşsa veri yok — sessizce null dön
    }
    console.error("❌ Firebase yükleme hatası:", error);
    return null;
  }
};

export const updatePresence = async (userId: string) => {
  if (!userId) return;
  try {
    const docRef = doc(db, "active_users", userId);
    // serverTimestamp() kullan: client saati manipüle edilebilir
    await setDoc(
      docRef,
      { lastActive: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    console.error("Presence update error:", error);
  }
};

export const getOnlineUsersCount = async (): Promise<number> => {
  try {
    // serverTimestamp ile kaydedilen alanı sorgulamak için Firestore
    // sunucu tarafında 5 dakika öncesini hesaplıyoruz.
    // Not: serverTimestamp Timestamp nesnesi döndürür, Date.now() ile karışmaması için
    // active_users belgelerinde artık Firestore Timestamp kullanılıyor.
    const { Timestamp } = await import("firebase/firestore");
    const fiveMinsAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
    const q = query(
      collection(db, "active_users"),
      where("lastActive", ">", fiveMinsAgo)
    );
    const snapshot = await getDocs(q);
    return Math.max(1, snapshot.size);
  } catch (error) {
    console.error("Online users fetch error:", error);
    return 1;
  }
};

export const deleteUserAllData = async (userId: string): Promise<void> => {
  if (!userId) return;
  const collections = ["user_data", "leaderboard", "active_users"];
  const branchSubjects = [
    "turkce",
    "matematik",
    "tarih",
    "cografya",
    "vatandaslik",
    "guncel",
  ];

  // Tüm silme işlemlerini paralel yürüt; herhangi biri hata verirse logla ama devam et
  const results = await Promise.allSettled([
    ...collections.map((col) => deleteDoc(doc(db, col, userId))),
    ...branchSubjects.map((s) =>
      deleteDoc(doc(db, "branch_leaderboards", `${userId}_${s}`))
    ),
  ]);

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`❌ Silme hatası (${i}):`, r.reason);
    }
  });
};
