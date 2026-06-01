"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/", label: "Ana Panel", short: "Ana", icon: "⌂" },
  { href: "/deneme", label: "Deneme Merkezi", short: "Deneme", icon: "◉" },
];

export default function DenemeNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-heading font-black text-slate-900 tracking-tight group"
      >
        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-emerald-400 text-white flex items-center justify-center text-base font-black shadow-md shadow-accent/20 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-accent/30 group-hover:scale-105">
          K
        </span>
        <span className="hidden sm:block text-sm font-bold tracking-tight text-slate-800 transition-colors group-hover:text-accent">
          KPSS 2026
        </span>
      </Link>
      <nav className="flex p-1 rounded-xl bg-slate-100/60 backdrop-blur-md border border-slate-200/40 relative">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/" || pathname === ""
              : pathname.startsWith("/deneme");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
                active
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeNavBg"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/20"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="sm:hidden relative z-10">{link.short}</span>
              <span className="hidden sm:inline relative z-10">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

