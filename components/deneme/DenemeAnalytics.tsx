"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DenemeRecord,
  evaluateDeneme,
  formatNet,
  estimateP3Score,
} from "@/lib/denemeUtils";
import { DENEME_SUBJECTS } from "@/lib/denemeConfig";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DenemeScoreRing from "./DenemeScoreRing";

type Props = { 
  denemeler: DenemeRecord[]; 
  allDenemeler?: DenemeRecord[]; 
  viewType?: "genel" | "brans"; 
  targetNet: number;
  onTargetNetChange: (value: number) => void;
  onAdd: () => void;
  isReadOnly?: boolean;
};

type Range = "all" | "5" | "10";

/* ── Custom EdTech Tooltips ── */
const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md border border-slate-200/60 dark:border-white/10 p-4 rounded-2xl shadow-xl min-w-[220px]">
      <p className="text-[10px] font-black text-slate-400 tracking-wider border-b border-slate-100 dark:border-white/10 pb-2 mb-2 truncate uppercase">
        {d.name}
      </p>
      <div className="space-y-1.5">
        <Row label="Toplam Net" value={d.net.toFixed(2)} bold color="text-blue-600 dark:text-blue-400" />
        <Row label="GY Net" value={d.gyNet.toFixed(2)} color="text-indigo-600 dark:text-indigo-400" />
        <Row label="GK Net" value={d.gkNet.toFixed(2)} color="text-purple-600 dark:text-purple-400" />
      </div>
    </div>
  );
};

const BransChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md border border-slate-200/60 dark:border-white/10 p-4 rounded-2xl shadow-xl min-w-[180px]">
      <p className="text-[10px] font-black text-slate-400 tracking-wider border-b border-slate-100 dark:border-white/10 pb-2 mb-2 truncate uppercase">
        {d.name}
      </p>
      <div className="space-y-1.5">
        <Row label="Net" value={d.net.toFixed(2)} bold color="text-violet-600 dark:text-violet-400" />
        <Row label="Doğru" value={d.correct.toString()} color="text-emerald-500" />
        <Row label="Yanlış" value={d.wrong.toString()} color="text-red-500" />
      </div>
    </div>
  );
};

function Row({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[11px] gap-4">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={`font-mono ${bold ? "font-black text-sm" : "font-bold"} ${color || "text-slate-900 dark:text-white"}`}>{value}</span>
    </div>
  );
}

