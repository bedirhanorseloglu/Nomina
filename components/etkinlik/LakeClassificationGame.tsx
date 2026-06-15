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
import { Heart, RefreshCw, Trophy, AlertCircle, Lightbulb, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
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
  const [gameState, setGameState] = useState<"playing" | "end">("playing");
  const [questions, setQuestions] = useState<{ lake: LakeItem, options: LakeType[] }[]>(() => {
    const shuffledLakes = shuffle(CLASSIFICATION_LAKES).slice(0, QUESTIONS_PER_GAME);
    const allTypes = Object.keys(LAKE_TYPE_LABELS) as LakeType[];
    return shuffledLakes.map(lake => {
      const wrongTypes = shuffle(allTypes.filter(t => t !== lake.type)).slice(0, 3);
      const options = shuffle([lake.type, ...wrongTypes]);
      return { lake, options };
    });
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [failsOnCurrent, setFailsOnCurrent] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<LakeItem[]>([]);
  
  // Animasyon state'leri
  const [animatingOption, setAnimatingOption] = useState<{ type: LakeType, isCorrect: boolean } | null>(null);

  const startGame = () => {
    const shuffledLakes = shuffle(CLASSIFICATION_LAKES).slice(0, QUESTIONS_PER_GAME);
    const allTypes = Object.keys(LAKE_TYPE_LABELS) as LakeType[];
    
    const newQuestions = shuffledLakes.map(lake => {
      const wrongTypes = shuffle(allTypes.filter(t => t !== lake.type)).slice(0, 3);
      const options = shuffle([lake.type, ...wrongTypes]);
      return { lake, options };
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setFailsOnCurrent(0);
    setWrongAnswers([]);
    setGameState("playing");
  };

  const handleDontKnow = () => {
    if (animatingOption) return;
    
    const currentQ = questions[currentIndex];
    
    // Add it to wrong answers so they can review it at the end
    if (!wrongAnswers.find(w => w.id === currentQ.lake.id)) {
      setWrongAnswers(prev => [...prev, currentQ.lake]);
    }

    // Push it to the end of the array to face it again
    setQuestions(prev => [...prev, currentQ]);
    
    setCurrentIndex(i => i + 1);
    setFailsOnCurrent(0);
  };

  const handleOptionClick = (selectedType: LakeType) => {
    if (animatingOption) return; // Prevent clicking while animating

    const currentQ = questions[currentIndex];
    const isCorrect = selectedType === currentQ.lake.type;

    setAnimatingOption({ type: selectedType, isCorrect });

    setTimeout(() => {
      setAnimatingOption(null);

      if (isCorrect) {
        if (failsOnCurrent === 0) {
          setCorrectCount(c => c + 1);
        }
        
        if (currentIndex + 1 >= questions.length) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          setGameState("end");
        } else {
          setCurrentIndex(i => i + 1);
          setFailsOnCurrent(0);
        }
      } else {
        setWrongCount(w => w + 1);
        setFailsOnCurrent(f => f + 1);
        if (!wrongAnswers.find(w => w.id === currentQ.lake.id)) {
          setWrongAnswers(prev => [...prev, currentQ.lake]);
        }
      }
    }, 1000);
  };

  if (gameState === "end") {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-[0_8px_0_0_rgba(0,0,0,0.2)] mb-8 bg-yellow-400">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2">
          Egzersiz Tamamlandı!
        </h1>
        <p className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-8 flex items-center justify-center gap-4">
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
  const showHint = failsOnCurrent >= 1;

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
      
      {/* ── Header Bar ── */}
      <div className="w-full flex items-center justify-between mb-8 px-4">
        {/* Progress */}
        <div className="flex items-center gap-3 flex-1">
          <span className="font-black text-slate-400">
            {Math.min(currentIndex + 1, QUESTIONS_PER_GAME)}/{QUESTIONS_PER_GAME}
          </span>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full flex-1 overflow-hidden">
            <motion.div 
              className="h-full bg-[#58cc02] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(Math.min(currentIndex, QUESTIONS_PER_GAME) / QUESTIONS_PER_GAME) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 ml-6 font-black text-lg">
          <div className="flex items-center gap-1.5 text-[#58cc02]">
            <CheckCircle2 className="w-6 h-6" /> {correctCount}
          </div>
          <div className="flex items-center gap-1.5 text-red-500">
            <XCircle className="w-6 h-6" /> {wrongCount}
          </div>
        </div>
      </div>

      {/* ── Question Area ── */}
      <div className="w-full flex flex-col items-center mb-10">
        <span className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">
          Hangi Oluşum Türüne Ait?
        </span>
        <motion.div 
          key={currentQ.lake.id}
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white px-8 py-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 text-center"
        >
          {currentQ.lake.name.replace(/\s+(Gölü|Göl)\s*$/i, "")} Gölü
        </motion.div>
      </div>

      {/* ── Hint Area ── */}
      <AnimatePresence>
        {showHint && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-2xl mb-8 px-4"
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
              onClick={() => handleOptionClick(opt)}
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

              <div className={`text-4xl md:text-5xl mb-3 transition-opacity ${isAnimatingThis ? 'opacity-0' : 'opacity-100'}`}>
                {colors.icon}
              </div>
              <span className={`text-lg md:text-xl font-black text-center transition-colors
                ${isCorrect || isWrong ? 'text-transparent' : 'text-slate-700 dark:text-slate-200'}
              `}>
                {LAKE_TYPE_LABELS[opt]}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ── Skip / Don't Know Button ── */}
      <div className="mt-8">
        <button
          onClick={handleDontKnow}
          disabled={!!animatingOption}
          className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <HelpCircle className="w-5 h-5" /> Emin Değilim
        </button>
      </div>
    </div>
  );
}
