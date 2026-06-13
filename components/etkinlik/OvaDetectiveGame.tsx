"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Search, Lightbulb, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { OVA_DETECTIVE_QUESTIONS } from "@/lib/ovaData";

interface OvaDetectiveGameProps {
  onComplete: () => void;
}

export default function OvaDetectiveGame({ onComplete }: OvaDetectiveGameProps) {
  const [questions] = useState(() => {
    return [...OVA_DETECTIVE_QUESTIONS].sort(() => Math.random() - 0.5);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedClues, setRevealedClues] = useState(1);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentQuestion = questions[currentIndex];
  const maxClues = currentQuestion?.clues.length || 4;
  const currentPotentialPoints = 100 - (revealedClues - 1) * 25;

  // Reset state when question changes
  useEffect(() => {
    setRevealedClues(1);
    setSelectedOption(null);
    setIsCorrect(null);
  }, [currentIndex]);

  if (!currentQuestion) {
    return (
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 border-2 border-slate-200 dark:border-slate-700 text-center max-w-2xl mx-auto shadow-sm">
        <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
          <Trophy className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Mükemmel Dedektif!</h2>
        <p className="text-slate-500 font-bold mb-6 text-lg">
          Tüm ipuçlarını başarıyla analiz ettin ve toplam <span className="text-lime-500">{score}</span> puan topladın. Sıra ovaların yerlerini haritada bulmakta!
        </p>
        <button
          onClick={onComplete}
          className="bg-[#58cc02] hover:bg-[#46a302] text-white font-bold py-4 px-8 rounded-2xl border-b-4 border-[#46a302] hover:border-b-0 hover:translate-y-[4px] transition-all text-lg w-full sm:w-auto"
        >
          Harita Moduna Geç
        </button>
      </div>
    );
  }

  const handleRevealClue = () => {
    if (revealedClues < maxClues && selectedOption === null) {
      setRevealedClues((prev) => prev + 1);
    }
  };

  const handleOptionClick = (option: string) => {
    if (selectedOption !== null) return; // Prevent multiple clicks

    setSelectedOption(option);
    const correct = option === currentQuestion.answer;
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + currentPotentialPoints);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#58cc02", "#ff9600", "#1cb0f6"]
      });
    } else {
      // Show all clues if they failed, so they can learn
      setRevealedClues(maxClues);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-[#1e293b] p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-xl">
            <Search className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">DOSYA {currentIndex + 1}/{questions.length}</div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Gizli Ova Aranıyor</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">TOPLAM PUAN</div>
          <div className="text-xl font-black text-lime-500">{score}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 md:p-8 border-2 border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-500" />
          
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">İpuçları</h2>
            <div className="bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-3 py-1 rounded-lg font-bold text-sm">
              Potansiyel: {currentPotentialPoints} Puan
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {currentQuestion.clues.slice(0, revealedClues).map((clue, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={idx}
                className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border-l-4 border-blue-500"
              >
                <div className="bg-white dark:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-black text-blue-500 shrink-0 shadow-sm text-sm">
                  {idx + 1}
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{clue}</p>
              </motion.div>
            ))}

            {revealedClues < maxClues && selectedOption === null && (
              <button
                onClick={handleRevealClue}
                className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <Lightbulb className="w-5 h-5" />
                Yeni İpucu İste (-25 Puan)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option;
              let btnClass = "bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white border-b-4 hover:bg-slate-50 dark:hover:bg-slate-800";
              
              if (selectedOption !== null) {
                if (option === currentQuestion.answer) {
                  btnClass = "bg-[#d7ffb8] dark:bg-lime-900/30 border-[#58cc02] text-[#58cc02] border-b-4";
                } else if (isSelected && !isCorrect) {
                  btnClass = "bg-[#ffdfe0] dark:bg-red-900/30 border-[#ff4b4b] text-[#ff4b4b] border-b-4 opacity-50";
                } else {
                  btnClass = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 border-b-4 opacity-50";
                }
              }

              return (
                <button
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  disabled={selectedOption !== null}
                  className={`p-4 rounded-2xl border-2 font-bold text-lg transition-all flex items-center justify-between ${btnClass} ${
                    selectedOption === null ? "active:border-b-2 active:translate-y-[2px]" : "cursor-default"
                  }`}
                >
                  {option}
                  {selectedOption !== null && option === currentQuestion.answer && <Check className="w-6 h-6 text-[#58cc02]" />}
                  {isSelected && !isCorrect && <X className="w-6 h-6 text-[#ff4b4b]" />}
                </button>
              );
            })}
          </div>

          {selectedOption !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 pt-6 border-t-2 border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCorrect ? 'bg-lime-100 text-lime-500' : 'bg-red-100 text-red-500'}`}>
                  {isCorrect ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                </div>
                <div>
                  <div className={`font-black text-lg ${isCorrect ? 'text-lime-500' : 'text-red-500'}`}>
                    {isCorrect ? `DOĞRU! +${currentPotentialPoints} Puan` : 'YANLIŞ! +0 Puan'}
                  </div>
                  <div className="text-slate-500 text-sm font-medium">
                    {isCorrect ? 'Tebrikler, tüm ipuçlarını doğru değerlendirdin.' : `Doğru cevap ${currentQuestion.answer} olmalıydı.`}
                  </div>
                </div>
              </div>
              <button
                onClick={handleNext}
                className="w-full sm:w-auto bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-bold py-3 px-8 rounded-xl border-b-4 border-[#1899d6] hover:border-b-0 hover:translate-y-[4px] transition-all"
              >
                Sıradaki Dosya
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
