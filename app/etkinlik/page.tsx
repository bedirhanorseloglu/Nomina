"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Layers, LayoutGrid, Milestone, Scale, Lock, Droplets } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type SubjectTab = "all" | "cografya" | "tarih" | "vatandaslik";

export default function EtkinlikIndexPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SubjectTab>("all");

  const TABS: { id: SubjectTab; name: string; icon: React.ElementType; color: string }[] = [
    { id: "all", name: "Tümü", icon: LayoutGrid, color: "bg-slate-500" },
    { id: "cografya", name: "Coğrafya", icon: Map, color: "bg-emerald-500" },
    { id: "tarih", name: "Tarih", icon: Milestone, color: "bg-amber-500" },
    { id: "vatandaslik", name: "Vatandaşlık", icon: Scale, color: "bg-slate-500" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-28 pb-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header - Gamified Style */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
        >
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 rounded-full border-[3px] border-white dark:border-slate-800 shadow-sm overflow-hidden shrink-0 bg-white">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
                  {user?.displayName?.charAt(0)?.toUpperCase() || "K"}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                Pratik Merkezi
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Derslere Özel Etkinlikler
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gamified Subject Filter (Segmented Control) */}
        <div className="mb-10 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-3 w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                    isActive
                      ? "text-white"
                      : "bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-700/50 border-b-[4px] hover:-translate-y-0.5 active:border-b-2 active:translate-y-[2px]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="subjectTabBg"
                      className={`absolute inset-0 rounded-2xl shadow-sm border-b-[4px] active:border-b-2 active:translate-y-[2px] ${tab.color} border-black/20`}
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon className={`relative z-10 w-5 h-5 ${isActive ? "drop-shadow-sm" : ""}`} />
                  <span className="relative z-10">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activities Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl space-y-12"
          >
            {/* COĞRAFYA BÖLÜMÜ */}
            {(activeTab === "all" || activeTab === "cografya") && (
              <div className="space-y-8">
                {activeTab === "all" && (
                  <div className="flex items-center gap-3 border-b-2 border-slate-200 dark:border-slate-800 pb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <Map className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Coğrafya</h2>
                  </div>
                )}

                {/* Alt Kategori: Yer Şekilleri */}
                <div>
                  <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2 tracking-wide uppercase">
                    Yer Şekilleri
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Dağlar */}
                    <Link href="/etkinlik/harita?topic=daglar" className="group w-full h-full text-left relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700/50 border-b-[6px] active:border-b-2 active:translate-y-[4px] transition-all block">
                      <div className="flex flex-col sm:flex-row items-start gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-red-500 text-white shadow-sm border-b-4 border-red-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Map className="w-10 h-10 drop-shadow-sm" />
                        </div>
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Türkiye'nin Dağları</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                              Türkiye üzerindeki dağları (kıvrım, kırık, volkanik) haritaya yerleştirerek öğren.
                            </p>
                          </div>
                          <div className="inline-flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-4 py-2.5 rounded-xl text-sm border-b-2 border-red-200 dark:border-red-900 self-start group-active:border-b-0 group-active:translate-y-[2px] transition-all">
                            Hemen Başla
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Platolar */}
                    <Link href="/etkinlik/platolar" className="group w-full h-full text-left relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700/50 border-b-[6px] active:border-b-2 active:translate-y-[4px] transition-all block">
                      <div className="flex flex-col sm:flex-row items-start gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-orange-500 text-white shadow-sm border-b-4 border-orange-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Map className="w-10 h-10 drop-shadow-sm" />
                        </div>
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-md">2 Aşamalı</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Türkiye'nin Platoları</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                              Platoları interaktif hikayelerle öğren ve harita üzerinde yerleştirerek pratiğini yap.
                            </p>
                          </div>
                          <div className="inline-flex items-center justify-center bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold px-4 py-2.5 rounded-xl text-sm border-b-2 border-orange-200 dark:border-orange-900 self-start group-active:border-b-0 group-active:translate-y-[2px] transition-all">
                            Hemen Başla
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Ovalar */}
                    <Link href="/etkinlik/ovalar" className="group w-full h-full text-left relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700/50 border-b-[6px] active:border-b-2 active:translate-y-[4px] transition-all block">
                      <div className="flex flex-col sm:flex-row items-start gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-lime-500 text-white shadow-sm border-b-4 border-lime-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Map className="w-10 h-10 drop-shadow-sm" />
                        </div>
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-lime-500 bg-lime-50 dark:bg-lime-500/10 px-2 py-0.5 rounded-md">Yeni Mod</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Türkiye'nin Ovaları</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                              Ova Dedektifi oyunuyla ipuçlarını bul, ardından harita üzerinde ovaları yerleştir.
                            </p>
                          </div>
                          <div className="inline-flex items-center justify-center bg-lime-50 dark:bg-lime-500/10 text-lime-600 dark:text-lime-400 font-bold px-4 py-2.5 rounded-xl text-sm border-b-2 border-lime-200 dark:border-lime-900 self-start group-active:border-b-0 group-active:translate-y-[2px] transition-all">
                            Hemen Başla
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Alt Kategori: Su Kaynakları */}
                <div>
                  <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2 tracking-wide uppercase mt-4">
                    Su Kaynakları
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Göller */}
                    <Link href="/etkinlik/harita?topic=goller" className="group w-full h-full text-left relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700/50 border-b-[6px] active:border-b-2 active:translate-y-[4px] transition-all block">
                      <div className="flex flex-col sm:flex-row items-start gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-cyan-500 text-white shadow-sm border-b-4 border-cyan-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Map className="w-10 h-10 drop-shadow-sm" />
                        </div>
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Türkiye'nin Gölleri</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                              Türkiye'deki gölleri oluşum türlerine göre haritada bul ve görsel hafızanı güçlendir.
                            </p>
                          </div>
                          <div className="inline-flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold px-4 py-2.5 rounded-xl text-sm border-b-2 border-cyan-200 dark:border-cyan-900 self-start group-active:border-b-0 group-active:translate-y-[2px] transition-all">
                            Hemen Başla
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Akarsular */}
                    <Link href="/etkinlik/akarsular" className="group w-full h-full text-left relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700/50 border-b-[6px] active:border-b-2 active:translate-y-[4px] transition-all block">
                      <div className="flex flex-col sm:flex-row items-start gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-blue-500 text-white shadow-sm border-b-4 border-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Droplets className="w-10 h-10 drop-shadow-sm" />
                        </div>
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">2 Aşamalı</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Akarsular</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                              Türkiye'nin akarsularını hikaye tarzında boşluk doldurarak öğren ve haritada yerlerini bul.
                            </p>
                          </div>
                          <div className="inline-flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-4 py-2.5 rounded-xl text-sm border-b-2 border-blue-200 dark:border-blue-900 self-start group-active:border-b-0 group-active:translate-y-[2px] transition-all">
                            Hemen Başla
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Alt Kategori: Genel Tekrar */}
                <div>
                  <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2 tracking-wide uppercase mt-4">
                    Genel Tekrar
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Bilgi Kartları */}
                    <Link href="/etkinlik/kart" className="group w-full h-full text-left relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700/50 border-b-[6px] active:border-b-2 active:translate-y-[4px] transition-all block">
                      <div className="flex flex-col sm:flex-row items-start gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-emerald-500 text-white shadow-sm border-b-4 border-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Layers className="w-10 h-10 drop-shadow-sm" />
                        </div>
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Tüm Konular (Bilgi Kartları)</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                              Hızlı tekrar yöntemiyle kavramları arkalı-önlü kartlarla ezberle ve serini koru.
                            </p>
                          </div>
                          <div className="inline-flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-4 py-2.5 rounded-xl text-sm border-b-2 border-emerald-200 dark:border-emerald-900 self-start group-active:border-b-0 group-active:translate-y-[2px] transition-all">
                            Kartları Çalış
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* TARİH BÖLÜMÜ */}
            {(activeTab === "all" || activeTab === "tarih") && (
              <div className="space-y-6 pt-4">
                {activeTab === "all" && (
                  <div className="flex items-center gap-3 border-b-2 border-slate-200 dark:border-slate-800 pb-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
                      <Milestone className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Tarih</h2>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Placeholder Tarih */}
                  <div className="w-full h-full text-left relative bg-slate-100 dark:bg-[#1e293b]/50 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700/50 border-dashed block opacity-70">
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-amber-500/20 text-amber-500/50 flex items-center justify-center shrink-0">
                        <Lock className="w-10 h-10" />
                      </div>
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <h3 className="text-xl font-black text-slate-500 dark:text-slate-400 mb-2">Kronoloji Zinciri</h3>
                          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mb-4 leading-relaxed">
                            Önemli tarihi olayları sıraya dizerek kronolojik hafızanı test et. Çok yakında eklenecek.
                          </p>
                        </div>
                        <div className="inline-flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-bold px-4 py-2.5 rounded-xl text-sm self-start">
                          Yakında
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VATANDAŞLIK BÖLÜMÜ */}
            {(activeTab === "all" || activeTab === "vatandaslik") && (
              <div className="space-y-6 pt-4">
                {activeTab === "all" && (
                  <div className="flex items-center gap-3 border-b-2 border-slate-200 dark:border-slate-800 pb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center">
                      <Scale className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Vatandaşlık</h2>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Placeholder Vatandaşlık */}
                  <div className="w-full h-full text-left relative bg-slate-100 dark:bg-[#1e293b]/50 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700/50 border-dashed block opacity-70">
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-slate-500/20 text-slate-500/50 flex items-center justify-center shrink-0">
                        <Lock className="w-10 h-10" />
                      </div>
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <h3 className="text-xl font-black text-slate-500 dark:text-slate-400 mb-2">Anayasa Kartları</h3>
                          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mb-4 leading-relaxed">
                            Temel hukuk kurallarını ve anayasa maddelerini boşluk doldurma ile öğren. Çok yakında.
                          </p>
                        </div>
                        <div className="inline-flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-bold px-4 py-2.5 rounded-xl text-sm self-start">
                          Yakında
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
