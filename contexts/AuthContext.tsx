"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { loadDenemeler, loadTargetNet, saveDenemeler } from "@/lib/denemeStorage";
import { loadFromFirebase, saveDenemeDataToFirebase, updateUserProfile, isLocalhost } from "@/lib/firebaseService";
import { updateLeaderboard, updateBranchLeaderboard } from "@/lib/leaderboardService";
import { evaluateDeneme, averageNet, migrateDenemeler } from "@/lib/denemeUtils";
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const localDenemeler = loadDenemeler();
          const targetNet = loadTargetNet();
          await updateUserProfile(currentUser.uid, currentUser.displayName, currentUser.email);
          const remote = await loadFromFirebase(currentUser.uid);
          
          let mergedDenemeler = localDenemeler;
          
          if (remote?.denemeler && remote.denemeler.length > 0) {
            const remoteMigrated = migrateDenemeler(remote.denemeler as any[]);
            
            // Her zaman lokal ve remote'u id'ye göre birleştir (veri kaybını önler)
            const localIds = new Set(localDenemeler.map((d: any) => d.id));
            const newRemotes = remoteMigrated.filter((r: any) => !localIds.has(r.id));
            mergedDenemeler = [...localDenemeler, ...newRemotes];
            // Tarihe göre sırala
            mergedDenemeler.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            saveDenemeler(mergedDenemeler);
          } else if (localDenemeler.length > 0 && !isLocalhost) {
            await saveDenemeDataToFirebase(currentUser.uid, localDenemeler, targetNet);
          }
          
          const genelDenemeler = mergedDenemeler.filter((d: any) => d.examType !== "brans");
          if (genelDenemeler.length > 0) {
            const nets = genelDenemeler.map((d: any) => evaluateDeneme(d.scores).totalNet);
            const avg = averageNet(genelDenemeler);
            const max = Math.max(...nets);
            updateLeaderboard(currentUser.uid, currentUser.displayName, currentUser.photoURL, avg, max, genelDenemeler.length);
          }

          // Update branch leaderboards
          const bransDenemeler = mergedDenemeler.filter((d: any) => d.examType === "brans" && d.bransSubjectId);
          const bransGroups = bransDenemeler.reduce((acc: any, d: any) => {
            if (!acc[d.bransSubjectId]) acc[d.bransSubjectId] = [];
            acc[d.bransSubjectId].push(d);
            return acc;
          }, {});

          for (const subjectId in bransGroups) {
            const subjectDenemeler = bransGroups[subjectId];
            const nets = subjectDenemeler.map((d: any) => {
              const score = d.scores.find((s: any) => s.subjectId === subjectId);
              return score ? score.correct - (score.wrong / 4) : 0;
            });
            const avg = nets.reduce((a: number, b: number) => a + b, 0) / nets.length;
            const max = Math.max(...nets);
            updateBranchLeaderboard(currentUser.uid, currentUser.displayName, currentUser.photoURL, subjectId, avg, max, subjectDenemeler.length);
          }
        } catch (error) {
          console.error("Global sync failed:", error);
        }
      }
      
      // setLoading is called AFTER the async sync completes so that child components
      // (e.g. DenemePageContent) don't mount and read localStorage before the
      // AuthContext has finished merging remote data into it.
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user.');
        return;
      }
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      if (typeof window !== "undefined") {
        localStorage.removeItem("kpss_2026_data");
        localStorage.removeItem("kpss_2026_denemeler");
        localStorage.removeItem("kpss_2026_target_net");
      }
      // Reload to clear state fully
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };
  // Version counter to force context consumers to re-render after profile updates
  // Firebase User is a mutable class - React can't detect property changes on the same reference.
  // Incrementing this counter forces the Provider to re-render → new context value object → consumers re-render.
  const [, setUserVersion] = useState(0);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUserVersion(v => v + 1);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
