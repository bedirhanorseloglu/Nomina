"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function TestDbPage() {
  const { user } = useAuth();
  const [log, setLog] = useState("");

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      try {
        let buseId = null;
        
        const lbSnapshot = await getDocs(collection(db, "leaderboard"));
        lbSnapshot.forEach(d => {
          if (d.data().displayName?.toLowerCase().includes("buse")) {
            buseId = d.id;
          }
        });

        if (!buseId) {
          const brSnapshot = await getDocs(collection(db, "branch_leaderboards"));
          brSnapshot.forEach(d => {
            if (d.data().displayName?.toLowerCase().includes("buse")) {
              buseId = d.data().userId;
            }
          });
        }

        if (!buseId) {
          setLog("Buse Yilmaz'in UID'si bulunamadi.");
          return;
        }

        const userDataRef = doc(db, "user_data", buseId);
        const userDataSnap = await getDoc(userDataRef);
        
        if (userDataSnap.exists()) {
          setLog("Bulunan Buse UID: " + buseId + "\n\nVeri:\n" + JSON.stringify(userDataSnap.data(), null, 2));
        } else {
          setLog("Bulunan Buse UID: " + buseId + "\n\nAncak user_data koleksiyonunda belgesi YOK!");
        }
      } catch (e: any) {
        setLog("Hata: " + e.message);
      }
    };
    run();
  }, [user]);

  return (
    <div className="p-10 text-black">
      <h1 className="text-2xl font-bold mb-4">Veritabanı Testi</h1>
      {!user && <p>Lütfen önce giriş yapın.</p>}
      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-[80vh]">{log}</pre>
    </div>
  );
}
