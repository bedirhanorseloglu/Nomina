import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

// Firebase config extracted from the project
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kpss-2026-87bd5",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const lbSnapshot = await getDocs(collection(db, "leaderboard"));
    let buseId = null;
    lbSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.displayName && data.displayName.toLowerCase().includes("buse")) {
        buseId = doc.id;
        console.log("Found Buse in leaderboard:", data);
      }
    });

    if (!buseId) {
      console.log("Buse not found in leaderboard. Checking branch_leaderboards...");
      const brSnapshot = await getDocs(collection(db, "branch_leaderboards"));
      brSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.displayName && data.displayName.toLowerCase().includes("buse")) {
          buseId = data.userId;
          console.log("Found Buse in branch_leaderboard:", data);
        }
      });
    }

    if (!buseId) {
      console.log("Could not find Buse's ID.");
      return;
    }

    const userDataRef = doc(db, "user_data", buseId);
    const userDataSnap = await getDoc(userDataRef);
    if (userDataSnap.exists()) {
      console.log("USER_DATA for Buse:");
      console.log(JSON.stringify(userDataSnap.data(), null, 2));
    } else {
      console.log("USER_DATA document does not exist for Buse!");
    }
    
    // forcefully exit
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
