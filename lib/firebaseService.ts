import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { AppData } from "@/types";

const DATA_COLLECTION = "user_data";

// Firestore doesn't allow undefined values — strip them recursively
function stripUndefined(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  }
  if (obj !== null && typeof obj === "object") {
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
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("✅ Firebase'den yüklendi");
      return docSnap.data() as AppData;
    }
  } catch (error) {
    console.error("❌ Firebase yükleme hatası:", error);
  }
  return null;
};

export const updatePresence = async (userId: string) => {
  if (!userId) return;
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
