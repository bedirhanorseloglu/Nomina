import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQDcxtnlyflVJrly7os9U6F7xbDBC8PcU",
  authDomain: "kpss-2026-87bd5.firebaseapp.com",
  projectId: "kpss-2026-87bd5",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkBuseData() {
  console.log("Querying for Buse's data...");
  const q = query(collection(db, "user_data"), where("email", "==", "yylmazbusee@gmail.com"));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log("No data found for Buse.");
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log("Found Buse's doc! UID:", doc.id);
    const denemeler = data.denemeler || [];
    console.log("Total denemeler:", denemeler.length);
    if (denemeler.length > 0) {
      console.log("Latest deneme:", denemeler[0].name, "Date:", denemeler[0].date);
      console.log("All names:", denemeler.map((d: any) => d.name));
    }
  });
}

checkBuseData().catch(console.error);
