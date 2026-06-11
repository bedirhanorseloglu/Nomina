"use client";

import { motion } from "framer-motion";

type Props = {
  value: number;
  max?: number;
  size?: number;
  label: string;
  sublabel?: string;
  color?: string;
};

export default function DenemeScoreRing({
  value,
  max = 120,
  size = 140,
  label,
  sublabel,
  color,
}: Props) {
  const stroke = size * 0.11; // Proportional thickness matching Apple Watch rings (~11%)
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (pct / 100) * circumference;

  // Unique IDs for SVG defs to avoid collisions
  const gradientId = `appleRingGradient-${label.replace(/\s+/g, "-")}`;
  const shadowId = `appleRingShadow-${label.replace(/\s+/g, "-")}`;

  // Saturated Apple Watch gradients
  const gradientColors = color
    ? { start: color, end: color }
    : label.toLowerCase().includes("net")
    ? { start: "#ff2d55", end: "#ff1493" } // Saturated Activity Ring Red/Pink
    : { start: "#00f576", end: "#00d0fc" }; // Saturated Cyan/Green

  // Calculate coordinates for the tip shadow to make the circle overlap 3D-style
  const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
  const tipX = size / 2 + radius * Math.cos(angle);
  const tipY = size / 2 + radius * Math.sin(angle);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group" style={{ width: size, height: size }}>
        {/* Apple watch ambient glow behind the ring */}
        <div
          className="absolute inset-0 rounded-full scale-90 blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${gradientColors.start} 0%, transparent 70%)`,
          }}
        />

        <svg width={size} height={size} className="-rotate-90 relative z-10 overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors.start} />
              <stop offset="100%" stopColor={gradientColors.end} />
            </linearGradient>

            {/* Soft, dark drop shadow filter for the overlap cap */}
            <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="1"
                dy="2"
                stdDeviation="2.5"
                floodColor="#000000"
                floodOpacity="0.35"
              />
            </filter>
          </defs>

          {/* Base Track (Apple style has 12% opacity saturated color track) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={gradientColors.start}
            strokeWidth={stroke}
            opacity="0.12"
          />

          {/* Active Progress Path */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Overlapping cap shadow */}
          {pct > 100 && (
            <motion.circle
              cx={tipX}
              cy={tipY}
              r={stroke / 2}
              fill={gradientColors.end}
              filter={`url(#${shadowId})`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              style={{ transformOrigin: `${tipX}px ${tipY}px` }}
            />
          )}
        </svg>

        {/* Central Text Metrics */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <motion.span
            key={value}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="text-4xl sm:text-5xl font-black font-sans tracking-tight text-[#1d1d1f] dark:text-white leading-none"
          >
            {value.toFixed(2).replace(/\.?0+$/, "")}
          </motion.span>
          {sublabel && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      <span className="text-[11px] font-semibold text-slate-400 tracking-wide mt-1.5">
        {label}
      </span>
    </div>
  );
}

