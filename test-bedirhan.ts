import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDQDcxtnlyflVJrly7os9U6F7xbDBC8PcU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "kpss-2026-87bd5.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kpss-2026-87bd5",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "kpss-2026-87bd5.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "577800093321",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:577800093321:web:4cefbe997ceda04009d058",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkData() {
  console.log("Fetching all users...");
  const usersSnapshot = await getDocs(collection(db, "user_data"));
  let bedirhanId = "";
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.email === "bedirhan.orseloglu@gmail.com" || (data.displayName && data.displayName.toLowerCase().includes("bedirhan"))) {
      bedirhanId = doc.id;
      console.log("Found Bedirhan! ID:", bedirhanId);
    }
  });

  if (bedirhanId) {
    const userDoc = await getDoc(doc(db, "user_data", bedirhanId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log("Bedirhan's data:");
      console.log(JSON.stringify(data.denemeler, null, 2));
    } else {
      console.log("User doc not found!");
    }
  } else {
    console.log("Bedirhan not found. Let's dump all user emails:");
    usersSnapshot.forEach(doc => {
      console.log(doc.id, doc.data().email, doc.data().displayName);
    });
  }
}

checkData().catch(console.error);
