import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AppData } from "@/types";

const DATA_COLLECTION = "user_data";
const DEFAULT_USER_ID = "main_user";

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

export const saveToFirebase = async (data: AppData) => {
  try {
    const docRef = doc(db, DATA_COLLECTION, DEFAULT_USER_ID);
    const sanitized = stripUndefined(data) as AppData;
    await setDoc(docRef, sanitized);
    console.log("✅ Firebase'e kaydedildi");
  } catch (error) {
    console.error("❌ Firebase kayıt hatası:", error);
  }
};

export const loadFromFirebase = async (): Promise<AppData | null> => {
  try {
    const docRef = doc(db, DATA_COLLECTION, DEFAULT_USER_ID);
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
