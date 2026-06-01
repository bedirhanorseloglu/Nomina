"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { PlusCircle, ClipboardList, BarChart3, BookOpen, TrendingUp } from "lucide-react";
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

type Tab = "yeni" | "gecmis" | "analiz";

const TABS = [
  { id: "yeni" as Tab, label: "Yeni Giriş", desc: "Sonuçları kaydet", icon: PlusCircle },
  { id: "gecmis" as Tab, label: "Kayıt Defteri", desc: "Geçmiş denemeler", icon: ClipboardList },
  { id: "analiz" as Tab, label: "Performans Analizi", desc: "Gelişim grafikleri", icon: BarChart3 },
];

export default function DenemePageContent() {
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

      const remote = await loadFromFirebase();
      if (remote?.denemeler && remote.denemeler.length > 0) {
        const remoteDenemeler = remote.denemeler as DenemeRecord[];
        setDenemeler(remoteDenemeler);
        saveDenemeler(remoteDenemeler);
      }
      if (remote?.denemeTargetNet !== undefined) {
        setTargetNet(remote.denemeTargetNet);
        saveTargetNet(remote.denemeTargetNet);
      }

      setLoaded(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    saveDenemeDataToFirebase(denemeler, targetNet);
  }, [denemeler, targetNet, loaded]);

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
      <div className="deneme-page min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,168,132,0.1)]" />
      </div>
    );
  }

  return (
    <div className="deneme-page min-h-screen text-slate-800 pb-20">
      <div className="deneme-page-bg" aria-hidden />

      <header className="sticky top-0 z-50 border-b border-slate-200/40 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <DenemeNav />
          {stats && (
            <div className="hidden md:flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/60 border border-slate-200/20 backdrop-blur-sm">
              <HeaderStat label="Ortalama" value={formatNet(stats.avg)} />
              <div className="w-px h-6 bg-slate-200/60 self-center" />
              <HeaderStat label="En İyi" value={formatNet(stats.best)} highlight />
              <div className="w-px h-6 bg-slate-200/60 self-center" />
              <HeaderStat label="Son" value={formatNet(stats.latest)} />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent bg-accent/5 px-3 py-1.5 rounded-full ring-1 ring-accent/20">
                Gelişim ve İstatistik
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight text-slate-900 mt-4">
                Deneme Merkezi
              </h1>
              <p className="text-slate-500 mt-3 max-w-lg text-sm leading-relaxed font-medium">
                Girdiğiniz her denemenin ders bazlı analizi çıkarılır, netleriniz otomatik hesaplanır ve gelişiminiz grafiklerle gösterilir.
              </p>
            </div>
            {/* View Type Toggle */}
            <div className="flex p-1 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-200/40 shadow-sm mt-6 md:mt-0">
              <button
                type="button"
                onClick={() => setViewType("genel")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  viewType === "genel"
                    ? "bg-slate-800 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                }`}
              >
                Genel Denemeler
              </button>
              <button
                type="button"
                onClick={() => setViewType("brans")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  viewType === "brans"
                    ? "bg-slate-800 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                }`}
              >
                Branş Denemeleri
              </button>
            </div>
            {stats && (
              <div className="flex gap-4">
                <HeroStat value={String(stats.count)} label="Toplam Sınav" icon={<BookOpen className="w-4.5 h-4.5" />} />
                <HeroStat value={formatNet(stats.avg)} label="Genel Ortalama" icon={<TrendingUp className="w-4.5 h-4.5" />} accent />
              </div>
            )}
          </motion.div>
        </section>

        <div className="flex gap-1.5 p-1.5 mb-10 rounded-2xl bg-slate-100/60 backdrop-blur-md border border-slate-200/40 shadow-sm max-w-2xl overflow-x-auto custom-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                if (t.id !== "yeni") setEditing(null);
              }}
              className="flex-1 min-w-[120px] py-3.5 px-4 rounded-xl text-left transition-all relative group cursor-pointer focus:outline-none"
            >
              {tab === t.id && (
                <motion.div
                  layoutId="denemeTabBg"
                  className="absolute inset-0 bg-white rounded-xl shadow-md shadow-slate-100 border border-slate-200/25"
                  style={{ zIndex: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2.5">
                <t.icon className={`w-5 h-5 shrink-0 relative z-10 transition-colors duration-200 ${tab === t.id ? "text-accent" : "text-slate-400 group-hover:text-slate-600"}`} />
                <div className="relative z-10">
                  <span className={`block text-xs font-black tracking-tight ${tab === t.id ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"}`}>
                    {t.label}
                  </span>
                  <span className="block text-[9px] font-medium text-slate-400 mt-0.5 hidden sm:block">
                    {t.desc}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

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
                    className="shrink-0 text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2"
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
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={`text-sm font-black font-mono mt-0.5 ${highlight ? "text-accent" : "text-slate-800"}`}
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
          ? "bg-gradient-to-br from-accent to-emerald-500 text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30"
          : "bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className={`text-[10px] font-bold ${accent ? "text-white/85" : "text-slate-500"}`}>
          {label}
        </span>
        {icon && <span className={`shrink-0 ${accent ? "text-white/90" : "text-slate-400"}`}>{icon}</span>}
      </div>
      <p className="text-3xl font-black font-mono tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}
