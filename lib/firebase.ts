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

// IndexedDB önbelleğini siliyoruz çünkü sekme erken kapatıldığında
// verilerin "kaydedildi" gibi görünüp aslında sadece yerel önbellekte kalmasına yol açıyor.
// Sunucuya anında senkronizasyon için Memory Cache (varsayılan) kullanıyoruz.
let db: ReturnType<typeof getFirestore>;
if (typeof window !== "undefined") {
  db = getFirestore(app);
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
