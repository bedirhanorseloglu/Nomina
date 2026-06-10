"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import TurkeyMapGame from "@/components/etkinlik/TurkeyMapGame";
import { MAP_TOPICS } from "@/lib/mapData";
import { ArrowLeft, Map, ArrowRight, Mountain, Droplets, ArrowLeftFromLine } from "lucide-react";
import { motion } from "framer-motion";

const TOPIC_ICONS: Record<string, React.ReactNode> = {
  goller: <Droplets className="w-8 h-8" />,
  daglar: <Mountain className="w-8 h-8" />,
};

const TOPIC_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  goller: { bg: "bg-[#1cb0f6]", text: "text-[#1cb0f6]", border: "border-[#1899d6]" },
  daglar: { bg: "bg-[#ff4b4b]", text: "text-[#ff4b4b]", border: "border-[#e04343]" },
};

function HaritaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams.get("topic");
  const topic = MAP_TOPICS.find((t) => t.id === topicId);

  // Game view
  if (topicId && topic) {
    return (
      <main className="min-h-[100dvh] bg-white dark:bg-[#0f172a] pt-24 pb-8 px-2 lg:px-4 flex flex-col">
        <TurkeyMapGame topic={topic} onQuit={() => router.push("/etkinlik/harita")} />
      </main>
    );
  }

  // Topic selection
  return (
    <main className="min-h-screen bg-white dark:bg-[#0f172a] pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Top bar back button */}
        <div className="mb-6">
          <Link href="/etkinlik" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-xs transition-colors">
            <ArrowLeft className="w-4 h-4" /> ETKİNLİKLERE DÖN
          </Link>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-24 h-24 bg-[#58cc02] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_6px_0_0_#46a302]"
          >
            <Map className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
            Harita Pratiği
          </h1>
          <p className="text-lg text-slate-500 font-bold max-w-xl mx-auto leading-relaxed">
            Türkiye coğrafyasını sürükle-bırak yöntemiyle öğrenin ve görsel hafızanızı güçlendirin.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {MAP_TOPICS.map((t, i) => {
            const colors = TOPIC_COLORS[t.id] ?? { bg: "bg-slate-400", text: "text-slate-400", border: "border-slate-500" };
            
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                className="h-full"
              >
                <Link
                  href={`/etkinlik/harita?topic=${t.id}`}
                  className="group w-full h-full text-left relative bg-white dark:bg-[#1e293b] rounded-[2rem] p-6 border-2 border-slate-200 dark:border-slate-700 border-b-[8px] active:border-b-2 active:translate-y-[6px] transition-all flex flex-col justify-between block"
                >
                  <div className="flex items-start gap-5 mb-6">
                    <div className={`w-20 h-20 rounded-[1.5rem] ${colors.bg} text-white shadow-sm flex items-center justify-center shrink-0 border-b-[6px] ${colors.border}`}>
                      {TOPIC_ICONS[t.id] ?? <Map className="w-10 h-10" />}
                    </div>
                    <div>
                      <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] rounded-lg mb-2">
                        {t.points.length} Kavram
                      </div>
                      <h2 className={`text-2xl font-black ${colors.text}`}>
                        {t.title}
                      </h2>
                    </div>
                  </div>
                  
                  <p className="text-slate-500 font-bold mb-6">
                    {t.description}
                  </p>
                  
                  <div className={`w-full text-center font-black text-white text-lg py-4 rounded-2xl ${colors.bg} border-b-4 ${colors.border} group-active:border-b-0 group-active:translate-y-[4px] transition-all`}>
                    BAŞLA
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function HaritaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-[#58cc02] border-b-[6px] border-[#46a302] flex items-center justify-center animate-bounce">
            <Map className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    }>
      <HaritaContent />
    </Suspense>
  );
}
