"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { PlusCircle, ClipboardList, BarChart3, BookOpen, TrendingUp, Zap, GraduationCap, Globe } from "lucide-react";
import DenemeNav from "./DenemeNav";
import DenemeEntryForm from "./DenemeEntryForm";
import DenemeHistoryList from "./DenemeHistoryList";
import dynamic from "next/dynamic";

const DenemeAnalytics = dynamic(() => import("./DenemeAnalytics"), { ssr: false });
import DenemeAlert from "./DenemeAlert";
import AppleEmoji from "../AppleEmoji";
import {
  addDeneme,
  deleteDeneme,
  loadDenemeler,
  loadTargetNet,
  saveDenemeler,
  saveTargetNet,
  updateDeneme,
} from "@/lib/denemeStorage";
import { DenemeRecord } from "@/lib/denemeUtils";
import { loadFromFirebase, saveDenemeDataToFirebase } from "@/lib/firebaseService";
import { averageNet, evaluateDeneme, formatNet, migrateDenemeler } from "@/lib/denemeUtils";
import { useAuth } from "@/contexts/AuthContext";
import { updateLeaderboard, updateBranchLeaderboard, removeFromLeaderboard, removeFromBranchLeaderboard } from "@/lib/leaderboardService";
import { DENEME_SUBJECTS } from "@/lib/denemeConfig";

type Tab = "yeni" | "gecmis" | "analiz";

const TABS = [
  { id: "yeni" as Tab, label: "Yeni Giriş", icon: PlusCircle },
  { id: "gecmis" as Tab, label: "Kayıt Defteri", icon: ClipboardList },
  { id: "analiz" as Tab, label: "Analiz", icon: BarChart3 },
];

