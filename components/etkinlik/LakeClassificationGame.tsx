"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LakeType, 
  LakeItem, 
  CLASSIFICATION_LAKES, 
  LAKE_TYPE_LABELS, 
  LAKE_TYPE_HINTS 
} from "@/lib/lakeClassificationData";
import { Heart, RefreshCw, Trophy, AlertCircle, Lightbulb, CheckCircle2, XCircle, HelpCircle, HeartPulse, Star } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

const TYPE_COLORS: Record<LakeType, { bg: string, text: string, border: string, icon: string }> = {
  tektonik: { bg: "bg-[#1cb0f6]", text: "text-[#1cb0f6]", border: "border-[#1899d6]", icon: "💥" },
  volkanik: { bg: "bg-[#ff4b4b]", text: "text-[#ff4b4b]", border: "border-[#e04343]", icon: "🌋" },
  karstik: { bg: "bg-[#2bced6]", text: "text-[#2bced6]", border: "border-[#20aeb5]", icon: "💧" },
  buzul: { bg: "bg-[#7dd3fc]", text: "text-[#0ea5e9]", border: "border-[#38bdf8]", icon: "🧊" },
  karma: { bg: "bg-[#ce82ff]", text: "text-[#b16be0]", border: "border-[#b16be0]", icon: "🔄" },
  heyelan_set: { bg: "bg-[#ff9600]", text: "text-[#e08400]", border: "border-[#e08400]", icon: "🪨" },
  aluvyal_set: { bg: "bg-[#58cc02]", text: "text-[#46a302]", border: "border-[#46a302]", icon: "🌿" },
  volkanik_set: { bg: "bg-[#f59e0b]", text: "text-[#d97706]", border: "border-[#d97706]", icon: "🔥" },
  kiyi_set: { bg: "bg-[#00c1ac]", text: "text-[#00a392]", border: "border-[#00a392]", icon: "🏖️" },
  traverten_set: { bg: "bg-[#d6d3d1]", text: "text-[#78716c]", border: "border-[#a8a29e]", icon: "🧱" },
  baraj: { bg: "bg-[#475569]", text: "text-[#334155]", border: "border-[#334155]", icon: "🏗️" },
};

// Toplam kaç soru sorulacak
const QUESTIONS_PER_GAME = 10;

