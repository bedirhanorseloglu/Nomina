/**
 * cleanup-users.mjs
 * Firebase'den main_user HARİÇ tüm kullanıcı verilerini ve denemeleri siler.
 * Çalıştırmak için: node scripts/cleanup-users.mjs
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQDcxtnlyflVJrly7os9U6F7xbDBC8PcU",
  authDomain: "kpss-2026-87bd5.firebaseapp.com",
  projectId: "kpss-2026-87bd5",
  storageBucket: "kpss-2026-87bd5.firebasestorage.app",
  messagingSenderId: "577800093321",
  appId: "1:577800093321:web:4cefbe997ceda04009d058",
};

const MAIN_USER_ID = "main_user"; // Korunacak belge ID'si

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteOthersFromCollection(collectionName) {
  console.log(`\n📂 "${collectionName}" koleksiyonu işleniyor...`);
  const snapshot = await getDocs(collection(db, collectionName));

  if (snapshot.empty) {
    console.log(`   ⚠️  Koleksiyon boş, atlanıyor.`);
    return 0;
  }

  let deleted = 0;
  let kept = 0;

  for (const docSnap of snapshot.docs) {
    if (docSnap.id === MAIN_USER_ID) {
      console.log(`   ✅ KORUNDU: ${docSnap.id}`);
      kept++;
    } else {
      await deleteDoc(doc(db, collectionName, docSnap.id));
      console.log(`   🗑️  SİLİNDİ: ${docSnap.id}`);
      deleted++;
    }
  }

  console.log(`   → ${deleted} belge silindi, ${kept} belge korundu.`);
  return deleted;
}

async function main() {
  console.log("🚀 Temizleme işlemi başlıyor...");
  console.log(`🔒 Korunan ID: "${MAIN_USER_ID}"\n`);

  const collections = ["user_data", "leaderboard", "active_users"];
  let totalDeleted = 0;

  for (const col of collections) {
    totalDeleted += await deleteOthersFromCollection(col);
  }

  console.log(`\n✨ Tamamlandı! Toplam ${totalDeleted} belge silindi.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Hata:", err);
  process.exit(1);
});
