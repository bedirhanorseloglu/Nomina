process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQDcxtnlyflVJrly7os9U6F7xbDBC8PcU",
  authDomain: "kpss-2026-87bd5.firebaseapp.com",
  projectId: "kpss-2026-87bd5",
  storageBucket: "kpss-2026-87bd5.firebasestorage.app",
  messagingSenderId: "577800093321",
  appId: "1:577800093321:web:4cefbe997ceda04009d058",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log(`🔍 Firebase'deki tüm kullanıcı verileri taranıyor...`);

const querySnapshot = await getDocs(collection(db, "user_data"));

let foundYargi = false;
let foundMock = false;
let userIds = [];

querySnapshot.forEach((docSnap) => {
  const userId = docSnap.id;
  userIds.push(userId);
  const data = docSnap.data();
  const denemeler = data?.denemeler || [];
  
  if (denemeler.length > 0) {
    console.log(`\n👤 Kullanıcı: ${userId} - ${denemeler.length} deneme`);
    
    denemeler.forEach((d, i) => {
      if(d.name?.toLowerCase().includes("yargı") || d.name?.toLowerCase().includes("yargi")) {
          console.log("\n🎯 'Yargı-1' veya benzer kayıt bulundu:");
          console.log(JSON.stringify(d, null, 2));
          foundYargi = true;
      }
      if(d.name?.toLowerCase().includes("mock") || d.name?.toLowerCase().includes("test")) {
          foundMock = true;
      }
    });
  }
});

console.log(`\nToplam ${userIds.length} kullanıcı bulundu.`);
if(!foundYargi) console.log("⚠️ 'Yargı-1' hiçbir kullanıcıda bulunamadı.");

process.exit(0);