export default function DenemePageContent() {
  const { user } = useAuth();
  const [denemeler, setDenemeler] = useState<DenemeRecord[]>([]);
  const [targetNet, setTargetNet] = useState(108);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("yeni");
  const [viewType, setViewType] = useState<"genel" | "brans">("genel");
  const [editing, setEditing] = useState<DenemeRecord | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const init = async () => {
      const localDenemeler = migrateDenemeler(loadDenemeler());
      const localTarget = loadTargetNet();
      setDenemeler(localDenemeler);
      saveDenemeler(localDenemeler);
      setTargetNet(localTarget);

      if (user?.uid) {
        const remote = await loadFromFirebase(user.uid);
        if (remote?.denemeler !== undefined) {
          const remoteDenemeler = migrateDenemeler(remote.denemeler as DenemeRecord[]);
          setDenemeler(remoteDenemeler);
          saveDenemeler(remoteDenemeler);
        }
        if (remote?.denemeTargetNet !== undefined) {
          setTargetNet(remote.denemeTargetNet);
          saveTargetNet(remote.denemeTargetNet);
        }
      }

      setLoaded(true);
    };
    init();
  }, [user]);

  useEffect(() => {
    if (!loaded) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (user?.uid) {
      saveDenemeDataToFirebase(user.uid, denemeler, targetNet);
      
      const genelDenemeler = denemeler.filter((d) => d.examType !== "brans");
      if (genelDenemeler.length > 0) {
        const nets = genelDenemeler.map((d) => evaluateDeneme(d.scores).totalNet);
        const avg = averageNet(genelDenemeler);
        const max = Math.max(...nets);
        updateLeaderboard(user.uid, user.displayName, user.photoURL, avg, max, genelDenemeler.length);
      } else {
        removeFromLeaderboard(user.uid);
      }

      // Update branch leaderboards
      const bransDenemeler = denemeler.filter((d) => d.examType === "brans" && d.bransSubjectId);
      const bransGroups = bransDenemeler.reduce((acc: any, d: any) => {
        if (!acc[d.bransSubjectId]) acc[d.bransSubjectId] = [];
        acc[d.bransSubjectId].push(d);
        return acc;
      }, {});

      for (const subject of DENEME_SUBJECTS) {
        const subjectId = subject.id;
        const subjectDenemeler = bransGroups[subjectId];
        
        if (subjectDenemeler && subjectDenemeler.length > 0) {
          const nets = subjectDenemeler.map((d: any) => {
            const score = d.scores.find((s: any) => s.subjectId === subjectId);
            return score ? score.correct - (score.wrong / 4) : 0;
          });
          const avg = nets.reduce((a: number, b: number) => a + b, 0) / nets.length;
          const max = Math.max(...nets);
          updateBranchLeaderboard(user.uid, user.displayName, user.photoURL, subjectId, avg, max, subjectDenemeler.length);
        } else {
          removeFromBranchLeaderboard(user.uid, subjectId);
        }
      }
    }
  }, [denemeler, targetNet, loaded, user]);

  const handleTargetNetChange = (value: number) => {
    setTargetNet(value);
    saveTargetNet(value);
  };

  const filteredDenemeler = useMemo(() => {
    return denemeler.filter(d => viewType === "genel" ? d.examType !== "brans" : d.examType === "brans");
  }, [denemeler, viewType]);

  const stats = useMemo(() => {
    if (filteredDenemeler.length === 0) return null;
    const nets = filteredDenemeler.map((d) => evaluateDeneme(d.scores).totalNet);
    return {
      count: filteredDenemeler.length,
      avg: averageNet(filteredDenemeler),
      best: Math.max(...nets),
      latest: evaluateDeneme(filteredDenemeler[0].scores).totalNet,
    };
  }, [filteredDenemeler]);

  const handleSave = (payload: {
    name: string;
    date: string;
    publisher?: string;
    note?: string;
    scores: DenemeRecord["scores"];
  }) => {
    if (editing) {
      setDenemeler(updateDeneme({ ...editing, ...payload }));
      setEditing(null);
      setTab("gecmis");
      toast.success("Deneme sınavı başarıyla güncellendi");
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.7 }
      });
      return;
    }
    setDenemeler(
      addDeneme({ id: crypto.randomUUID(), ...payload })
    );
    setTab("gecmis");
    toast.success("Yeni deneme sınav sonucu kaydedildi! 🎉");
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0f1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1a] text-gray-900 dark:text-white pb-20">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-500/[0.04] via-purple-500/[0.02] to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-500/[0.03] to-transparent rounded-full blur-3xl" />
      </div>

      <DenemeNav>
        {stats && (
          <div className="flex items-center gap-1 p-1.5 rounded-full bg-white/40 dark:bg-[#1e293b]/40 border border-gray-200/50 dark:border-white/10 backdrop-blur-sm shadow-sm">
            <HeaderStat label="Ortalama" value={formatNet(stats.avg)} />
            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 self-center" />
            <HeaderStat label="En İyi" value={formatNet(stats.best)} highlight />
            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 self-center" />
            <HeaderStat label="Son" value={formatNet(stats.latest)} />
          </div>
        )}
      </DenemeNav>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-12">
        {/* Unified EdTech Header & Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-[2rem] shadow-sm overflow-hidden shrink-0 bg-white ring-4 ring-white dark:ring-[#1e293b]">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black">
                  {user?.displayName?.charAt(0)?.toUpperCase() || "K"}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">
                Hoş Geldin, {user?.displayName?.split(" ")[0] || "Şampiyon"}
              </p>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                {tab === "yeni" ? "Sınav Girişi" : tab === "gecmis" ? "Kayıt Defteri" : "Gelişim Analizi"}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (
                  <button
                    type="button"
                    onClick={() => {
                      const mocks: DenemeRecord[] = [];
                      for (let i = 1; i <= 3; i++) {
                        mocks.push({
                          id: `mock-${i}`,
                          name: `Mock Genel Deneme ${i}`,
                          date: new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
                          examType: "genel",
                          scores: DENEME_SUBJECTS.map(s => ({
                            subjectId: s.id,
                            correct: Math.floor(s.questionCount * (0.6 + Math.random() * 0.3)),
                            wrong: Math.floor(s.questionCount * (0.1 + Math.random() * 0.2)),
                            empty: 0,
                          })).map(s => ({ ...s, empty: DENEME_SUBJECTS.find(x => x.id === s.subjectId)!.questionCount - s.correct - s.wrong }))
                        });
                      }
                      DENEME_SUBJECTS.forEach((sub) => {
                        for (let i = 1; i <= 3; i++) {
                          const correct = Math.floor(sub.questionCount * (0.5 + Math.random() * 0.4));
                          const wrong = Math.floor(sub.questionCount * (0.1 + Math.random() * 0.2));
                          mocks.push({
                            id: crypto.randomUUID(),
                            name: `Mock ${sub.title} Branş ${i}`,
                            date: new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
                            examType: "brans",
                            bransSubjectId: sub.id,
                            scores: [{
                              subjectId: sub.id,
                              correct,
                              wrong,
                              empty: sub.questionCount - correct - wrong
                            }]
                          });
                        }
                      });
                      const newData = [...denemeler, ...mocks];
                      setDenemeler(newData);
                      saveDenemeler(newData);
                      toast.success("Test verileri başarıyla eklendi! (Firebase etkilenmedi)");
                    }}
                    className="px-3 py-1 bg-rose-100 text-rose-600 font-black rounded-xl text-[10px] uppercase tracking-wider border border-rose-200 hover:bg-rose-200 transition-colors"
                  >
                    🧪 Test Verisi Yükle
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 p-1.5 bg-slate-200/60 dark:bg-slate-800/60 rounded-[1.5rem] w-full md:w-auto mt-6 md:mt-0 shadow-inner">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  if (t.id !== "yeni") setEditing(null);
                }}
                className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[12px] font-bold transition-all relative flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
              >
                {tab === t.id && (
                  <motion.div
                    layoutId="denemeTabBg"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <t.icon className={`w-4 h-4 relative z-10 transition-colors ${tab === t.id ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                <span className={`relative z-10 transition-colors ${tab === t.id ? "text-slate-800 dark:text-white font-black" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold"}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === "yeni" && (
            <motion.div
              key="yeni"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
              {editing && (
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <DenemeAlert variant="warning" title="Düzenleme modu" className="flex-1">
                    <strong>{editing.name}</strong> denemesinin sonuçlarını güncelliyorsunuz.
                  </DenemeAlert>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline underline-offset-2"
                  >
                    Yeni kayıt ekle
                  </button>
                </div>
              )}
              <DenemeEntryForm
                key={editing?.id ?? "new"}
                targetNet={targetNet}
                initial={
                  editing
                    ? {
                        name: editing.name,
                        date: editing.date,
                        publisher: editing.publisher,
                        note: editing.note,
                        scores: editing.scores,
                      }
                    : undefined
                }
                onSubmit={handleSave}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
            </motion.div>
          )}

          {tab === "gecmis" && (
            <motion.div
              key="gecmis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
              {/* ViewType Switcher for Kayıt Defteri */}
              <ViewTypeSwitcher viewType={viewType} onChange={setViewType} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewType}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <DenemeHistoryList
                    denemeler={filteredDenemeler}
                    onDelete={(id) => {
                      setDenemeler(deleteDeneme(id));
                      toast.success("Deneme kaydı silindi");
                    }}
                    onEdit={(d) => {
                      setEditing(d);
                      setTab("yeni");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onAdd={() => setTab("yeni")}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {tab === "analiz" && (
            <motion.div
              key="analiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
              {/* ViewType Switcher for Analiz */}
              <ViewTypeSwitcher viewType={viewType} onChange={setViewType} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewType}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <DenemeAnalytics
                    denemeler={filteredDenemeler}
                    allDenemeler={denemeler}
                    viewType={viewType}
                    targetNet={targetNet}
                    onTargetNetChange={handleTargetNetChange}
                    onAdd={() => setTab("yeni")}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ────────────────────────────
   Sub-components
   ──────────────────────────── */

function ViewTypeSwitcher({
  viewType,
  onChange,
}: {
  viewType: "genel" | "brans";
  onChange: (v: "genel" | "brans") => void;
}) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="inline-flex bg-slate-200/60 dark:bg-slate-800/60 p-1.5 rounded-2xl w-full sm:w-auto">
        <button
          onClick={() => onChange("genel")}
          className={`flex-1 sm:flex-none relative px-6 py-2.5 text-sm font-bold transition-all rounded-xl z-10 flex items-center justify-center gap-2 ${
            viewType === "genel" ? "text-blue-700 dark:text-blue-300" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          {viewType === "genel" && (
            <motion.div
              layoutId="edtechActiveTab"
              className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-xl"
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          )}
          <AppleEmoji emoji="🌍" className="relative z-10 mr-1" />
          <span className="relative z-10">Genel Deneme</span>
        </button>
        <button
          onClick={() => onChange("brans")}
          className={`flex-1 sm:flex-none relative px-6 py-2.5 text-sm font-bold transition-all rounded-xl z-10 flex items-center justify-center gap-2 ${
            viewType === "brans" ? "text-violet-700 dark:text-violet-300" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          {viewType === "brans" && (
            <motion.div
              layoutId="edtechActiveTab"
              className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-xl"
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          )}
          <AppleEmoji emoji="🎯" className="relative z-10 mr-1" />
          <span className="relative z-10">Branş Denemesi</span>
        </button>
      </div>
      <div className="hidden sm:flex items-center gap-2.5 px-5 py-3 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 text-xs font-bold text-slate-400">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        {viewType === "genel" ? "KPSS GY-GK Sınavları" : "Ders Bazlı Sınavlar"}
      </div>
    </div>
  );
}

function HeaderStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-4 py-1.5 text-center min-w-[70px]">
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p
        className={`text-sm font-black font-mono mt-0.5 ${highlight ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

function HeroStat({
  value,
  label,
  icon,
  accent,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-5 py-4 min-w-[120px] relative overflow-hidden transition-all duration-300 ${
        accent
          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
          : "bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${accent ? "text-white/85" : "text-gray-500 dark:text-gray-400"}`}>
          {label}
        </span>
        {icon && <span className={`shrink-0 ${accent ? "text-white/90" : "text-gray-400"}`}>{icon}</span>}
      </div>
      <p className="text-3xl font-black font-mono tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}