export default function DenemeAnalytics({
  denemeler,
  allDenemeler = [],
  viewType = "genel",
  targetNet,
  onTargetNetChange,
  onAdd,
  isReadOnly = false,
}: Props) {
  const [range, setRange] = useState<Range>("all");
  const [activeMetric, setActiveMetric] = useState<"total" | "gy" | "gk">("total");
  const [selectedBransSubjectId, setSelectedBransSubjectId] = useState<string>("");

  const availableBransSubjects = useMemo(() => {
    if (viewType !== "brans") return [];
    const ids = new Set(allDenemeler.filter(d => d.examType === "brans").map(d => d.bransSubjectId).filter(Boolean));
    return DENEME_SUBJECTS.filter(s => ids.has(s.id));
  }, [allDenemeler, viewType]);

  useEffect(() => {
    if (viewType === "brans" && availableBransSubjects.length > 0) {
      if (!selectedBransSubjectId || !availableBransSubjects.find(s => s.id === selectedBransSubjectId)) {
        setSelectedBransSubjectId(availableBransSubjects[0].id);
      }
    }
  }, [viewType, availableBransSubjects, selectedBransSubjectId]);

  const active = useMemo(() => {
    const list = [...denemeler];
    return range === "all" ? list : list.slice(0, parseInt(range, 10));
  }, [denemeler, range]);

  /* ── General Mode Stats ── */
  const stats = useMemo(() => {
    if (viewType !== "genel" || active.length === 0) return null;
    const evals = active.map((d) => ({ d, r: evaluateDeneme(d.scores, d.examType) }));
    const nets = evals.map((e) => e.r.totalNet);
    const avg = nets.reduce((a, b) => a + b, 0) / nets.length;
    const best = Math.max(...nets);

    const subjects = DENEME_SUBJECTS.map((sub) => {
      let tc = 0, tw = 0, te = 0, cnt = 0;
      active.forEach((d) => {
        const s = d.scores.find((x) => x.subjectId === sub.id);
        if (s) { tc += s.correct; tw += s.wrong; te += s.empty; cnt++; }
      });
      const ac = cnt ? tc / cnt : 0, aw = cnt ? tw / cnt : 0, ae = cnt ? te / cnt : 0;
      const net = cnt ? (tc - tw / 4) / cnt : 0;
      const accuracy = ac + aw > 0 ? (ac / (ac + aw)) * 100 : 0;
      return { ...sub, avgCorrect: ac, avgWrong: aw, avgEmpty: ae, avgNet: net, accuracy };
    });

    const sorted = [...subjects].sort((a, b) => b.avgNet - a.avgNet);

    const trend = [...active].reverse().map((d) => {
      const r = evaluateDeneme(d.scores, d.examType);
      return { 
        name: d.name, 
        net: r.totalNet, 
        gyNet: r.gyNet, 
        gkNet: r.gkNet, 
      };
    });

    const gyAvg = subjects.filter((s) => s.category === "Genel Yetenek").reduce((a, s) => a + s.avgNet, 0);
    const gkAvg = subjects.filter((s) => s.category !== "Genel Yetenek").reduce((a, s) => a + s.avgNet, 0);

    const worstWrong = [...subjects].map((s) => ({ ...s, wr: s.questionCount ? s.avgWrong / s.questionCount : 0 })).sort((a, b) => b.wr - a.wr);
    const worstEmpty = [...subjects].map((s) => ({ ...s, er: s.questionCount ? s.avgEmpty / s.questionCount : 0 })).sort((a, b) => b.er - a.er);
    const improvement = active.length > 1 ? nets[0] - nets[nets.length - 1] : 0;

    return {
      count: active.length, avg, best, latest: nets[0],
      subjects, strongest: sorted[0], weakest: sorted[sorted.length - 1],
      trend, gyAvg, gkAvg,
      p3: estimateP3Score(gyAvg, gkAvg),
      mostWrong: worstWrong[0]?.wr > 0 ? worstWrong[0] : null,
      mostEmpty: worstEmpty[0]?.er > 0 ? worstEmpty[0] : null,
      improvement,
    };
  }, [active, viewType]);

  /* ── Branch Mode Stats ── */
  const bransStats = useMemo(() => {
    if (viewType !== "brans" || !selectedBransSubjectId) return null;
    const list = active.filter(d => d.bransSubjectId === selectedBransSubjectId);
    if (list.length === 0) return null;

    const subConfig = DENEME_SUBJECTS.find(s => s.id === selectedBransSubjectId);
    const maxQuestions = subConfig?.questionCount ?? 30;

    const evals = list.map(d => {
      const s = d.scores.find(x => x.subjectId === selectedBransSubjectId);
      const correct = s?.correct ?? 0;
      const wrong = s?.wrong ?? 0;
      const empty = s?.empty ?? 0;
      const net = correct - wrong / 4;
      return { correct, wrong, empty, net, name: d.name, date: d.date };
    });

    const nets = evals.map(e => e.net);
    const avg = nets.reduce((a, b) => a + b, 0) / nets.length;
    const best = Math.max(...nets);
    const latest = nets[0];

    const avgC = evals.reduce((a, b) => a + b.correct, 0) / evals.length;
    const avgW = evals.reduce((a, b) => a + b.wrong, 0) / evals.length;
    const avgE = evals.reduce((a, b) => a + b.empty, 0) / evals.length;

    const trend = [...evals].reverse();
    const improvement = list.length > 1 ? nets[0] - nets[nets.length - 1] : 0;

    return {
      count: list.length, avg, best, latest, avgC, avgW, avgE, maxQuestions, trend, config: subConfig, improvement
    };
  }, [active, selectedBransSubjectId, viewType]);

  /* ═══ Empty States ═══ */
  if (viewType === "genel" && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 text-center">
        <DenemeScoreRing value={0} max={120} size={130} label="Analiz Bekleniyor" />
        <p className="text-sm font-semibold text-slate-500 mt-6 max-w-xs leading-relaxed">
          Genel deneme analizlerini görmek için en az bir adet Genel Deneme kaydı {isReadOnly ? "bulunmuyor" : "girmelisiniz"}.
        </p>
        {!isReadOnly && <button onClick={onAdd} className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20">Deneme Girişi Yap</button>}
      </div>
    );
  }

  if (viewType === "brans" && availableBransSubjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 text-center">
        <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 text-violet-500 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm">
          🎯
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Branş Analizi Bekleniyor</h3>
        <p className="text-sm font-semibold text-slate-500 mt-2 max-w-xs leading-relaxed">
          Branş deneme grafiklerini ve analizlerini görmek için önce "Yeni Giriş" kısmından bir Branş Denemesi {isReadOnly ? "bulunmuyor" : "kaydetmelisiniz"}.
        </p>
        {!isReadOnly && <button onClick={onAdd} className="mt-6 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20">Branş Denemesi Gir</button>}
      </div>
    );
  }

  const metricStroke = activeMetric === "total" ? "#3b82f6" : activeMetric === "gy" ? "#6366f1" : "#a855f7";
  const remaining = stats ? Math.max(0, targetNet - stats.avg) : 0;

  return (
    <div className="space-y-12 pb-10">

      {/* ━━━ Header Filter / Count ━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex p-1 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200/50 dark:border-white/10 w-fit shadow-sm">
          {(["all", "5", "10"] as Range[]).map((r) => (
            <button key={r} type="button" onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${range === r ? "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}>
              {r === "all" ? "Tüm Zamanlar" : `Son ${r} Sınav`}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
          {viewType === "genel" ? `${stats?.count} genel deneme` : `${bransStats?.count} branş denemesi`} gösteriliyor
        </span>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          GENEL DENEME ANALİZ DETAYLARI
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {viewType === "genel" && stats && (
        <>
          {/* ━━━ 1 · Genel Bakış ━━━ */}
          <Section
            title="Genel Bakış"
            desc="Sınav skorlarınızın özet tablosu. Çalışmalarınızın genel seyrini buradan takip edebilirsiniz."
            icon="📊"
          >
            <div className="grid sm:grid-cols-3 gap-5">
              <SummaryCard label="Net Ortalaması" value={formatNet(stats.avg)} sub="120 soru üzerinden" accent emoji="🔥" />
              <SummaryCard label="En Yüksek Net" value={formatNet(stats.best)} sub={`Tahmini P3: ${estimateP3Score(stats.best).toFixed(2)}`} emoji="👑" />
              <SummaryCard label="Tahmini P3 Puanı" value={stats.p3.toFixed(2)} sub="Net ortalamanıza göre" highlight emoji="🎓" />
            </div>

            <div className="mt-6 p-6 rounded-[2rem] bg-white dark:bg-[#1e293b] border border-slate-200/60 dark:border-white/5 shadow-sm">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-5 flex items-center gap-2">
                <span className="text-lg">⚖️</span> GY / GK Denge Grafiği
              </p>
              <div className="space-y-4">
                <BalanceBar label="Genel Yetenek (GY)" value={stats.gyAvg} max={60} color="from-blue-500 to-indigo-400" textColor="text-blue-600" />
                <BalanceBar label="Genel Kültür (GK)" value={stats.gkAvg} max={60} color="from-purple-500 to-pink-400" textColor="text-purple-600" />
              </div>
            </div>
          </Section>

          {/* ━━━ 2 · Gelişim Grafiği ━━━ */}
          <Section
            title="Net Gelişim Eğrisi"
            desc="Sınavdan sınava olan net değişimlerinizi ve trendinizi gösterir."
            icon="📈"
          >
            <div className="flex p-1 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200/50 dark:border-white/5 text-xs font-bold w-fit mb-5 shadow-sm">
              {([
                { key: "total" as const, label: "Toplam Net" },
                { key: "gy" as const, label: "Genel Yetenek" },
                { key: "gk" as const, label: "Genel Kültür" },
              ]).map((m) => (
                <button key={m.key} type="button" onClick={() => setActiveMetric(m.key)}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeMetric === m.key ? "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}>
                  {m.label}
                </button>
              ))}
            </div>

            <div className="h-[320px] w-full p-4 bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trend} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metricStroke} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={metricStroke} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border-custom)" opacity={0.5} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} dy={10} />
                  <YAxis domain={[0, activeMetric === "total" ? 120 : 60]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} dx={-5} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(0,0,0,0.05)", strokeWidth: 2 }} />
                  <Area type="monotone" dataKey={activeMetric === "total" ? "net" : activeMetric === "gy" ? "gyNet" : "gkNet"}
                    stroke={metricStroke} strokeWidth={4} fill="url(#colorMetric)"
                    activeDot={{ r: 6, strokeWidth: 2, fill: "#fff", stroke: metricStroke }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {stats.improvement !== 0 && stats.count > 1 && (
              <div className="mt-4 flex justify-center">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-sm ${stats.improvement > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"}`}>
                  {stats.improvement > 0 ? "🚀" : "📉"} İlk denemeden bu yana {stats.improvement > 0 ? "+" : ""}{formatNet(stats.improvement)} net {stats.improvement > 0 ? "ilerleme!" : "gerileme."}
                </span>
              </div>
            )}
          </Section>

          {/* ━━━ 3 · Hedef Belirleme (Gamified Slider) ━━━ */}
          {!isReadOnly && (
            <Section title="Hedefini Belirle" desc="Kendine bir net hedefi koy ve ona ulaşmak için ilerlemeni takip et." icon="🎯">
              <div className="relative overflow-hidden p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-[#1e293b] border border-slate-200/60 dark:border-white/5 shadow-sm group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none transition-transform group-hover:scale-110"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0 transform -rotate-6 transition-transform group-hover:rotate-0">
                       <span className="text-3xl drop-shadow-md">🏆</span>
                     </div>
                     <div>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Hedefin</p>
                       <p className="text-4xl font-black font-mono text-slate-800 dark:text-white tracking-tighter">
                         {targetNet}
                         <span className="text-base font-bold text-slate-400 ml-2 font-sans tracking-normal">net</span>
                       </p>
                     </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-white/5 px-5 py-3 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Bu Netin P3 Karşılığı</p>
                    <p className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{estimateP3Score(targetNet).toFixed(2)}</p>
                  </div>
                </div>

                <div className="relative z-10 mb-8">
                  <input
                    type="range"
                    min={60}
                    max={115}
                    value={targetNet}
                    onChange={(e) => onTargetNetChange(parseInt(e.target.value, 10))}
                    style={{ ["--val" as string]: `${((targetNet - 60) / (115 - 60)) * 100}%` }}
                    className="premium-range w-full cursor-pointer"
                  />
                </div>

                <div className="space-y-4 relative z-10">
                  {(() => {
                    const ratio = stats.avg / targetNet;
                    const pct = Math.min(100, ratio * 100);
                    const barColor = ratio >= 1 ? "from-emerald-400 to-green-500" : ratio >= 0.8 ? "from-blue-400 to-indigo-500" : "from-amber-400 to-orange-500";

                    return (
                      <>
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                          <span>Mevcut Ortalamam: {formatNet(stats.avg)}</span>
                          <span className={ratio >= 1 ? "text-emerald-500" : ""}>{Math.round(pct)}% Tamamlandı</span>
                        </div>
                        <div className="h-5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner p-1">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${barColor} rounded-full shadow-sm relative overflow-hidden`}
                            animate={{ width: `${pct}%` }}
                            transition={{ type: "spring", stiffness: 50, damping: 15 }}
                          >
                            <div className="absolute inset-0 bg-white/20 w-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }} />
                          </motion.div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {remaining > 0 ? (
                  <div className="mt-6 text-center text-sm font-bold text-slate-600 dark:text-slate-300">
                    Hedefine ulaşmak için <span className="font-black font-mono text-indigo-600 dark:text-indigo-400 text-lg mx-1">{formatNet(remaining)} net</span> daha yükselmelisin. Başarabilirsin! 💪
                  </div>
                ) : (
                  <div className="mt-6 text-center text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                    <span className="text-xl">🎉</span> Hedefine ulaştın! Mükemmelsin!
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ━━━ 4 · Ders Bazlı Kırılım (Cards) ━━━ */}
          <Section title="Ders Karnen" desc="Derslerin detaylı analizleri. En yüksek ve en düşük başarı oranlarını incele." icon="📚">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.subjects.map((s, i) => {
                const pct = s.questionCount > 0 ? (s.avgNet / s.questionCount) * 100 : 0;
                const accColor = s.accuracy >= 70 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : s.accuracy >= 45 ? "text-amber-600 bg-amber-50 dark:bg-amber-500/10" : "text-red-600 bg-red-50 dark:bg-red-500/10";
                
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-5 rounded-[2rem] bg-white dark:bg-[#1e293b] border border-slate-200/60 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 text-4xl" style={{ color: s.color }}>
                      {s.icon}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                        <span className="text-2xl">{s.icon}</span>
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-800 dark:text-white">{s.title}</p>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{s.category} • {s.questionCount} Soru</p>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mb-3 relative z-10">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ortalama Net</p>
                        <p className="text-3xl font-black font-mono" style={{ color: s.color }}>{formatNet(s.avgNet)}</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl ${accColor}`}>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-0.5 opacity-80">Başarı</p>
                        <p className="font-mono font-bold text-sm">% {Math.round(s.accuracy)}</p>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative z-10">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: s.color }}
                        initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 0.8 }} />
                    </div>

                    <div className="mt-4 flex justify-between text-xs font-bold font-mono relative z-10 bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                      <span className="text-emerald-500">{s.avgCorrect.toFixed(1)} D</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-red-500">{s.avgWrong.toFixed(1)} Y</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">{s.avgEmpty.toFixed(1)} B</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Section>

          {/* ━━━ 5 · Tavsiyeler ━━━ */}
          <Section title="Akıllı Tavsiyeler" desc="Sonuçlarına göre oluşturulan kişisel koçluk notların." icon="💡">
            <div className="grid md:grid-cols-2 gap-4">
              {stats.mostWrong && (
                <Tip icon="🚨" title="Dikkat: Çok Hata Yapıyorsun" color="bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300">
                  <strong className="font-black">{stats.mostWrong.title}</strong> dersinde soruların %{Math.round(stats.mostWrong.wr * 100)}'unu yanlış yapıyorsun. Yanlış yaptığın konuları tekrar etmeden yeni denemeye geçme!
                </Tip>
              )}
              {stats.mostEmpty && (
                <Tip icon="⏰" title="Süre veya Bilgi Eksikliği" color="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300">
                  <strong className="font-black">{stats.mostEmpty.title}</strong> dersinde soruların %{Math.round(stats.mostEmpty.er * 100)}'unu boş bırakıyorsun. Turlama tekniğini daha iyi kullanarak süreni yönetebilirsin.
                </Tip>
              )}
              <Tip icon="⚖️" title="GY / GK Dengen" color="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300">
                {stats.gyAvg < stats.gkAvg
                  ? "Genel Yetenek puanın daha düşük. Paragraf ve matematik çözme hızını artırmaya odaklan."
                  : "Genel Kültür puanın daha düşük. Tarih, Coğrafya ve Vatandaşlık okumalarını sıklaştır."}
              </Tip>
              <Tip icon="💎" title="Gizli Potansiyelin" color="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                Tüm yanlış ve boş sorularını doğruya çevirirsen <strong className="font-black text-emerald-600 dark:text-emerald-400">+{formatNet(120 - stats.avg)} net</strong> kazanabilirsin. Hatalarından öğrenmek en büyük sıçramayı yaptırır!
              </Tip>
            </div>
          </Section>
        </>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BRANŞ DENEME ANALİZ DETAYLARI
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {viewType === "brans" && bransStats && (
        <>
          <div className="flex gap-3 border-b border-slate-200 dark:border-white/10 pb-6 overflow-x-auto no-scrollbar snap-x">
            {availableBransSubjects.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedBransSubjectId(sub.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-[1rem] font-bold transition-all snap-start ${
                  selectedBransSubjectId === sub.id 
                    ? "text-white transform scale-105" 
                    : "bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
                style={
                  selectedBransSubjectId === sub.id
                    ? { backgroundColor: sub.color, boxShadow: `0 10px 15px -3px ${sub.color}40, 0 4px 6px -4px ${sub.color}40` }
                    : {}
                }
              >
                <span>{sub.icon}</span>
                <span>{sub.title}</span>
              </button>
            ))}
          </div>

          <Section title={`${bransStats.config?.title} İstatistikleri`} desc="Seçili branştaki genel performans özetin." icon={bransStats.config?.icon || "🎯"}>
            <div className="grid sm:grid-cols-4 gap-4">
              <SummaryCard label="Net Ortalaması" value={formatNet(bransStats.avg)} sub={`${bransStats.maxQuestions} soruda`} emoji="📊" accent />
              <SummaryCard label="En Yüksek Net" value={formatNet(bransStats.best)} sub="Rekorun" emoji="🏆" />
              <SummaryCard label="Son Sınav Neti" value={formatNet(bransStats.latest)} sub="Mevcut durum" emoji="📌" />
              <SummaryCard label="Gelişimin" value={`${bransStats.improvement > 0 ? "+" : ""}${formatNet(bransStats.improvement)}`} sub="İlk sınava göre" emoji={bransStats.improvement > 0 ? "🚀" : "📉"} highlight />
            </div>

            <div className="mt-5 p-6 rounded-[2rem] bg-white dark:bg-[#1e293b] border border-slate-200/60 dark:border-white/5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-6">Ortalama Doğru / Yanlış Dağılımı</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                  <span className="text-emerald-500 text-2xl mb-1">✅</span>
                  <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{bransStats.avgC.toFixed(1)}</span>
                  <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mt-1">Doğru</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                  <span className="text-rose-500 text-2xl mb-1">❌</span>
                  <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">{bransStats.avgW.toFixed(1)}</span>
                  <span className="text-[10px] font-bold text-rose-600/70 uppercase tracking-wider mt-1">Yanlış</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                  <span className="text-slate-400 text-2xl mb-1">⚪</span>
                  <span className="text-2xl font-black font-mono text-slate-600 dark:text-slate-300">{bransStats.avgE.toFixed(1)}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Boş</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Gelişim Eğrisi" desc={`${bransStats.config?.title} dersindeki net değişim trendi.`} icon="📈">
            <div className="h-[320px] w-full p-4 bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bransStats.trend} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bransColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={bransStats.config?.color || "#8b5cf6"} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={bransStats.config?.color || "#8b5cf6"} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border-custom)" opacity={0.5} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} dy={10} />
                  <YAxis domain={[0, bransStats.maxQuestions]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} dx={-5} />
                  <Tooltip content={<BransChartTooltip />} cursor={{ stroke: "rgba(0,0,0,0.05)", strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="net" stroke={bransStats.config?.color || "#8b5cf6"} strokeWidth={4} fill="url(#bransColor)" activeDot={{ r: 6, strokeWidth: 2, fill: "#fff", stroke: bransStats.config?.color || "#8b5cf6" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function Section({ title, desc, icon, children }: { title: string; desc?: string; icon?: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="mb-6 flex items-center gap-3">
        {icon && <span className="text-3xl bg-white dark:bg-[#1e293b] p-2 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">{icon}</span>}
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{title}</h3>
          {desc && <p className="text-sm font-semibold text-slate-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ label, value, sub, accent, highlight, emoji }: { label: string; value: string; sub: string; accent?: boolean; highlight?: boolean; emoji?: string; }) {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} className={`p-6 rounded-[2rem] border shadow-sm relative overflow-hidden flex flex-col justify-between h-full ${
      accent ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-indigo-400 text-white" :
      highlight ? "bg-gradient-to-br from-violet-500 to-purple-600 border-purple-400 text-white" :
      "bg-white dark:bg-[#1e293b] border-slate-200/60 dark:border-white/5 text-slate-800 dark:text-white"
    }`}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className={`text-[10px] font-black uppercase tracking-widest ${accent || highlight ? "text-white/80" : "text-slate-400"}`}>{label}</p>
        {emoji && <span className="text-2xl drop-shadow-sm">{emoji}</span>}
      </div>
      <div className="relative z-10">
        <p className={`text-4xl font-black font-mono tracking-tight drop-shadow-sm ${accent || highlight ? "text-white" : "text-slate-800 dark:text-white"}`}>{value}</p>
        {sub && <p className={`text-[11px] font-bold mt-2 ${accent || highlight ? "text-white/80" : "text-slate-400"}`}>{sub}</p>}
      </div>
      {(accent || highlight) && <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />}
    </motion.div>
  );
}

function BalanceBar({ label, value, max, color, textColor }: { label: string; value: number; max: number; color: string; textColor: string; }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
        <span>{label}</span>
        <span className={`font-mono font-black ${textColor}`}>{formatNet(value)} / {max}</span>
      </div>
      <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner p-0.5">
        <motion.div 
          className={`h-full bg-gradient-to-r ${color} rounded-full relative shadow-sm`} 
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}

function Tip({ icon, title, color, children }: { icon: string; title: string; color: string; children: React.ReactNode; }) {
  return (
    <div className={`p-5 rounded-[1.5rem] border ${color} flex gap-4`}>
      <span className="text-3xl shrink-0 drop-shadow-sm">{icon}</span>
      <div>
        <h4 className="text-sm font-black mb-1 opacity-90">{title}</h4>
        <p className="text-xs font-semibold leading-relaxed opacity-80">{children}</p>
      </div>
    </div>
  );
}
