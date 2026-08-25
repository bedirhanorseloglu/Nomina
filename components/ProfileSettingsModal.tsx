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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, deleteUser, reauthenticateWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { deleteUserAllData, updateUserProfile } from "@/lib/firebaseService";
import { notify } from "@/lib/notify";
import AppleEmoji from "@/components/AppleEmoji";

/* ──────────────────────────────────────────────
   DiceBear Avatar Config
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
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [view, setView] = useState<View>("main");
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showApiKeyHelp, setShowApiKeyHelp] = useState(false);

  // Avatar picker state
  const [selectedStyle, setSelectedStyle] = useState<string>(AVATAR_STYLES[0].id);
  const [seeds, setSeeds] = useState<string[]>([]);

  // Init
  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.displayName || "");
      setSelectedPhotoURL(user.photoURL || null);
      
      const storedKey = localStorage.getItem("gemini_api_key");
      if (storedKey) setGeminiApiKey(storedKey);
      
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
    const keyChanged = geminiApiKey !== (localStorage.getItem("gemini_api_key") || "");
    setHasChanges(nameChanged || photoChanged || keyChanged);
  }, [displayName, selectedPhotoURL, geminiApiKey, user]);

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
      if (geminiApiKey) {
        localStorage.setItem("gemini_api_key", geminiApiKey.trim());
      } else {
        localStorage.removeItem("gemini_api_key");
      }

      await updateProfile(auth.currentUser, {
        displayName: displayName.trim() || null,
        photoURL: selectedPhotoURL,
      });
      await updateUserProfile(auth.currentUser.uid, displayName.trim() || null, auth.currentUser.email);
      await refreshUser();
      setSaveStatus("saved");
      notify.success("Profil başarıyla güncellendi!", { badge: "GÜNCELLENDİ", emoji: "👤" });
      setTimeout(() => {
        setSaveStatus("idle");
        setHasChanges(false);
      }, 2000);
    } catch (error) {
      console.error("Profile update failed:", error);
      notify.error("Profil güncellenirken hata oluştu.");
      setSaveStatus("idle");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || deleteConfirmText !== "SİL") return;
    setIsDeleting(true);
    try {
      const uid = auth.currentUser.uid;
      await deleteUserAllData(uid);
      localStorage.clear();
      try {
        await deleteUser(auth.currentUser);
      } catch (err: any) {
        if (err.code === "auth/requires-recent-login") {
          await reauthenticateWithPopup(auth.currentUser, googleProvider);
          await deleteUser(auth.currentUser);
        } else {
          throw err;
        }
      }
      notify.success("Hesabınız başarıyla silindi.", { badge: "HESAP SİLİNDİ", emoji: "👋" });
      onClose();
    } catch (error) {
      console.error("Hesap silme hatası:", error);
      notify.error("Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
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
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => { if (view === "avatar") setView("main"); else onClose(); }}
          />

          {/* 3D Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.75rem] shadow-2xl border-2 border-b-[8px] border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* 3D Close Button */}
            <button
              type="button"
              onClick={() => { if (view === "avatar") setView("main"); else onClose(); }}
              className="absolute top-5 right-5 z-20 w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-[#1cb0f6] dark:hover:border-[#1cb0f6] hover:text-[#1cb0f6] dark:hover:text-[#38bdf8] hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center justify-center font-black active:translate-y-0.5 transition-all shadow-sm cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {view === "main" ? (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-y-auto flex-1 min-h-0 no-scrollbar"
                >
                  {/* Hero / Avatar Section */}
                  <div className="relative px-8 pt-8 pb-6 flex flex-col items-center">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setView("avatar")}
                      className="relative z-10 group focus:outline-none cursor-pointer"
                    >
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-800 border-2 border-b-[6px] border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center relative">
                        {selectedPhotoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedPhotoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl font-black text-[#1cb0f6]">
                            {initial}
                          </span>
                        )}
                      </div>
                      
                      {/* 3D Edit Pencil Badge */}
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[#1cb0f6] text-white border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] flex items-center justify-center shadow-xs group-hover:scale-110 active:translate-y-0.5 transition-transform">
                        ✏️
                      </div>
                    </motion.button>

                    <button 
                      type="button"
                      onClick={() => setView("avatar")} 
                      className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#1cb0f6]/15 hover:bg-[#1cb0f6]/25 text-[#1cb0f6] border-2 border-b-2 border-[#1cb0f6]/30 font-black text-xs uppercase tracking-wider transition-all active:translate-y-0.5 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>Avatarı Değiştir</span>
                    </button>

                    {selectedPhotoURL && (
                      <button 
                        type="button"
                        onClick={handleRemoveAvatar} 
                        className="mt-1 text-[11px] font-black text-slate-400 hover:text-[#ff4b4b] transition-colors cursor-pointer"
                      >
                        Avatarı Kaldır
                      </button>
                    )}
                  </div>

                  {/* 3D Form Fields */}
                  <div className="px-8 pb-8 space-y-5">
                    {/* Display Name Input */}
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 mb-2 flex items-center gap-2">
                        <AppleEmoji emoji="👤" size={16} />
                        <span>Görünen Ad</span>
                      </label>
                      <div className="bg-slate-50 dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 flex items-center gap-3 focus-within:border-[#1cb0f6] dark:focus-within:border-[#1cb0f6] focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-2xs">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Adınızı girin..."
                          className="w-full bg-transparent outline-none font-black text-slate-800 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 mb-2 flex items-center gap-2">
                        <AppleEmoji emoji="✉️" size={16} />
                        <span>E-posta</span>
                      </label>
                      <div className="bg-slate-100/70 dark:bg-slate-800/60 border-2 border-b-4 border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-500 dark:text-slate-300 text-sm truncate">
                            {user.email}
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-700/80 px-2.5 py-1 rounded-lg border-2 border-b-2 border-slate-300 dark:border-slate-600 shrink-0">
                          SALT OKUNUR
                        </span>
                      </div>
                    </div>

                    {/* 3D Account Info Chips */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3.5 border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-3">
                        <AppleEmoji emoji="📅" size={20} />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Katılım</p>
                          <p className="text-xs font-black text-slate-800 dark:text-white">{creationDate}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3.5 border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-3">
                        <AppleEmoji emoji="⏱️" size={20} />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Son Giriş</p>
                          <p className="text-xs font-black text-slate-800 dark:text-white">{lastSignIn}</p>
                        </div>
                      </div>
                    </div>

                    {/* Google Auth Badge */}
                    <div className="bg-[#1cb0f6]/10 dark:bg-[#1cb0f6]/15 rounded-2xl p-3.5 border-2 border-b-4 border-[#1cb0f6]/40 border-b-[#1cb0f6] flex items-center gap-3 text-[#1cb0f6] dark:text-[#38bdf8] font-black text-xs shadow-2xs">
                      <AppleEmoji emoji="🛡️" size={20} />
                      <span>Google ile güvenli giriş aktif</span>
                    </div>

                    {/* Delete Account Button */}
                    <div className="pt-2 border-t-2 border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmText(""); }}
                        className="w-full py-3 rounded-2xl text-xs font-black text-[#ff4b4b] hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 border-2 border-dashed border-red-200 dark:border-red-500/30 cursor-pointer active:translate-y-0.5"
                      >
                        <AppleEmoji emoji="🗑️" size={16} />
                        <span>Hesabı Kalıcı Olarak Sil</span>
                      </button>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className={`flex-1 py-4 rounded-2xl font-black text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          hasChanges
                            ? "bg-[#58cc02] text-white border-2 border-b-4 border-[#58cc02] border-b-[#46a302] hover:bg-[#46a302] active:translate-y-0.5"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-b-4 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-75"
                        }`}
                      >
                        {saveStatus === "saving" ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> <span>Kaydediliyor...</span></>
                        ) : saveStatus === "saved" ? (
                          <><Check className="w-4 h-4" /> <span>Kaydedildi!</span></>
                        ) : (
                          <><AppleEmoji emoji="🚀" size={16} className="text-white" /> <span>Kaydet</span></>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-[#ff4b4b] border-2 border-b-4 border-[#ff4b4b]/40 border-b-[#ff4b4b] hover:border-[#ff4b4b] hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center shadow-2xs active:translate-y-0.5 transition-all cursor-pointer"
                        title="Çıkış Yap"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Delete Confirm Dialog */}
                    <AnimatePresence>
                      {showDeleteConfirm && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.97 }}
                          transition={{ duration: 0.18 }}
                          className="rounded-3xl border-2 border-b-4 border-[#ff4b4b] bg-red-50 dark:bg-red-500/10 p-5 flex flex-col gap-3 shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#ff4b4b] text-white border-2 border-b-4 border-[#ff4b4b] border-b-[#e03030] flex items-center justify-center shrink-0 shadow-xs">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[#ff4b4b]">Bu işlem geri alınamaz!</p>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                Tüm verileriniz, denemeleriniz ve ilerlemeniz kalıcı olarak silinecek.
                              </p>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-black uppercase tracking-widest text-[#ff4b4b] mb-1.5 block">
                              Onaylamak için <span className="underline">SİL</span> yazın
                            </label>
                            <input
                              type="text"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                              placeholder="SİL"
                              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-b-4 border-red-200 dark:border-red-500/30 font-black text-[#ff4b4b] text-sm outline-none focus:border-[#ff4b4b]"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                              className="flex-1 py-3 rounded-2xl text-xs font-black bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-b-4 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs active:translate-y-0.5 cursor-pointer"
                            >
                              İptal
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteAccount}
                              disabled={deleteConfirmText !== "SİL" || isDeleting}
                              className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                deleteConfirmText === "SİL" && !isDeleting
                                  ? "bg-[#ff4b4b] text-white border-2 border-b-4 border-[#ff4b4b] border-b-[#e03030] shadow-xs active:translate-y-0.5"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 border-2 border-b-4 border-slate-300 dark:border-slate-600 cursor-not-allowed"
                              }`}
                            >
                              {isDeleting ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Siliniyor...</>
                              ) : (
                                <><Trash2 className="w-3.5 h-3.5" /> Hesabı Sil</>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* API Key Help Modal */}
                    <AnimatePresence>
                      {showApiKeyHelp && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 z-50 bg-white dark:bg-slate-800 rounded-[2.5rem] flex flex-col h-full overflow-hidden p-6"
                        >
                          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                              <AppleEmoji emoji="💡" size={24} />
                              API Anahtarı Nasıl Alınır?
                            </h3>
                            <button
                              type="button"
                              onClick={() => setShowApiKeyHelp(false)}
                              className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:border-[#1cb0f6] dark:hover:border-[#1cb0f6] hover:text-[#1cb0f6] dark:hover:text-[#38bdf8] hover:bg-slate-50 dark:hover:bg-slate-700/80 font-black active:translate-y-0.5 transition-all shadow-sm cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto py-6 space-y-6 no-scrollbar">
                            <div className="space-y-4">
                              <div className="flex gap-4">
                                <div className="w-8 h-8 shrink-0 rounded-2xl bg-[#e8f7ff] text-[#1cb0f6] font-black border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] flex items-center justify-center text-sm shadow-2xs">1</div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-800 dark:text-white">Google AI Studio'ya gidin</h4>
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Tamamen ücretsiz olan <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[#1cb0f6] font-bold hover:underline">Google AI Studio</a> sayfasına gidin ve bir Google hesabı ile giriş yapın.
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex gap-4">
                                <div className="w-8 h-8 shrink-0 rounded-2xl bg-[#e8f7ff] text-[#1cb0f6] font-black border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] flex items-center justify-center text-sm shadow-2xs">2</div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-800 dark:text-white">Yeni bir anahtar oluşturun</h4>
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Açılan sayfada <strong>"Create API key"</strong> butonuna tıklayın. 
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-4">
                                <div className="w-8 h-8 shrink-0 rounded-2xl bg-[#e8f7ff] text-[#1cb0f6] font-black border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] flex items-center justify-center text-sm shadow-2xs">3</div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-800 dark:text-white">Kodu kopyalayın</h4>
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Ekranda görünen uzun kodu kopyalayıp buradaki kutucuğa yapıştırın.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t-2 border-slate-100 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => setShowApiKeyHelp(false)}
                              className="w-full py-3.5 rounded-2xl bg-[#1cb0f6] text-white border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] font-black text-sm shadow-xs hover:bg-[#159ee0] active:translate-y-0.5 transition-all cursor-pointer"
                            >
                              Anladım, Kapat
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

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
                  className="overflow-y-auto flex-1 min-h-0 no-scrollbar p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white">Avatar Seç</h3>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">Birini seç veya yenilerini oluştur</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshAvatars}
                      className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:border-[#1cb0f6] dark:hover:border-[#1cb0f6] hover:text-[#1cb0f6] dark:hover:text-[#38bdf8] hover:bg-slate-50 dark:hover:bg-slate-700/80 font-black active:translate-y-0.5 transition-all shadow-sm cursor-pointer"
                      title="Yeni avatarlar oluştur"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 3D Style Selector */}
                  <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                    {AVATAR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyle(style.id)}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                          selectedStyle === style.id
                            ? "bg-[#1cb0f6] text-white border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] shadow-xs"
                            : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 border-2 border-transparent hover:text-slate-800"
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>

                  {/* 3D Avatar Grid */}
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
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleSelectAvatar(url)}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] shadow-md"
                              : "border-slate-200 dark:border-slate-700 hover:border-[#1cb0f6]"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Avatar ${i + 1}`}
                            className="w-full h-full object-cover bg-slate-50 dark:bg-slate-900"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#1cb0f6] text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
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
