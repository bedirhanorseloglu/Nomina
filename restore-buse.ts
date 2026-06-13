process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import crypto from 'crypto';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kpss-2026-87bd5',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newTrials = [
  { id: crypto.randomUUID(), name: 'Matematik', date: '2026-06-11T12:00:00Z', publisher: 'yargý', correct: 24, incorrect: 3, empty: 3, net: 23.25, examType: 'brans' },
  { id: crypto.randomUUID(), name: 'Matematik', date: '2026-06-11T12:05:00Z', publisher: 'yargý', correct: 24, incorrect: 3, empty: 3, net: 23.25, examType: 'brans' },
  { id: crypto.randomUUID(), name: 'Matematik', date: '2026-06-11T12:10:00Z', publisher: 'yargý', correct: 26, incorrect: 3, empty: 1, net: 25.25, examType: 'brans' },
  { id: crypto.randomUUID(), name: 'Matematik', date: '2026-06-11T12:15:00Z', publisher: 'yargý', correct: 22, incorrect: 0, empty: 8, net: 22, examType: 'brans' },
  { id: crypto.randomUUID(), name: 'Matematik', date: '2026-06-11T12:20:00Z', publisher: 'yargý', correct: 23, incorrect: 4, empty: 3, net: 22, examType: 'brans' },
  { id: crypto.randomUUID(), name: 'Matematik', date: '2026-06-11T12:25:00Z', publisher: 'yargý', correct: 24, incorrect: 2, empty: 4, net: 23.5, examType: 'brans' }
];

async function run() {
  const lbSnapshot = await getDocs(collection(db, 'leaderboard'));
  let buseId = null;
  lbSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.displayName && data.displayName.toLowerCase().includes('buse')) {
      buseId = doc.id;
    }
  });

  if (!buseId) {
    const brSnapshot = await getDocs(collection(db, 'branch_leaderboards'));
    brSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.displayName && data.displayName.toLowerCase().includes('buse')) {
        buseId = data.userId;
      }
    });
  }

  if (!buseId) {
    console.log('Buse bulunamadý!');
    process.exit(1);
  }

  console.log('Buse UID:', buseId);
  const userDenemeRef = doc(db, 'user_denemeler', buseId);
  const userDenemeSnap = await getDoc(userDenemeRef);
  
  let currentDenemeler = [];
  if (userDenemeSnap.exists()) {
    currentDenemeler = userDenemeSnap.data().denemeler || [];
  }

  const finalDenemeler = [...currentDenemeler, ...newTrials];

  await setDoc(userDenemeRef, {
    denemeler: finalDenemeler,
    lastUpdated: Date.now()
  }, { merge: true });

  console.log('Buse icin 6 matematik denemesi eklendi!');
  process.exit(0);
}
run();
