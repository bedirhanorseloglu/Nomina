"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "@/lib/notify";
import { PlusCircle, ClipboardList, BarChart3, BookOpen, TrendingUp, Zap, GraduationCap, Globe } from "lucide-react";
import DenemeEntryForm from "./DenemeEntryForm";
import DenemeHistoryList from "./DenemeHistoryList";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const DenemeAnalytics = dynamic(() => import("./DenemeAnalytics"), { ssr: false });
import DenemeAlert from "./DenemeAlert";
import DenemeLoading from "./DenemeLoading";
import AppleEmoji from "../AppleEmoji";
import { DenemeRecord } from "@/lib/denemeUtils";
import { loadDenemeYeniden, saveDenemeYeniden } from "@/lib/firebaseService";
import { averageNet, evaluateDeneme, formatNet, migrateDenemeler, createEmptyScores } from "@/lib/denemeUtils";
import { useAuth } from "@/contexts/AuthContext";
import { getStudyDate } from "@/lib/dateUtils";
import { format } from "date-fns";
import { updateLeaderboard, updateBranchLeaderboard, removeFromLeaderboard, removeFromBranchLeaderboard } from "@/lib/leaderboardService";
import { DENEME_SUBJECTS } from "@/lib/denemeConfig";
import { getSubjectTopics } from "@/lib/topicUtils";

type Tab = "yeni" | "gecmis" | "analiz";

const TABS = [
  { id: "yeni" as Tab, label: "Yeni Giriş", icon: PlusCircle },
  { id: "gecmis" as Tab, label: "Kayıt Defteri", icon: ClipboardList },
  { id: "analiz" as Tab, label: "Analiz", icon: BarChart3 },
];

const DEFAULT_TARGET_NET = 90;

