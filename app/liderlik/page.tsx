"use client";

import DenemeNav from "@/components/deneme/DenemeNav";
import Leaderboard from "@/components/deneme/Leaderboard";

export default function LiderlikPage() {
  return (
    <div className="deneme-page min-h-screen text-slate-800 dark:text-slate-100 pb-20">
      <div className="deneme-page-bg" aria-hidden />

      <DenemeNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 mt-24">


        <Leaderboard />
      </main>
    </div>
  );
}
