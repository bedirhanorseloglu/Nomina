"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RIVER_FEATURES, RiverFeature } from "@/lib/riverData";
import { Droplets, Check, X, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface RiverStoryGameProps {
  onComplete: () => void;
}

export default function RiverStoryGame({ onComplete }: RiverStoryGameProps) {
  const [questions] = useState(() => {
    return [...RIVER_FEATURES].sort(() => Math.random() - 0.5).slice(0, 10);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const currentRiver = questions[currentIndex];

  const handleOptionClick = (option: string) => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(option);
    
    if (option === currentRiver.blank) {
      setIsCorrect(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#58cc02', '#ffffff']
      });
    } else {
      setIsCorrect(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      onComplete();
    }
  };

  if (!currentRiver) return null;

  // Split story into parts: before blank and after blank
  const parts = currentRiver.story.split("_____");

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
      {/* Progress */}
      <div className="w-full mb-8 flex items-center gap-4">
        <Droplets className="text-blue-500 w-6 h-6 shrink-0" />
        <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#58cc02]"
            initial={{ width: 0 }}
            animate={{ width: `${(currentIndex / questions.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="w-full flex flex-col items-center"
        >
          {/* Question Box */}
          <div className="bg-white dark:bg-[#1e293b] w-full rounded-3xl p-8 border-2 border-slate-200 dark:border-slate-700 shadow-sm mb-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-500" />
            <h2 className="text-xl font-black text-slate-400 mb-2 uppercase tracking-widest">SORU {currentIndex + 1}</h2>
            <div className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white leading-snug">
              {parts[0]}
              <span className={`inline-block mx-2 px-4 py-1 min-w-[120px] border-b-4 text-center transition-colors ${
                selectedOption === null 
                  ? "border-slate-300 dark:border-slate-600 text-transparent" 
                  : isCorrect 
                    ? "border-[#58cc02] text-[#58cc02]" 
                    : "border-[#ff4b4b] text-[#ff4b4b]"
              }`}>
                {selectedOption || "......"}
              </span>
              {parts[1]}
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {currentRiver.options.map((option) => {
              const isSelected = selectedOption === option;
              let btnClass = "bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white border-b-4 hover:bg-slate-50";
              
              if (isSelected) {
                if (isCorrect) {
                  btnClass = "bg-[#d7ffb8] dark:bg-[#58cc02]/20 border-[#58cc02] text-[#58cc02] border-b-0 translate-y-1";
                } else {
                  btnClass = "bg-[#ffdfdf] dark:bg-[#ff4b4b]/20 border-[#ff4b4b] text-[#ff4b4b] border-b-0 translate-y-1";
                }
              } else if (selectedOption !== null && option === currentRiver.blank) {
                // Show correct answer if wrong was selected
                btnClass = "bg-[#d7ffb8] dark:bg-[#58cc02]/20 border-[#58cc02] text-[#58cc02] border-b-4 opacity-50";
              } else if (selectedOption !== null) {
                // Dim others
                btnClass = "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 border-b-4 opacity-50";
              }

              return (
                <button
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  disabled={selectedOption !== null}
                  className={`p-4 rounded-2xl border-2 font-bold text-lg md:text-xl transition-all ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Next Button Footer */}
      <AnimatePresence>
        {selectedOption !== null && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`fixed bottom-0 left-0 right-0 p-4 md:p-8 border-t-2 z-50 flex justify-center ${
              isCorrect ? "bg-[#d7ffb8] dark:bg-[#1a3809] border-[#c0e8a0] dark:border-[#2a5910]" : "bg-[#ffdfdf] dark:bg-[#4a1515] border-[#f0c0c0] dark:border-[#6a1e1e]"
            }`}
          >
            <div className="max-w-4xl w-full flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${isCorrect ? "bg-[#58cc02]" : "bg-[#ff4b4b]"}`}>
                  {isCorrect ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
                </div>
                <div className={`font-black text-2xl ${isCorrect ? "text-[#58cc02]" : "text-[#ff4b4b]"}`}>
                  {isCorrect ? "Harika!" : "Yanlış Cevap"}
                </div>
              </div>
              <button
                onClick={handleNext}
                className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 ${
                  isCorrect 
                    ? "bg-[#58cc02] hover:bg-[#46a302] border-[#46a302]" 
                    : "bg-[#ff4b4b] hover:bg-[#e04343] border-[#e04343]"
                }`}
              >
                Devam Et <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
