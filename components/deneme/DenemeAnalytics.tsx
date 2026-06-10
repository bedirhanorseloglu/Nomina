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
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);
import DenemeScoreRing from "./DenemeScoreRing";
import { BarChart3, TrendingUp, Target, BookOpen, CheckCircle2, XCircle, MinusCircle, Lightbulb, AlertTriangle, Clock, Scale, Sparkles, BookText, Calculator, Landmark, Globe2, Newspaper } from "lucide-react";
import AppleEmoji from "../AppleEmoji";
import * as Slider from "@radix-ui/react-slider";

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



function Row({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[11px] gap-4">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={`font-mono ${bold ? "font-black text-sm" : "font-bold"} ${color || "text-slate-900 dark:text-white"}`}>{value}</span>
    </div>
  );
}

const getSubjectIcon = (id: string, color: string) => {
  switch (id) {
    case 'turkce': return <BookText className="w-5 h-5" style={{ color }} />;
    case 'matematik': return <Calculator className="w-5 h-5" style={{ color }} />;
    case 'tarih': return <Landmark className="w-5 h-5" style={{ color }} />;
    case 'cografya': return <Globe2 className="w-5 h-5" style={{ color }} />;
    case 'vatandaslik': return <Scale className="w-5 h-5" style={{ color }} />;
    case 'guncel-bilgiler': return <Newspaper className="w-5 h-5" style={{ color }} />;
    default: return <BookOpen className="w-5 h-5" style={{ color }} />;
  }
};

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
      
      const gySubj = r.subjects.filter((s) => s.category === "Genel Yetenek");
      const gkSubj = r.subjects.filter((s) => s.category === "Genel Kültür" || s.category === "Vatandaşlık");

      return { 
        name: d.name, 
        net: r.totalNet, 
        gyNet: r.gyNet, 
        gkNet: r.gkNet, 
        correct: r.totalCorrect,
        wrong: r.totalWrong,
        empty: r.totalEmpty,
        gyC: gySubj.reduce((a, s) => a + s.correct, 0),
        gyW: gySubj.reduce((a, s) => a + s.wrong, 0),
        gyE: gySubj.reduce((a, s) => a + s.empty, 0),
        gkC: gkSubj.reduce((a, s) => a + s.correct, 0),
        gkW: gkSubj.reduce((a, s) => a + s.wrong, 0),
        gkE: gkSubj.reduce((a, s) => a + s.empty, 0),
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
            icon={<BarChart3 className="w-8 h-8 text-blue-500" />}
          >
            <div className="grid sm:grid-cols-3 gap-5">
              <SummaryCard label="Net Ortalaması" value={formatNet(stats.avg)} sub="120 soru üzerinden" accent emoji="🔥" />
              <SummaryCard label="En Yüksek Net" value={formatNet(stats.best)} sub={`Tahmini P3: ${estimateP3Score(stats.best).toFixed(2)}`} emoji="👑" />
              <SummaryCard label="Tahmini P3 Puanı" value={stats.p3.toFixed(2)} sub="Net ortalamanıza göre" highlight emoji="🎓" />
            </div>

            <div className="mt-8 p-6 sm:p-8 bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/5">
              <h4 className="text-[13px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Denge Grafiği</h4>
              <div className="space-y-6">
                <BalanceBar label="Genel Yetenek" value={stats.gyAvg} max={60} color="bg-[#1cb0f6]" textColor="text-[#1cb0f6]" />
                <BalanceBar label="Genel Kültür" value={stats.gkAvg} max={60} color="bg-[#ce82ff]" textColor="text-[#ce82ff]" />
              </div>
            </div>
          </Section>

          {/* ━━━ 2 · Gelişim Grafiği ━━━ */}
          <Section
            title="Net Gelişim Eğrisi"
            desc="Sınavdan sınava olan net değişimlerinizi ve trendinizi gösterir."
            icon={<TrendingUp className="w-8 h-8 text-indigo-500" />}
          >
            <div className="flex p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-white/5 text-xs font-bold w-fit mb-8 shadow-inner backdrop-blur-sm">
              {([
                { key: "total" as const, label: "Toplam Net", icon: "🌟" },
                { key: "gy" as const, label: "Genel Yetenek", icon: "🧠" },
                { key: "gk" as const, label: "Genel Kültür", icon: "🌍" },
              ]).map((m) => (
                <button key={m.key} type="button" onClick={() => setActiveMetric(m.key)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 z-10 ${
                    activeMetric === m.key ? "text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}>
                  {activeMetric === m.key && (
                    <motion.div
                      layoutId="metricTab"
                      className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-xl border border-slate-200/60 dark:border-white/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 text-sm"><AppleEmoji emoji={m.icon} size={16} /></span>
                  <span className="relative z-10">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="h-[380px] w-full p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)] border border-slate-100 dark:border-white/5 relative group">
              <Line 
                data={{
                  labels: stats.trend.map(d => d.name),
                  datasets: (() => {
                    const mappedData = stats.trend.map(d => {
                       let yVal, cVal, wVal, eVal;
                       if (activeMetric === "total") { yVal = d.net; cVal = d.correct; wVal = d.wrong; eVal = d.empty; }
                       else if (activeMetric === "gy") { yVal = d.gyNet; cVal = d.gyC; wVal = d.gyW; eVal = d.gyE; }
                       else { yVal = d.gkNet; cVal = d.gkC; wVal = d.gkW; eVal = d.gkE; }
                       return { x: d.name, y: yVal, correct: cVal, wrong: wVal, empty: eVal };
                    });
                    return [
                      {
                        label: 'Net',
                        parsing: { xAxisKey: 'x', yAxisKey: 'y' },
                        data: mappedData,
                        borderColor: metricStroke,
                        backgroundColor: (context: any) => {
                          const ctx = context.chart.ctx;
                          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                          gradient.addColorStop(0, metricStroke + '33'); // 20% opacity
                          gradient.addColorStop(1, metricStroke + '00'); // 0% opacity
                          return gradient;
                        },
                        borderWidth: 4,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: metricStroke,
                        pointBorderWidth: 3,
                        pointRadius: 0, // Hidden until hover for modern look
                        pointHoverRadius: 6,
                        pointHitRadius: 20,
                        fill: true,
                        tension: 0.4, // Super smooth curve
                      },
                      {
                        label: 'Doğru',
                        parsing: { xAxisKey: 'x', yAxisKey: 'correct' },
                        data: mappedData,
                        backgroundColor: '#10b981', borderColor: '#10b981', borderWidth: 0, pointRadius: 0, pointHoverRadius: 0, showLine: false, fill: false
                      },
                      {
                        label: 'Yanlış',
                        parsing: { xAxisKey: 'x', yAxisKey: 'wrong' },
                        data: mappedData,
                        backgroundColor: '#f43f5e', borderColor: '#f43f5e', borderWidth: 0, pointRadius: 0, pointHoverRadius: 0, showLine: false, fill: false
                      },
                      {
                        label: 'Boş',
                        parsing: { xAxisKey: 'x', yAxisKey: 'empty' },
                        data: mappedData,
                        backgroundColor: '#94a3b8', borderColor: '#94a3b8', borderWidth: 0, pointRadius: 0, pointHoverRadius: 0, showLine: false, fill: false
                      }
                    ];
                  })()
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      titleColor: '#64748b',
                      bodyColor: '#0f172a',
                      bodyFont: { size: 14, weight: 'bold', family: "'Nunito', sans-serif" },
                      titleFont: { size: 11, weight: 'bold', family: "'Nunito', sans-serif" },
                      borderColor: 'rgba(0,0,0,0.06)',
                      borderWidth: 1,
                      padding: 14,
                      displayColors: true,
                      usePointStyle: true,
                      boxWidth: 8,
                      boxHeight: 8,
                      boxPadding: 6,
                      cornerRadius: 16,
                      callbacks: {
                        label: (context) => {
                          const val = context.datasetIndex === 0 ? context.parsed.y.toFixed(2) : context.parsed.y.toString();
                          return ` ${context.dataset.label}: ${val}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      min: 0,
                      max: activeMetric === "total" ? 120 : 60,
                      grid: {
                        color: 'rgba(148, 163, 184, 0.15)',
                        tickLength: 0,
                        lineWidth: 1.5,
                        drawTicks: false
                      },
                      border: { display: false, dash: [4, 4] },
                      ticks: {
                        padding: 15,
                        font: { size: 12, weight: 800, family: "'Nunito', sans-serif" },
                        color: '#94a3b8',
                        maxTicksLimit: 6
                      }
                    },
                    x: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: {
                        padding: 20,
                        font: { size: 11, weight: 700, family: "'Nunito', sans-serif" },
                        color: '#94a3b8',
                        maxTicksLimit: 8
                      }
                    }
                  }
                }}
              />
            </div>

            {stats.improvement !== 0 && stats.count > 1 && (
              <div className="mt-4 flex justify-center">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-sm ${stats.improvement > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"}`}>
                  {stats.improvement > 0 ? "🚀" : "📉"} İlk denemeden bu yana {stats.improvement > 0 ? "+" : ""}{formatNet(stats.improvement)} net {stats.improvement > 0 ? "ilerleme!" : "gerileme."}
                </span>
              </div>
            )}
          </Section>

          {/* ━━━ 3 · Hedef Belirleme (Gamified Path) ━━━ */}
          {!isReadOnly && (
            <Section title="Hedefine Doğru İlerle" desc="Koyduğun hedefe ulaşmak için önündeki yolu takip et." icon={<Target className="w-8 h-8 text-[#1cb0f6]" />}>
              <div className="w-full bg-white dark:bg-[#1e293b] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)] border-2 border-slate-100 dark:border-white/5 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />

                <div className="flex flex-col gap-10 sm:gap-14 relative z-10">
                  
                  {/* Top: Stats Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="text-center flex-1">
                      <p className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">Mevcut Ortalaman</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <p className="text-5xl sm:text-6xl font-black font-mono text-slate-800 dark:text-white leading-none">
                          {formatNet(stats.avg)}
                        </p>
                        <span className="text-xl font-bold text-slate-400">net</span>
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col justify-center flex-1 px-4 mt-4">
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full relative overflow-hidden">
                        <motion.div 
                          className="absolute top-0 left-0 bottom-0 bg-[#58cc02]" 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (stats.avg / targetNet) * 100)}%` }}
                          transition={{ type: "spring", stiffness: 50, damping: 20 }}
                        />
                      </div>
                      <p className="text-center text-xs font-bold text-slate-400 mt-3">
                        Hedefin %{Math.round(Math.min(100, (stats.avg / targetNet) * 100))}'ine ulaştın!
                      </p>
                    </div>

                    <div className="text-center flex-1">
                      <p className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1 flex justify-center items-center gap-1.5">
                        Yeni Hedefin
                      </p>
                      <div className="flex items-baseline justify-center gap-2 text-[#1cb0f6]">
                        <p className="text-5xl sm:text-6xl font-black font-mono leading-none">
                          {targetNet}
                        </p>
                        <span className="text-xl font-bold opacity-80">net</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Interactive Path Slider */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 sm:p-10 border-2 border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center">
                          <AppleEmoji emoji="🎯" size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">Hedefini Güncelle</p>
                          <p className="text-xs font-semibold text-slate-500">Hedefini artır, daha iyisini başar!</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tahmini P3 Puanı</p>
                        <p className="text-2xl font-black font-mono text-[#ff9600] leading-none">{estimateP3Score(targetNet).toFixed(2)}</p>
                      </div>
                    </div>

                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-8"
                      value={[targetNet]}
                      min={60}
                      max={115}
                      step={1}
                      onValueChange={(val) => onTargetNetChange(val[0])}
                    >
                      <Slider.Track className="bg-slate-200 dark:bg-slate-700 relative grow rounded-full h-4 sm:h-5 shadow-inner overflow-hidden">
                        <Slider.Range className="absolute bg-[#1cb0f6] rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb
                        className="block w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full border-[3px] border-[#1cb0f6] shadow-[0_4px_10px_rgba(28,176,246,0.3)] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#1cb0f6]/20 transition-colors cursor-grab active:cursor-grabbing flex items-center justify-center"
                        aria-label="Hedef Net"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#1cb0f6]" />
                      </Slider.Thumb>
                    </Slider.Root>
                    <div className="flex justify-between w-full mt-3 text-sm font-bold text-slate-400 px-2">
                      <span>60 Net</span>
                      <span>115 Net</span>
                    </div>
                  </div>

                  {/* Bottom: Motivation Badge */}
                  <div className="flex justify-center">
                    {remaining > 0 ? (
                      <div className="inline-flex items-center gap-3 px-6 py-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl font-bold border-2 border-amber-200 dark:border-amber-500/20">
                        <AppleEmoji emoji="🔥" size={24} className="animate-bounce" />
                        <span className="text-sm sm:text-base">Hedefe ulaşmana sadece <span className="font-black text-amber-500 text-lg sm:text-xl px-1">{formatNet(remaining)} net</span> kaldı! Devam et!</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-3 px-6 py-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl font-bold border-2 border-emerald-200 dark:border-emerald-500/20">
                        <AppleEmoji emoji="🎉" size={28} className="animate-bounce" /> 
                        <span className="text-sm sm:text-base">Mükemmel! Mevcut hedefini aştın. Yeni bir hedef belirleme zamanı!</span>
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
            </Section>
          )}

          {/* ━━━ 4 · Ders Bazlı Kırılım (Cards) ━━━ */}
          <Section title="Ders Karnen" desc="Derslerin detaylı analizleri. En yüksek ve en düşük başarı oranlarını incele." icon={<BookOpen className="w-8 h-8 text-purple-500" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.subjects.map((s, i) => {
                const pct = s.questionCount > 0 ? (s.avgNet / s.questionCount) * 100 : 0;
                
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-5 sm:p-6 rounded-[1.5rem] bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/10" style={{ backgroundColor: `${s.color}15` }}>
                          {getSubjectIcon(s.id, s.color)}
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-slate-800 dark:text-white leading-tight">{s.title}</p>
                          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{s.category} • {s.questionCount} Soru</p>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex flex-col items-center justify-center border ${
                        s.accuracy >= 70 ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20" : 
                        s.accuracy >= 45 ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20" : 
                        "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20"
                      }`}>
                        <span className="opacity-70 text-[9px] uppercase tracking-wider mb-0.5">Başarı</span>
                        <span>%{Math.round(s.accuracy)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ortalama Net</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-black font-mono leading-none" style={{ color: s.color }}>{formatNet(s.avgNet)}</p>
                      </div>
                    </div>

                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: s.color }}
                        initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ type: "spring", stiffness: 60, damping: 15 }} />
                    </div>

                    <div className="flex justify-between text-xs font-bold px-1">
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> {s.avgCorrect.toFixed(1)} D</span>
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5"/> {s.avgWrong.toFixed(1)} Y</span>
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><MinusCircle className="w-3.5 h-3.5"/> {s.avgEmpty.toFixed(1)} B</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Section>

          {/* ━━━ 5 · Tavsiyeler ━━━ */}
          <Section title="Akıllı Tavsiyeler" desc="Sonuçlarına göre oluşturulan kişisel koçluk notların." icon={<Lightbulb className="w-7 h-7 text-amber-500" />}>
            <div className="grid md:grid-cols-2 gap-4">
              {stats.mostWrong && (
                <Tip icon={<AlertTriangle className="w-6 h-6 text-rose-500" />} title="Dikkat: Çok Hata Yapıyorsun" colorClass="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                  <strong className="font-bold text-slate-700 dark:text-slate-200">{stats.mostWrong.title}</strong> dersinde soruların %{Math.round(stats.mostWrong.wr * 100)}'unu yanlış yapıyorsun. Yanlış yaptığın konuları tekrar etmeden yeni denemeye geçme!
                </Tip>
              )}
              {stats.mostEmpty && (
                <Tip icon={<Clock className="w-6 h-6 text-amber-500" />} title="Süre veya Bilgi Eksikliği" colorClass="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                  <strong className="font-bold text-slate-700 dark:text-slate-200">{stats.mostEmpty.title}</strong> dersinde soruların %{Math.round(stats.mostEmpty.er * 100)}'unu boş bırakıyorsun. Turlama tekniğini daha iyi kullanarak süreni yönetebilirsin.
                </Tip>
              )}
              <Tip icon={<Scale className="w-6 h-6 text-blue-500" />} title="GY / GK Dengen" colorClass="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                {stats.gyAvg < stats.gkAvg
                  ? "Genel Yetenek puanın daha düşük. Paragraf ve matematik çözme hızını artırmaya odaklan."
                  : "Genel Kültür puanın daha düşük. Tarih, Coğrafya ve Vatandaşlık okumalarını sıklaştır."}
              </Tip>
              <Tip icon={<Sparkles className="w-6 h-6 text-emerald-500" />} title="Gizli Potansiyelin" colorClass="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                Tüm yanlış ve boş sorularını doğruya çevirirsen <strong className="font-bold text-emerald-600 dark:text-emerald-400">+{formatNet(120 - stats.avg)} net</strong> kazanabilirsin. Hatalarından öğrenmek en büyük sıçramayı yaptırır!
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

          <Section title={`${bransStats.config?.title} İstatistikleri`} desc="Seçili branştaki genel performans özetin." icon={<BarChart3 className="w-8 h-8" style={{ color: bransStats.config?.color || "#8b5cf6" }} />}>
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
                  <CheckCircle2 className="text-emerald-500 w-7 h-7 mb-2" />
                  <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{bransStats.avgC.toFixed(1)}</span>
                  <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mt-1">Doğru</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                  <XCircle className="text-rose-500 w-7 h-7 mb-2" />
                  <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">{bransStats.avgW.toFixed(1)}</span>
                  <span className="text-[10px] font-bold text-rose-600/70 uppercase tracking-wider mt-1">Yanlış</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                  <MinusCircle className="text-slate-400 w-7 h-7 mb-2" />
                  <span className="text-2xl font-black font-mono text-slate-600 dark:text-slate-300">{bransStats.avgE.toFixed(1)}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Boş</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Gelişim Eğrisi" desc={`${bransStats.config?.title} dersindeki net değişim trendi.`} icon={<TrendingUp className="w-8 h-8 text-violet-500" />}>
            <div className="h-[320px] w-full p-6 bg-white dark:bg-[#1e293b] rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-white/10">
              <Line 
                data={{
                  labels: bransStats.trend.map(d => d.name),
                  datasets: (() => {
                    const mappedData = bransStats.trend.map(d => ({
                      x: d.name,
                      y: d.net,
                      correct: d.correct,
                      wrong: d.wrong,
                      empty: d.empty
                    }));
                    return [
                      {
                        label: 'Net',
                        parsing: { xAxisKey: 'x', yAxisKey: 'y' },
                        data: mappedData,
                        borderColor: bransStats.config?.color || "#8b5cf6",
                        backgroundColor: (context: any) => {
                          const ctx = context.chart.ctx;
                          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                          gradient.addColorStop(0, (bransStats.config?.color || "#8b5cf6") + '33'); 
                          gradient.addColorStop(1, (bransStats.config?.color || "#8b5cf6") + '00');
                          return gradient;
                        },
                        borderWidth: 4,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: bransStats.config?.color || "#8b5cf6",
                        pointBorderWidth: 3,
                        pointRadius: 0, 
                        pointHoverRadius: 6,
                        pointHitRadius: 20,
                        fill: true,
                        tension: 0.4, 
                      },
                      {
                        label: 'Doğru',
                        parsing: { xAxisKey: 'x', yAxisKey: 'correct' },
                        data: mappedData,
                        backgroundColor: '#10b981', borderColor: '#10b981', borderWidth: 0, pointRadius: 0, pointHoverRadius: 0, showLine: false, fill: false
                      },
                      {
                        label: 'Yanlış',
                        parsing: { xAxisKey: 'x', yAxisKey: 'wrong' },
                        data: mappedData,
                        backgroundColor: '#f43f5e', borderColor: '#f43f5e', borderWidth: 0, pointRadius: 0, pointHoverRadius: 0, showLine: false, fill: false
                      },
                      {
                        label: 'Boş',
                        parsing: { xAxisKey: 'x', yAxisKey: 'empty' },
                        data: mappedData,
                        backgroundColor: '#94a3b8', borderColor: '#94a3b8', borderWidth: 0, pointRadius: 0, pointHoverRadius: 0, showLine: false, fill: false
                      }
                    ];
                  })()
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      titleColor: '#64748b',
                      bodyColor: '#0f172a',
                      bodyFont: { size: 14, weight: 'bold', family: "'Nunito', sans-serif" },
                      titleFont: { size: 11, weight: 'bold', family: "'Nunito', sans-serif" },
                      borderColor: 'rgba(0,0,0,0.06)',
                      borderWidth: 1,
                      padding: 14,
                      displayColors: true,
                      usePointStyle: true,
                      boxWidth: 8,
                      boxHeight: 8,
                      boxPadding: 6,
                      cornerRadius: 16,
                      callbacks: {
                        label: (context) => {
                          const val = context.datasetIndex === 0 ? context.parsed.y.toFixed(2) : context.parsed.y.toString();
                          return ` ${context.dataset.label}: ${val}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      min: 0,
                      max: bransStats.maxQuestions,
                      grid: {
                        color: 'rgba(148, 163, 184, 0.15)',
                        tickLength: 0,
                        lineWidth: 1.5,
                        drawTicks: false
                      },
                      border: { display: false, dash: [4, 4] },
                      ticks: {
                        padding: 15,
                        font: { size: 12, weight: 800, family: "'Nunito', sans-serif" },
                        color: '#94a3b8',
                        maxTicksLimit: 6
                      }
                    },
                    x: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: {
                        padding: 20,
                        font: { size: 11, weight: 700, family: "'Nunito', sans-serif" },
                        color: '#94a3b8',
                        maxTicksLimit: 8
                      }
                    }
                  }
                }}
              />
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

function Section({ title, desc, icon, children }: { title: string; desc?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-[1.25rem] shadow-sm border border-slate-100/80 dark:border-white/5">
            <span className="text-2xl drop-shadow-sm flex items-center justify-center child-svg-large">{icon}</span>
          </div>
        )}
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">{title}</h3>
          {desc && <p className="text-sm font-bold text-slate-400 mt-1">{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}



function SummaryCard({ label, value, sub, accent, highlight, emoji }: { label: string; value: string; sub: string; accent?: boolean; highlight?: boolean; emoji?: string; }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }} 
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between h-full cursor-pointer ${
      accent ? "bg-[#58cc02] border-[#58cc02] text-white" : // Duolingo Green
      highlight ? "bg-[#1cb0f6] border-[#1cb0f6] text-white" : // Duolingo Blue
      "bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
    }`}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className={`text-[11px] font-bold uppercase tracking-widest ${accent || highlight ? "text-white/90" : "text-slate-400"}`}>{label}</p>
        {emoji && <AppleEmoji emoji={emoji} size={32} className="relative z-10 drop-shadow-sm hover:scale-110 transition-transform" />}
      </div>
      <div className="relative z-10">
        <p className={`text-4xl leading-none font-black tracking-tight ${accent || highlight ? "text-white" : "text-slate-800 dark:text-white"}`}>{value}</p>
        {sub && <p className={`text-xs font-bold mt-2 ${accent || highlight ? "text-white/90" : "text-slate-400"}`}>{sub}</p>}
      </div>
      {(accent || highlight) && <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />}
    </motion.div>
  );
}

function BalanceBar({ label, value, max, color, textColor }: { label: string; value: number; max: number; color: string; textColor: string; }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end">
        <span className="font-bold text-slate-700 dark:text-slate-200 text-[15px]">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={`font-black text-xl ${textColor}`}>{formatNet(value)}</span>
          <span className="text-xs font-bold text-slate-400">/ {max}</span>
        </div>
      </div>
      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${color} rounded-full`} 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        />
      </div>
    </div>
  );
}

function Tip({ icon, title, colorClass, children }: { icon: React.ReactNode; title: string; colorClass: string; children: React.ReactNode; }) {
  return (
    <div className="bg-white dark:bg-[#1e293b] p-5 sm:p-6 rounded-[1.5rem] border border-slate-100 dark:border-white/5 shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-md transition-shadow flex gap-4 sm:gap-5">
      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${colorClass}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1.5">{title}</h4>
        <p className="text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">{children}</p>
      </div>
    </div>
  );
}
