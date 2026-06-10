import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDQDcxtnlyflVJrly7os9U6F7xbDBC8PcU",
  authDomain: "kpss-2026-87bd5.firebaseapp.com",
  projectId: "kpss-2026-87bd5",
  storageBucket: "kpss-2026-87bd5.firebasestorage.app",
  messagingSenderId: "577800093321",
  appId: "1:577800093321:web:4cefbe997ceda04009d058",
  measurementId: "G-FCC2C9S1GL"
};

// Initialize Firebase — guard against double-init in Next.js hot reload
const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// Firestore: tarayıcıda ilk kez başlatılıyorsa IndexedDB kalıcı cache ile aç.
// persistentLocalCache → enableIndexedDbPersistence'ın modern karşılığı.
// persistentMultipleTabManager → birden fazla sekme açık olsa da sorunsuz çalışır.
// Sunucu tarafında (SSR/SSG) veya ikinci init'te düz getFirestore kullan.
let db: ReturnType<typeof getFirestore>;
if (typeof window !== "undefined" && isFirstInit) {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Nadir durum: başka bir modül daha önce getFirestore çağırdıysa
    db = getFirestore(app);
  }
} else {
  db = getFirestore(app);
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Analytics: yalnızca tarayıcıda, non-blocking
const analytics =
  typeof window !== "undefined"
    ? isSupported().then((yes) => (yes ? getAnalytics(app) : null))
    : null;

export { app, db, auth, googleProvider, analytics };