function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function LakeClassificationGame({ onComplete, onBack }: { onComplete?: () => void; onBack?: () => void }) {
  const [gameState, setGameState] = useState<"playing" | "review_transition" | "end">("playing");
  const [questions, setQuestions] = useState<{ lake: LakeItem, options: LakeType[] }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [hintRevealedOnCurrent, setHintRevealedOnCurrent] = useState(false);
  const [lakeFails, setLakeFails] = useState<Record<string, number>>({});
  const [wrongAnswers, setWrongAnswers] = useState<LakeItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [scoreDelta, setScoreDelta] = useState<{ val: string, id: number, type: 'up' | 'down' } | null>(null);

  // Animasyon state'leri
  const [animatingOption, setAnimatingOption] = useState<{ type: LakeType, isCorrect: boolean } | null>(null);

  // Init oyunu
  const startGame = () => {
    const shuffledLakes = shuffle(CLASSIFICATION_LAKES).slice(0, QUESTIONS_PER_GAME);
    const allTypes = Object.keys(LAKE_TYPE_LABELS) as LakeType[];
    const initQuestions = shuffledLakes.map(lake => {
      const wrongTypes = shuffle(allTypes.filter(t => t !== lake.type)).slice(0, 3);
      const options = shuffle([lake.type, ...wrongTypes]);
      return { lake, options };
    });
    setQuestions(initQuestions);
    setCurrentIndex(0);
    setScore(0);
    setCompletedCount(0);
    setCorrectCount(0);
    setWrongCount(0);
    setHintRevealedOnCurrent(false);
    setLakeFails({});
    setWrongAnswers([]);
    setGameState("playing");
  };

  useEffect(() => {
    setIsMounted(true);
    startGame();
  }, []);

  if (!isMounted || questions.length === 0) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#58cc02] rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleGetHint = (e: React.MouseEvent) => {
    if (animatingOption) return;
    
    setScoreDelta({ val: "-3", id: Date.now(), type: 'down' });
    // Decrease score, show hint, do not skip
    setScore(s => Math.max(0, s - 3));
    setHintRevealedOnCurrent(true);
  };

  const handleOptionClick = (e: React.MouseEvent, selectedType: LakeType) => {
    if (animatingOption) return; // Prevent clicking while animating

    const currentQ = questions[currentIndex];
    const isCorrect = selectedType === currentQ.lake.type;

    setAnimatingOption({ type: selectedType, isCorrect });

    setTimeout(() => {
      setAnimatingOption(null);

      if (isCorrect) {
        setCompletedCount(c => c + 1);
        // If they never failed this lake, it counts as correct
        if (!lakeFails[currentQ.lake.id]) {
          setCorrectCount(c => c + 1);
          setScore(s => s + 10);
          setScoreDelta({ val: "+10", id: Date.now(), type: 'up' });
        } else {
          setScore(s => s + 5); // They get some points for getting it right on review
          setScoreDelta({ val: "+5", id: Date.now(), type: 'up' });
        }
        
        if (currentIndex + 1 >= questions.length) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          setGameState("end");
        } else {
          const nextIndex = currentIndex + 1;
          if (nextIndex === QUESTIONS_PER_GAME && nextIndex < questions.length) {
            setGameState("review_transition");
          }
          setCurrentIndex(nextIndex);
        }
        setHintRevealedOnCurrent(false);
      } else {
        // Only increment wrong count if they haven't failed it before (don't double penalize)
        if (!lakeFails[currentQ.lake.id]) {
          setWrongCount(w => w + 1);
          setScore(s => Math.max(0, s - 5));
          setScoreDelta({ val: "-5", id: Date.now(), type: 'down' });
        }
        setLakeFails(prev => ({ ...prev, [currentQ.lake.id]: (prev[currentQ.lake.id] || 0) + 1 }));
        
        if (!wrongAnswers.find(w => w.id === currentQ.lake.id)) {
          setWrongAnswers(prev => [...prev, currentQ.lake]);
        }

        // Push to end and skip
        setQuestions(prev => [...prev, currentQ]);
        const nextIndex = currentIndex + 1;
        if (nextIndex === QUESTIONS_PER_GAME) {
          setGameState("review_transition");
        }
        setCurrentIndex(nextIndex);
        setHintRevealedOnCurrent(false);
      }
    }, 1000);
  };

  if (gameState === "review_transition") {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto flex flex-col items-center justify-center text-center p-8 bg-[#ffc800]/10 border-2 border-[#ffc800] rounded-[2rem] shadow-sm"
      >
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-[0_8px_0_0_rgba(0,0,0,0.1)] mb-8 bg-[#ffc800]">
          <HeartPulse className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mb-4">
          Hadi hatalarını gözden geçirelim!
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-bold mb-8">
          Yanlış yaptığın veya emin olmadığın gölleri tekrar edeceğiz. Bu sefer başaracaksın!
        </p>
        <button 
          onClick={() => setGameState("playing")}
          className="w-full sm:w-auto px-8 py-4 bg-[#ffc800] text-white font-black uppercase rounded-2xl border-b-4 border-[#cc9e00] active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 hover:bg-[#ffb000]"
        >
          Devam Et
        </button>
      </motion.div>
    );
  }

  if (gameState === "end") {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-[0_8px_0_0_rgba(0,0,0,0.2)] mb-8 bg-yellow-400">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white mb-2">
          Egzersiz Tamamlandı!
        </h1>
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-2xl sm:text-3xl font-black text-yellow-500 mb-6 bg-yellow-100 dark:bg-yellow-500/20 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border-b-4 border-yellow-200 dark:border-yellow-900/50">
          <Star className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> Toplam Puan: {score}
        </div>
        <p className="text-lg sm:text-xl font-bold text-slate-500 dark:text-slate-400 mb-8 flex items-center justify-center gap-4">
          <span className="flex items-center gap-2 text-[#58cc02]"><CheckCircle2 className="w-6 h-6" /> {correctCount} Doğru</span>
          <span className="flex items-center gap-2 text-red-500"><XCircle className="w-6 h-6" /> {wrongCount} Hata</span>
        </p>

        {wrongAnswers.length > 0 && (
          <div className="w-full bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700 mb-8 text-left">
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Gözden Geçirmen Gerekenler
            </h3>
            <div className="flex flex-col gap-3">
              {wrongAnswers.map(w => (
                <div key={w.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{w.name}</span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 px-3 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    {LAKE_TYPE_LABELS[w.type]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center">
          {onBack ? (
            <button onClick={onBack} className="px-6 py-3 bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold uppercase rounded-2xl hover:bg-slate-300 transition-colors">
              Menüye Dön
            </button>
          ) : (
            <Link href="/etkinlik" className="px-6 py-3 bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold uppercase rounded-2xl hover:bg-slate-300 transition-colors">
              Geri Dön
            </Link>
          )}
          <button 
            onClick={startGame}
            className="px-6 py-3 bg-[#58cc02] text-white font-black uppercase rounded-2xl border-b-4 border-[#46a302] active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Tekrar Oyna
          </button>
          {onComplete && (
            <button 
              onClick={onComplete}
              className="px-6 py-3 bg-[#1cb0f6] text-white font-black uppercase rounded-2xl border-b-4 border-[#1899d6] active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
            >
              2. Aşamaya Geç
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const hintVisible = hintRevealedOnCurrent || (lakeFails[currentQ?.lake?.id] || 0) >= 1;

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
      
      {/* ── Header Bar ── */}
      <div className="w-full flex items-center justify-between mb-8 px-4">
        {/* Progress */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          <span className="font-black text-slate-400 text-sm sm:text-base">
            {completedCount}/{QUESTIONS_PER_GAME}
          </span>
          <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700 rounded-full flex-1 overflow-hidden">
            <motion.div 
              className="h-full bg-[#58cc02] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / QUESTIONS_PER_GAME) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 sm:gap-4 ml-4 sm:ml-6 font-black text-base sm:text-lg">
          <div className="relative flex items-center gap-1 sm:gap-2 text-yellow-500 bg-yellow-100 dark:bg-yellow-500/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border-b-4 border-yellow-200 dark:border-yellow-900/50">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> <span className="hidden sm:inline">Puan:</span> 
            <motion.span
              key={score}
              initial={{ scale: 1.5, color: scoreDelta?.type === 'up' ? "#58cc02" : scoreDelta?.type === 'down' ? "#ef4444" : undefined }}
              animate={{ scale: 1, color: "" }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              {score}
            </motion.span>
            
            <AnimatePresence>
              {scoreDelta && (
                <motion.div
                  key={scoreDelta.id}
                  initial={{ opacity: 0, y: 10, scale: 0.5 }}
                  animate={{ opacity: 1, y: -30, scale: 1.2 }}
                  exit={{ opacity: 0, y: -40, scale: 1 }}
                  transition={{ duration: 1 }}
                  onAnimationComplete={() => setScoreDelta(null)}
                  className={`absolute -top-4 right-0 font-black text-2xl drop-shadow-sm ${scoreDelta.type === 'up' ? 'text-[#58cc02]' : 'text-red-500'}`}
                >
                  {scoreDelta.val}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1.5 text-[#58cc02] opacity-60 text-sm hidden sm:flex">
            <CheckCircle2 className="w-5 h-5" /> {correctCount}
          </div>
          <div className="flex items-center gap-1.5 text-red-500 opacity-60 text-sm hidden sm:flex">
            <XCircle className="w-5 h-5" /> {wrongCount}
          </div>
        </div>
      </div>

      {/* ── Question Area ── */}
      <div className="w-full flex flex-col items-center mb-10">
        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-2">
          Hangi Oluşum Türüne Ait?
        </span>
        <motion.div 
          key={currentQ.lake.id}
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 dark:text-white px-6 py-4 sm:px-8 sm:py-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 text-center w-full sm:w-auto"
        >
          {currentQ.lake.name.replace(/\s+(Gölü|Göl)\s*$/i, "")} Gölü
        </motion.div>
      </div>

      {/* ── Hint Area ── */}
      <AnimatePresence>
        {hintVisible && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-2xl mb-8 px-4 relative"
          >
            <div className="bg-yellow-50 dark:bg-yellow-500/10 border-2 border-yellow-200 dark:border-yellow-900/50 rounded-2xl p-4 flex gap-4 items-start">
              <div className="w-10 h-10 bg-yellow-400 text-white rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_0_0_#ca8a04]">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-yellow-800 dark:text-yellow-500 font-black uppercase tracking-widest text-xs mb-1">
                  İpucu
                </span>
                <p className="text-yellow-700 dark:text-yellow-400 font-medium leading-relaxed">
                  {currentQ.lake.customHint || LAKE_TYPE_HINTS[currentQ.lake.type]}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Options (Buckets) ── */}
      <div className="w-full grid grid-cols-2 gap-4 md:gap-6 px-4 max-w-3xl">
        {currentQ.options.map((opt) => {
          const colors = TYPE_COLORS[opt];
          const isAnimatingThis = animatingOption?.type === opt;
          const isCorrect = isAnimatingThis && animatingOption.isCorrect;
          const isWrong = isAnimatingThis && !animatingOption.isCorrect;

          return (
            <motion.button
              key={opt}
              onClick={(e) => handleOptionClick(e, opt)}
              disabled={!!animatingOption}
              animate={isWrong ? { x: [-8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`relative flex flex-col items-center justify-center p-6 md:p-8 rounded-[2rem] border-b-[8px] transition-all
                ${isCorrect ? 'bg-[#58cc02] border-[#46a302] scale-105' : 
                  isWrong ? 'bg-red-500 border-red-700 scale-95 opacity-80' : 
                  'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:-translate-y-1 active:translate-y-1 active:border-b-0'}
              `}
            >
              {isCorrect && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="absolute inset-0 flex items-center justify-center z-10"
                >
                  <CheckCircle2 className="w-16 h-16 text-white drop-shadow-md" />
                </motion.div>
              )}
              {isWrong && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="absolute inset-0 flex items-center justify-center z-10"
                >
                  <XCircle className="w-16 h-16 text-white drop-shadow-md" />
                </motion.div>
              )}

              <div className={`text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 transition-opacity ${isAnimatingThis ? 'opacity-0' : 'opacity-100'}`}>
                {colors.icon}
              </div>
              <span className={`text-base sm:text-lg md:text-xl font-black text-center transition-colors
                ${isCorrect || isWrong ? 'text-transparent' : 'text-slate-700 dark:text-slate-200'}
              `}>
                {LAKE_TYPE_LABELS[opt]}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ── Hint Button ── */}
      {!hintVisible && (
        <div className="mt-8">
          <button
            onClick={handleGetHint}
            disabled={!!animatingOption}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 font-bold uppercase rounded-2xl hover:bg-yellow-200 dark:hover:bg-yellow-900/50 border-b-4 border-yellow-200 dark:border-yellow-900/50 active:translate-y-1 active:border-b-0 transition-all"
          >
            <Lightbulb className="w-5 h-5" /> İpucu Al (-3 Puan)
          </button>
        </div>
      )}
    </div>
  );
}
