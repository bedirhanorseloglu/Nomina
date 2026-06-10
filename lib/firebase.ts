import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
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

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence (sadece tarayıcıda çalışır)
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Birden fazla sekme açık olduğu için offline persistence aktif edilemedi.");
    } else if (err.code === 'unimplemented') {
      console.warn("Tarayıcınız offline persistence desteklemiyor.");
    }
  });
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Analytics initialization (only in browser)
const analytics = typeof window !== "undefined" ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export { app, db, auth, googleProvider, analytics };
