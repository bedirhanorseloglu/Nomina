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

/* ── Tooltip for General Chart ── */
const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200/60 p-4 rounded-2xl shadow-2xl min-w-[220px]">
      <p className="text-[10px] font-black text-slate-400 tracking-wider border-b border-slate-100 pb-2 mb-2 truncate uppercase">
        {d.name}
      </p>
      <div className="space-y-1">
        <Row label="Toplam Net" value={d.net.toFixed(2)} bold />
        <Row label="GY Net" value={d.gyNet.toFixed(2)} color="text-blue-600" />
        <Row label="GK Net" value={d.gkNet.toFixed(2)} color="text-purple-600" />
        
        <div className="pt-2 pb-1 mt-2 border-t border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ders Netleri</p>
          {DENEME_SUBJECTS.map(sub => {
            if (d[sub.id] !== undefined) {
              return <Row key={sub.id} label={sub.title} value={d[sub.id].toFixed(2)} />;
            }
            return null;
          })}
        </div>

        <div className="pt-1.5 mt-1.5 border-t border-slate-100">
          <Row label="Tahmini P3" value={d.p3.toFixed(3)} color="text-amber-700" bold />
        </div>
      </div>
    </div>
  );
};

/* ── Tooltip for Branch Chart ── */
const BransChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200/60 p-4 rounded-2xl shadow-2xl min-w-[180px]">
      <p className="text-[10px] font-black text-slate-400 tracking-wider border-b border-slate-100 pb-2 mb-2 truncate uppercase">
        {d.name}
      </p>
      <div className="space-y-1">
        <Row label="Net" value={d.net.toFixed(2)} bold color="text-accent" />
        <Row label="Doğru" value={d.correct.toString()} color="text-emerald-600" />
        <Row label="Yanlış" value={d.wrong.toString()} color="text-red-500" />
        <Row label="Boş" value={d.empty.toString()} color="text-slate-500" />
      </div>
    </div>
  );
};

