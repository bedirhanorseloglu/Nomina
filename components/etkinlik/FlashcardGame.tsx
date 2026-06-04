"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPoint, MapTopic } from "@/lib/mapData";
import { ArrowLeft, ArrowRight, Shuffle, Repeat, CheckCircle2, XCircle } from "lucide-react";

// Aynı görsel stilleri tekrar kullanalım
const TYPE_VISUALS: Record<string, { bg: string; border: string; text: string; glow: string; icon: string }> = {
  tektonik: { bg: "bg-blue-500", border: "border-blue-400", text: "text-blue-100", glow: "shadow-blue-500/40", icon: "🌊" },
  karstik: { bg: "bg-cyan-500", border: "border-cyan-400", text: "text-cyan-100", glow: "shadow-cyan-500/40", icon: "💧" },
  volkanik: { bg: "bg-red-500", border: "border-red-400", text: "text-red-100", glow: "shadow-red-500/40", icon: "🌋" },
  heyelan: { bg: "bg-amber-500", border: "border-amber-400", text: "text-amber-100", glow: "shadow-amber-500/40", icon: "🪨" },
  aluvyal: { bg: "bg-emerald-500", border: "border-emerald-400", text: "text-emerald-100", glow: "shadow-emerald-500/40", icon: "🌿" },
  kiyi: { bg: "bg-teal-500", border: "border-teal-400", text: "text-teal-100", glow: "shadow-teal-500/40", icon: "🏖️" },
  karma: { bg: "bg-purple-500", border: "border-purple-400", text: "text-purple-100", glow: "shadow-purple-500/40", icon: "🔄" },
  kivrim: { bg: "bg-indigo-500", border: "border-indigo-400", text: "text-indigo-100", glow: "shadow-indigo-500/40", icon: "〰️" },
  kirik: { bg: "bg-orange-500", border: "border-orange-400", text: "text-orange-100", glow: "shadow-orange-500/40", icon: "⚡" },
  plato: { bg: "bg-lime-600", border: "border-lime-500", text: "text-lime-100", glow: "shadow-lime-600/40", icon: "🌄" },
};

function getTypeVisual(type: string) {
  return TYPE_VISUALS[type] ?? { bg: "bg-slate-500", border: "border-slate-400", text: "text-slate-100", glow: "shadow-slate-500/40", icon: "📌" };
}

function formatName(name: string) {
  return name.replace(/\s+(Dağları|Dağı|Dağ|Gölü|Göl)\s*$/i, "");
}

export default function FlashcardGame({ topic }: { topic: MapTopic }) {
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

  const handleShuffle = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setQueue(prev => {
        const shuffled = [...prev];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      });
    }, 150);
  };

  if (totalCount > 0 && queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto py-16 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-teal-500/30 mb-6"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Tebrikler!</h2>
        <p className="text-lg text-slate-500 mb-8">Bu kategorideki tüm kartları başarıyla öğrendiniz.</p>
        <button 
          onClick={initGame}
          className="flex items-center gap-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <Repeat className="w-5 h-5" /> Yeniden Başla
        </button>
      </div>
    );
  }

  if (queue.length === 0) return null;

  const currentCard = queue[0];
  const visual = getTypeVisual(currentCard.type);
  const progressPct = (learnedCount / totalCount) * 100;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-8">
      
      {/* İlerleme Çubuğu */}
      <div className="w-full max-w-sm mb-8">
        <div className="flex items-center justify-between text-sm font-bold text-slate-500 mb-3">
          <div className="flex items-center gap-4">
            <span>Öğrenilen: <span className="text-emerald-500">{learnedCount}</span></span>
            <span>Kalan: <span className="text-orange-500">{queue.length}</span></span>
          </div>
          <button 
            onClick={handleShuffle}
            className="flex items-center gap-1.5 hover:text-blue-500 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm"
          >
            <Shuffle className="w-4 h-4" /> Karıştır
          </button>
        </div>
        <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 3D Kart Alanı */}
      <div 
        className="relative w-full max-w-sm h-[400px] cursor-pointer group"
        style={{ perspective: "1000px" }}
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
            className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-6 shadow-inner">
              <span className="text-3xl font-black text-slate-400">?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white leading-tight mb-4">
              {formatName(currentCard.name)}
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-auto bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full flex items-center gap-2">
              <Shuffle className="w-4 h-4" /> Çevirmek için tıkla
            </p>
          </div>

          {/* Arka Yüz (Cevap) */}
          <div 
            className={`absolute inset-0 backface-hidden ${visual.bg} rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 text-center border-4 ${visual.border}`}
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/30">
              <span className="text-5xl drop-shadow-md">{visual.icon}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2 drop-shadow-sm">
              {formatName(currentCard.name)}
            </h2>
            <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full mt-6 shadow-inner border border-white/30">
              <span className="text-lg font-bold text-white uppercase tracking-widest drop-shadow-sm">
                {currentCard.type}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigasyon Butonları */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="flex items-center gap-3 mt-8 w-full max-w-sm"
          >
            <button
              onClick={handleWrongOrPass}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white dark:bg-slate-800 text-red-500 shadow-md hover:bg-red-50 hover:border-red-200 border border-transparent transition-all hover:-translate-y-1 active:translate-y-0"
            >
              <XCircle className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">Yanlış</span>
            </button>

            <button
              onClick={handleWrongOrPass}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 shadow-md hover:bg-slate-50 hover:border-slate-200 border border-transparent transition-all hover:-translate-y-1 active:translate-y-0"
            >
              <ArrowRight className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">Pas</span>
            </button>

            <button
              onClick={handleCorrect}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-400 transition-all hover:-translate-y-1 active:translate-y-0"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">Doğru</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isFlipped && (
        <div className="h-[84px] mt-8 flex items-center justify-center">
          <p className="text-slate-400 text-sm font-medium animate-pulse">Cevaplamak için kartı çevirin</p>
        </div>
      )}

    </div>
  );
}
