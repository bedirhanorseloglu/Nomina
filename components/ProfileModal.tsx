"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [seed, setSeed] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      // If user has a photoURL from dicebear, extract seed, else use their uid or random
      if (user.photoURL && user.photoURL.includes("api.dicebear.com")) {
        try {
          const url = new URL(user.photoURL);
          setSeed(url.searchParams.get("seed") || user.uid || Math.random().toString(36).substring(7));
        } catch {
          setSeed(user.uid || Math.random().toString(36).substring(7));
        }
      } else {
        setSeed(user.uid || Math.random().toString(36).substring(7));
      }
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const generateRandomSeed = () => {
    setSeed(Math.random().toString(36).substring(7));
  };

  const svgDataUri = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Lütfen bir kullanıcı adı girin.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: svgDataUri,
      });
      toast.success("Profilin başarıyla güncellendi!");
      onClose();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Profil güncellenirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-xl font-black text-slate-800">Profilini Düzenle</h2>
              <p className="text-xs font-medium text-slate-500">Liderlik tablosunda nasıl görüneceğini seç.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-lg bg-slate-50">
                <img src={svgDataUri} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={generateRandomSeed}
                className="absolute bottom-0 right-0 p-3 bg-accent text-white rounded-full shadow-lg hover:bg-accent/90 transition-transform hover:scale-105 active:scale-95"
                title="Yeni Avatar Üret"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Kullanıcı Adı</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={20}
                placeholder="Örn: KPSS Şampiyonu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3.5 rounded-xl bg-accent text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent/90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
