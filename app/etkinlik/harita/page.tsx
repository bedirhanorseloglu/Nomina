"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TurkeyMapGame from "@/components/etkinlik/TurkeyMapGame";
import { MAP_TOPICS } from "@/lib/mapData";
import { ArrowLeft, Map, ArrowRight, MapPin, Mountain, Droplets } from "lucide-react";
import { motion } from "framer-motion";

const TOPIC_ICONS: Record<string, React.ReactNode> = {
  goller: <Droplets className="w-7 h-7" />,
  daglar: <Mountain className="w-7 h-7" />,
};

const TOPIC_GRADIENTS: Record<string, string> = {
  goller: "from-blue-500 to-cyan-500",
  daglar: "from-orange-500 to-red-500",
};

function HaritaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams.get("topic");
  const topic = MAP_TOPICS.find((t) => t.id === topicId);

  // Game view
  if (topicId && topic) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 dark:from-[#0a0f1e] dark:via-[#0f172a] dark:to-[#0a0f1e] pt-20 pb-8 px-2 lg:px-4 selection:bg-blue-500/30">
        <div className="w-full mx-auto mb-3">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push("/etkinlik/harita")}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors text-sm font-semibold group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kategorilere Dön
          </motion.button>
        </div>
        <TurkeyMapGame topic={topic} />
      </main>
    );
  }

  // Topic selection
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 dark:from-[#0a0f1e] dark:via-[#0f172a] dark:to-[#0a0f1e] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30"
          >
            <Map className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
            Harita <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">Etkinlikleri</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Sürükle-bırak yöntemiyle Türkiye haritası üzerinde coğrafi bilgilerinizi pekiştirin.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {MAP_TOPICS.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/etkinlik/harita?topic=${t.id}`)}
              className="group text-left rounded-3xl overflow-hidden
                bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl
                border border-white/40 dark:border-white/5
                shadow-lg shadow-slate-200/60 dark:shadow-black/30
                hover:shadow-xl hover:shadow-slate-300/60 dark:hover:shadow-black/40
                transition-shadow"
            >
              {/* Top gradient bar */}
              <div className={`h-2 bg-gradient-to-r ${TOPIC_GRADIENTS[t.id] ?? "from-slate-400 to-slate-500"}`} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${TOPIC_GRADIENTS[t.id] ?? "from-slate-400 to-slate-500"} flex items-center justify-center text-white shadow-lg`}>
                    {TOPIC_ICONS[t.id] ?? <MapPin className="w-7 h-7" />}
                  </div>
                  <span className="text-xs font-bold text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-full">
                    {t.points.length} öğe
                  </span>
                </div>

                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  {t.description}
                </p>

                <div className="flex items-center justify-end text-sm font-bold text-blue-500 group-hover:text-blue-600 transition-colors">
                  Teste Başla
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function HaritaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
            <Map className="w-6 h-6 text-white" />
          </div>
          <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    }>
      <HaritaContent />
    </Suspense>
  );
}
