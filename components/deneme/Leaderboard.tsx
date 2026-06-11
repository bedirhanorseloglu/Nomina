"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, BookOpen, Loader2 } from "lucide-react";
import { getLeaderboard, getBranchLeaderboard, LeaderboardEntry } from "@/lib/leaderboardService";
import { DENEME_SUBJECTS } from "@/lib/denemeConfig";
import { estimateP3Score } from "@/lib/denemeUtils";
import { useAuth } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";

const UserProfileModal = dynamic(() => import("./UserProfileModal"), { ssr: false });

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

  const [leaderboardType, setLeaderboardType] = useState<"genel" | "brans">("genel");
  const [selectedBranch, setSelectedBranch] = useState<string>("turkce");

  useEffect(() => {
    if (!user) return;
    const fetchLeaders = async () => {
      setLoading(true);
      let data = [];
      if (leaderboardType === "genel") {
        data = await getLeaderboard(50);
      } else {
        data = await getBranchLeaderboard(selectedBranch, 50);
      }
      setLeaders(data);
      setLoading(false);
    };
    fetchLeaders();
  }, [user, leaderboardType, selectedBranch]);

  if (!user) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  const top3 = leaders.slice(0, 3);
  const others = leaders.slice(3);

  const PodiumBlock = ({ leader, rank, height, color, delay }: any) => {
    const isCurrentUser = user?.uid === leader.userId;
    const emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
    const rankColors = rank === 1 ? "from-amber-300 to-amber-500 text-amber-900" : rank === 2 ? "from-slate-200 to-slate-400 text-slate-800" : "from-orange-300 to-orange-500 text-orange-950";
    const p3 = leaderboardType === "genel" ? estimateP3Score(leader.averageNet).toFixed(2) : null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: "spring", stiffness: 100 }}
        onClick={() => setSelectedUser(leader)}
        className="flex flex-col items-center cursor-pointer group relative z-10 mx-1 sm:mx-3"
      >
        <div className={`relative z-20 -mb-6 ${rank === 1 ? 'w-24 h-24' : 'w-20 h-20'}`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${rankColors} rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity`} />
          {leader.photoURL ? (
            <img src={leader.photoURL} alt={leader.displayName} className={`w-full h-full rounded-full border-[6px] ${isCurrentUser ? 'border-blue-500' : 'border-white'} shadow-xl object-cover relative z-10`} />
          ) : (
            <div className={`w-full h-full rounded-full flex items-center justify-center text-3xl font-black border-[6px] ${isCurrentUser ? 'border-blue-500 text-blue-500' : 'border-white text-slate-500'} bg-slate-100 shadow-xl relative z-10`}>
              {leader.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -top-4 -right-4 text-4xl drop-shadow-xl z-30 transform group-hover:scale-125 group-hover:rotate-12 transition-transform">{emoji}</div>
          {isCurrentUser && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full z-30 border-2 border-white shadow-sm">SEN</div>}
        </div>
        
        <div className={`w-28 sm:w-36 ${height} rounded-t-[2rem] flex flex-col items-center justify-end pb-6 shadow-2xl transition-transform transform group-hover:-translate-y-2 relative overflow-hidden`}
             style={{ background: `linear-gradient(to top, #f1f5f9, #ffffff)` }}>
           <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${rankColors}`}></div>
           
           <p className="text-xs sm:text-sm font-black text-slate-800 text-center truncate w-full px-3">{leader.displayName}</p>
           
           <div className="mt-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black uppercase text-slate-400 text-center tracking-widest leading-none mb-0.5">NET</p>
             <p className="text-base sm:text-xl font-black font-mono leading-none" style={{ color: rank === 1 ? '#d97706' : rank === 2 ? '#475569' : '#c2410c' }}>
               {leader.averageNet.toFixed(1)}
             </p>
           </div>

           {p3 && (
             <div className="mt-2 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
               P3: {p3}
             </div>
           )}
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 p-4 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Değişken arka plan efektleri */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full mix-blend-multiply blur-3xl translate-x-1/3 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full mix-blend-multiply blur-3xl -translate-x-1/3 translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-[#ff9500]/10 border border-[#ff9500]/20 flex items-center justify-center text-[#ff9500] shadow-sm shrink-0">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Şampiyonlar Ligi</h3>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">
                {leaderboardType === "genel" ? "Türkiye Geneli Sıralama" : "Branş Bazlı Sıralama"}
              </p>
            </div>
          </div>
          
          <div className="bg-slate-100/80 dark:bg-white/5 p-1.5 rounded-[1.25rem] flex gap-1 border border-slate-200/60 dark:border-white/10 w-fit relative">
            <button
              onClick={() => setLeaderboardType("genel")}
              className={`relative z-10 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors w-36 ${
                leaderboardType === "genel" 
                  ? "text-[#1cb0f6]" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              {leaderboardType === "genel" && (
                <motion.div layoutId="leaderboardTab" className="absolute inset-0 bg-white dark:bg-[#1e293b] rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-200/50 dark:border-white/5 -z-10" />
              )}
              Genel Deneme
            </button>
            <button
              onClick={() => setLeaderboardType("brans")}
              className={`relative z-10 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors w-36 ${
                leaderboardType === "brans" 
                  ? "text-[#af52de]" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              {leaderboardType === "brans" && (
                <motion.div layoutId="leaderboardTab" className="absolute inset-0 bg-white dark:bg-[#1e293b] rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-200/50 dark:border-white/5 -z-10" />
              )}
              Branş
            </button>
          </div>
        </div>

        {leaderboardType === "brans" && (
          <div className="mb-10 flex gap-3 relative z-10 overflow-x-auto pb-4 no-scrollbar snap-x">
            {DENEME_SUBJECTS.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedBranch(subject.id)}
                className={`shrink-0 px-5 py-3 rounded-2xl text-xs font-black transition-all snap-start flex items-center gap-2 border ${
                  selectedBranch === subject.id
                    ? "text-white transform scale-105"
                    : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10"
                }`}
                style={selectedBranch === subject.id ? { 
                  backgroundColor: subject.color, 
                  borderColor: subject.color,
                  boxShadow: `0 10px 25px -5px ${subject.color}60`
                } : {}}
              >
                <span className="text-lg">{subject.icon}</span>
                {subject.title}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-24 min-h-[300px] relative z-10">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin opacity-50" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm font-bold relative z-10 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200/50 dark:border-white/5 mt-8 max-w-md mx-auto">
            <div className="text-5xl mb-4">📭</div>
            <p>Henüz bu alanda kimse yok.</p>
            <p className="mt-1">İlk denemeni çöz ve liderlik tablosuna adını yazdır!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div className="relative z-10 flex justify-center items-end gap-0 sm:gap-4 mb-20 mt-16 h-64 px-2">
                {top3[1] && <PodiumBlock leader={top3[1]} rank={2} height="h-36 sm:h-40" color="bg-slate-400" delay={0.2} />}
                {top3[0] && <PodiumBlock leader={top3[0]} rank={1} height="h-48 sm:h-56" color="bg-amber-400" delay={0.1} />}
                {top3[2] && <PodiumBlock leader={top3[2]} rank={3} height="h-28 sm:h-32" color="bg-orange-500" delay={0.3} />}
              </div>
            )}
            
            <div className="relative z-10 space-y-4">
              {others.map((leader, idx) => {
                const isCurrentUser = user?.uid === leader.userId;
                const rankInGlobal = idx + 4;
                const p3 = leaderboardType === "genel" ? estimateP3Score(leader.averageNet).toFixed(2) : null;
                
                return (
                  <motion.div
                    key={leader.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (idx * 0.05) + 0.4 }}
                    onClick={() => setSelectedUser(leader)}
                    className={`flex items-center gap-4 p-4 sm:p-5 rounded-[2rem] border transition-all cursor-pointer group hover:-translate-y-1 ${
                      isCurrentUser 
                        ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 shadow-md ring-2 ring-blue-500/20" 
                        : "bg-white dark:bg-[#1e293b] border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-lg"
                    }`}
                  >
                    <div className="w-12 text-center shrink-0">
                      <span className={`text-xl font-black ${isCurrentUser ? 'text-blue-500' : 'text-slate-400'}`}>#{rankInGlobal}</span>
                    </div>
                    
                    <div className="relative shrink-0">
                      {leader.photoURL ? (
                        <img src={leader.photoURL} alt={leader.displayName} className="w-14 h-14 rounded-2xl border-2 border-white shadow-sm object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border-2 border-white shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 group-hover:scale-105 transition-transform">
                          {leader.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-black text-slate-800 dark:text-white text-lg truncate group-hover:text-blue-600 transition-colors`}>
                          {leader.displayName}
                        </p>
                        {isCurrentUser && (
                          <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200">
                            Sen
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> {leader.totalTrials} Sınav Çözdü
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {p3 && (
                        <div className="hidden sm:block text-center bg-indigo-50 dark:bg-indigo-500/10 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">P3 Puan</p>
                          <p className="font-mono font-black text-indigo-600">{p3}</p>
                        </div>
                      )}
                      <div className="text-center px-4 py-2 rounded-xl border shadow-sm bg-[#1cb0f6]/10 dark:bg-[#1cb0f6]/20 border-[#1cb0f6]/20 dark:border-[#1cb0f6]/30">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-0.5 text-[#1cb0f6] dark:text-[#1cb0f6]/80">Ort. Net</p>
                        <p className="text-xl font-black font-mono leading-none text-[#1cb0f6] dark:text-[#1cb0f6]">
                          {leader.averageNet.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <AnimatePresence>
        {selectedUser && (
          <UserProfileModal
            userEntry={selectedUser}
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
