"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mountain, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PlateauStoryGame from "@/components/etkinlik/PlateauStoryGame";
import TurkeyMapGame from "@/components/etkinlik/TurkeyMapGame";
import { MAP_TOPICS } from "@/lib/mapData";

type Stage = "menu" | "story" | "map";

export default function PlatolarPage() {
  const [stage, setStage] = useState<Stage>("menu");
  const topic = MAP_TOPICS.find((t) => t.id === "platolar");

  return (
    <main className="min-h-[100dvh] bg-slate-50 dark:bg-[#0f172a] pt-28 pb-12 px-4 sm:px-6">
      <div className={`mx-auto w-full transition-all duration-500 ${stage === "map" ? "max-w-[1600px]" : "max-w-5xl"}`}>
        {/* Top bar back button */}
        <div className="mb-8">
          <Link href="/etkinlik" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-widest text-xs transition-colors">
            <ArrowLeft className="w-4 h-4" /> ETKİNLİKLERE DÖN
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {stage === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center max-w-2xl mx-auto text-center"
            >
              <div className="w-24 h-24 bg-orange-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_6px_0_0_#c2410c]">
                <Mountain className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
                Platoların Serüveni
              </h1>
              <p className="text-lg text-slate-500 font-bold mb-12">
                Türkiye'nin platolarını interaktif hikayelerle öğren, ardından haritada yerlerini bularak bilgini pekiştir!
              </p>

              <div className="grid sm:grid-cols-2 gap-6 w-full">
                <button
                  onClick={() => setStage("story")}
                  className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-700/50 border-b-[8px] active:border-b-2 active:translate-y-[6px] transition-all text-left flex flex-col group"
                >
                  <div className="w-16 h-16 bg-[#58cc02] rounded-2xl flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    <Mountain className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">1. Aşama</h3>
                  <p className="text-slate-500 font-bold text-sm">Boşluk doldurma ve hikayelerle plato özelliklerini öğren.</p>
                </button>

                <button
                  onClick={() => setStage("map")}
                  className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-700/50 border-b-[8px] active:border-b-2 active:translate-y-[6px] transition-all text-left flex flex-col group"
                >
                  <div className="w-16 h-16 bg-[#1cb0f6] rounded-2xl flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    <Map className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">2. Aşama</h3>
                  <p className="text-slate-500 font-bold text-sm">Seterra tarzı haritada platoların yerlerini bularak pratiğini yap.</p>
                </button>
              </div>
            </motion.div>
          )}

          {stage === "story" && (
            <motion.div
              key="story"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Platoların Serüveni</h2>
                <button onClick={() => setStage("menu")} className="text-sm font-bold text-slate-400 hover:text-slate-600">Menüye Dön</button>
              </div>
              <PlateauStoryGame onComplete={() => setStage("map")} />
            </motion.div>
          )}

          {stage === "map" && topic && (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
               <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Haritada Plato Avcısı</h2>
                <button onClick={() => setStage("menu")} className="text-sm font-bold text-slate-400 hover:text-slate-600">Menüye Dön</button>
              </div>
              <TurkeyMapGame topic={topic} onQuit={() => setStage("menu")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
