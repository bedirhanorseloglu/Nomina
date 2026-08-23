"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Award, Swords, TrendingUp, CheckCircle2, Trophy, Flame, Target } from "lucide-react";
import { LeaderboardEntry } from "@/lib/leaderboardService";
import { loadFromFirebase, loadDenemeYeniden } from "@/lib/firebaseService";
import { evaluateDeneme } from "@/lib/denemeUtils";
import { useAuth } from "@/contexts/AuthContext";
import { DenemeRecord, migrateDenemeler } from "@/lib/denemeUtils";
import { DENEME_SUBJECTS } from "@/lib/denemeConfig";
import AppleEmoji from "../AppleEmoji";

const calculateSubjectAverages = (denemeler: DenemeRecord[], type: "genel" | "brans") => {
  const filtered = denemeler.filter(d => type === "genel" ? d.examType !== "brans" : d.examType === "brans");
  const subjectTotals: Record<string, { net: number; count: number }> = {};

  filtered.forEach(d => {
    d.scores.forEach(s => {
      const bId = d.bransSubjectId || d.scores[0]?.subjectId;
      if (type === "brans" && bId && s.subjectId !== bId) return;
      if (!subjectTotals[s.subjectId]) {
        subjectTotals[s.subjectId] = { net: 0, count: 0 };
      }
      subjectTotals[s.subjectId].net += (s.correct - (s.wrong / 4));
      subjectTotals[s.subjectId].count += 1;
    });
  });

  const averages: Record<string, number> = {};
  for (const [subj, data] of Object.entries(subjectTotals)) {
    if (data.count > 0) {
      averages[subj] = data.net / data.count;
    }
  }
  return averages;
};

