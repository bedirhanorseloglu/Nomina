"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, Loader2, Shield, Gem, BookOpen } from "lucide-react";
import { getLeaderboard, LeaderboardEntry } from "@/lib/leaderboardService";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileModal from "./UserProfileModal";

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    const fetchLeaders = async () => {
      const data = await getLeaderboard(50); // Fetch top 50
      setLeaders(data);
      setLoading(false);
    };
    fetchLeaders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-accent animate-spin opacity-50" />
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm font-semibold">
        Henüz liderlik tablosunda kimse yok. İlk denemeni çöz ve listeye gir!
      </div>
    );
  }

  const top3 = leaders.slice(0, 3);
  const others = leaders.slice(3);

  const PodiumBlock = ({ leader, rank, height, color, delay }: any) => {
    const isCurrentUser = user?.uid === leader.userId;
    const emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: "spring", stiffness: 100 }}
        onClick={() => setSelectedUser(leader)}
        className="flex flex-col items-center cursor-pointer group"
      >
        <div className={`relative z-10 -mb-4 ${rank === 1 ? 'w-20 h-20' : 'w-16 h-16'}`}>
          {leader.photoURL ? (
            <img src={leader.photoURL} alt={leader.displayName} className={`w-full h-full rounded-full border-4 ${isCurrentUser ? 'border-accent' : 'border-white'} shadow-xl object-cover`} />
          ) : (
            <div className={`w-full h-full rounded-full flex items-center justify-center text-xl font-black border-4 ${isCurrentUser ? 'border-accent text-accent' : 'border-white text-slate-600'} bg-slate-100 shadow-xl`}>
              {leader.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -top-3 -right-3 text-2xl drop-shadow-md">{emoji}</div>
        </div>
        
        <div className={`w-24 sm:w-32 ${height} rounded-t-2xl flex flex-col items-center justify-end pb-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] transition-all group-hover:-translate-y-2 relative overflow-hidden`}
             style={{ background: `linear-gradient(to top, #f8fafc, white)` }}>
           <div className={`absolute top-0 left-0 w-full h-1 ${color}`}></div>
           <p className="text-xs sm:text-sm font-black text-slate-800 text-center truncate w-full px-2">{leader.displayName}</p>
           <p className="text-sm sm:text-lg font-black font-mono mt-1" style={{ color: rank === 1 ? '#d97706' : rank === 2 ? '#475569' : '#c2410c' }}>
             {leader.averageNet.toFixed(1)}
           </p>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 p-4 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/3 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/3 translate-y-1/2"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">Sıralama</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mt-1">Türkiye Geneli Net Ortalaması</p>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <div className="relative z-10 flex justify-center items-end gap-2 sm:gap-6 mb-16 mt-12 h-56 px-2">
            {top3[1] && <PodiumBlock leader={top3[1]} rank={2} height="h-32" color="bg-slate-400" delay={0.2} />}
            {top3[0] && <PodiumBlock leader={top3[0]} rank={1} height="h-44" color="bg-amber-400" delay={0.1} />}
            {top3[2] && <PodiumBlock leader={top3[2]} rank={3} height="h-28" color="bg-orange-500" delay={0.3} />}
          </div>
        )}

        <div className="relative z-10 space-y-3">
          {others.map((leader, idx) => {
            const isCurrentUser = user?.uid === leader.userId;
            const rankInGlobal = idx + 4; // Because top 3 is separated
            
            let bgClass = "bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-md";
            if (isCurrentUser) {
              bgClass = `bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-500/20`;
            }

            return (
              <motion.div
                key={leader.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (idx * 0.05) + 0.4 }}
                onClick={() => setSelectedUser(leader)}
                className={`flex items-center gap-3 sm:gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${bgClass}`}
              >
                <div className={`w-10 text-center shrink-0`}>
                    <span className={`text-lg font-black ${isCurrentUser ? 'text-blue-500' : 'text-slate-400'}`}>#{rankInGlobal}</span>
                </div>
                
                {leader.photoURL ? (
                  <img src={leader.photoURL} alt={leader.displayName} className={`w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover group-hover:scale-105 transition-transform`} />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black border-2 border-white shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 group-hover:scale-105 transition-transform`}>
                    {leader.displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className={`font-black text-slate-800 text-base truncate`}>
                    {leader.displayName}
                    {isCurrentUser && <span className="ml-2 text-[10px] font-black uppercase text-white bg-blue-500 px-2 py-0.5 rounded-lg shadow-sm">Sen</span>}
                  </p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {leader.totalTrials} Deneme
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-xl sm:text-2xl font-black font-mono tracking-tighter ${isCurrentUser ? 'text-blue-500' : 'text-slate-800'}`}>
                    {leader.averageNet.toFixed(2)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
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
