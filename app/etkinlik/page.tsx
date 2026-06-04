"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Map, Layers, ArrowRight } from "lucide-react";

export default function EtkinlikIndexPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 dark:from-[#0a0f1e] dark:via-[#0f172a] dark:to-[#0a0f1e] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
            Tüm <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Etkinlikler</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Coğrafya bilginizi pekiştirmek için farklı öğrenme modüllerini keşfedin.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Harita Modülü */}
          <motion.button
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/etkinlik/harita")}
            className="group text-left rounded-3xl overflow-hidden bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-white/5 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all"
          >
            <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg mb-6">
                <Map className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">Türkiye Haritası</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Tıkla-yerleştir mantığıyla Türkiye üzerindeki dağları, gölleri ve yeryüzü şekillerini harita üzerinde görsel olarak öğrenin.
              </p>
              <div className="flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform">
                Haritaya Git <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </motion.button>

          {/* Kart Modülü */}
          <motion.button
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/etkinlik/kart")}
            className="group text-left rounded-3xl overflow-hidden bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-white/5 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all"
          >
            <div className="h-3 bg-gradient-to-r from-emerald-500 to-teal-600" />
            <div className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg mb-6">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">Bilgi Kartları (Flashcards)</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Hızlı tekrar yöntemiyle yeryüzü şekillerinin türlerini (kıvrım, kırık, tektonik vb.) arkalı-önlü kartlarla ezberleyin.
              </p>
              <div className="flex items-center text-emerald-600 font-bold group-hover:translate-x-2 transition-transform">
                Kartlara Git <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </main>
  );
}