function Row({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[11px] gap-4">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={`font-mono ${bold ? "font-black" : "font-bold"} ${color || "text-slate-900"}`}>{value}</span>
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

  // Branch subjects that actually have at least one test recorded
  const availableBransSubjects = useMemo(() => {
    if (viewType !== "brans") return [];
    const ids = new Set(allDenemeler.filter(d => d.examType === "brans").map(d => d.bransSubjectId).filter(Boolean));
    return DENEME_SUBJECTS.filter(s => ids.has(s.id));
  }, [allDenemeler, viewType]);

  // Set default selected branch subject if not set or invalid
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
      const subjectNets: Record<string, number> = {};
      d.scores.forEach(s => {
        subjectNets[s.subjectId] = s.correct - (s.wrong / 4);
      });
      return { 
        name: d.name, 
        net: r.totalNet, 
        gyNet: r.gyNet, 
        gkNet: r.gkNet, 
        p3: estimateP3Score(r.totalNet),
        ...subjectNets
      };
    });

    const exams = [...active].reverse().map((d) => {
      const r = evaluateDeneme(d.scores, d.examType);
      return { id: d.id, name: d.name, date: d.date, publisher: d.publisher, totalNet: r.totalNet, p3: estimateP3Score(r.totalNet) };
    });

    const gyAvg = subjects.filter((s) => s.category === "Genel Yetenek").reduce((a, s) => a + s.avgNet, 0);
    const gkAvg = subjects.filter((s) => s.category !== "Genel Yetenek").reduce((a, s) => a + s.avgNet, 0);

    const worstWrong = [...subjects].map((s) => ({ ...s, wr: s.questionCount ? s.avgWrong / s.questionCount : 0 })).sort((a, b) => b.wr - a.wr);
    const worstEmpty = [...subjects].map((s) => ({ ...s, er: s.questionCount ? s.avgEmpty / s.questionCount : 0 })).sort((a, b) => b.er - a.er);
    const improvement = active.length > 1 ? nets[0] - nets[nets.length - 1] : 0;

    return {
      count: active.length, avg, best, latest: nets[0],
      delta: active.length > 1 ? nets[0] - nets[1] : 0,
      subjects, strongest: sorted[0], weakest: sorted[sorted.length - 1],
      trend, exams, gyAvg, gkAvg,
      p3: estimateP3Score(avg),
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
      count: list.length,
      avg,
      best,
      latest,
      avgC,
      avgW,
      avgE,
      maxQuestions,
      trend,
      config: subConfig,
      improvement
    };
  }, [active, selectedBransSubjectId, viewType]);

  /* ═══ Empty States ═══ */
  if (viewType === "genel" && !stats) {
    return (
      <div className="deneme-empty-state">
        <DenemeScoreRing value={0} max={120} size={130} label="Analiz Bekleniyor" />
        <p className="text-sm font-semibold text-slate-400 mt-6 max-w-xs leading-relaxed text-center">
          Genel deneme analizlerini görmek için en az bir adet Genel Deneme kaydı {isReadOnly ? "bulunmuyor" : "girmelisiniz"}.
        </p>
        {!isReadOnly && <button type="button" onClick={onAdd} className="deneme-btn-primary mt-6">Deneme Girişi Yap</button>}
      </div>
    );
  }

  if (viewType === "brans" && availableBransSubjects.length === 0) {
    return (
      <div className="deneme-empty-state">
        <DenemeScoreRing value={0} max={30} size={130} label="Branş Analizi" />
        <p className="text-sm font-semibold text-slate-400 mt-6 max-w-xs leading-relaxed text-center">
          Branş deneme grafiklerini ve analizlerini görmek için önce "Yeni Giriş" kısmından bir Branş Denemesi {isReadOnly ? "bulunmuyor" : "kaydetmelisiniz"}.
        </p>
        {!isReadOnly && <button type="button" onClick={onAdd} className="deneme-btn-primary mt-6">Branş Denemesi Gir</button>}
      </div>
    );
  }

  const metricStroke = activeMetric === "total" ? "#0071e3" : activeMetric === "gy" ? "#3b82f6" : "#8b5cf6";
  const remaining = stats ? Math.max(0, targetNet - stats.avg) : 0;

  return (
    <div className="space-y-10">

      {/* ━━━ Header Filter / Count ━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex p-1 bg-slate-100/60 rounded-xl border border-slate-200/20 w-fit">
          {(["all", "5", "10"] as Range[]).map((r) => (
            <button key={r} type="button" onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${range === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {r === "all" ? "Tüm Zamanlar" : `Son ${r} Deneme`}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          {viewType === "genel" ? `${stats?.count} genel deneme` : `${bransStats?.count} branş denemesi`} gösteriliyor
        </span>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          GENEL DENEME ANALİZ DETAYLARI
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-10">
          {viewType === "genel" && stats && (
            <>
          {/* ━━━ 1 · Genel Bakış ━━━ */}
          <Section
            title="Genel Bakış"
            desc="Tüm denemelerinizin özet istatistikleri. Net ortalamanız, en yüksek netiniz ve tahmini P3 puanınız burada gösterilir."
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <SummaryCard label="Net Ortalaması" value={formatNet(stats.avg)} sub="120 üzerinden" accent />
              <SummaryCard label="En Yüksek Net" value={formatNet(stats.best)} sub={`Tahmini P3: ${estimateP3Score(stats.best).toFixed(3)}`} />
              <SummaryCard label="Tahmini P3 Puanı" value={stats.p3.toFixed(3)} sub={`${formatNet(stats.avg)} net ortalamasına göre`} highlight />
            </div>

            {/* GY / GK dengesi - basit bar */}
            <div className="mt-6 p-5 rounded-2xl bg-white border border-slate-200/30 shadow-sm">
              <p className="text-xs font-bold text-slate-500 mb-4">
                Genel Yetenek ve Genel Kültür netlerinizin dengesi. KPSS&apos;de her iki alan eşit ağırlıktadır.
              </p>
              <div className="space-y-3">
                <BalanceBar label="Genel Yetenek (GY)" value={stats.gyAvg} max={60} color="from-blue-500 to-cyan-400" textColor="text-blue-600" />
                <BalanceBar label="Genel Kültür (GK)" value={stats.gkAvg} max={60} color="from-purple-500 to-pink-400" textColor="text-purple-600" />
              </div>
            </div>
          </Section>

          {/* ━━━ 2 · Gelişim Grafiği ━━━ */}
          <Section
            title="Net Gelişim Grafiği"
            desc="Denemelerinizin kronolojik sırasına göre net değişiminizi gösterir. Yukarı yönlü eğilim, çalışmalarınızın karşılığını aldığınız anlamına gelir."
          >
            {/* Metrik seçici */}
            <div className="flex p-0.5 bg-slate-100/60 rounded-xl border border-slate-200/20 text-xs font-bold w-fit mb-5">
              {([
                { key: "total" as const, label: "Toplam Net" },
                { key: "gy" as const, label: "Genel Yetenek" },
                { key: "gk" as const, label: "Genel Kültür" },
              ]).map((m) => (
                <button key={m.key} type="button" onClick={() => setActiveMetric(m.key)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeMetric === m.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                  {m.label}
                </button>
              ))}
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trend} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metricStroke} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={metricStroke} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} dy={10} />
                  <YAxis domain={[0, activeMetric === "total" ? 120 : 60]} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} dx={-5} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(0,0,0,0.04)", strokeWidth: 1 }} />
                  <Area type="monotone" dataKey={activeMetric === "total" ? "net" : activeMetric === "gy" ? "gyNet" : "gkNet"}
                    stroke={metricStroke} strokeWidth={2.5} fillOpacity={1} fill="url(#aGrad)"
                    activeDot={{ r: 5, strokeWidth: 0, fill: metricStroke }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {stats.improvement !== 0 && stats.count > 1 && (
              <p className="text-xs font-semibold text-slate-500 mt-4 text-center">
                İlk denemeden bu yana{" "}
                <span className={`font-black font-mono ${stats.improvement > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {stats.improvement > 0 ? "+" : ""}{formatNet(stats.improvement)} net
                </span>{" "}
                {stats.improvement > 0 ? "ilerleme" : "gerileme"} kaydettiniz.
              </p>
            )}
          </Section>

          {/* ━━━ 3 · Ders Bazlı Analiz ━━━ */}
          <Section
            title="Ders Bazlı Analiz"
            desc="Her dersin ortalama netinizi, isabet oranınızı ve doğru-yanlış-boş dağılımınızı gösterir. Düşük isabet oranına sahip dersler, öncelikli çalışma alanlarınızdır."
          >
            <div className="space-y-3">
              {stats.subjects.map((s, i) => {
                const pct = s.questionCount > 0 ? (s.avgNet / s.questionCount) * 100 : 0;
                const accColor = s.accuracy >= 70 ? "text-emerald-700 bg-emerald-50" : s.accuracy >= 45 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/50 hover:shadow-lg hover:shadow-slate-200/50 transition-all relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity" style={{ backgroundColor: s.color }}></div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
                      <div className="flex items-center gap-4 sm:w-48 shrink-0">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                          <span className="text-2xl drop-shadow-sm">{s.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 tracking-tight">{s.title}</p>
                          <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">{s.category} · {s.questionCount} Soru</p>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="h-3 w-full bg-slate-100/80 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                          <motion.div className="h-full rounded-full relative" style={{ backgroundColor: s.color }}
                            initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }}
                            transition={{ duration: 0.7, delay: i * 0.04 }}>
                            <div className="absolute inset-0 bg-white/20"></div>
                          </motion.div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-black text-xl w-16 text-right drop-shadow-sm" style={{ color: s.color }}>
                          {formatNet(s.avgNet)}
                        </span>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl shadow-sm ${accColor}`}>
                          %{Math.round(s.accuracy)}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 hidden md:flex items-center justify-between w-32 text-right bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          <span className="text-emerald-600" title="Doğru">{s.avgCorrect.toFixed(1)}D</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-red-500" title="Yanlış">{s.avgWrong.toFixed(1)}Y</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-500" title="Boş">{s.avgEmpty.toFixed(1)}B</span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Güçlü / Zayıf özet */}
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div className="relative overflow-hidden p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
                <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform">{stats.strongest.icon}</div>
                <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-2 relative z-10">En Güçlü Dersiniz</p>
                <div className="flex flex-col relative z-10">
                  <p className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="text-2xl drop-shadow-sm">{stats.strongest.icon}</span>
                    {stats.strongest.title}
                  </p>
                  <p className="text-2xl font-mono font-black mt-2 drop-shadow-sm" style={{ color: stats.strongest.color }}>{formatNet(stats.strongest.avgNet)} <span className="text-sm text-slate-400 font-sans">net</span></p>
                </div>
              </div>
              <div className="relative overflow-hidden p-5 rounded-3xl bg-amber-50/50 border border-amber-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group">
                <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform">{stats.weakest.icon}</div>
                <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2 relative z-10">Öncelikli Çalışma Alanı</p>
                <div className="flex flex-col relative z-10">
                  <p className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="text-2xl drop-shadow-sm">{stats.weakest.icon}</span>
                    {stats.weakest.title}
                  </p>
                  <p className="text-2xl font-mono font-black mt-2 drop-shadow-sm" style={{ color: stats.weakest.color }}>{formatNet(stats.weakest.avgNet)} <span className="text-sm text-slate-400 font-sans">net</span></p>
                </div>
              </div>
            </div>
          </Section>

          {/* ━━━ 4 · Hedef Belirleme ━━━ */}
          {!isReadOnly && (
            <Section
              title="Hedef Belirleme"
              desc="Kendinize bir hedef net belirleyin. Mevcut net ortalamanızla hedefiniz arasındaki farkı ve bu hedefe ulaştığınızda alacağınız tahmini P3 puanını görebilirsiniz."
            >
            <div className="relative overflow-hidden p-6 rounded-[2rem] bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8 relative z-10">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                     <span className="text-3xl drop-shadow-sm">🎯</span>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Hedef Netiniz</p>
                     <p className="text-4xl font-black font-mono text-slate-800 drop-shadow-sm tracking-tighter">
                       {targetNet}
                       <span className="text-base font-bold text-slate-400 ml-2 font-sans tracking-normal">net</span>
                     </p>
                   </div>
                </div>
                
                <div className="text-left sm:text-right bg-gradient-to-br from-slate-50 to-slate-100/50 px-5 py-3 rounded-2xl border border-slate-200/50 shadow-inner">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Hedefteki P3 Puanı</p>
                  <p className="text-3xl font-black font-mono text-indigo-600 drop-shadow-sm tracking-tighter">
                    {estimateP3Score(targetNet).toFixed(3)}
                  </p>
                </div>
              </div>

              <div className="relative z-10 mb-6 group">
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

              <div className="space-y-3 relative z-10">
                {(() => {
                  const ratio = stats.avg / targetNet; // 0..1+
                  const pct = Math.min(100, ratio * 100);
                  // Renk: %0-49 kırmızı, %50-79 turuncu, %80-99 mavi, %100+ yeşil
                  const barColor =
                    ratio >= 1
                      ? "from-emerald-500 to-green-400"
                      : ratio >= 0.8
                      ? "from-blue-500 to-indigo-500"
                      : ratio >= 0.5
                      ? "from-amber-400 to-orange-400"
                      : "from-red-500 to-rose-400";
                  const dotColor =
                    ratio >= 1
                      ? "bg-emerald-500"
                      : ratio >= 0.8
                      ? "bg-blue-500"
                      : ratio >= 0.5
                      ? "bg-amber-400"
                      : "bg-red-400";
                  const targetDotColor =
                    ratio >= 1 ? "bg-emerald-400" : "bg-slate-300";

                  return (
                    <>
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shadow-sm transition-colors duration-500 ${dotColor}`} />
                          Mevcut: {formatNet(stats.avg)} net
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shadow-inner transition-colors duration-500 ${targetDotColor}`} />
                          Hedef: {targetNet} net
                        </span>
                      </div>
                      <div className="h-4 w-full bg-slate-100/80 backdrop-blur-sm rounded-full overflow-hidden shadow-inner border border-slate-200/50 p-0.5">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${barColor} rounded-full relative shadow-sm transition-all duration-500`}
                          animate={{ width: `${pct}%` }}
                          transition={{ type: "spring", stiffness: 50, damping: 15 }}
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-full" />
                        </motion.div>
                      </div>
                      {/* Yüzde göstergesi */}
                      <div className="flex justify-end">
                        <span className={`text-[10px] font-black tracking-wider transition-colors duration-500 ${
                          ratio >= 1 ? "text-emerald-600" : ratio >= 0.8 ? "text-blue-500" : ratio >= 0.5 ? "text-amber-500" : "text-red-400"
                        }`}>
                          %{Math.round(pct)} tamamlandı
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/50 text-center relative z-10 shadow-sm">
                {remaining > 0 ? (
                  <p className="text-sm font-bold text-slate-700 tracking-tight">
                    Hedefinize ulaşmak için <span className="font-black font-mono text-indigo-600 text-lg mx-1 drop-shadow-sm">{formatNet(remaining)} net</span> daha gerekiyor.
                  </p>
                ) : (
                  <p className="text-sm font-black text-emerald-600 flex items-center justify-center gap-2 drop-shadow-sm">
                    <span className="text-xl">🎉</span> Hedefinize ulaştınız! Tebrikler!
                  </p>
                )}
              </div>
            </div>
          </Section>
          )}

          {/* ━━━ 6 · Çalışma Tavsiyeleri ━━━ */}
          <Section
            title="Çalışma Tavsiyeleri"
            desc="Deneme sonuçlarınız incelenerek sizin için oluşturulan öneriler. En kısa sürede en çok net artışı sağlayacak alanlara odaklanmanızı sağlar."
          >
            <div className="space-y-3">
              {stats.mostWrong && (
                <Tip icon="🚨" title="Yanlış Oranı Yüksek" color="bg-red-50/60 border-red-100">
                  <strong style={{ color: stats.mostWrong.color }}>{stats.mostWrong.title}</strong> dersinde soruların %{Math.round(stats.mostWrong.wr * 100)}&apos;ini yanlış yapıyorsunuz. Bu derste soru çözmeden önce konu özetlerini tekrar edin.
                </Tip>
              )}
              {stats.mostEmpty && (
                <Tip icon="⏰" title="Boş Bırakma Oranı Yüksek" color="bg-amber-50/60 border-amber-100">
                  <strong style={{ color: stats.mostEmpty.color }}>{stats.mostEmpty.title}</strong> dersinde soruların %{Math.round(stats.mostEmpty.er * 100)}&apos;ini boş bırakıyorsunuz. Süre yönetiminizi geliştirmeniz gerekiyor olabilir.
                </Tip>
              )}
              <Tip icon="📊" title="GY / GK Dengeniz" color="bg-blue-50/60 border-blue-100">
                GY ortalamanız <strong className="text-blue-600">{formatNet(stats.gyAvg)}/60</strong>, GK ortalamanız <strong className="text-purple-600">{formatNet(stats.gkAvg)}/60</strong>.{" "}
                {stats.gyAvg < stats.gkAvg
                  ? "GY tarafınız daha zayıf. Matematik ve Türkçe çalışmalarına ağırlık verin."
                  : "GK tarafınız daha zayıf. Tarih, Coğrafya ve Vatandaşlık çalışmalarına öncelik verin."}
              </Tip>
              <Tip icon="🎯" title="Net Potansiyeliniz" color="bg-emerald-50/60 border-emerald-100">
                Mevcut ortalamanız {formatNet(stats.avg)} net. Tüm yanlış ve boş sorularınızı doğruya çevirmeniz durumunda <strong className="text-emerald-700">{formatNet(120 - stats.avg)} net</strong> daha kazanabilirsiniz.
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
          {/* Apple-style Branş Seçici Sekmeler */}
          <div className="space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">İncelenecek Branş Seçin</span>
            <div className="flex flex-wrap p-1 bg-slate-100/60 backdrop-blur-md rounded-[20px] border border-slate-200/30 gap-1 shadow-sm">
              {availableBransSubjects.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedBransSubjectId(sub.id)}
                  className="relative px-5 py-3 rounded-[16px] transition-all focus:outline-none cursor-pointer"
                >
                  {selectedBransSubjectId === sub.id && (
                    <motion.div
                      layoutId="bransTabBg"
                      className="absolute inset-0 bg-white rounded-[16px] shadow-sm border border-slate-200/40"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-lg">{sub.icon}</span>
                    <span className={`text-xs font-bold transition-colors ${selectedBransSubjectId === sub.id ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
                      {sub.title}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ━━━ 1 · Branş Genel Bakış ━━━ */}
          <Section
            title={`${bransStats.config?.title} Branş Analizi`}
            desc={`${bransStats.config?.title} dersinde girdiğiniz branş denemelerinin özet net istatistikleri.`}
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <SummaryCard 
                label="Net Ortalaması" 
                value={formatNet(bransStats.avg)} 
                sub={`${bransStats.maxQuestions} soru üzerinden`} 
                accent 
              />
              <SummaryCard 
                label="En Yüksek Net" 
                value={formatNet(bransStats.best)} 
                sub={`Başarı Oranı: %${Math.round((bransStats.best / bransStats.maxQuestions) * 100)}`} 
              />
              <SummaryCard 
                label="Son Sınav Neti" 
                value={formatNet(bransStats.latest)} 
                sub={`İsabet Oranı: %${Math.round((bransStats.latest / bransStats.maxQuestions) * 100)}`} 
                highlight 
              />
            </div>

            {/* D/Y/B Dağılım Kartı */}
            <div className="mt-6 p-6 rounded-2xl bg-white border border-slate-200/30 shadow-sm">
              <p className="text-xs font-bold text-slate-500 mb-4">
                Soruların Doğru, Yanlış ve Boş Dağılım Ortalamaları.
              </p>
              <div className="space-y-4">
                <BalanceBar label="Doğru Sayısı" value={bransStats.avgC} max={bransStats.maxQuestions} color="from-emerald-500 to-green-400" textColor="text-emerald-600" />
                <BalanceBar label="Yanlış Sayısı" value={bransStats.avgW} max={bransStats.maxQuestions} color="from-red-500 to-rose-400" textColor="text-red-500" />
                <BalanceBar label="Boş Bırakılan" value={bransStats.avgE} max={bransStats.maxQuestions} color="from-slate-400 to-slate-300" textColor="text-slate-500" />
              </div>
            </div>
          </Section>

          {/* ━━━ 2 · Branş Gelişim Grafiği ━━━ */}
          <Section
            title="Ders Gelişim Eğrisi"
            desc={`Kronolojik sırayla ${bransStats.config?.title} branşındaki gelişim ve net değişimleriniz.`}
          >
            <div className="h-64 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bransStats.trend} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={bransStats.config?.color || "#0071e3"} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={bransStats.config?.color || "#0071e3"} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} dy={10} />
                  <YAxis domain={[0, bransStats.maxQuestions]} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} dx={-5} />
                  <Tooltip content={<BransChartTooltip />} cursor={{ stroke: "rgba(0,0,0,0.04)", strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="net"
                    stroke={bransStats.config?.color || "#0071e3"} strokeWidth={2.5} fillOpacity={1} fill="url(#bGrad)"
                    activeDot={{ r: 5, strokeWidth: 0, fill: bransStats.config?.color || "#0071e3" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {bransStats.improvement !== 0 && bransStats.count > 1 && (
              <p className="text-xs font-semibold text-slate-500 mt-4 text-center">
                İlk branş denemenizden bu yana{" "}
                <span className={`font-black font-mono ${bransStats.improvement > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {bransStats.improvement > 0 ? "+" : ""}{formatNet(bransStats.improvement)} net
                </span>{" "}
                {bransStats.improvement > 0 ? "ilerlediniz." : "gerilediniz."}
              </p>
            )}
          </Section>

          {/* ━━━ 3 · Özel Tavsiyeler ━━━ */}
          <Section
            title="Ders Bazlı Teşhis & Öneri"
            desc={`${bransStats.config?.title} performansınız analiz edilerek hazırlanan kişisel çalışma planı.`}
          >
            <div className="space-y-3">
              {bransStats.avgW > (bransStats.maxQuestions * 0.15) ? (
                <Tip icon="🚨" title="Yüksek Hata Oranı" color="bg-red-50/60 border-red-100">
                  {bransStats.config?.title} dersinde ortalama yanlış sayınız (<strong className="text-red-500">{bransStats.avgW.toFixed(1)}</strong>) yüksek bir oranda seyrediyor. Bu durum konu eksikliğinden ziyade hatalı akıl yürütme veya soru kalıplarını tanımama durumunu gösterir. Ders özelinde yanlış yaptığınız soru tiplerini kesip bir deftere yapıştırın ve çözümlerini hocalarınıza sorun.
                </Tip>
              ) : (
                <Tip icon="✨" title="Düşük Hata Oranı" color="bg-emerald-50/60 border-emerald-100">
                  Harika! {bransStats.config?.title} dersinde ortalama yanlış sayınız (<strong className="text-emerald-700">{bransStats.avgW.toFixed(1)}</strong>) soru sayısına kıyasla mükemmel düzeyde düşük. Konuları özümsediğiniz açıkça görülüyor.
                </Tip>
              )}

              {bransStats.avgE > (bransStats.maxQuestions * 0.20) && (
                <Tip icon="⏰" title="Süre veya Bilgi Eksikliği" color="bg-amber-50/60 border-amber-100">
                  Soruların %20&apos;sinden fazlasını boş bırakıyorsunuz (Ortalama: <strong className="text-amber-700">{bransStats.avgE.toFixed(1)} boş</strong>). Bu konularda ya derinlemesine bilgi eksiğiniz var ya da denemede süre kontrolü yapamadığınız için bu sorulara yetişemiyorsunuz. Tur yöntemi kullanarak çözümleri hızlandırın.
                </Tip>
              )}

              <Tip icon="🎯" title="Gelişim Fırsatı" color="bg-blue-50/60 border-blue-100">
                Mevcut net ortalamanız <strong className="text-blue-600">{formatNet(bransStats.avg)}</strong>. Tüm boş ve yanlışları doğruya çevirerek kazanabileceğiniz maksimum potansiyel net: <strong className="text-slate-800">{formatNet(bransStats.maxQuestions - bransStats.avg)} net</strong>.
              </Tip>
            </div>
          </Section>
            </>
          )}
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mb-5">
        <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
        <p className="text-sm font-medium text-slate-400 mt-1.5 max-w-2xl leading-relaxed">{desc}</p>
      </div>
      {children}
    </motion.section>
  );
}

function SummaryCard({ label, value, sub, accent, highlight }: {
  label: string; value: string; sub: string; accent?: boolean; highlight?: boolean;
}) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`relative overflow-hidden p-6 rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl ${
      accent ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-indigo-400 text-white" :
      highlight ? "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 text-white" :
      "bg-white/80 border-slate-200/60"
    }`}>
      {(accent || highlight) && (
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      )}
      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 relative z-10 ${accent || highlight ? "text-white/80" : "text-slate-400"}`}>{label}</p>
      <p className={`text-4xl font-black font-mono tracking-tight drop-shadow-sm relative z-10 ${accent || highlight ? "text-white" : "text-slate-800"}`}>
        {value}
      </p>
      <p className={`text-[11px] font-bold mt-2 relative z-10 ${accent || highlight ? "text-white/80" : "text-slate-400"}`}>{sub}</p>
    </motion.div>
  );
}

function BalanceBar({ label, value, max, color, textColor }: {
  label: string; value: number; max: number; color: string; textColor: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-black text-slate-700 tracking-tight">
        <span>{label}</span>
        <span className={`font-mono ${textColor}`}>{formatNet(value)} / {max}</span>
      </div>
      <div className="h-3 w-full bg-slate-100/80 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
        <motion.div className={`h-full bg-gradient-to-r ${color} rounded-full relative`}
          initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-white/20"></div>
        </motion.div>
      </div>
    </div>
  );
}

function Tip({ icon, title, color, children }: {
  icon: string; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <motion.div 
      whileHover={{ x: 4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`p-5 rounded-3xl border flex gap-4 shadow-sm backdrop-blur-sm ${color}`}
    >
      <span className="text-2xl mt-0.5 shrink-0 drop-shadow-sm">{icon}</span>
      <div>
        <p className="text-sm font-black text-slate-800 mb-1 tracking-tight">{title}</p>
        <p className="text-xs font-medium text-slate-600 leading-relaxed">{children}</p>
      </div>
    </motion.div>
  );
}
