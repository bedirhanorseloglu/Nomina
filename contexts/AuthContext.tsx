"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { updateUserProfile } from "@/lib/firebaseService";

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
          await updateUserProfile(currentUser.uid, currentUser.displayName, currentUser.email);
        } catch (error) {
          console.error("Profile update failed:", error);
        }
      }
      
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
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

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
