"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, TrendingUp, Award, Calendar, BookOpen } from "lucide-react";
import { LeaderboardEntry } from "@/lib/leaderboardService";
import { loadFromFirebase } from "@/lib/firebaseService";
import { evaluateDeneme } from "@/lib/denemeUtils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from "recharts";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { loadDenemeler } from "@/lib/denemeStorage";
import { useAuth } from "@/contexts/AuthContext";
import { BADGES, getEarnedBadges } from "@/lib/badgesConfig";
import DenemeAnalytics from "./DenemeAnalytics";
import { DenemeRecord } from "@/lib/denemeUtils";

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

const calculateSubjectAverages = (denemeler: DenemeRecord[]) => {
  const genel = denemeler.filter(d => d.examType !== "brans");
  const subjectTotals: Record<string, { net: number; count: number }> = {};

  genel.forEach(d => {
    d.scores.forEach(s => {
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
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    gkgyNet: 0, 
    egitimNet: 0,
    totalBrans: 0,
    bestBransName: "",
    bestBransScore: 0,
    bestGenelSubj: "",
    worstGenelSubj: "",
  });
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [userDenemeler, setUserDenemeler] = useState<DenemeRecord[]>([]);
  const [userTargetNet, setUserTargetNet] = useState<number>(108);
  
  const [currentUserStats, setCurrentUserStats] = useState<any>(null);
  const [userSubjectAverages, setUserSubjectAverages] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<"genel" | "brans" | "kiyasla" | "rozetler">("kiyasla");
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userEntry) return;
      setLoading(true);
      try {
        const data = await loadFromFirebase(userEntry.userId);
        if (data) {
          if (data.denemeler) {
            setUserDenemeler(data.denemeler);
            setUserSubjectAverages(calculateSubjectAverages(data.denemeler));
          }
          if (data.denemeTargetNet !== undefined) {
            setUserTargetNet(data.denemeTargetNet);
          }
        }
        
        if (data && data.denemeler) {
          const allDenemeler = data.denemeler as any[];
          
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

          setStats({
            gkgyNet: gkgyCount ? gkgyTotal / gkgyCount : 0,
            egitimNet: 0,
            totalBrans: brans.length,
            bestBransName,
            bestBransScore,
            bestGenelSubj: bestSubj,
            worstGenelSubj: worstSubj,
          });
          
          setEarnedBadges(getEarnedBadges(data));
        }
      } catch (error) {
        console.error("Kullanıcı verisi çekilemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrentUserStats = () => {
      const local = loadDenemeler();
      const genel = local.filter(d => d.examType !== "brans");
      const brans = local.filter(d => d.examType === "brans");
      
      let avg = 0;
      let max = 0;
      if (genel.length > 0) {
        const nets = genel.map(d => evaluateDeneme(d.scores).totalNet);
        avg = nets.reduce((a, b) => a + b, 0) / nets.length;
        max = Math.max(...nets);
      }
      
      const averages = calculateSubjectAverages(local);

      setCurrentUserStats({
         totalGenel: genel.length,
         avgNet: avg,
         maxNet: max,
         totalBrans: brans.length,
         subjectAverages: averages,
      });
    };

    if (isOpen) {
      fetchUserData();
      fetchCurrentUserStats();
    }
  }, [userEntry, isOpen]);

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
          className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 border-slate-200 flex flex-col overflow-hidden"
        >
          {/* Header Background */}
          <div className={`h-40 shrink-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 relative overflow-hidden`}>
             {/* Decorative circles */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
             
             <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-xl transition-colors backdrop-blur-md z-10"
              >
                <X className="w-5 h-5" />
              </button>
          </div>
          
          {/* Avatar & Info (Overlapping Glass Card) */}
          <div className="px-4 sm:px-6 relative -mt-16 z-10 shrink-0">
             <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl shadow-slate-200/50 rounded-[2rem] p-5 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
                
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                  <div className={`w-24 h-24 rounded-2xl border-4 border-white shadow-md bg-white flex items-center justify-center overflow-hidden shrink-0`}>
                    {userEntry.photoURL ? (
                       <img src={userEntry.photoURL} alt={userEntry.displayName} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                         <span className="text-3xl font-black text-slate-400">
                           {userEntry.displayName.charAt(0).toUpperCase()}
                         </span>
                       </div>
                    )}
                  </div>
                  
                  <div className="text-center sm:text-left mb-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{userEntry.displayName}</h2>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                       <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-sm">
                         <Award className="w-4 h-4 text-blue-500" /> KPSS Adayı
                       </span>
                    </div>
                  </div>
                </div>

                <div className="text-center sm:text-right bg-gradient-to-br from-blue-50 to-indigo-50/50 px-6 py-4 rounded-2xl border border-blue-100/50 shrink-0 shadow-sm">
                   <p className="text-[10px] font-black uppercase text-blue-600/70 tracking-widest mb-0.5">En Yüksek Net</p>
                   <p className={`text-3xl font-black font-mono tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm`}>
                     {userEntry.maxNet.toFixed(2)}
                   </p>
                </div>

             </div>
          </div>
          
          {/* Tab Selection (Duolingo Style) */}
          <div className="px-6 flex gap-3 bg-white pt-4 pb-4 border-b-2 border-slate-100 overflow-x-auto custom-scrollbar shrink-0">
             <button 
                onClick={() => setActiveTab("genel")}
                className={`px-5 py-3 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shrink-0 border-2 ${
                  activeTab === "genel" 
                  ? "bg-blue-50 text-blue-500 border-blue-500 border-b-4 active:border-b-2 active:translate-y-[2px]" 
                  : "bg-white text-slate-400 border-slate-200 border-b-4 hover:bg-slate-50 active:border-b-2 active:translate-y-[2px]"
                }`}
             >
                Genel Sınavlar
             </button>
             <button 
                onClick={() => setActiveTab("brans")}
                className={`px-5 py-3 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shrink-0 border-2 ${
                  activeTab === "brans" 
                  ? "bg-purple-50 text-purple-500 border-purple-500 border-b-4 active:border-b-2 active:translate-y-[2px]" 
                  : "bg-white text-slate-400 border-slate-200 border-b-4 hover:bg-slate-50 active:border-b-2 active:translate-y-[2px]"
                }`}
             >
                Branş
             </button>
             <button 
                onClick={() => setActiveTab("rozetler")}
                className={`px-5 py-3 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shrink-0 border-2 ${
                  activeTab === "rozetler" 
                  ? "bg-orange-50 text-orange-500 border-orange-500 border-b-4 active:border-b-2 active:translate-y-[2px]" 
                  : "bg-white text-slate-400 border-slate-200 border-b-4 hover:bg-slate-50 active:border-b-2 active:translate-y-[2px]"
                }`}
             >
                Rozetler
             </button>
             {user && user.uid !== userEntry.userId && (
               <button 
                  onClick={() => setActiveTab("kiyasla")}
                  className={`px-5 py-3 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shrink-0 ml-auto border-2 ${
                    activeTab === "kiyasla" 
                    ? "bg-amber-50 text-amber-500 border-amber-500 border-b-4 active:border-b-2 active:translate-y-[2px]" 
                    : "bg-white text-slate-400 border-slate-200 border-b-4 hover:bg-slate-50 active:border-b-2 active:translate-y-[2px]"
                  }`}
               >
                  Kıyasla ⚔️
               </button>
             )}
          </div>

          <div className="bg-white flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === "genel" && (
              <div className="p-6 space-y-6">
                 {/* Top Stats */}
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 border-b-4 flex items-center gap-4 hover:border-blue-200 transition-colors">
                     <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                       <Calendar className="w-6 h-6" />
                     </div>
                     <div>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Çözülen Sınav</p>
                       <p className="text-xl font-black text-slate-800">{userEntry.totalTrials}</p>
                     </div>
                   </div>
                   
                   <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 border-b-4 flex items-center gap-4 hover:border-emerald-200 transition-colors">
                     <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-500 flex items-center justify-center shrink-0">
                       <TrendingUp className="w-6 h-6" />
                     </div>
                     <div>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Net Ortalaması</p>
                       <p className="text-xl font-black text-slate-800">{userEntry.averageNet.toFixed(2)}</p>
                     </div>
                   </div>
                 </div>

                 {/* Detailed Section Breakdown */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 border-b-4 hover:border-blue-200 transition-colors">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Genel Yetenek (GY)</p>
                       <div className="flex items-end gap-2">
                          <p className="text-2xl font-black font-mono text-blue-500">{stats.gkgyNet > 0 ? (stats.gkgyNet / 2).toFixed(1) : "-"}</p>
                          <p className="text-xs font-bold text-slate-400 mb-1">/ 60</p>
                       </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 border-b-4 hover:border-purple-200 transition-colors">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Genel Kültür (GK)</p>
                       <div className="flex items-end gap-2">
                          <p className="text-2xl font-black font-mono text-purple-500">{stats.gkgyNet > 0 ? (stats.gkgyNet / 2).toFixed(1) : "-"}</p>
                          <p className="text-xs font-bold text-slate-400 mb-1">/ 60</p>
                       </div>
                    </div>
                 </div>
                 
                 {/* Best and Worst */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border-2 border-emerald-200 border-b-4">
                       <p className="text-[10px] font-black uppercase text-emerald-500 tracking-wider mb-1">En Başarılı Ders</p>
                       <p className="text-sm font-black text-slate-800 truncate">{stats.bestGenelSubj || "Yeterli Veri Yok"}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border-2 border-rose-200 border-b-4">
                       <p className="text-[10px] font-black uppercase text-rose-500 tracking-wider mb-1">Gelişim Alanı</p>
                       <p className="text-sm font-black text-slate-800 truncate">{stats.worstGenelSubj || "Yeterli Veri Yok"}</p>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === "brans" && (
              <div className="p-6 grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 border-b-4 flex items-center gap-4 hover:border-purple-200 transition-colors">
                   <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-500 flex items-center justify-center shrink-0">
                     <BookOpen className="w-6 h-6" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Branş Denemesi</p>
                     <p className="text-xl font-black text-slate-800">{stats.totalBrans}</p>
                   </div>
                 </div>
                 
                 <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 border-b-4 flex items-center gap-4 hover:border-amber-200 transition-colors">
                   <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                     <Award className="w-6 h-6" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">En İyi Branş</p>
                     <p className="text-sm font-black text-slate-800 truncate">{stats.bestBransName || "-"}</p>
                     <p className="text-xs font-mono font-bold text-amber-500">{stats.bestBransScore.toFixed(2)} Net</p>
                   </div>
                 </div>
              </div>
            )}

            {activeTab === "kiyasla" && currentUserStats && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-800">Detaylı Karşılaştırma</h3>
                  <span className="text-[10px] font-black text-white bg-blue-500 px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm">Sen vs {userEntry.displayName}</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column: Averages & Stats */}
                  <div className="space-y-6">
                    {/* Ortalamalar */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 border-b-4 hover:border-blue-200 transition-colors">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                         <span className={currentUserStats.avgNet >= userEntry.averageNet ? "text-blue-500" : ""}>Sen ({currentUserStats.avgNet.toFixed(1)})</span>
                         <span className="text-slate-500">Net Ortalaması</span>
                         <span className={userEntry.averageNet > currentUserStats.avgNet ? "text-purple-500" : ""}>Rakip ({userEntry.averageNet.toFixed(1)})</span>
                      </div>
                      <div className="flex h-4 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 relative">
                         <div className="bg-blue-400 h-full transition-all" style={{ width: `${(currentUserStats.avgNet / (currentUserStats.avgNet + userEntry.averageNet || 1)) * 100}%` }}></div>
                         <div className="bg-purple-400 h-full transition-all" style={{ width: `${(userEntry.averageNet / (currentUserStats.avgNet + userEntry.averageNet || 1)) * 100}%` }}></div>
                      </div>
                    </div>

                    {/* En Yüksek Net */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 border-b-4 hover:border-blue-200 transition-colors">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                         <span className={currentUserStats.maxNet >= userEntry.maxNet ? "text-blue-500" : ""}>Sen ({currentUserStats.maxNet.toFixed(1)})</span>
                         <span className="text-slate-500">En Yüksek Net</span>
                         <span className={userEntry.maxNet > currentUserStats.maxNet ? "text-purple-500" : ""}>Rakip ({userEntry.maxNet.toFixed(1)})</span>
                      </div>
                      <div className="flex h-4 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 relative">
                         <div className="bg-blue-400 h-full transition-all" style={{ width: `${(currentUserStats.maxNet / (currentUserStats.maxNet + userEntry.maxNet || 1)) * 100}%` }}></div>
                         <div className="bg-purple-400 h-full transition-all" style={{ width: `${(userEntry.maxNet / (currentUserStats.maxNet + userEntry.maxNet || 1)) * 100}%` }}></div>
                      </div>
                    </div>

                    {/* Çözülen Denemeler (Genel + Branş) */}
                    <div className="flex justify-between gap-4">
                       <div className="flex-1 bg-blue-50 p-4 rounded-2xl border-2 border-blue-200 border-b-4 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Sen</p>
                          <p className="text-3xl font-black text-blue-500">{currentUserStats.totalGenel}</p>
                          <p className="text-xs font-bold text-blue-600/70">Genel</p>
                          <div className="my-3 border-b-2 border-blue-200/50"></div>
                          <p className="text-xl font-black text-blue-500/80">{currentUserStats.totalBrans}</p>
                          <p className="text-[10px] font-bold text-blue-600/70">Branş</p>
                       </div>
                       <div className="flex-1 flex items-center justify-center text-4xl opacity-50 drop-shadow-sm">⚔️</div>
                       <div className="flex-1 bg-purple-50 p-4 rounded-2xl border-2 border-purple-200 border-b-4 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-2">Rakip</p>
                          <p className="text-3xl font-black text-purple-500">{userEntry.totalTrials}</p>
                          <p className="text-xs font-bold text-purple-600/70">Genel</p>
                          <div className="my-3 border-b-2 border-purple-200/50"></div>
                          <p className="text-xl font-black text-purple-500/80">{stats.totalBrans}</p>
                          <p className="text-[10px] font-bold text-purple-600/70">Branş</p>
                       </div>
                    </div>
                  </div>

                  {/* Right Column: Subject Chart */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 border-b-4 flex flex-col h-[400px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Ders Bazlı Net Ortalamaları</p>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { subject: 'Türkçe', sen: currentUserStats.subjectAverages?.['turkce'] || 0, rakip: userSubjectAverages['turkce'] || 0 },
                            { subject: 'Matematik', sen: currentUserStats.subjectAverages?.['matematik'] || 0, rakip: userSubjectAverages['matematik'] || 0 },
                            { subject: 'Tarih', sen: currentUserStats.subjectAverages?.['tarih'] || 0, rakip: userSubjectAverages['tarih'] || 0 },
                            { subject: 'Coğrafya', sen: currentUserStats.subjectAverages?.['cografya'] || 0, rakip: userSubjectAverages['cografya'] || 0 },
                            { subject: 'Vatandaşlık', sen: currentUserStats.subjectAverages?.['vatandaslik'] || 0, rakip: userSubjectAverages['vatandaslik'] || 0 },
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
                          <Bar dataKey="sen" name="Sen" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                          <Bar dataKey="rakip" name="Rakip" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart Section */}
            {(activeTab === "genel" || activeTab === "brans") && (
              <div className="p-4 sm:p-6 border-t-2 border-slate-100 bg-slate-50 overflow-y-auto custom-scrollbar">
                 {!loading ? (
                    <DenemeAnalytics 
                       denemeler={userDenemeler.filter(d => activeTab === "genel" ? d.examType !== "brans" : d.examType === "brans")} 
                       allDenemeler={userDenemeler} 
                       viewType={activeTab} 
                       targetNet={userTargetNet} 
                       onTargetNetChange={() => {}} 
                       onAdd={() => {}} 
                       isReadOnly={true}
                    />
                 ) : (
                    <div className="h-64 flex items-center justify-center bg-white border-2 border-slate-200 border-b-4 rounded-2xl m-6">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                    </div>
                 )}
              </div>
            )}

            {activeTab === "rozetler" && (
               <div className="p-6 border-t-2 border-slate-100 bg-slate-50">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center">Başarım Koleksiyonu</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                   {BADGES.map((badge) => {
                     const isEarned = earnedBadges.includes(badge.id);
                     const colorMap: any = {
                       emerald: "bg-emerald-50 border-emerald-200 text-emerald-500",
                       orange: "bg-orange-50 border-orange-200 text-orange-500",
                       blue: "bg-blue-50 border-blue-200 text-blue-500",
                       amber: "bg-amber-50 border-amber-200 text-amber-500",
                       purple: "bg-purple-50 border-purple-200 text-purple-500",
                     };
                     
                     return (
                       <div key={badge.id} className={`p-4 rounded-3xl border-2 border-b-4 flex flex-col items-center justify-center text-center transition-all ${isEarned ? colorMap[badge.color] + ' scale-100' : 'bg-slate-50 border-slate-200 text-slate-400 scale-95 opacity-60 grayscale'}`}>
                          <div className={`text-4xl mb-3 drop-shadow-sm ${isEarned ? 'animate-bounce-slow' : ''}`}>{badge.icon}</div>
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1">{badge.title}</p>
                          <p className="text-[9px] font-bold opacity-70 leading-tight">{badge.description}</p>
                       </div>
                     );
                   })}
                 </div>
               </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