interface UserProfileModalProps {
  userEntry: LeaderboardEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ userEntry, isOpen, onClose }: UserProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState({ 
    gkgyNet: 0, 
    totalGenel: 0,
    avgNetGenel: 0,
    maxNetGenel: 0,
    totalBrans: 0,
    avgNetBrans: 0,
    maxNetBrans: 0,
  });
  const [userDenemeler, setUserDenemeler] = useState<DenemeRecord[]>([]);
  
  const [currentUserStats, setCurrentUserStats] = useState<any>(null);
  const [currentUserDenemeler, setCurrentUserDenemeler] = useState<DenemeRecord[]>([]);
  const [userGenelSubjectAverages, setUserGenelSubjectAverages] = useState<Record<string, number>>({});
  const [userBransSubjectAverages, setUserBransSubjectAverages] = useState<Record<string, number>>({});
  const [kiyasType, setKiyasType] = useState<"genel" | "brans">("genel");
  const [kiyasBransSubject, setKiyasBransSubject] = useState<string>("turkce");
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userEntry) return;
      setLoading(true);
      setLoadError(null);
      try {
        const data = await loadFromFirebase(userEntry.userId);
        const denemeData = await loadDenemeYeniden(userEntry.userId);
        
        if (data && denemeData) {
          data.denemeler = denemeData.denemeler || [];
        } else if (denemeData) {
          Object.assign(data || {}, { denemeler: denemeData.denemeler || [] });
        }
        
        if (!data && !denemeData) {
          setLoadError(`${userEntry.displayName} adlı kullanıcının verisi bulunamadı.`);
        }
        
        const combinedData = data || denemeData || {};
        
        if (combinedData) {
          if (combinedData.denemeler && (combinedData.denemeler as any[]).length > 0) {
            const migrated = migrateDenemeler(combinedData.denemeler as DenemeRecord[]);
            combinedData.denemeler = migrated as any;
            setUserDenemeler(migrated);
            setUserGenelSubjectAverages(calculateSubjectAverages(migrated, "genel"));
            setUserBransSubjectAverages(calculateSubjectAverages(migrated, "brans"));
          }
        }
        
        if (combinedData && combinedData.denemeler) {
          const allDenemeler = combinedData.denemeler as any[];
          
          const genel = allDenemeler.filter(d => d.examType !== "brans");
          const brans = allDenemeler.filter(d => d.examType === "brans");

          let avgGenel = 0;
          let maxGenel = 0;
          if (genel.length > 0) {
            const nets = genel.map(d => evaluateDeneme(d.scores).totalNet);
            avgGenel = nets.reduce((a, b) => a + b, 0) / nets.length;
            maxGenel = Math.max(...nets);
          }

          let avgBrans = 0;
          let maxBrans = 0;
          if (brans.length > 0) {
            const bransNets = brans.map(d => {
              const bId = d.bransSubjectId || d.scores[0]?.subjectId;
              if (!bId) return 0;
              const s = d.scores.find((x: any) => x.subjectId === bId);
              return s ? s.correct - (s.wrong / 4) : 0;
            });
            avgBrans = bransNets.reduce((a, b) => a + b, 0) / bransNets.length;
            maxBrans = Math.max(...bransNets);
          }

          setStats({
            gkgyNet: avgGenel,
            totalGenel: genel.length,
            avgNetGenel: avgGenel,
            maxNetGenel: maxGenel,
            totalBrans: brans.length,
            avgNetBrans: avgBrans,
            maxNetBrans: maxBrans,
          });
        }
      } catch (error) {
        console.error("Kullanıcı verisi çekilemedi:", error);
        setLoadError(`Veri yükleme hatası: ${(error as Error)?.message || 'Bilinmeyen hata'}`);
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrentUserStats = async () => {
      if (!user) return;
      const denemeData = await loadDenemeYeniden(user.uid);
      const local = migrateDenemeler((denemeData?.denemeler as DenemeRecord[]) || []);
      setCurrentUserDenemeler(local);
      const genel = local.filter(d => d.examType !== "brans");
      const brans = local.filter(d => d.examType === "brans");
      
      let avgGenel = 0;
      let maxGenel = 0;
      if (genel.length > 0) {
        const nets = genel.map(d => evaluateDeneme(d.scores).totalNet);
        avgGenel = nets.reduce((a, b) => a + b, 0) / nets.length;
        maxGenel = Math.max(...nets);
      }
      
      let avgBrans = 0;
      let maxBrans = 0;
      if (brans.length > 0) {
        const bransNets = brans.map(d => {
          const bId = d.bransSubjectId || d.scores[0]?.subjectId;
          if (!bId) return 0;
          const s = d.scores.find((x: any) => x.subjectId === bId);
          return s ? s.correct - (s.wrong / 4) : 0;
        });
        avgBrans = bransNets.reduce((a, b) => a + b, 0) / bransNets.length;
        maxBrans = Math.max(...bransNets);
      }
      
      setCurrentUserStats({
         totalGenel: genel.length,
         avgNetGenel: avgGenel,
         maxNetGenel: maxGenel,
         totalBrans: brans.length,
         avgNetBrans: avgBrans,
         maxNetBrans: maxBrans,
         genelSubjectAverages: calculateSubjectAverages(local, "genel"),
         bransSubjectAverages: calculateSubjectAverages(local, "brans"),
      });
    };

    if (isOpen) {
      fetchUserData();
      fetchCurrentUserStats();
    }
  }, [userEntry, isOpen, user]);

  if (!isOpen || !userEntry) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* 3D Main Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#1cb0f6]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#F43F5E]/10 rounded-full blur-3xl pointer-events-none" />

          {/* 3D Push Button Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 border-b-slate-300 dark:border-slate-700 dark:border-b-slate-800 text-slate-400 hover:text-[#ff4b4b] hover:border-[#ff4b4b] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center z-30 shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ━━━ 3D DÜELLO & PROFİL BAŞLIĞI ━━━ */}
          <div className="p-6 sm:p-8 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              
              {/* Opponent Avatar with 3D Ring */}
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-[1.75rem] bg-[#fff0f3] dark:bg-[#F43F5E]/15 border-2 border-b-4 border-[#F43F5E] border-b-[#e11d48] flex items-center justify-center overflow-hidden shrink-0 shadow-md relative group">
                {userEntry.photoURL ? (
                   <img src={userEntry.photoURL} alt={userEntry.displayName} className="w-full h-full object-cover" />
                ) : (
                   <span className="text-4xl font-black text-[#F43F5E]">
                     {userEntry.displayName.charAt(0).toUpperCase()}
                   </span>
                )}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                  <AppleEmoji emoji="🎯" size={14} />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    {userEntry.displayName}
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-[#F43F5E] border border-[#F43F5E]/30">
                    RAKİP ADAY
                  </span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                   <span className="text-xs font-bold text-[#1cb0f6] flex items-center gap-1.5 bg-[#e8f7ff] dark:bg-[#1cb0f6]/15 px-3 py-1 rounded-xl border-2 border-b-2 border-[#1cb0f6]/30 shadow-2xs">
                     <Award className="w-3.5 h-3.5 text-[#1cb0f6]" /> KPSS Adayı
                   </span>
                   <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border-2 border-b-2 border-slate-200 dark:border-slate-700 shadow-2xs">
                     {stats.totalGenel + stats.totalBrans} Toplam Deneme
                   </span>
                </div>
              </div>
            </div>

            {/* Rakip Net Score Badge */}
            {(() => {
              const headerAvgRakip = (() => {
                if (kiyasType === "genel") return stats.avgNetGenel || 0;
                const rakipBransList = userDenemeler.filter(d => d.examType === "brans" && (d.bransSubjectId || d.scores[0]?.subjectId) === kiyasBransSubject);
                if (!rakipBransList.length) return 0;
                const nets = rakipBransList.map(d => {
                  const s = d.scores.find((x: any) => x.subjectId === kiyasBransSubject);
                  return s ? s.correct - (s.wrong / 4) : 0;
                });
                return nets.reduce((a, b) => a + b, 0) / nets.length;
              })();

              const isBrans = kiyasType === "brans";
              const activeSubject = isBrans ? DENEME_SUBJECTS.find(s => s.id === kiyasBransSubject) : null;
              const title = isBrans && activeSubject ? `${activeSubject.title} Ort.` : "Genel Net Ort.";
              const activeColor = isBrans && activeSubject ? activeSubject.color : "#1cb0f6";

              return (
                <div 
                  className="text-center sm:text-right px-6 py-3.5 rounded-2xl border-2 border-b-4 shadow-xs shrink-0 sm:mr-12 transition-all duration-300"
                  style={{ 
                    backgroundColor: `${activeColor}15`, 
                    borderColor: `${activeColor}50`,
                    borderBottomColor: activeColor 
                  }}
                >
                   <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: activeColor }}>
                     {title}
                   </p>
                   <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight" style={{ color: activeColor }}>
                     {headerAvgRakip.toFixed(2)}
                   </p>
                </div>
              );
            })()}
          </div>

          {/* Modal Content Scroll Area */}
          <div className="bg-white dark:bg-slate-900 flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
            {currentUserStats ? (
              <div className="space-y-6">
                
                {/* ━━━ DÜELLO MODU VE ÜSTÜNLÜK ÇİPİ ━━━ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Karşılaştırma Modu
                    </h3>
                    
                    {/* 3D Segmented Control */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-2xs gap-1.5 relative">
                      <button 
                        type="button"
                        onClick={() => setKiyasType("genel")}
                        className={`relative px-5 py-2 text-xs font-black tracking-widest uppercase rounded-xl transition-all cursor-pointer z-10 ${
                          kiyasType === "genel" ? "text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        {kiyasType === "genel" && (
                          <motion.div
                            layoutId="modalKiyasTabBg"
                            className="absolute inset-0 bg-[#1cb0f6] border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] rounded-xl shadow-xs"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">Genel Deneme</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setKiyasType("brans")}
                        className={`relative px-5 py-2 text-xs font-black tracking-widest uppercase rounded-xl transition-all cursor-pointer z-10 ${
                          kiyasType === "brans" ? "text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        {kiyasType === "brans" && (
                          <motion.div
                            layoutId="modalKiyasTabBg"
                            className="absolute inset-0 bg-[#58cc02] border-2 border-b-4 border-[#58cc02] border-b-[#46a302] rounded-xl shadow-xs"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">Branş Denemesi</span>
                      </button>
                    </div>
                  </div>

                  {/* 3D Versus Matchup Pill */}
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2 rounded-2xl border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-xs self-start sm:self-auto">
                    <span className="text-xs font-black text-[#1cb0f6]">SEN</span>
                    <AppleEmoji emoji="⚔️" size={16} />
                    <span className="text-xs font-black text-[#F43F5E]">{userEntry.displayName}</span>
                  </div>
                </div>
                
                {/* Branş Sub-Subject Pills */}
                {kiyasType === "brans" && (
                  <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                    {DENEME_SUBJECTS.map(subj => {
                      const isActive = kiyasBransSubject === subj.id;
                      return (
                        <button
                          key={subj.id}
                          type="button"
                          onClick={() => setKiyasBransSubject(subj.id)}
                          className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap border-2 border-b-4 cursor-pointer flex items-center gap-2 ${
                            isActive 
                              ? "text-white shadow-xs active:translate-y-0.5" 
                              : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                          style={isActive ? { backgroundColor: subj.color, borderColor: subj.color, borderBottomColor: "rgba(0,0,0,0.3)" } : {}}
                        >
                          <AppleEmoji emoji={subj.icon} size={15} color={isActive ? "white" : subj.color} />
                          <span>{subj.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {(() => {
                  let kiyasAvgSen = 0, kiyasAvgRakip = 0, kiyasMaxSen = 0, kiyasMaxRakip = 0, kiyasTotalSen = 0, kiyasTotalRakip = 0;
                  const typeLabel = kiyasType === "genel" ? "Genel" : "Branş";
                  const senSbjAvg = kiyasType === "genel" ? currentUserStats.genelSubjectAverages : currentUserStats.bransSubjectAverages;
                  const rakipSbjAvg = kiyasType === "genel" ? userGenelSubjectAverages : userBransSubjectAverages;

                  if (kiyasType === "genel") {
                    kiyasAvgSen = currentUserStats.avgNetGenel;
                    kiyasAvgRakip = stats.avgNetGenel;
                    kiyasMaxSen = currentUserStats.maxNetGenel;
                    kiyasMaxRakip = stats.maxNetGenel;
                    kiyasTotalSen = currentUserStats.totalGenel;
                    kiyasTotalRakip = stats.totalGenel;
                  } else {
                    const senBransList = currentUserDenemeler.filter(d => d.examType === "brans" && (d.bransSubjectId || d.scores[0]?.subjectId) === kiyasBransSubject);
                    const rakipBransList = userDenemeler.filter(d => d.examType === "brans" && (d.bransSubjectId || d.scores[0]?.subjectId) === kiyasBransSubject);
                    
                    const getBransStats = (list: DenemeRecord[]) => {
                      if (!list.length) return { avg: 0, max: 0, count: 0 };
                      const nets = list.map(d => {
                        const s = d.scores.find((x: any) => x.subjectId === kiyasBransSubject);
                        return s ? s.correct - (s.wrong / 4) : 0;
                      });
                      return {
                        avg: nets.reduce((a, b) => a + b, 0) / nets.length,
                        max: Math.max(...nets),
                        count: nets.length
                      };
                    };
                    
                    const senStats = getBransStats(senBransList);
                    const rakipBransStatsObj = getBransStats(rakipBransList);
                    
                    kiyasAvgSen = senStats.avg;
                    kiyasAvgRakip = rakipBransStatsObj.avg;
                    kiyasMaxSen = senStats.max;
                    kiyasMaxRakip = rakipBransStatsObj.max;
                    kiyasTotalSen = senStats.count;
                    kiyasTotalRakip = rakipBransStatsObj.count;
                  }

                  const avgDiff = kiyasAvgSen - kiyasAvgRakip;
                  const maxDiff = kiyasMaxSen - kiyasMaxRakip;
                  
                  return (
                    <div className="grid lg:grid-cols-12 gap-6 items-start">
                      
                      {/* ━━━ SOL KOLON: 3D DÜELLO ÖZET KARTLARI (5 Kolon) ━━━ */}
                      <div className="lg:col-span-5 space-y-4">
                        
                        {/* 1. Ortalama Net Karşılaştırma Kartı */}
                        <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-3xl border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-2xs space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {typeLabel} Net Ortalaması
                            </span>
                            {avgDiff > 0 ? (
                              <span className="text-[11px] font-black text-[#58cc02] bg-[#e5f9e7] dark:bg-[#58cc02]/15 px-2.5 py-0.5 rounded-lg border border-[#58cc02]/30 flex items-center gap-1">
                                <AppleEmoji emoji="👑" size={12} /> +{avgDiff.toFixed(1)} Öndesin
                              </span>
                            ) : avgDiff < 0 ? (
                              <span className="text-[11px] font-black text-[#F43F5E] bg-[#fff0f3] dark:bg-[#F43F5E]/15 px-2.5 py-0.5 rounded-lg border border-[#F43F5E]/30 flex items-center gap-1">
                                {avgDiff.toFixed(1)} Geridesin
                              </span>
                            ) : (
                              <span className="text-[11px] font-black text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-lg">
                                Eşit Skor
                              </span>
                            )}
                          </div>

                          {/* Yan Yana Skor Sayıları */}
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <span className="text-[10px] font-black uppercase text-[#1cb0f6] tracking-wider block">SEN</span>
                              <span className="text-3xl font-black font-mono text-[#1cb0f6]">
                                {kiyasAvgSen.toFixed(1)}
                              </span>
                            </div>
                            <div className="text-center">
                              <span className="text-xs font-black text-slate-400 uppercase">VS</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black uppercase text-[#F43F5E] tracking-wider block">RAKİP</span>
                              <span className="text-3xl font-black font-mono text-[#F43F5E]">
                                {kiyasAvgRakip.toFixed(1)}
                              </span>
                            </div>
                          </div>

                          {/* 3D Segmented Dynamic Track */}
                          <div className="h-4 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 p-0.5 shadow-inner flex gap-1">
                            <motion.div 
                              className="h-full rounded-full bg-gradient-to-r from-[#1cb0f6] to-[#0099e6] shadow-xs"
                              initial={{ width: 0 }}
                              animate={{ width: `${(kiyasAvgSen / (kiyasAvgSen + kiyasAvgRakip || 1)) * 100}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                            <motion.div 
                              className="h-full rounded-full bg-gradient-to-r from-[#F43F5E] to-[#e11d48] shadow-xs"
                              initial={{ width: 0 }}
                              animate={{ width: `${(kiyasAvgRakip / (kiyasAvgSen + kiyasAvgRakip || 1)) * 100}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                        </div>

                        {/* 2. En Yüksek Net Kartı */}
                        <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-3xl border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-2xs space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              En Yüksek {typeLabel} Net
                            </span>
                            {maxDiff > 0 ? (
                              <span className="text-[11px] font-black text-[#58cc02] bg-[#e5f9e7] dark:bg-[#58cc02]/15 px-2.5 py-0.5 rounded-lg border border-[#58cc02]/30 flex items-center gap-1">
                                <AppleEmoji emoji="👑" size={12} /> +{maxDiff.toFixed(1)} Rekor
                              </span>
                            ) : maxDiff < 0 ? (
                              <span className="text-[11px] font-black text-[#F43F5E] bg-[#fff0f3] dark:bg-[#F43F5E]/15 px-2.5 py-0.5 rounded-lg border border-[#F43F5E]/30">
                                {maxDiff.toFixed(1)} Fark
                              </span>
                            ) : (
                              <span className="text-[11px] font-black text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-lg">
                                Eşit Rekor
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <span className="text-[10px] font-black uppercase text-[#1cb0f6] tracking-wider block">SEN</span>
                              <span className="text-3xl font-black font-mono text-[#1cb0f6]">
                                {kiyasMaxSen.toFixed(1)}
                              </span>
                            </div>
                            <div className="text-center">
                              <span className="text-xs font-black text-slate-400 uppercase">VS</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black uppercase text-[#F43F5E] tracking-wider block">RAKİP</span>
                              <span className="text-3xl font-black font-mono text-[#F43F5E]">
                                {kiyasMaxRakip.toFixed(1)}
                              </span>
                            </div>
                          </div>

                          <div className="h-4 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 p-0.5 shadow-inner flex gap-1">
                            <motion.div 
                              className="h-full rounded-full bg-gradient-to-r from-[#1cb0f6] to-[#0099e6] shadow-xs"
                              initial={{ width: 0 }}
                              animate={{ width: `${(kiyasMaxSen / (kiyasMaxSen + kiyasMaxRakip || 1)) * 100}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                            <motion.div 
                              className="h-full rounded-full bg-gradient-to-r from-[#F43F5E] to-[#e11d48] shadow-xs"
                              initial={{ width: 0 }}
                              animate={{ width: `${(kiyasMaxRakip / (kiyasMaxSen + kiyasMaxRakip || 1)) * 100}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                        </div>

                        {/* 3. Çözülen Deneme Sayısı (3D Push-Card) */}
                        <div className="flex items-center justify-between gap-3">
                           <div className="flex-1 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] text-center shadow-xs">
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#1cb0f6] mb-1">Sen</p>
                              <p className="text-3xl font-black text-[#1cb0f6] font-mono leading-none mb-1">{kiyasTotalSen}</p>
                              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                                Deneme Çözüldü
                              </p>
                           </div>
                           
                           <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-b-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                             <AppleEmoji emoji="⚔️" size={18} />
                           </div>
                           
                           <div className="flex-1 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border-2 border-b-4 border-[#F43F5E] border-b-[#e11d48] text-center shadow-xs">
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#F43F5E] mb-1">Rakip</p>
                              <p className="text-3xl font-black text-[#F43F5E] font-mono leading-none mb-1">{kiyasTotalRakip}</p>
                              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                                Deneme Çözüldü
                              </p>
                           </div>
                        </div>
                      </div>

                      {/* ━━━ SAĞ KOLON: DERS BAZLI 3D DÜELLO DAĞILIMI (7 Kolon) ━━━ */}
                      <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/80 p-5 sm:p-6 rounded-3xl border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex items-center gap-2">
                            <AppleEmoji emoji="📊" size={16} />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                              Ders Bazlı Net Dağılımı
                            </h4>
                          </div>
                          
                          {/* Legend */}
                          <div className="flex items-center gap-3 text-[11px] font-black uppercase">
                            <span className="flex items-center gap-1.5 text-[#1cb0f6]">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#1cb0f6]" /> Sen
                            </span>
                            <span className="flex items-center gap-1.5 text-[#F43F5E]">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" /> Rakip
                            </span>
                          </div>
                        </div>

                        {/* Subject Rows */}
                        <div className="space-y-3.5">
                          {DENEME_SUBJECTS.map((subj) => {
                            const senNet = senSbjAvg?.[subj.id] ?? 0;
                            const rakipNet = rakipSbjAvg?.[subj.id] ?? 0;
                            const totalMax = subj.questionCount;
                            const senPct = Math.min(100, Math.max(0, (senNet / totalMax) * 100));
                            const rakipPct = Math.min(100, Math.max(0, (rakipNet / totalMax) * 100));
                            const isSenWinner = senNet > rakipNet;
                            const isRakipWinner = rakipNet > senNet;

                            const hoverBorderClass =
                              subj.id === "turkce"
                                ? "hover:border-[#fa5fea] dark:hover:border-[#fa5fea] hover:shadow-[#fa5fea]/10"
                                : subj.id === "matematik"
                                ? "hover:border-[#af52de] dark:hover:border-[#af52de] hover:shadow-[#af52de]/10"
                                : subj.id === "tarih"
                                ? "hover:border-[#ff9500] dark:hover:border-[#ff9500] hover:shadow-[#ff9500]/10"
                                : subj.id === "cografya"
                                ? "hover:border-[#10B981] dark:hover:border-[#10B981] hover:shadow-[#10B981]/10"
                                : subj.id === "vatandaslik"
                                ? "hover:border-[#5856d6] dark:hover:border-[#5856d6] hover:shadow-[#5856d6]/10"
                                : "hover:border-[#1cb0f6] dark:hover:border-[#1cb0f6]";

                            return (
                              <div 
                                key={subj.id}
                                className={`bg-white dark:bg-slate-900/80 p-3.5 rounded-2xl border-2 border-b-2 border-slate-200 dark:border-slate-700 shadow-2xs space-y-2 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${hoverBorderClass}`}
                              >
                                {/* Row Header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-7 h-7 rounded-xl flex items-center justify-center border-2 border-b-2 shadow-2xs group-hover:scale-110 transition-transform"
                                      style={{ backgroundColor: `${subj.color}15`, borderColor: `${subj.color}40` }}
                                    >
                                      <AppleEmoji emoji={subj.icon} size={14} />
                                    </div>
                                    <span className="text-xs font-black text-slate-800 dark:text-white">
                                      {subj.title}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      ({subj.questionCount} Soru)
                                    </span>
                                  </div>

                                  {/* Net Score Values */}
                                  <div className="flex items-center gap-3 text-xs font-mono font-black">
                                    <span className={`flex items-center gap-1 ${isSenWinner ? "text-[#1cb0f6]" : "text-slate-400"}`}>
                                      {isSenWinner && <AppleEmoji emoji="👑" size={11} />}
                                      {senNet.toFixed(1)}
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-600">/</span>
                                    <span className={`flex items-center gap-1 ${isRakipWinner ? "text-[#F43F5E]" : "text-slate-400"}`}>
                                      {rakipNet.toFixed(1)}
                                      {isRakipWinner && <AppleEmoji emoji="👑" size={11} />}
                                    </span>
                                  </div>
                                </div>

                                {/* Dual Bars */}
                                <div className="space-y-1">
                                  {/* Sen Bar */}
                                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                    <motion.div 
                                      className="h-full bg-gradient-to-r from-[#1cb0f6] to-[#0099e6] rounded-full shadow-2xs"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${senPct}%` }}
                                      transition={{ duration: 0.5, ease: "easeOut" }}
                                    />
                                  </div>
                                  {/* Rakip Bar */}
                                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                    <motion.div 
                                      className="h-full bg-gradient-to-r from-[#F43F5E] to-[#e11d48] rounded-full shadow-2xs"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${rakipPct}%` }}
                                      transition={{ duration: 0.5, ease: "easeOut" }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <p className="text-sm font-bold">Kıyaslama yapılabilmesi için sisteme giriş yapmış olmalısınız.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
