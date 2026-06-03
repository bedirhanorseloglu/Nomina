"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { PlusCircle, ClipboardList, BarChart3, BookOpen, TrendingUp, Zap } from "lucide-react";
import DenemeNav from "./DenemeNav";
import DenemeEntryForm from "./DenemeEntryForm";
import DenemeHistoryList from "./DenemeHistoryList";
import DenemeAnalytics from "./DenemeAnalytics";
import DenemeAlert from "./DenemeAlert";
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
import { averageNet, evaluateDeneme, formatNet } from "@/lib/denemeUtils";
import { useAuth } from "@/contexts/AuthContext";
import { updateLeaderboard } from "@/lib/leaderboardService";

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
      const localDenemeler = loadDenemeler();
      const localTarget = loadTargetNet();
      setDenemeler(localDenemeler);
      setTargetNet(localTarget);

      if (user?.uid) {
        const remote = await loadFromFirebase(user.uid);
        if (remote?.denemeler && remote.denemeler.length > 0) {
          const remoteDenemeler = remote.denemeler as DenemeRecord[];
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
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            {/* Title Block */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                  Gelişim ve İstatistik
                </span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                  Deneme Merkezi
                </h1>
                {stats && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                      {stats.count} sınav
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {formatNet(stats.avg)} ort.
                    </span>
                  </div>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-lg text-sm leading-relaxed font-medium">
                Girdiğiniz her denemenin ders bazlı analizi çıkarılır, netleriniz otomatik hesaplanır ve gelişiminiz grafiklerle gösterilir.
              </p>
            </div>

            {/* View Toggle */}
            <div className="shrink-0">
              <div className="relative flex bg-gray-100 dark:bg-[#1e293b] rounded-full p-1 border border-gray-200/50 dark:border-white/5">
                <motion.div
                  className="absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-full bg-gray-900 dark:bg-blue-500 shadow-md"
                  animate={{ x: viewType === "genel" ? 0 : "calc(100% + 4px)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
                <button
                  type="button"
                  onClick={() => setViewType("genel")}
                  className={`relative z-10 w-28 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer text-center ${
                    viewType === "genel" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Genel
                </button>
                <button
                  type="button"
                  onClick={() => setViewType("brans")}
                  className={`relative z-10 w-28 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer text-center ${
                    viewType === "brans" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Branş
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <div className="flex gap-1 p-1 bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm max-w-md">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  if (t.id !== "yeni") setEditing(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all relative flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
              >
                {tab === t.id && (
                  <motion.div
                    layoutId="denemeTabBg"
                    className="absolute inset-0 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/25"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <t.icon className={`w-4 h-4 relative z-10 transition-colors ${tab === t.id ? "text-white" : "text-gray-400"}`} />
                <span className={`relative z-10 transition-colors ${tab === t.id ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
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
          )}

          {tab === "analiz" && (
            <motion.div
              key="analiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
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
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ────────────────────────────
   Sub-components
   ──────────────────────────── */

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