export default function DenemePageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode");
  const initialSubject = searchParams.get("subject");
  const initialDurationParam = searchParams.get("duration");
  const initialDuration = initialDurationParam ? parseInt(initialDurationParam, 10) : undefined;

  const [denemeler, setDenemeler] = useState<DenemeRecord[]>([]);
  const [targetNet, setTargetNet] = useState(DEFAULT_TARGET_NET);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("yeni");
  const [viewType, setViewType] = useState<"genel" | "brans">((initialMode as "genel" | "brans") || "genel");
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>(initialSubject || "turkce");
  const [editing, setEditing] = useState<DenemeRecord | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // ─── SAVE: Explicit persistence function ─────────────────────
  const persistData = useCallback(async (newDenemeler: DenemeRecord[], newTargetNet: number) => {
    if (!user?.uid) return;

    // Filter out temporary mock test data so it NEVER gets saved to Firebase or Leaderboards
    const realDenemeler = newDenemeler.filter(d => !((d as any).isMock || d.id?.startsWith("mock-") || d.name?.startsWith("Mock ")));

    // 1. Firebase'e doğrudan kaydet (YENİ İZOLE YAPI)
    await saveDenemeYeniden(user.uid, realDenemeler, newTargetNet);

    // 2. Liderlik tablolarını güncelle
    const genelDenemeler = realDenemeler.filter((d) => d.examType !== "brans");
    if (genelDenemeler.length > 0) {
      const nets = genelDenemeler.map((d) => evaluateDeneme(d.scores).totalNet);
      const avg = averageNet(genelDenemeler);
      const max = Math.max(...nets);
      await updateLeaderboard(user.uid, user.displayName, user.photoURL, avg, max, genelDenemeler.length);
    } else {
      await removeFromLeaderboard(user.uid);
    }

    const bransDenemeler = realDenemeler.filter((d) => d.examType === "brans" && d.bransSubjectId);
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
        await updateBranchLeaderboard(user.uid, user.displayName, user.photoURL, subjectId, avg, max, subjectDenemeler.length);
      } else {
        await removeFromBranchLeaderboard(user.uid, subjectId);
      }
    }
  }, [user]);

  // ─── LOAD: Firebase is the single source of truth ───────────────────────
  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) {
        setDenemeler([]);
        setTargetNet(DEFAULT_TARGET_NET);
        setLoaded(true);
        return;
      }

      try {
        const data = await loadDenemeYeniden(user.uid);
        if (data) {
          if (data.denemeler && (data.denemeler as any[]).length > 0) {
            const migrated = migrateDenemeler(data.denemeler as DenemeRecord[]);
            
            // --- BUSE YILMAZ RECOVERY SCRIPT ---
            let finalDenemeler = [...migrated];
            if (user?.email === "yylmazbusee@gmail.com") {
              const hasRecovered = finalDenemeler.some(d => d.id === "buse-rec-1");
              if (!hasRecovered) {
                const recoveredRecords: DenemeRecord[] = [
                  { id: "buse-rec-1", name: "Matematik Denemesi 1", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 24, wrong: 3, empty: 3 }] },
                  { id: "buse-rec-2", name: "Matematik Denemesi 2", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 24, wrong: 3, empty: 3 }] },
                  { id: "buse-rec-3", name: "Matematik Denemesi 3", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 26, wrong: 3, empty: 1 }] },
                  { id: "buse-rec-4", name: "Matematik Denemesi 4", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 22, wrong: 0, empty: 8 }] },
                  { id: "buse-rec-5", name: "Matematik Denemesi 5", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 23, wrong: 4, empty: 3 }] },
                  { id: "buse-rec-6", name: "Matematik Denemesi 6", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 24, wrong: 2, empty: 4 }] },
                ];
                finalDenemeler = [...finalDenemeler, ...recoveredRecords];
                notify.success("Eksik matematik denemeleri otomatik olarak kurtarıldı.", { badge: "KURTARILDI" });
                persistData(finalDenemeler, data.denemeTargetNet !== undefined ? data.denemeTargetNet : DEFAULT_TARGET_NET);
              }
            }
            // -----------------------------------
            
            setDenemeler(finalDenemeler);
          } else {
            // If completely empty, check if it's Buse
            if (user?.email === "yylmazbusee@gmail.com") {
                const recoveredRecords: DenemeRecord[] = [
                  { id: "buse-rec-1", name: "Matematik Denemesi 1", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 24, wrong: 3, empty: 3 }] },
                  { id: "buse-rec-2", name: "Matematik Denemesi 2", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 24, wrong: 3, empty: 3 }] },
                  { id: "buse-rec-3", name: "Matematik Denemesi 3", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 26, wrong: 3, empty: 1 }] },
                  { id: "buse-rec-4", name: "Matematik Denemesi 4", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 22, wrong: 0, empty: 8 }] },
                  { id: "buse-rec-5", name: "Matematik Denemesi 5", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 23, wrong: 4, empty: 3 }] },
                  { id: "buse-rec-6", name: "Matematik Denemesi 6", publisher: "yargı", date: "2026-06-11", examType: "brans", bransSubjectId: "matematik", scores: [{ subjectId: "matematik", correct: 24, wrong: 2, empty: 4 }] },
                ];
                setDenemeler(recoveredRecords);
                notify.success("Eksik matematik denemeleri otomatik olarak kurtarıldı.", { badge: "KURTARILDI" });
                persistData(recoveredRecords, data.denemeTargetNet !== undefined ? data.denemeTargetNet : DEFAULT_TARGET_NET);
            } else {
                setDenemeler([]);
            }
          }
          if (data.denemeTargetNet !== undefined) {
            setTargetNet(data.denemeTargetNet);
          }
        }
      } catch (error) {
        console.error("Firebase load failed:", error);
        notify.error("Veriler yüklenirken hata oluştu. Lütfen sayfayı yenileyin.");
      } finally {
        setLoaded(true);
        setTimeout(() => setInitialLoadDone(true), 0);
      }
    };
    
    setLoaded(false);
    setInitialLoadDone(false);
    loadData();
  }, [user?.uid, persistData]);

  // ─── CRUD helpers (state-only, explicit save) ────────────────────
  const handleTargetNetChange = (value: number) => {
    setTargetNet(value);
    persistData(denemeler, value);
  };

  const filteredDenemeler = useMemo(() => {
    return denemeler.filter(d => viewType === "genel" ? d.examType !== "brans" : d.examType === "brans");
  }, [denemeler, viewType]);

  const stats = useMemo(() => {
    if (filteredDenemeler.length === 0) return null;
    const nets = filteredDenemeler.map((d) => evaluateDeneme(d.scores, d.examType).totalNet);
    return {
      count: filteredDenemeler.length,
      avg: averageNet(filteredDenemeler),
      best: Math.max(...nets),
      latest: evaluateDeneme(filteredDenemeler[0].scores, filteredDenemeler[0].examType).totalNet,
    };
  }, [filteredDenemeler]);

  const handleSave = async (payload: {
    name: string;
    date: string;
    publisher?: string;
    note?: string;
    durationMinutes?: number;
    scores: DenemeRecord["scores"];
    examType?: "genel" | "brans";
    bransSubjectId?: string;
  }) => {
    const targetExamType = payload.examType || (editing ? editing.examType : "genel");
    const targetBranchId = payload.bransSubjectId || (editing ? editing.bransSubjectId : undefined) || "turkce";

    const updateTabAndViews = () => {
      if (targetExamType === "brans") {
        setViewType("brans");
        if (targetBranchId) {
          setActiveSubjectTab(targetBranchId);
        }
      } else {
        setViewType("genel");
      }
      setTab("gecmis");
    };

    if (editing) {
      const updated = denemeler.map(d => d.id === editing.id ? { ...editing, ...payload } : d);
      setDenemeler(updated);
      setEditing(null);
      updateTabAndViews();

      persistData(updated, targetNet);

      notify.info(payload.name || "Deneme Sınavı", {
        badge: "DENEME GÜNCELLENDİ",
        emoji: "📝",
        description: "Sonuçlar ve analizlerin güncellendi",
      });
      return;
    }
    
    const newRecord: DenemeRecord = { id: crypto.randomUUID(), ...payload };
    const updated = [newRecord, ...denemeler];
    updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setDenemeler(updated);
    updateTabAndViews();

    persistData(updated, targetNet);

    notify.success(payload.name || "Yeni Deneme Sınavı", {
      badge: "BAŞARIYLA KAYDEDİLDİ",
      emoji: "🎯",
      description: "Analizlerin ve sıralaman güncellendi",
    });
  };

  const handleDelete = (id: string) => {
    const updated = denemeler.filter(d => d.id !== id);
    const delPromise = persistData(updated, targetNet).then(() => {
      setDenemeler(updated);
    });

    notify.error("Sınav kaydı veritabanından kaldırıldı", {
      badge: "DENEME SİLİNDİ",
      emoji: "🗑️",
    });
  };

  if (!loaded) {
    return <DenemeLoading />;
  }

  return (
    <div className="min-h-screen bg-bg text-text-main pb-20">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-500/[0.04] via-purple-500/[0.02] to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-500/[0.03] to-transparent rounded-full blur-3xl" />
      </div>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-12">
        {/* Unified EdTech Header & Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden shrink-0 flex items-center justify-center">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1cb0f6] to-[#0088cc] flex items-center justify-center text-white text-2xl font-black">
                  {user?.displayName?.charAt(0)?.toUpperCase() || "K"}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-0.5">
                Hoş Geldin, {user?.displayName?.split(" ")[0] || "Şampiyon"}
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                {tab === "yeni" ? "Sınav Girişi" : tab === "gecmis" ? "Kayıt Defteri" : "Gelişim Analizi"}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const mocks: DenemeRecord[] = [];
                        for (let i = 1; i <= 3; i++) {
                          mocks.push({
                            id: `mock-${crypto.randomUUID()}`,
                            isMock: true,
                            name: `Mock Genel Deneme ${i}`,
                            date: new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
                            examType: "genel",
                            scores: DENEME_SUBJECTS.map(s => {
                              const qCount = s.questionCount;
                              const correct = Math.floor(qCount * (0.6 + Math.random() * 0.25));
                              const wrong = Math.floor(qCount * (0.1 + Math.random() * 0.15));
                              const empty = qCount - correct - wrong;
                              const topics = getSubjectTopics(s.id);
                              
                              // Randomly assign some wrong/empty to specific topics
                              const topicErrors: any[] = [];
                              if (wrong > 0 && topics.length > 0) {
                                const t1 = topics[Math.floor(Math.random() * topics.length)];
                                topicErrors.push({ topicId: t1.id, topicTitle: t1.title, wrongCount: Math.min(wrong, 2) });
                              }
                              if (empty > 0 && topics.length > 1) {
                                const t2 = topics[Math.floor(Math.random() * topics.length)];
                                topicErrors.push({ topicId: t2.id, topicTitle: t2.title, emptyCount: Math.min(empty, 2) });
                              }

                              return {
                                subjectId: s.id,
                                correct,
                                wrong,
                                empty,
                                topicErrors,
                              };
                            })
                          } as any);
                        }
                        DENEME_SUBJECTS.forEach((sub) => {
                          for (let i = 1; i <= 3; i++) {
                            const correct = Math.floor(sub.questionCount * (0.5 + Math.random() * 0.4));
                            const wrong = Math.floor(sub.questionCount * (0.1 + Math.random() * 0.2));
                            const empty = sub.questionCount - correct - wrong;
                            const topics = getSubjectTopics(sub.id);
                            const topicErrors: any[] = [];
                            if (wrong > 0 && topics.length > 0) {
                              const t1 = topics[Math.floor(Math.random() * topics.length)];
                              topicErrors.push({ topicId: t1.id, topicTitle: t1.title, wrongCount: Math.min(wrong, 2) });
                            }
                            if (empty > 0 && topics.length > 1) {
                              const t2 = topics[Math.floor(Math.random() * topics.length)];
                              topicErrors.push({ topicId: t2.id, topicTitle: t2.title, emptyCount: Math.min(empty, 2) });
                            }

                            mocks.push({
                              id: `mock-${crypto.randomUUID()}`,
                              isMock: true,
                              name: `Mock ${sub.title} Branş ${i}`,
                              date: new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
                              examType: "brans",
                              bransSubjectId: sub.id,
                              scores: [{
                                subjectId: sub.id,
                                correct,
                                wrong,
                                empty,
                                topicErrors,
                              }]
                            } as any);
                          }
                        });
                        setDenemeler(prev => [...prev, ...mocks]);
                        notify.success("Geçici test verileri ve konu analiz matrisi yüklendi!", { badge: "TEST VERİSİ", emoji: "📊" });
                      }}
                      className="px-3.5 py-1.5 bg-[#ffebeb] dark:bg-rose-500/20 text-[#ff4b4b] dark:text-rose-400 font-extrabold rounded-xl text-xs uppercase tracking-wider border-2 border-b-4 border-[#ff4b4b] border-b-[#ea2b2b] hover:scale-105 active:translate-y-0.5 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      Test Verisi Yükle
                    </button>

                    {denemeler.some(d => (d as any).isMock || d.id?.startsWith("mock-") || d.name?.startsWith("Mock ")) && (
                      <button
                        type="button"
                        onClick={() => {
                          const clean = denemeler.filter(d => !((d as any).isMock || d.id?.startsWith("mock-") || d.name?.startsWith("Mock ")));
                          setDenemeler(clean);
                          persistData(clean, targetNet);
                          notify.success("Test verileri silindi ve veritabanı temizlendi!", { badge: "TEMİZLENDİ", emoji: "✨" });
                        }}
                        className="px-3.5 py-1.5 bg-[#e5f9e7] dark:bg-[#58cc02]/20 text-[#58cc02] border-2 border-b-4 border-[#58cc02] border-b-[#46a302] font-extrabold rounded-xl text-xs uppercase tracking-wider hover:scale-105 active:translate-y-0.5 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        Test Verilerini Temizle
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-b-4 border-slate-200 dark:border-slate-700 w-full md:w-auto mt-6 md:mt-0 shadow-xs gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  if (t.id !== "yeni") setEditing(null);
                }}
                className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all relative flex items-center justify-center gap-2 cursor-pointer focus:outline-none group ${
                  tab === t.id
                    ? "bg-white dark:bg-slate-800 text-[#1cb0f6] border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-[#1cb0f6] dark:hover:text-[#1cb0f6] hover:bg-sky-50 dark:hover:bg-slate-800/80"
                }`}
              >
                <t.icon className={`w-4 h-4 transition-colors ${tab === t.id ? "text-[#1cb0f6]" : "text-slate-400 group-hover:text-[#1cb0f6]"}`} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === "yeni" && (
            <motion.div
              key="yeni"
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
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
                        durationMinutes: editing.durationMinutes,
                        scores: editing.scores,
                        examType: editing.examType,
                        bransSubjectId: editing.bransSubjectId,
                      }
                    : (initialMode || initialSubject || initialDuration) ? {
                        name: "",
                        date: format(getStudyDate(), 'yyyy-MM-dd'),
                        durationMinutes: initialDuration,
                        scores: createEmptyScores(),
                        examType: (initialMode as "genel" | "brans") || "genel",
                        bransSubjectId: initialSubject || "",
                      } : undefined
                }
                onSubmit={handleSave}
                onCancel={editing ? () => setEditing(null) : undefined}
              />
            </motion.div>
          )}

          {tab === "gecmis" && (
            <motion.div
              key="gecmis"
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <ViewTypeSwitcher viewType={viewType} onChange={setViewType} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewType}
                  initial={{ opacity: 0, x: viewType === "brans" ? 15 : -15, scale: 0.99 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: viewType === "brans" ? -15 : 15, scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                >
                  <DenemeHistoryList
                    denemeler={filteredDenemeler}
                    viewType={viewType}
                    activeSubjectTab={activeSubjectTab}
                    onActiveSubjectTabChange={setActiveSubjectTab}
                    onDelete={handleDelete}
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
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <ViewTypeSwitcher viewType={viewType} onChange={setViewType} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewType}
                  initial={{ opacity: 0, x: viewType === "brans" ? 15 : -15, scale: 0.99 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: viewType === "brans" ? -15 : 15, scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                >
                  <DenemeAnalytics
                    denemeler={filteredDenemeler}
                    allDenemeler={denemeler}
                    viewType={viewType}
                    activeSubjectTab={activeSubjectTab}
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
          <AppleEmoji emoji="🌍" className="relative z-10 mr-1" color="#1cb0f6" />
          <span className="relative z-10">Genel Deneme</span>
        </button>
        <button
          onClick={() => onChange("brans")}
          className={`flex-1 sm:flex-none relative px-6 py-2.5 text-sm font-bold transition-all rounded-xl z-10 flex items-center justify-center gap-2 ${
            viewType === "brans" ? "text-[#58cc02] dark:text-[#58cc02]" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          {viewType === "brans" && (
            <motion.div
              layoutId="edtechActiveTab"
              className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-xl"
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          )}
          <AppleEmoji emoji="🎯" className="relative z-10 mr-1" color="#58cc02" />
          <span className="relative z-10">Branş Denemesi</span>
        </button>
      </div>
      <div className="hidden sm:flex items-center gap-2.5 px-5 py-3 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 text-xs font-bold text-slate-400">
        <div className={`w-2 h-2 rounded-full ${viewType === "genel" ? "bg-blue-400" : "bg-[#58cc02]"} animate-pulse`} />
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
