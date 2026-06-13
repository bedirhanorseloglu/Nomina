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
const DENEME_COLLECTION = "user_denemeler";
const PLANNER_COLLECTION = "user_planner";

/**
 * Tek doğruluk kaynağı: ortam tespiti.
 * leaderboardService gibi diğer modüller buradan import eder,
 * kod tekrarını ve tutarsızlığı önler.
 */
export const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10.") ||
    window.location.hostname.startsWith("172."));

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
    
    // Kök Neden Çözümü: localStorage'dan gelen 'data' içindeki 'denemeler' eskidir!
    // Dashboard sadece kendi yönettiği alanları kaydetmeli, deneme verilerini EZMEMELİDİR.
    const { denemeler, denemeTargetNet, ...dashboardData } = data;

    const payload = stripUndefined(dashboardData) as Partial<AppData>;
    
    // user verisini merge true ile güncelle
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.error("❌ Firebase kayıt hatası:", error);
    throw error;
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
    throw error;
  }
};

export const saveDenemeYeniden = async (
  userId: string,
  denemeler: AppData["denemeler"],
  denemeTargetNet?: number
) => {
  if (!userId) return;
  try {
    const docRef = doc(db, DENEME_COLLECTION, userId);
    const payload = stripUndefined({
      denemeler,
      denemeTargetNet,
      lastUpdated: Date.now()
    }) as Record<string, any>;
    // Eski sistemdeki merge karışıklıklarını önlemek için tamamen yeni döküman yazılır
    await setDoc(docRef, payload, { merge: false });
    console.log("Yeni bağımsız tabloya kaydedildi!");
  } catch (error) {
    console.error("❌ Yeni Deneme Kayıt Hatası:", error);
    throw error;
  }
};

export const loadDenemeYeniden = async (userId: string) => {
  if (!userId) return null;
  try {
    // 1. Önce yeni bağımsız tablodan çekmeyi dene
    const docRef = doc(db, DENEME_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    // 2. Yeni tabloda veri yoksa, geçiş (Migration) amaçlı eski tablodan çekmeyi dene
    const oldDocRef = doc(db, DATA_COLLECTION, userId);
    const oldDocSnap = await getDoc(oldDocRef);
    if (oldDocSnap.exists()) {
      const oldData = oldDocSnap.data() as AppData;
      if (oldData.denemeler && oldData.denemeler.length > 0) {
        console.log("Eski veritabanından yeni veritabanına taşıma yapılıyor...");
        await saveDenemeYeniden(userId, oldData.denemeler, oldData.denemeTargetNet);
        return { denemeler: oldData.denemeler, denemeTargetNet: oldData.denemeTargetNet };
      }
    }
    return null;
  } catch (error) {
    console.error("❌ Yeni Deneme Yükleme Hatası:", error);
    return null;
  }
};

export const savePlannerYeniden = async (
  userId: string,
  plannerData: any
) => {
  if (!userId) return;
  try {
    const docRef = doc(db, PLANNER_COLLECTION, userId);
    const payload = stripUndefined({
      ...plannerData,
      lastUpdated: Date.now()
    }) as Record<string, any>;
    await setDoc(docRef, payload, { merge: false });
    console.log("Planner verisi yeni tabloya kaydedildi!");
  } catch (error) {
    console.error("❌ Planner Kayıt Hatası:", error);
    throw error;
  }
};

export const loadPlannerYeniden = async (userId: string) => {
  if (!userId) return null;
  try {
    // 1. Önce yeni bağımsız tablodan çekmeyi dene
    const docRef = doc(db, PLANNER_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    // 2. Yeni tabloda veri yoksa, geçiş (Migration) amaçlı eski tablodan çekmeyi dene
    const oldDocRef = doc(db, DATA_COLLECTION, userId);
    const oldDocSnap = await getDoc(oldDocRef);
    if (oldDocSnap.exists()) {
      const oldData = oldDocSnap.data() as any;
      if (oldData.subjects && oldData.subjects.length > 0) {
        console.log("Eski veritabanından planner veritabanına taşıma yapılıyor...");
        
        // Extract planner specific data from old user_data
        const plannerData = {
          subjects: oldData.subjects,
          slotNotes: (oldData as any).slotNotes || {},
          completedNotes: (oldData as any).completedNotes || {},
          holidays: (oldData as any).holidays || [],
          dailyGoals: (oldData as any).dailyGoals || {},
          dailyGoalTarget: (oldData as any).dailyGoalTarget || 100,
        };
        
        await savePlannerYeniden(userId, plannerData);
        return plannerData;
      }
    }
    return null;
  } catch (error) {
    console.error("❌ Planner Yükleme Hatası:", error);
    return null;
  }
};

export const loadFromFirebase = async (
  userId: string
): Promise<AppData | null> => {
  if (!userId) return null;
  try {
    const docRef = doc(db, DATA_COLLECTION, userId);
    // getDoc ağ isteğini bekleyecektir.
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppData;
    }
    return null;
  } catch (error) {
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
    throw error;
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

  const collections = ["user_data", "leaderboard", "active_users", "user_denemeler", "user_planner"];
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
