"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Flame, Plus, Check } from "lucide-react";
import { format } from "date-fns";

type Props = {
  dailyGoals: Record<string, number>;
  dailyGoalTarget: number;
  streak: number;
  onUpdateGoal: (date: string, solved: number) => void;
  onSetTarget: (target: number) => void;
};

export default function DailyGoalWidget({ dailyGoals, dailyGoalTarget, streak, onUpdateGoal, onSetTarget }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const todaySolved = dailyGoals[today] || 0;
  
  const [inputVal, setInputVal] = useState("");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(dailyGoalTarget.toString());

  const progress = dailyGoalTarget > 0 ? Math.min((todaySolved / dailyGoalTarget) * 100, 100) : 0;
  const isCompleted = todaySolved >= dailyGoalTarget && dailyGoalTarget > 0;

  const handleAdd = () => {
    const val = parseInt(inputVal);
    if (!isNaN(val) && val > 0) {
      onUpdateGoal(today, todaySolved + val);
      setInputVal("");
    }
  };

  const handleSaveTarget = () => {
    const val = parseInt(targetInput);
    if (!isNaN(val) && val > 0) {
      onSetTarget(val);
      setIsEditingTarget(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-[2rem] p-6 border border-white dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none relative overflow-hidden group">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 shadow-inner">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Günlük Soru Hedefi</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Streak Koruması</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-900/30">
          <Flame className={`w-4 h-4 ${(streak || 0) > 0 ? "text-orange-500" : "text-orange-300 dark:text-orange-700"}`} />
          <span className="text-sm font-black text-orange-600">{streak || 0} Gün</span>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black font-mono tracking-tighter text-slate-800 dark:text-slate-100">{todaySolved}</span>
            <span className="text-sm font-bold text-slate-400">/ 
              {isEditingTarget ? (
                <input 
                  type="number"
                  value={targetInput}
                  onChange={e => setTargetInput(e.target.value)}
                  onBlur={handleSaveTarget}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTarget()}
                  className="w-16 ml-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100 outline-none"
                  autoFocus
                />
              ) : (
                <span className="cursor-pointer hover:text-slate-600 transition-colors ml-1" onClick={() => setIsEditingTarget(true)}>{dailyGoalTarget} Soru</span>
              )}
            </span>
          </div>
          {isCompleted && (
             <span className="text-xs font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">Tamamlandı! 🎉</span>
          )}
        </div>

        <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            className={`h-full rounded-full ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <input 
            type="number"
            placeholder="Kaç soru çözdün?"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-orange-300 transition-all"
          />
          <button 
            onClick={handleAdd}
            disabled={!inputVal}
            className="bg-slate-900 dark:bg-slate-700 text-white dark:text-slate-100 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
