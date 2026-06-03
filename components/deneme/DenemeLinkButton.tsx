"use client";

import Link from "next/link";

type Variant = "header" | "sidebar" | "card";

const styles: Record<Variant, string> = {
  header:
    "flex items-center justify-center gap-2 px-3 sm:px-4 h-10 sm:h-11 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-accent/25 transition-all shrink-0",
  sidebar:
    "w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-accent text-white text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-accent/20 transition-all",
  card:
    "inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-accent text-white text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-accent/25 transition-all",
};

export default function DenemeLinkButton({
  variant = "header",
  onNavigate,
}: {
  variant?: Variant;
  onNavigate?: () => void;
}) {
  return (
    <Link href="/deneme" className={styles[variant]} onClick={onNavigate}>
      <span className="text-base leading-none">📊</span>
      {variant === "header" ? (
        <>
          <span className="sm:hidden">Deneme</span>
          <span className="hidden sm:inline">Deneme Analizi</span>
        </>
      ) : (
        <span>Deneme Analizi</span>
      )}
    </Link>
  );
}
