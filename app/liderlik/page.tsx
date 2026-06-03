"use client";

import DenemeNav from "@/components/deneme/DenemeNav";
import Leaderboard from "@/components/deneme/Leaderboard";

export default function LiderlikPage() {
  return (
    <div className="deneme-page min-h-screen text-slate-800 pb-20">
      <div className="deneme-page-bg" aria-hidden />

      <DenemeNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 mt-24">
        <section className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent rounded-3xl -z-10" />
          <div className="text-center pt-8 pb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-slate-200 border-b-4 mb-6">
              <span className="text-xl">🏆</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">Meydan Okuma</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black font-heading tracking-tight text-slate-900 mb-6 drop-shadow-sm">
              Liderlik Tablosu
            </h1>
            <p className="text-slate-500 max-w-lg mx-auto text-base sm:text-lg font-medium leading-relaxed px-4">
              Türkiye geneli rekabetini gör, üst liglere tırman ve <span className="text-amber-500 font-bold">şampiyonluğa</span> ulaş!
            </p>
          </div>
        </section>

        <div className="bg-white rounded-3xl border border-slate-100/60 shadow-xl overflow-hidden p-2 sm:p-6">
          <Leaderboard />
        </div>
      </main>
    </div>
  );
}
