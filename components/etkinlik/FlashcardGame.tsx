"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPoint, MapTopic } from "@/lib/mapData";
import { ArrowLeft, ArrowRight, Shuffle, Repeat, CheckCircle2, XCircle, X } from "lucide-react";

// Aynı görsel stilleri tekrar kullanalım
const TYPE_VISUALS: Record<string, { bg: string; border: string; text: string; glow: string; icon: string }> = {
  tektonik: { bg: "bg-[#1cb0f6]", border: "border-[#1899d6]", text: "text-[#1cb0f6]", glow: "shadow-blue-500/40", icon: "🌊" },
  karstik: { bg: "bg-[#2bced6]", border: "border-[#20aeb5]", text: "text-[#2bced6]", glow: "shadow-cyan-500/40", icon: "💧" },
  volkanik: { bg: "bg-[#ff4b4b]", border: "border-[#e04343]", text: "text-[#ff4b4b]", glow: "shadow-red-500/40", icon: "🌋" },
  heyelan: { bg: "bg-[#ff9600]", border: "border-[#e08400]", text: "text-[#ff9600]", glow: "shadow-orange-500/40", icon: "🪨" },
  aluvyal: { bg: "bg-[#58cc02]", border: "border-[#46a302]", text: "text-[#58cc02]", glow: "shadow-emerald-500/40", icon: "🌿" },
  kiyi: { bg: "bg-[#00c1ac]", border: "border-[#00a392]", text: "text-[#00c1ac]", glow: "shadow-teal-500/40", icon: "🏖️" },
  karma: { bg: "bg-[#ce82ff]", border: "border-[#b16be0]", text: "text-[#ce82ff]", glow: "shadow-purple-500/40", icon: "🔄" },
  kivrim: { bg: "bg-[#8965f0]", border: "border-[#6f50c8]", text: "text-[#8965f0]", glow: "shadow-indigo-500/40", icon: "〰️" },
  kirik: { bg: "bg-[#ffc800]", border: "border-[#e0b000]", text: "text-[#ffc800]", glow: "shadow-yellow-500/40", icon: "⚡" },
  plato: { bg: "bg-[#58cc02]", border: "border-[#46a302]", text: "text-[#58cc02]", glow: "shadow-lime-600/40", icon: "🌄" },
};

function getTypeVisual(type: string) {
  return TYPE_VISUALS[type] ?? { bg: "bg-slate-500", border: "border-slate-400", text: "text-slate-600", glow: "shadow-slate-500/40", icon: "📌" };
}

function formatName(name: string) {
  return name.replace(/\s+(Dağları|Dağı|Dağ|Gölü|Göl)\s*$/i, "");
}

// ── Progress Bar ──
function ProgressBar({ progress, total }: { progress: number; total: number }) {
  const pct = total > 0 ? (progress / total) * 100 : 0;
  
  return (
    <div className="flex-1 max-w-2xl mx-auto h-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
      <motion.div 
        className="h-full bg-[#58cc02] rounded-full relative"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full" />
      </motion.div>
    </div>
  );
}

