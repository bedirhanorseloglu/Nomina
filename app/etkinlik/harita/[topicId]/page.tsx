import React from "react";
import { notFound } from "next/navigation";
import TurkeyMapGame from "@/components/etkinlik/TurkeyMapGame";
import { MAP_TOPICS } from "@/lib/mapData";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const topic = MAP_TOPICS.find((t) => t.id === topicId);
  if (!topic) return { title: "Etkinlik Bulunamadı" };
  
  return {
    title: `${topic.title} | KPSS 2026`,
    description: topic.description,
  };
}

// With output: "export", this tells Next.js to only render the params returned
// by generateStaticParams and treat any other URL as 404 — required for static builds.
export const dynamicParams = false;

export function generateStaticParams() {
  return MAP_TOPICS.map((topic) => ({
    topicId: topic.id,
  }));
}

export default async function DynamicHaritaEtkinlikPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const topic = MAP_TOPICS.find((t) => t.id === topicId);
  
  if (!topic) notFound();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-24 pb-12 px-4 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto mb-6">
        <Link href="/etkinlik/harita" className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-semibold">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kategorilere Dön
        </Link>
      </div>
      <TurkeyMapGame topic={topic!} />
    </main>
  );
}
