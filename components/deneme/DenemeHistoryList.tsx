"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { DenemeRecord, evaluateDeneme, formatNet, estimateP3Score } from "@/lib/denemeUtils";
import { DENEME_SUBJECTS } from "@/lib/denemeConfig";
import ConfirmDialog from "./ConfirmDialog";

type Props = {
  denemeler: DenemeRecord[];
  onDelete: (id: string) => void;
  onEdit: (deneme: DenemeRecord) => void;
  onAdd: () => void;
};

export default function DenemeHistoryList({
  denemeler,
  onDelete,
  onEdit,
  onAdd,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DenemeRecord | null>(null);

  const requestDelete = (deneme: DenemeRecord) => setDeleteTarget(deneme);
  const confirmDelete = () => {
    if (!deleteTarget) return;
    onDelete(deleteTarget.id);
    if (expandedId === deleteTarget.id) setExpandedId(null);
    setDeleteTarget(null);
  };

  const deleteDialog = (
    <ConfirmDialog
      open={!!deleteTarget}
      title="Deneme Kaydını Sil"
      message={
        deleteTarget
          ? `"${deleteTarget.name}" kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz.`
          : ""
      }
      confirmLabel="Evet, Sil"
      cancelLabel="Vazgeç"
      variant="danger"
      onClose={() => setDeleteTarget(null)}
      onConfirm={confirmDelete}
    />
  );

  // Detect if we are in Branch view by checking if all passed exams are "brans" type
  const isAllBrans = useMemo(() => {
    return denemeler.length > 0 && denemeler.every((d) => d.examType === "brans");
  }, [denemeler]);

  // Group branch exams by subject ID
  const groupedBrans = useMemo(() => {
    if (!isAllBrans) return null;
    const groups: Record<string, DenemeRecord[]> = {};
    denemeler.forEach((d) => {
      const subId = d.bransSubjectId || "unknown";
      if (!groups[subId]) groups[subId] = [];
      groups[subId].push(d);
    });
    return groups;
  }, [denemeler, isAllBrans]);

  if (denemeler.length === 0) {
    return (
      <>
      {deleteDialog}
      <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-12 text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-200/50 flex items-center justify-center text-4xl mb-6 shadow-sm">
          📋
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">Henüz Kayıtlı Deneme Yok</h3>
        <p className="text-sm font-semibold text-slate-400 mt-2 max-w-sm leading-relaxed">
          Sınav sonuçlarınızı kaydederek net ortalamalarınızı ve gelişim eksiklerinizi anında görün.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-8 px-6 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-md"
        >
          İlk Deneme Kaydını Ekle
        </button>
      </div>
      </>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BRANŞ GÖRÜNÜMÜ: DERS DERS GRUPLANDIRILMIŞ LİSTE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (isAllBrans && groupedBrans) {
    return (
      <>
      {deleteDialog}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedBrans).map(([subId, list], groupIdx) => {
          const subConfig = DENEME_SUBJECTS.find((s) => s.id === subId);
          if (!subConfig) return null;

          const isGroupExpanded = expandedSubId === subId;

          // Calculate average stats for this course group
          const totalExams = list.length;
          const evals = list.map((d) => {
            const s = d.scores.find((x) => x.subjectId === subId);
            return {
              correct: s?.correct ?? 0,
              wrong: s?.wrong ?? 0,
              net: (s?.correct ?? 0) - (s?.wrong ?? 0) / 4,
            };
          });
          const avgNet = evals.reduce((sum, e) => sum + e.net, 0) / totalExams;
          const bestNet = Math.max(...evals.map((e) => e.net));

          return (
            <motion.div
              key={subId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.05, type: "spring", stiffness: 260, damping: 25 }}
              className="bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_4px_24px_rgb(0,0,0,0.03)] rounded-[28px] overflow-hidden hover:shadow-[0_8px_32px_rgb(0,0,0,0.06)] transition-all duration-300"
            >
              {/* Course Header Bar */}
              <div
                className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100/60"
              >
                <div className="flex items-center gap-4.5 min-w-0">
                  <span
                    className="text-3xl w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white"
                    style={{ backgroundColor: `${subConfig.color}15` }}
                  >
                    {subConfig.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-800 text-lg sm:text-xl tracking-tight flex items-center gap-2">
                      {subConfig.title}
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200/20 font-sans mt-0.5">
                        {totalExams} Deneme
                      </span>
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      Branşındaki tüm sınav sonuçlarınız ve başarı durumunuz.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-3 sm:pt-0 border-t border-slate-100/50 sm:border-t-0">
                  <div className="flex items-center gap-3">
                    <ScoreChip label="Net Ort." value={avgNet} />
                    <ScoreChip label="En İyi Net" value={bestNet} highlight />
                  </div>
                </div>
              </div>

              {/* Nested Exams List (Always Visible - Square Grid Layout) */}
              <div
                className="bg-slate-50/10 px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {list.map((deneme, index) => {
                      const res = evaluateDeneme(deneme.scores, deneme.examType);
                      const subRes = res.subjects.find((s) => s.subjectId === subId);
                      if (!subRes) return null;

                      const pct = Math.min(100, (subRes.net / subConfig.questionCount) * 100);

                      return (
                        <div
                          key={deneme.id}
                          className="bg-white border border-slate-200/40 rounded-[24px] p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between min-h-[220px]"
                        >
                          {/* Top Row: Title, Date, Publisher */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-extrabold text-slate-800 text-sm tracking-tight line-clamp-2">
                                {deneme.name}
                              </h4>
                              {deneme.publisher && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-200/20 shrink-0">
                                  {deneme.publisher}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 block">
                              {format(new Date(deneme.date + "T12:00:00"), "d MMM yyyy", { locale: tr })}
                            </span>
                          </div>

                          {/* Middle Row: Score Statistics */}
                          <div className="my-5 flex items-center justify-between">
                            <div className="space-y-0.5">
                              <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 block">Net</span>
                              <span className="text-2xl font-black font-mono tracking-tight" style={{ color: subConfig.color }}>
                                {formatNet(subRes.net)}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <MiniDetailsChip label="D" value={subRes.correct} color="emerald" />
                              <MiniDetailsChip label="Y" value={subRes.wrong} color="red" />
                              <MiniDetailsChip label="B" value={subRes.empty} color="slate" />
                            </div>
                          </div>

                          {/* Progress Line */}
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: subConfig.color }}
                            />
                          </div>

                          {/* Actions / Notes Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
                            {deneme.note ? (
                              <span className="text-[10px] text-slate-400 italic line-clamp-1 max-w-[120px]" title={deneme.note}>
                                📝 {deneme.note}
                              </span>
                            ) : <div />}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onEdit(deneme)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors shadow-sm"
                              >
                                Düzenle
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDelete(deneme)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-xs"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </motion.div>
          );
        })}
      </div>
      </>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GENEL GÖRÜNÜM: STANDART CHRONOLOGICAL LİSTE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <>
    {deleteDialog}
    <div className="space-y-6">
      {denemeler.map((deneme, index) => {
        const result = evaluateDeneme(deneme.scores, deneme.examType);
        const expanded = expandedId === deneme.id;
        const pct = Math.min(100, (result.totalNet / 120) * 100);

        return (
          <motion.article
            key={deneme.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, type: "spring", stiffness: 260, damping: 25 }}
            className="bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_4px_24px_rgb(0,0,0,0.03)] rounded-[24px] overflow-hidden hover:shadow-[0_8px_32px_rgb(0,0,0,0.06)] transition-all duration-300"
          >
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : deneme.id)}
              className="w-full text-left p-6 sm:p-7 hover:bg-slate-50/30 transition-colors cursor-pointer focus:outline-none"
            >
              <div className="flex flex-col md:flex-row gap-5 md:items-center">
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  {/* Apple Style Score Display */}
                  <div className="flex-shrink-0 text-center w-20">
                    <span className="text-3xl font-black font-mono text-slate-800 tracking-tight tabular-nums block leading-none">
                      {formatNet(result.totalNet)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
                      net
                    </span>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2 border border-slate-200/20 shadow-inner">
                      <motion.div
                        className="h-full bg-gradient-to-r from-accent to-emerald-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  
                  {/* Info Column */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-800 text-lg md:text-xl truncate tracking-tight">
                      {deneme.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        📅 {format(new Date(deneme.date + "T12:00:00"), "d MMMM yyyy", {
                          locale: tr,
                        })}
                      </span>
                      {deneme.publisher && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 rounded-lg bg-slate-100 text-slate-500 border border-slate-200/40">
                          {deneme.publisher}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score Chips */}
                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-4 md:pt-0 border-t border-slate-100/50 md:border-t-0">
                  <div className="flex items-center gap-2.5">
                    <ScoreChip label="GY Net" value={result.gyNet} />
                    <ScoreChip label="GK Net" value={result.gkNet} />
                    <ScoreChip label="Tahmini P3" value={estimateP3Score(result.totalNet)} highlight />
                  </div>
                  <span
                    className={`w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200/30 text-slate-500 transition-all duration-300 ${expanded ? "rotate-180 bg-accent/10 text-accent border-accent/20" : "hover:bg-slate-100"}`}
                  >
                    ▼
                  </span>
                </div>
              </div>
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="border-t border-slate-100 bg-slate-50/10"
                >
                  {/* Detailed Subjects Grid */}
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.subjects.map((s) => {
                      const ans = s.correct + s.wrong;
                      const acc = ans === 0 ? 0 : Math.round((s.correct / ans) * 100);
                      
                      return (
                        <div
                          key={s.subjectId}
                          className="flex items-center justify-between p-4.5 rounded-[20px] bg-white border border-slate-200/30 shadow-sm"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span 
                              className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${s.color}12` }}
                            >
                              {s.icon}
                            </span>
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-800 text-sm block truncate">{s.title}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">
                                %{acc} İsabet
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className="font-mono font-black text-base"
                              style={{ color: s.color }}
                            >
                              {formatNet(s.net)}
                            </span>
                            <span className="block text-[9px] text-slate-400 font-mono font-bold mt-0.5">
                              {s.correct}D · {s.wrong}Y · {s.empty}B
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {deneme.note && (
                    <div className="px-6 pb-4">
                      <div className="p-4 rounded-2xl bg-slate-100/50 border border-slate-200/30 text-sm text-slate-600 leading-relaxed italic relative">
                        <span className="absolute top-2 left-2 text-2xl opacity-10 select-none font-serif">“</span>
                        <p className="pl-5 font-semibold text-slate-500">{deneme.note}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Actions Bar */}
                  <div className="px-6 pb-6 pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(deneme)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200/60 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      Sonuçları Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(deneme)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Kaydı Sil
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        );
      })}
    </div>
    </>
  );
}

function ScoreChip({ 
  label, 
  value, 
  highlight,
  isCount,
  isPercentage,
  color
}: { 
  label: string; 
  value: number; 
  highlight?: boolean;
  isCount?: boolean;
  isPercentage?: boolean;
  color?: string;
}) {
  return (
    <div className={`text-center px-3.5 py-1.5 rounded-[14px] border min-w-[70px] transition-all duration-200 ${
      highlight 
        ? "bg-amber-50/80 border-amber-200/50 text-amber-700 shadow-sm" 
        : "bg-slate-50 border-slate-200/30 text-slate-800"
    }`}>
      <p className={`text-[8.5px] font-black uppercase tracking-widest ${highlight ? "text-amber-600" : "text-slate-400"}`}>{label}</p>
      <p className={`font-mono font-black tabular-nums mt-0.5 ${
        highlight 
          ? "text-amber-800 text-xs" 
          : color || "text-slate-800"
      }`}>
        {isPercentage 
          ? `%${Math.round(value)}` 
          : isCount 
            ? String(value) 
            : label.toLowerCase().includes("p3") 
              ? value.toFixed(3) 
              : formatNet(value)
        }
      </p>
    </div>
  );
}

function MiniDetailsChip({ label, value, color }: { label: string; value: number; color: "emerald" | "red" | "slate" }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-red-50 text-red-600 border-red-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200/40"
  };

  return (
    <div className={`px-2 py-1 rounded-lg border text-[10px] font-black font-mono flex items-center gap-1 shrink-0 shadow-sm ${styles[color]}`}>
      <span>{label}:</span>
      <span>{value}</span>
    </div>
  );
}
