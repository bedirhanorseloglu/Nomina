"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Shield,
  LogOut,
  Check,
  Loader2,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

/* ──────────────────────────────────────────────
   DiceBear Avatar Config
   Free API, no storage needed — just a URL.
   ────────────────────────────────────────────── */
const AVATAR_STYLES = [
  { id: "adventurer", label: "Maceraperest" },
  { id: "avataaars", label: "Karikatür" },
  { id: "bottts", label: "Robot" },
  { id: "fun-emoji", label: "Emoji" },
  { id: "lorelei", label: "Lorelei" },
  { id: "notionists", label: "Notionist" },
  { id: "personas", label: "Persona" },
  { id: "pixel-art", label: "Piksel" },
] as const;

function generateAvatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&radius=20&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function generateSeeds(base: string, count: number): string[] {
  const seeds: string[] = [];
  for (let i = 0; i < count; i++) {
    seeds.push(`${base}-${i}-${Date.now()}`);
  }
  return seeds;
}

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type View = "main" | "avatar";

export default function ProfileSettingsModal({
  isOpen,
  onClose,
}: ProfileSettingsModalProps) {
  const { user, signOut, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [selectedPhotoURL, setSelectedPhotoURL] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [view, setView] = useState<View>("main");
  const [hasChanges, setHasChanges] = useState(false);

  // Avatar picker state
  const [selectedStyle, setSelectedStyle] = useState<string>(AVATAR_STYLES[0].id);
  const [seeds, setSeeds] = useState<string[]>([]);

  // Init
  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.displayName || "");
      setSelectedPhotoURL(user.photoURL || null);
      setHasChanges(false);
      setSaveStatus("idle");
      setView("main");
      setSeeds(generateSeeds(user.email || "user", 12));
    }
  }, [user, isOpen]);

  // Track changes
  useEffect(() => {
    if (!user) return;
    const nameChanged = displayName !== (user.displayName || "");
    const photoChanged = selectedPhotoURL !== (user.photoURL || null);
    setHasChanges(nameChanged || photoChanged);
  }, [displayName, selectedPhotoURL, user]);

  const handleRefreshAvatars = () => {
    setSeeds(generateSeeds(Math.random().toString(36), 12));
  };

  const handleSelectAvatar = (url: string) => {
    setSelectedPhotoURL(url);
    setView("main");
  };

  const handleRemoveAvatar = () => {
    setSelectedPhotoURL(null);
  };

  const handleSave = async () => {
    if (!auth.currentUser || !hasChanges) return;
    setSaveStatus("saving");
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim() || null,
        photoURL: selectedPhotoURL,
      });
      await refreshUser();
      setSaveStatus("saved");
      toast.success("Profil başarıyla güncellendi!");
      setTimeout(() => {
        setSaveStatus("idle");
        setHasChanges(false);
      }, 2000);
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Profil güncellenirken hata oluştu.");
      setSaveStatus("idle");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view === "avatar") setView("main");
        else onClose();
      }
    },
    [onClose, view]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!user) return null;

  const initial = user.email?.charAt(0).toUpperCase() || "U";

  const creationDate = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const lastSignIn = user.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => { if (view === "avatar") setView("main"); else onClose(); }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-[2rem] shadow-2xl border border-gray-200/60 dark:border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Close */}
            <button
              onClick={() => { if (view === "avatar") setView("main"); else onClose(); }}
              className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <AnimatePresence mode="wait">
              {view === "main" ? (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-y-auto"
                >
                  {/* Hero */}
                  <div className="relative px-8 pt-8 pb-6 flex flex-col items-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Avatar */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setView("avatar")}
                      className="relative z-10 group focus:outline-none"
                    >
                      <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-purple-900/40 border-2 border-white dark:border-gray-800 shadow-xl flex items-center justify-center ring-4 ring-transparent group-hover:ring-blue-500/20 transition-all">
                        {selectedPhotoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedPhotoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600">
                            {initial}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                        ✏️
                      </div>
                    </motion.button>

                    <p className="mt-3 text-xs text-blue-500 font-medium cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setView("avatar")}>
                      Avatarı Değiştir
                    </p>

                    {selectedPhotoURL && (
                      <button onClick={handleRemoveAvatar} className="mt-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors">
                        Avatarı Kaldır
                      </button>
                    )}
                  </div>

                  {/* Form */}
                  <div className="px-8 pb-8 space-y-5">
                    {/* Display Name */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">
                        Görünen Ad
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Adınızı girin..."
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">
                        E-posta
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <div className="w-full pl-10 pr-20 py-3 rounded-xl bg-gray-100/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/5 text-gray-500 dark:text-gray-400 text-sm font-medium">
                          {user.email}
                        </div>
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400 bg-gray-200/60 dark:bg-white/10 px-1.5 py-0.5 rounded">
                          SALT OKUNUR
                        </span>
                      </div>
                    </div>

                    {/* Account Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                        <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Katılım</p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{creationDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                        <Clock className="w-4 h-4 text-green-500 shrink-0" />
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Son Giriş</p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{lastSignIn}</p>
                        </div>
                      </div>
                    </div>

                    {/* Provider */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                      <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Google ile güvenli giriş aktif</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1">
                      <motion.button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        whileHover={hasChanges ? { scale: 1.01 } : {}}
                        whileTap={hasChanges ? { scale: 0.98 } : {}}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                          hasChanges
                            ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                            : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        {saveStatus === "saving" ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
                        ) : saveStatus === "saved" ? (
                          <><Check className="w-4 h-4" /> Kaydedildi!</>
                        ) : (
                          <><Sparkles className="w-4 h-4" /> Kaydet</>
                        )}
                      </motion.button>
                      <button
                        onClick={handleLogout}
                        className="py-3 px-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 text-sm font-bold transition-all flex items-center gap-2 border border-red-100 dark:border-red-500/15"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ──── Avatar Picker View ──── */
                <motion.div
                  key="avatar"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-y-auto"
                >
                  <div className="px-8 pt-8 pb-2">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Avatar Seç</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Birini seç veya yenilerini oluştur</p>
                      </div>
                      <motion.button
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.3 }}
                        onClick={handleRefreshAvatars}
                        className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 transition-colors"
                        title="Yeni avatarlar oluştur"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </motion.button>
                    </div>

                    {/* Style Selector */}
                    <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none -mx-2 px-2">
                      {AVATAR_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                            selectedStyle === style.id
                              ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                              : "bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Avatar Grid */}
                  <div className="px-8 pb-8">
                    <div className="grid grid-cols-4 gap-3">
                      {seeds.map((seed, i) => {
                        const url = generateAvatarUrl(selectedStyle, seed);
                        const isSelected = selectedPhotoURL === url;
                        return (
                          <motion.button
                            key={`${selectedStyle}-${seed}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleSelectAvatar(url)}
                            className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                              isSelected
                                ? "border-blue-500 ring-4 ring-blue-500/20 shadow-lg"
                                : "border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Avatar ${i + 1}`}
                              className="w-full h-full object-cover bg-gray-50 dark:bg-white/5"
                              loading="lazy"
                            />
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow"
                              >
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
