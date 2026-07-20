"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ChevronRight, RefreshCcw, MonitorPlay } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export default function Quiz({ data, onSeek }: { data: QuizQuestion[], onSeek?: (time: string) => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="p-4 bg-red-50 text-red-500 rounded-xl">Geçersiz test formatı.</div>;
  }

  const q = data[currentQuestion];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === q.answerIndex) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < data.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const restart = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <div className="bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center shadow-sm my-4">
        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Test Bitti!</h3>
        <p className="text-lg font-bold text-[#1cb0f6] mb-6">
          {data.length} soruda {score} doğru yaptın.
        </p>
        <button
          onClick={restart}
          className="bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_0_#1899d6] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 mx-auto"
        >
          <RefreshCcw className="w-5 h-5" /> Tekrar Çöz
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm my-4 font-sans select-none whitespace-normal break-words">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          SORU {currentQuestion + 1} / {data.length}
        </span>
        <span className="bg-[#1cb0f6]/10 text-[#1cb0f6] px-3 py-1 rounded-full text-xs font-bold">
          Puan: {score}
        </span>
      </div>

      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-5 leading-snug">
        {q.question}
      </h4>

      <div className="space-y-3">
        {q.options.map((option, idx) => {
          let btnClass = "border-slate-200 dark:border-white/10 hover:border-[#1cb0f6] hover:bg-[#1cb0f6]/5";
          let icon = null;

          if (isAnswered) {
            if (idx === q.answerIndex) {
              btnClass = "border-[#58cc02] bg-[#58cc02]/10 text-[#58cc02]";
              icon = <CheckCircle2 className="w-5 h-5" />;
            } else if (idx === selectedOption) {
              btnClass = "border-[#ff2d55] bg-[#ff2d55]/10 text-[#ff2d55]";
              icon = <XCircle className="w-5 h-5" />;
            } else {
              btnClass = "border-slate-200 dark:border-white/10 opacity-50";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all flex items-center justify-between ${btnClass}`}
            >
              <span className={isAnswered ? "font-bold" : ""}>{option}</span>
              {icon}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-5 overflow-hidden"
          >
            <div className={`p-4 rounded-xl border-l-4 ${selectedOption === q.answerIndex ? "bg-[#58cc02]/10 border-[#58cc02]" : "bg-[#ff2d55]/10 border-[#ff2d55]"}`}>
              <p className="font-bold text-sm mb-1 text-slate-800 dark:text-white">
                {selectedOption === q.answerIndex ? "Harika! Doğru Cevap." : "Maalesef yanlış."}
              </p>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {q.explanation.split(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]\(#[^)]*\)/g).map((part, i) => {
                  if (i % 2 === 1) {
                    return (
                      <button 
                        key={i}
                        onClick={(e) => { e.preventDefault(); onSeek?.(part); }}
                        className="inline-flex items-center gap-1 bg-[#ff2d55]/10 text-[#ff2d55] px-1.5 py-0 rounded-md font-bold hover:bg-[#ff2d55]/20 transition-colors mx-0.5 text-xs"
                      >
                        <MonitorPlay className="w-3.5 h-3.5" /> {part}
                      </button>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </div>
            </div>
            <button
              onClick={nextQuestion}
              className="mt-4 w-full bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#1899d6] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {currentQuestion < data.length - 1 ? "Sıradaki Soru" : "Sonucu Gör"} <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