export default function FlashcardGame({ topic, onQuit }: { topic: MapTopic, onQuit?: () => void }) {
  const [queue, setQueue] = useState<MapPoint[]>([]);
  const [learnedCount, setLearnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const initGame = () => {
    const shuffled = [...topic.points];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQueue(shuffled);
    setTotalCount(shuffled.length);
    setLearnedCount(0);
    setIsFlipped(false);
  };

  useEffect(() => {
    initGame();
  }, [topic]);

  const handleCorrect = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setQueue(prev => prev.slice(1));
      setLearnedCount(prev => prev + 1);
    }, 150);
  };

  const handleWrongOrPass = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setQueue(prev => {
        if (prev.length <= 1) return prev; // If only 1 left, don't just flash it
        const newQ = [...prev];
        const item = newQ.shift();
        if (item) newQ.push(item);
        return newQ;
      });
    }, 150);
  };

  if (totalCount > 0 && queue.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-900 p-4">
        <div className="w-32 h-32 bg-[#58cc02] rounded-[2.5rem] border-b-[8px] border-[#46a302] flex items-center justify-center mx-auto mb-8 animate-bounce">
          <CheckCircle2 className="w-16 h-16 text-white" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-[#58cc02] mb-4 text-center">Harika İş Çıkardın!</h2>
        <p className="text-xl text-slate-500 font-bold mb-12 text-center max-w-md">
          Bu kategorideki tüm kartları başarıyla öğrendin.
        </p>
        
        <div className="w-full max-w-md flex flex-col gap-4">
          <button
            onClick={initGame}
            className="w-full py-4 rounded-2xl font-black text-white text-lg bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#1899d6] hover:border-[#1cb0f6] hover:translate-y-1 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-2"
          >
            Yeniden Öğren
          </button>
          <button
            onClick={onQuit}
            className="w-full py-4 rounded-2xl font-black text-[#1cb0f6] text-lg border-2 border-[#1cb0f6] bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            Kategorilere Dön
          </button>
        </div>
      </div>
    );
  }

  if (queue.length === 0) return null;

  const currentCard = queue[0];
  const visual = getTypeVisual(currentCard.type);

  return (
    <div className="flex flex-col w-full h-full min-h-[80vh] relative">
      
      {/* ── Game Header ── */}
      <div className="flex items-center gap-4 py-4 px-4 sm:px-8 w-full max-w-5xl mx-auto z-10">
        <button 
          onClick={onQuit}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
        <ProgressBar progress={learnedCount} total={totalCount} />
        <div className="w-8 h-8 flex items-center justify-center font-black text-gray-400">
          {learnedCount}/{totalCount}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md mx-auto px-4 mt-8 pb-32">
        
        {/* 3D Kart Alanı */}
        <div 
          className="relative w-full aspect-[3/4] max-h-[500px] cursor-pointer group"
          style={{ perspective: "1500px" }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="w-full h-full relative preserve-3d"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Ön Yüz (Soru) */}
            <div 
              className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-[3rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border-4 border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white leading-tight mb-8">
                {formatName(currentCard.name)}
              </h2>
              <div className="w-20 h-20 rounded-[1.5rem] bg-gray-100 dark:bg-slate-700 flex items-center justify-center mt-8 border-b-4 border-gray-200">
                <span className="text-4xl font-black text-gray-300">?</span>
              </div>
            </div>

            {/* Arka Yüz (Cevap) */}
            <div 
              className={`absolute inset-0 backface-hidden ${visual.bg} rounded-[3rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center p-8 text-center border-b-[8px] ${visual.border}`}
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-[2rem] flex items-center justify-center mb-10 shadow-xl border-b-4 border-white/30">
                <span className="text-6xl drop-shadow-md">{visual.icon}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-sm">
                {formatName(currentCard.name)}
              </h2>
              <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-[2rem] mt-6 shadow-inner border border-white/30 text-center min-w-[200px]">
                <span className="block text-2xl font-black text-white uppercase tracking-widest drop-shadow-sm">
                  {currentCard.type}
                </span>
                {currentCard.description && (
                  <span className="block text-sm text-white/90 mt-2 font-bold bg-black/10 rounded-xl py-2 px-4">
                    📍 {currentCard.description}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>

      </div>

      {/* ── Bottom Drawer / Actions ── */}
      <AnimatePresence>
        {isFlipped ? (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100, transition: { duration: 0.2 } }}
            className="fixed bottom-0 left-0 w-full z-50 bg-white dark:bg-slate-900 border-t-2 border-gray-200 dark:border-slate-800 p-4 pb-8"
          >
            <div className="max-w-2xl mx-auto flex items-center gap-4">
              <button
                onClick={handleWrongOrPass}
                className="flex-1 py-4 rounded-2xl bg-white dark:bg-slate-800 text-[#ff4b4b] border-2 border-gray-200 dark:border-slate-700 hover:bg-red-50 hover:border-[#ff4b4b] border-b-4 font-black text-lg uppercase tracking-wider transition-all hover:translate-y-1 active:border-b-2 active:translate-y-2 flex flex-col items-center justify-center gap-1"
              >
                TKRARLA
              </button>

              <button
                onClick={handleCorrect}
                className="flex-1 py-4 rounded-2xl bg-[#58cc02] text-white border-b-4 border-[#46a302] font-black text-lg uppercase tracking-wider transition-all hover:translate-y-1 active:border-b-2 active:translate-y-2 flex flex-col items-center justify-center gap-1"
              >
                BİLİYORUM
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100, transition: { duration: 0.2 } }}
            className="fixed bottom-0 left-0 w-full z-50 bg-white dark:bg-slate-900 border-t-2 border-gray-200 dark:border-slate-800 p-4 pb-8"
          >
            <div className="max-w-2xl mx-auto flex items-center justify-center h-[72px]">
              <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">Cevabı Görmek İçin Karta Dokunun</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
