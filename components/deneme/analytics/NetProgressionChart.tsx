"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import AppleEmoji from "@/components/AppleEmoji";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { DENEME_SUBJECTS, getSubjectQuestionCount } from "@/lib/denemeConfig";
import { formatNet } from "@/lib/denemeUtils";
import { CustomRechartsTooltip, renderRefLabel } from "./AnalyticsCommon";

export function GenelRechartsTrend({
  stats,
  activeMetric = "total",
  targetNet,
}: {
  stats: any;
  activeMetric?: string;
  targetNet?: number;
}) {
  const [chartView, setChartView] = useState<"net" | "breakdown">("net");

  const isSubject = !["total", "gy", "gk"].includes(activeMetric);
  const subjectConfig = isSubject ? DENEME_SUBJECTS.find((s) => s.id === activeMetric) : null;
  const subjectStat = isSubject ? stats.subjects?.find((s: any) => s.id === activeMetric) : null;

  const chartData = useMemo(() => {
    return stats.trend.map((d: any, idx: number) => {
      let net = d.totalNet;
      let correct = d.totalCorrect;
      let wrong = d.totalWrong;
      let empty = d.totalEmpty;

      if (activeMetric === "gy") {
        net = d.gyNet;
        correct = d.gyCorrect;
        wrong = d.gyWrong;
        empty = d.gyEmpty;
      } else if (activeMetric === "gk") {
        net = d.gkNet;
        correct = d.gkCorrect;
        wrong = d.gkWrong;
        empty = d.gkEmpty;
      } else if (isSubject && d.subjectsMap?.[activeMetric]) {
        const subData = d.subjectsMap[activeMetric];
        net = subData.net;
        correct = subData.correct;
        wrong = subData.wrong;
        empty = subData.empty;
      }

      return {
        indexName: `#${idx + 1}`,
        fullName: d.name,
        date: d.date,
        net: parseFloat(net.toFixed(2)),
        correct,
        wrong,
        empty,
      };
    });
  }, [stats, activeMetric, isSubject]);

  const maxQuestions = activeMetric === "total"
    ? 120
    : activeMetric === "gy" || activeMetric === "gk"
    ? 60
    : subjectConfig?.questionCount || 30;

  const mainColor =
    activeMetric === "total"
      ? "#1cb0f6"
      : activeMetric === "gy"
      ? "#af52de"
      : activeMetric === "gk"
      ? "#58cc02"
      : subjectConfig?.color || "#1cb0f6";

  const latestNet =
    activeMetric === "total"
      ? stats.latest
      : activeMetric === "gy"
      ? stats.gyLatest
      : activeMetric === "gk"
      ? stats.gkLatest
      : subjectStat?.latestNet ?? 0;

  const bestNet =
    activeMetric === "total"
      ? stats.best
      : activeMetric === "gy"
      ? stats.gyBest
      : activeMetric === "gk"
      ? stats.gkBest
      : subjectStat?.bestNet ?? 0;

  const avgNet =
    activeMetric === "total"
      ? stats.avg
      : activeMetric === "gy"
      ? stats.gyAvg
      : activeMetric === "gk"
      ? stats.gkAvg
      : subjectStat?.avgNet ?? 0;

  const chartTitle =
    activeMetric === "total"
      ? "Genel Sınav Net Seyri"
      : activeMetric === "gy"
      ? "Genel Yetenek Gelişim Grafiği"
      : activeMetric === "gk"
      ? "Genel Kültür Gelişim Grafiği"
      : `${subjectConfig?.title || ""} Gelişim Grafiği`;

  const chartDesc =
    activeMetric === "total"
      ? `Toplam ${stats.count} denemede sınavdan sınava net değişiminiz.`
      : activeMetric === "gy"
      ? `Toplam ${stats.count} denemede Genel Yetenek net değişiminiz.`
      : activeMetric === "gk"
      ? `Toplam ${stats.count} denemede Genel Kültür net değişiminiz.`
      : `Toplam ${stats.count} genel denemede ${subjectConfig?.title || ""} net değişiminiz.`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-sm space-y-6 relative overflow-hidden">
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-15 dark:opacity-25"
        style={{ backgroundColor: mainColor }}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 pb-4 border-b border-slate-100 dark:border-slate-700/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: mainColor }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: mainColor }}
              />
            </span>
            <h4 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
              {chartTitle}
            </h4>
          </div>
          <p className="text-xs font-bold text-slate-400">
            {chartDesc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="px-3.5 py-1.5 rounded-xl border-2 border-b-4 text-xs font-black flex items-center gap-1.5 shadow-2xs"
            style={{
              backgroundColor: `${mainColor}15`,
              borderColor: `${mainColor}40`,
              borderBottomColor: mainColor,
              color: mainColor,
            }}
          >
            <span className="opacity-75 font-extrabold">Son:</span>
            <span className="font-black text-sm tracking-wide">{formatNet(latestNet)}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border-2 border-b-4 border-amber-400 border-b-amber-500 text-[#ff9500] text-xs font-black flex items-center gap-1.5 shadow-2xs">
            <span className="font-extrabold">Rekor:</span>
            <span className="font-black text-sm tracking-wide">{formatNet(bestNet)}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[#58cc02]/10 dark:bg-[#58cc02]/20 border-2 border-b-4 border-[#58cc02]/40 border-b-[#58cc02] text-[#58cc02] text-xs font-black flex items-center gap-1.5 shadow-2xs">
            <span className="font-extrabold">Ort:</span>
            <span className="font-black text-sm tracking-wide">{formatNet(avgNet)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl w-fit text-xs font-black border-2 border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setChartView("net")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            chartView === "net"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <AppleEmoji emoji="📈" size={16} />
          <span>Net Değişimi</span>
        </button>
        <button
          type="button"
          onClick={() => setChartView("breakdown")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            chartView === "breakdown"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <AppleEmoji emoji="📊" size={16} />
          <span>Doğru / Yanlış / Boş</span>
        </button>
      </div>

      <div className="h-[320px] w-full pt-4 relative">
        <ResponsiveContainer width="100%" height={300} minWidth={0}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="genelNetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={mainColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={mainColor} stopOpacity={0.0} />
              </linearGradient>
              <linearGradient
                id="genelCorrectGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#58cc02" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#58cc02" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(148, 163, 184, 0.15)"
            />

            <XAxis
              dataKey="indexName"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
              dy={8}
            />

            <YAxis
              domain={[0, maxQuestions]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
              dx={-8}
            />

            <RechartsTooltip
              content={<CustomRechartsTooltip mainColor={mainColor} />}
            />

            <ReferenceLine
              y={avgNet}
              stroke={mainColor}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={renderRefLabel(
                `Ort: ${formatNet(avgNet)}`,
                mainColor,
                "right"
              )}
            />

            {activeMetric === "total" && targetNet && (
              <ReferenceLine
                y={targetNet}
                stroke="#58cc02"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={renderRefLabel(
                  `Hedef: ${targetNet}`,
                  "#58cc02",
                  "left"
                )}
              />
            )}

            {chartView === "net" ? (
              <Area
                type="monotone"
                dataKey="net"
                name="Net"
                stroke={mainColor}
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#genelNetGradient)"
                activeDot={{
                  r: 8,
                  stroke: "#ffffff",
                  strokeWidth: 3,
                  fill: mainColor,
                }}
              />
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="correct"
                  name="Doğru"
                  stroke="#58cc02"
                  strokeWidth={3}
                  fill="url(#genelCorrectGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="wrong"
                  name="Yanlış"
                  stroke="#ff4b4b"
                  strokeWidth={2}
                  fill="transparent"
                />
                <Area
                  type="monotone"
                  dataKey="empty"
                  name="Boş"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  fill="transparent"
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BransRechartsTrend({ bransStats }: { bransStats: any }) {
  const mainColor = bransStats.config?.color || "#1cb0f6";
  const [chartView, setChartView] = useState<"net" | "breakdown">("net");

  const chartData = useMemo(() => {
    return bransStats.trend.map((d: any, idx: number) => ({
      indexName: `#${idx + 1}`,
      fullName: d.name,
      date: d.date,
      net: parseFloat(d.net.toFixed(2)),
      correct: d.correct,
      wrong: d.wrong,
      empty: d.empty,
    }));
  }, [bransStats]);

  const latestNet = bransStats.latest;
  const bestNet = bransStats.best;
  const avgNet = bransStats.avg;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-sm space-y-6 relative overflow-hidden">
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-15 dark:opacity-25"
        style={{ backgroundColor: mainColor }}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 pb-4 border-b border-slate-100 dark:border-slate-700/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: mainColor }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: mainColor }}
              />
            </span>
            <h4 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
              {bransStats.config?.title} Gelişim Trendi
            </h4>
          </div>
          <p className="text-xs font-bold text-slate-400">
            Toplam {bransStats.count} denemede sınavdan sınava net seyri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="px-3.5 py-1.5 rounded-xl border-2 border-b-4 text-xs font-black flex items-center gap-1.5 shadow-2xs"
            style={{
              backgroundColor: `${mainColor}15`,
              borderColor: `${mainColor}40`,
              borderBottomColor: mainColor,
              color: mainColor,
            }}
          >
            <span className="opacity-75 font-extrabold">Son:</span>
            <span className="font-black text-sm tracking-wide">{formatNet(latestNet)}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border-2 border-b-4 border-amber-400 border-b-amber-500 text-[#ff9500] text-xs font-black flex items-center gap-1.5 shadow-2xs">
            <span className="font-extrabold">Rekor:</span>
            <span className="font-black text-sm tracking-wide">{formatNet(bestNet)}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[#58cc02]/10 dark:bg-[#58cc02]/20 border-2 border-b-4 border-[#58cc02]/40 border-b-[#58cc02] text-[#58cc02] text-xs font-black flex items-center gap-1.5 shadow-2xs">
            <span className="font-extrabold">Ort:</span>
            <span className="font-black text-sm tracking-wide">{formatNet(avgNet)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl w-fit text-xs font-black border-2 border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setChartView("net")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            chartView === "net"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <AppleEmoji emoji="📈" size={16} />
          <span>Net Değişimi</span>
        </button>
        <button
          type="button"
          onClick={() => setChartView("breakdown")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            chartView === "breakdown"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <AppleEmoji emoji="📊" size={16} />
          <span>Doğru / Yanlış / Boş</span>
        </button>
      </div>

      <div className="h-[320px] w-full pt-4 relative">
        <ResponsiveContainer width="100%" height={300} minWidth={0}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="bransNetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={mainColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={mainColor} stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="correctGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#58cc02" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#58cc02" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(148, 163, 184, 0.15)"
            />

            <XAxis
              dataKey="indexName"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
              dy={8}
            />

            <YAxis
              domain={[0, bransStats.maxQuestions]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
              dx={-8}
            />

            <RechartsTooltip
              content={<CustomRechartsTooltip mainColor={mainColor} />}
            />

            <ReferenceLine
              y={avgNet}
              stroke={mainColor}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={renderRefLabel(
                `Ort: ${formatNet(avgNet)}`,
                mainColor,
                "right"
              )}
            />

            {chartView === "net" ? (
              <Area
                type="monotone"
                dataKey="net"
                name="Net"
                stroke={mainColor}
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#bransNetGradient)"
                activeDot={{
                  r: 8,
                  stroke: "#ffffff",
                  strokeWidth: 3,
                  fill: mainColor,
                }}
              />
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="correct"
                  name="Doğru"
                  stroke="#58cc02"
                  strokeWidth={3}
                  fill="url(#correctGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="wrong"
                  name="Yanlış"
                  stroke="#ff4b4b"
                  strokeWidth={2}
                  fill="transparent"
                />
                <Area
                  type="monotone"
                  dataKey="empty"
                  name="Boş"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  fill="transparent"
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AppleFitnessConcentricRings({
  correct,
  wrong,
  empty,
  maxQuestions,
  avgNet,
  color,
}: {
  correct: number;
  wrong: number;
  empty: number;
  maxQuestions: number;
  avgNet: number;
  color: string;
}) {
  const [hoveredRing, setHoveredRing] = useState<
    "correct" | "wrong" | "empty" | null
  >(null);

  const total = maxQuestions > 0 ? maxQuestions : 1;
  const cPct = Math.min(1, Math.max(0, correct / total));
  const wPct = Math.min(1, Math.max(0, wrong / total));
  const ePct = Math.min(1, Math.max(0, empty / total));

  const size = 220;
  const center = size / 2;

  const rings = [
    {
      key: "correct" as const,
      label: "Doğru",
      val: correct,
      pct: cPct,
      radius: 85,
      strokeWidth: 14,
      color: "#58cc02",
      trackColor: "rgba(88, 204, 2, 0.15)",
    },
    {
      key: "wrong" as const,
      label: "Yanlış",
      val: wrong,
      pct: wPct,
      radius: 67,
      strokeWidth: 14,
      color: "#ff4b4b",
      trackColor: "rgba(255, 75, 75, 0.15)",
    },
    {
      key: "empty" as const,
      label: "Boş",
      val: empty,
      pct: ePct,
      radius: 49,
      strokeWidth: 14,
      color: "#94a3b8",
      trackColor: "rgba(148, 163, 184, 0.15)",
    },
  ];

  const activeRing = rings.find((r) => r.key === hoveredRing);

  return (
    <div className="relative flex flex-col items-center justify-center py-2">
      <div className="relative w-[220px] h-[220px] flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {rings.map((ring) => {
            const circumference = 2 * Math.PI * ring.radius;
            const strokeDashoffset = circumference * (1 - ring.pct);
            const isHovered = hoveredRing === ring.key;

            return (
              <g
                key={ring.key}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredRing(ring.key)}
                onMouseLeave={() => setHoveredRing(null)}
              >
                <circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="transparent"
                  stroke={ring.trackColor}
                  strokeWidth={ring.strokeWidth}
                />
                <motion.circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="transparent"
                  stroke={ring.color}
                  strokeWidth={
                    isHovered ? ring.strokeWidth + 4 : ring.strokeWidth
                  }
                  strokeDasharray={circumference}
                  strokeLinecap="round"
                  animate={{
                    strokeDashoffset,
                    strokeWidth: isHovered
                      ? ring.strokeWidth + 4
                      : ring.strokeWidth,
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 18 }}
                  className="filter drop-shadow-xs"
                />
              </g>
            );
          })}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[84px] h-[84px] rounded-full bg-white dark:bg-slate-900 border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-md flex flex-col items-center justify-center text-center p-1">
            {activeRing ? (
              <motion.div
                key={activeRing.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                <span
                  className="text-[9px] font-black uppercase tracking-wider block leading-tight"
                  style={{ color: activeRing.color }}
                >
                  {activeRing.label}
                </span>
                <span className="text-xl font-black text-slate-800 dark:text-white leading-none mt-0.5 block">
                  {activeRing.val.toFixed(1)}
                </span>
                <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                  %{Math.round(activeRing.pct * 100)}
                </span>
              </motion.div>
            ) : (
              <div>
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block leading-tight">
                  Ort. Net
                </span>
                <span
                  className="text-xl font-black tracking-tight leading-none mt-0.5 block"
                  style={{ color: color || "#1cb0f6" }}
                >
                  {formatNet(avgNet)}
                </span>
                <span className="text-[9px] font-extrabold text-slate-400 mt-0.5 block">
                  / {maxQuestions}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3">
        {rings.map((ring) => (
          <div
            key={ring.key}
            onMouseEnter={() => setHoveredRing(ring.key)}
            onMouseLeave={() => setHoveredRing(null)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border-2 ${
              hoveredRing === ring.key
                ? "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-2xs scale-105"
                : "border-transparent text-slate-500"
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: ring.color }}
            />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {ring.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
