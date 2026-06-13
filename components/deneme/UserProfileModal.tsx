"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, TrendingUp, Award, Calendar, BookOpen, Swords } from "lucide-react";
import { LeaderboardEntry } from "@/lib/leaderboardService";
import { loadFromFirebase, loadDenemeYeniden } from "@/lib/firebaseService";
import { evaluateDeneme } from "@/lib/denemeUtils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from "recharts";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { useAuth } from "@/contexts/AuthContext";
import { BADGES, getEarnedBadges } from "@/lib/badgesConfig";
import DenemeAnalytics from "./DenemeAnalytics";
import { DenemeRecord, migrateDenemeler } from "@/lib/denemeUtils";
import { DENEME_SUBJECTS } from "@/lib/denemeConfig";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-2xl border-2 border-slate-200 shadow-xl" style={{ borderBottomWidth: '4px' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🚀</span>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label || "Deneme"}</p>
        </div>
        <p className="text-xl font-black text-blue-500 font-mono tracking-tighter">
          {Number(payload[0].value).toFixed(2)} <span className="text-xs font-bold text-slate-400">Net</span>
        </p>
      </div>
    );
  }
  return null;
};

const calculateSubjectAverages = (denemeler: DenemeRecord[], type: "genel" | "brans") => {
  const filtered = denemeler.filter(d => type === "genel" ? d.examType !== "brans" : d.examType === "brans");
  const subjectTotals: Record<string, { net: number; count: number }> = {};

  filtered.forEach(d => {
    // For brans exams, only consider the score object that matches bransSubjectId,
    // OR if we just iterate scores, ensure we only count the one that was taken.
    // Wait, old brans exams have empty 0 for other subjects.
    // Actually, for brans exams, it's safer to only count `s.subjectId === d.bransSubjectId` if it exists.
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
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    gkgyNet: 0, 
    egitimNet: 0,
    totalGenel: 0,
    avgNetGenel: 0,
    maxNetGenel: 0,
    totalBrans: 0,
    avgNetBrans: 0,
    maxNetBrans: 0,
    bestBransName: "",
    bestBransScore: 0,
    bestGenelSubj: "",
    worstGenelSubj: "",
  });
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [userDenemeler, setUserDenemeler] = useState<DenemeRecord[]>([]);
  const [userTargetNet, setUserTargetNet] = useState<number>(108);
  
  const [currentUserStats, setCurrentUserStats] = useState<any>(null);
  const [currentUserDenemeler, setCurrentUserDenemeler] = useState<DenemeRecord[]>([]);
  const [userGenelSubjectAverages, setUserGenelSubjectAverages] = useState<Record<string, number>>({});
  const [userBransSubjectAverages, setUserBransSubjectAverages] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<"genel" | "brans" | "kiyasla" | "rozetler">("kiyasla");
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
          // If only denemeData exists
          Object.assign(data || {}, { denemeler: denemeData.denemeler || [] });
        }
        
        if (!data && !denemeData) {
          setLoadError(`${userEntry.displayName} adlı kullanıcının verisi bulunamadı. Kullanıcı henüz deneme kaydetmemiş olabilir.`);
        }
        
        // Let's use either data or denemeData as base depending on what we have
        const combinedData = data || denemeData || {};
        
        if (combinedData) {
          if (combinedData.denemeler && (combinedData.denemeler as any[]).length > 0) {
            const migrated = migrateDenemeler(combinedData.denemeler as DenemeRecord[]);
            combinedData.denemeler = migrated as any;
            setUserDenemeler(migrated);
            setUserGenelSubjectAverages(calculateSubjectAverages(migrated, "genel"));
            setUserBransSubjectAverages(calculateSubjectAverages(migrated, "brans"));
          }
          if (combinedData.denemeTargetNet !== undefined) {
            setUserTargetNet(combinedData.denemeTargetNet);
          }
        }
        
        if (combinedData && combinedData.denemeler) {
          const allDenemeler = combinedData.denemeler as any[];
          
          // --- GENEL DENEME VERİSİ ---
          const genel = allDenemeler.filter(d => d.examType !== "brans")
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
          const mappedGenel = genel.slice(-10).map(d => {
            const evaluated = evaluateDeneme(d.scores);
            return {
              date: format(new Date(d.date), "d MMM", { locale: tr }),
              net: evaluated.totalNet,
            };
          });
          setChartData(mappedGenel);
          
          let gkgyTotal = 0;
          let gkgyCount = 0;
          let subjectTotals: Record<string, {net: number, count: number}> = {};

          genel.forEach(d => {
             const ev = evaluateDeneme(d.scores);
             gkgyTotal += ev.gyNet + ev.gkNet;
             gkgyCount++;
             
             // Accumulate subject nets
             d.scores.forEach((s: any) => {
                if (!subjectTotals[s.subjectId]) subjectTotals[s.subjectId] = { net: 0, count: 0 };
                subjectTotals[s.subjectId].net += (s.correct - s.wrong / 4);
                subjectTotals[s.subjectId].count++;
             });
          });
          
          let bestSubj = "";
          let worstSubj = "";
          
          if (Object.keys(subjectTotals).length > 0) {
            const sortedSubjects = Object.entries(subjectTotals)
              .map(([id, data]) => ({ id, avgNet: data.net / data.count }))
              .sort((a, b) => b.avgNet - a.avgNet);
              
            if (sortedSubjects.length > 0) {
               bestSubj = sortedSubjects[0].id.charAt(0).toUpperCase() + sortedSubjects[0].id.slice(1);
               worstSubj = sortedSubjects[sortedSubjects.length - 1].id.charAt(0).toUpperCase() + sortedSubjects[sortedSubjects.length - 1].id.slice(1);
            }
          }

          // --- BRANŞ DENEME VERİSİ ---
          const brans = allDenemeler.filter(d => d.examType === "brans");
          let bestBransScore = 0;
          let bestBransName = "-";
          
          if (brans.length > 0) {
            brans.forEach(b => {
              const scoreObj = b.scores[0]; 
              if (scoreObj) {
                const net = scoreObj.correct - (scoreObj.wrong / 4);
                if (net > bestBransScore) {
                  bestBransScore = net;
                  bestBransName = scoreObj.subjectId; 
                }
              }
            });
            bestBransName = bestBransName.charAt(0).toUpperCase() + bestBransName.slice(1);
          }

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
            gkgyNet: gkgyCount ? gkgyTotal / gkgyCount : 0,
            egitimNet: 0,
            totalGenel: genel.length,
            avgNetGenel: avgGenel,
            maxNetGenel: maxGenel,
            totalBrans: brans.length,
            avgNetBrans: avgBrans,
            maxNetBrans: maxBrans,
            bestBransName,
            bestBransScore,
            bestGenelSubj: bestSubj,
            worstGenelSubj: worstSubj,
          });
          
          setEarnedBadges(getEarnedBadges(combinedData as any));
        }
      } catch (error) {
        console.error("Kullanıcı verisi çekilemedi:", error);
        setLoadError(`Kullanıcı verisi yüklenirken hata oluştu: ${(error as Error)?.message || 'Bilinmeyen hata'}`);
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
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
          className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-[#0f172a] rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/5 flex flex-col overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Clean Apple/Duolingo Profile Header */}
          <div className="p-6 sm:p-8 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-100 dark:border-white/5 relative bg-white dark:bg-[#0f172a]">
            
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] bg-[#1cb0f6]/10 border border-[#1cb0f6]/20 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {userEntry.photoURL ? (
                   <img src={userEntry.photoURL} alt={userEntry.displayName} className="w-full h-full object-cover" />
                ) : (
                   <span className="text-4xl font-black text-[#1cb0f6]">
                     {userEntry.displayName.charAt(0).toUpperCase()}
                   </span>
                )}
              </div>
              
              <div className="text-center sm:text-left mt-2 sm:mt-0">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{userEntry.displayName}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                   <span className="text-[11px] font-bold text-[#1cb0f6] flex items-center gap-1.5 bg-[#1cb0f6]/10 px-3 py-1.5 rounded-xl border border-[#1cb0f6]/20">
                     <Award className="w-4 h-4" /> KPSS Adayı
                   </span>
                </div>
              </div>
            </div>

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
              const color = isBrans && activeSubject ? activeSubject.color : "#1cb0f6";

              return (
                <div className="text-center sm:text-right px-6 py-4 rounded-[1.25rem] border shadow-sm shrink-0 transition-all duration-300 sm:mr-10 mt-4 sm:mt-0"
                     style={{ backgroundColor: `${color}10`, borderColor: `${color}20` }}>
                   <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: color }}>{title}</p>
                   <p className="text-4xl font-black font-mono tracking-tighter drop-shadow-sm" style={{ color: color }}>
                     {headerAvgRakip.toFixed(2)}
                   </p>
                </div>
              );
            })()}

          </div>
          
          {/* Removed Tab Selection as requested */}

          <div className="bg-white flex-1 overflow-y-auto custom-scrollbar">
            {currentUserStats && (
              <div className="p-6 space-y-6 border-t-2 border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black text-slate-800">Detaylı Karşılaştırma</h3>
                    <div className="flex bg-slate-100/80 rounded-xl p-1 border border-slate-200/60 shadow-inner">
                      <button 
                        onClick={() => setKiyasType("genel")}
                        className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-lg transition-colors ${kiyasType === "genel" ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        Genel
                      </button>
                      <button 
                        onClick={() => setKiyasType("brans")}
                        className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-lg transition-colors ${kiyasType === "brans" ? "bg-white text-purple-600 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        Branş
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-white bg-slate-800 px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm flex items-center gap-1.5">Sen <Swords className="w-3.5 h-3.5" /> {userEntry.displayName}</span>
                </div>
                
                {kiyasType === "brans" && (
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {DENEME_SUBJECTS.map(subj => {
                      const isActive = kiyasBransSubject === subj.id;
                      return (
                        <button
                          key={subj.id}
                          onClick={() => setKiyasBransSubject(subj.id)}
                          className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap border-2 ${isActive ? "text-white shadow-sm" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                          style={isActive ? { backgroundColor: subj.color, borderColor: subj.color } : {}}
                        >
                          {subj.title}
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
                    // Calculate specifically for kiyasBransSubject
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
                  
                  return (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column: Averages & Stats */}
                  <div className="space-y-5">
                    {/* Ortalamalar */}
                    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-[1.5rem] border border-slate-100 dark:border-white/5 shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-md transition-all">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                         <span className={kiyasAvgSen >= kiyasAvgRakip ? "text-[#1cb0f6]" : ""}>Sen ({kiyasAvgSen.toFixed(1)}) {kiyasAvgSen >= kiyasAvgRakip && kiyasAvgSen > 0 && "👑"}</span>
                         <span className="text-slate-500">{typeLabel} Net Ortalaması</span>
                         <span className={kiyasAvgRakip > kiyasAvgSen ? "text-[#ff2d55]" : ""}>{kiyasAvgRakip > kiyasAvgSen && "👑"} Rakip ({kiyasAvgRakip.toFixed(1)})</span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                         <div className="h-full transition-all" style={{ backgroundColor: "#1cb0f6", width: `${(kiyasAvgSen / (kiyasAvgSen + kiyasAvgRakip || 1)) * 100}%` }}></div>
                         <div className="h-full transition-all" style={{ backgroundColor: "#ff2d55", width: `${(kiyasAvgRakip / (kiyasAvgSen + kiyasAvgRakip || 1)) * 100}%` }}></div>
                      </div>
                    </div>

                    {/* En Yüksek Net */}
                    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-[1.5rem] border border-slate-100 dark:border-white/5 shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-md transition-all">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                         <span className={kiyasMaxSen >= kiyasMaxRakip ? "text-[#1cb0f6]" : ""}>Sen ({kiyasMaxSen.toFixed(1)}) {kiyasMaxSen >= kiyasMaxRakip && kiyasMaxSen > 0 && "👑"}</span>
                         <span className="text-slate-500">En Yüksek {typeLabel} Net</span>
                         <span className={kiyasMaxRakip > kiyasMaxSen ? "text-[#ff2d55]" : ""}>{kiyasMaxRakip > kiyasMaxSen && "👑"} Rakip ({kiyasMaxRakip.toFixed(1)})</span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                         <div className="h-full transition-all" style={{ backgroundColor: "#1cb0f6", width: `${(kiyasMaxSen / (kiyasMaxSen + kiyasMaxRakip || 1)) * 100}%` }}></div>
                         <div className="h-full transition-all" style={{ backgroundColor: "#ff2d55", width: `${(kiyasMaxRakip / (kiyasMaxSen + kiyasMaxRakip || 1)) * 100}%` }}></div>
                      </div>
                    </div>

                    {/* Çözülen Denemeler (Genel + Branş) */}
                    <div className="flex justify-between gap-4">
                       <div className={`flex-1 bg-[#1cb0f6]/5 dark:bg-[#1cb0f6]/10 p-5 rounded-[1.5rem] border border-[#1cb0f6]/20 dark:border-[#1cb0f6]/20 text-center shadow-sm`}>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#1cb0f6] mb-2">Sen</p>
                          <p className="text-3xl font-black text-[#1cb0f6] font-mono leading-none mb-1">{kiyasTotalSen}</p>
                          <p className="text-[10px] font-bold text-[#1cb0f6]/70 leading-tight">Tane {kiyasType === "brans" ? DENEME_SUBJECTS.find(s=>s.id===kiyasBransSubject)?.title + " Branş Denemesi" : "Genel Deneme"} Çözüldü</p>
                       </div>
                       <div className="flex items-center justify-center text-slate-300 dark:text-slate-600">
                         <Swords className="w-8 h-8 opacity-70" />
                       </div>
                       <div className={`flex-1 bg-[#ff2d55]/5 dark:bg-[#ff2d55]/10 p-5 rounded-[1.5rem] border border-[#ff2d55]/20 dark:border-[#ff2d55]/20 text-center shadow-sm`}>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#ff2d55] mb-2">Rakip</p>
                          <p className="text-3xl font-black text-[#ff2d55] font-mono leading-none mb-1">{kiyasTotalRakip}</p>
                          <p className="text-[10px] font-bold text-[#ff2d55]/70 leading-tight">Tane {kiyasType === "brans" ? DENEME_SUBJECTS.find(s=>s.id===kiyasBransSubject)?.title + " Branş Denemesi" : "Genel Deneme"} Çözüldü</p>
                       </div>
                    </div>
                  </div>

                  {/* Right Column: Subject Chart */}
                  <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[1.5rem] border border-slate-100 dark:border-white/5 shadow-[0_2px_10px_rgb(0,0,0,0.03)] flex flex-col h-[400px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">{typeLabel} - Ders Bazlı Net Ortalamaları</p>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { subject: 'Türkçe', sen: senSbjAvg?.['turkce'] || 0, rakip: rakipSbjAvg['turkce'] || 0 },
                            { subject: 'Matematik', sen: senSbjAvg?.['matematik'] || 0, rakip: rakipSbjAvg['matematik'] || 0 },
                            { subject: 'Tarih', sen: senSbjAvg?.['tarih'] || 0, rakip: rakipSbjAvg['tarih'] || 0 },
                            { subject: 'Coğrafya', sen: senSbjAvg?.['cografya'] || 0, rakip: rakipSbjAvg['cografya'] || 0 },
                            { subject: 'Vatandaşlık', sen: senSbjAvg?.['vatandaslik'] || 0, rakip: rakipSbjAvg['vatandaslik'] || 0 },
                            { subject: 'Güncel', sen: senSbjAvg?.['guncel-bilgiler'] || 0, rakip: rakipSbjAvg['guncel-bilgiler'] || 0 },
                          ]}
                          layout="vertical"
                          margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} width={80} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '1rem', border: '2px solid #e2e8f0', fontWeight: 'bold', fontSize: '12px' }}
                            formatter={(value: any) => Number(value).toFixed(1) + " Net"}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                          <Bar dataKey="sen" name="Sen" fill="#1cb0f6" radius={[0, 4, 4, 0]} barSize={12} />
                          <Bar dataKey="rakip" name="Rakip" fill="#ff2d55" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                );
                })()}
              </div>
            )}
            {!currentUserStats && (
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
