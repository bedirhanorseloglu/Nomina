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

  const isAllBrans = useMemo(() => {
    return denemeler.length > 0 && denemeler.every((d) => d.examType === "brans");
  }, [denemeler]);

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
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm">
            📭
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Henüz Deneme Yok</h3>
          <p className="text-slate-500 mt-2 max-w-sm">
            İlk denemenizi ekleyerek ilerlemenizi görselleştirmeye ve istatistiklerinizi oluşturmaya başlayın.
          </p>
          <button
            onClick={onAdd}
            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 active:scale-95"
          >
            + İlk Denemeyi Ekle
          </button>
        </div>
      </>
    );
  }

  // BRANŞ GÖRÜNÜMÜ
  if (isAllBrans && groupedBrans) {
    return (
      <>
        {deleteDialog}
        <div className="space-y-10">
          {Object.entries(groupedBrans).map(([subId, list]) => {
            const subConfig = DENEME_SUBJECTS.find((s) => s.id === subId);
            if (!subConfig) return null;

            return (
              <div key={subId} className="space-y-5 bg-slate-50/50 dark:bg-[#0a0f1a] p-6 rounded-[2rem] border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-4 border-b border-slate-200/50 dark:border-white/5 pb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: `${subConfig.color}15`, color: subConfig.color }}>
                    {subConfig.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                      {subConfig.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{list.length} Çözüm</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {list.map((deneme) => {
                    const res = evaluateDeneme(deneme.scores, deneme.examType);
                    const subRes = res.subjects.find((s) => s.subjectId === subId);
                    if (!subRes) return null;

                    return (
                      <div
                        key={deneme.id}
                        className="p-5 bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm hover:shadow-md border border-slate-100 dark:border-white/5 transition-all flex flex-col group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-violet-600 transition-colors">
                              {deneme.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-slate-400">
                              <span>{format(new Date(deneme.date + "T12:00:00"), "d MMM yyyy", { locale: tr })}</span>
                              {deneme.publisher && (
                                <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md text-slate-500">
                                  {deneme.publisher}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="px-3 py-1.5 rounded-xl text-center shrink-0 border" style={{ backgroundColor: `${subConfig.color}15`, borderColor: `${subConfig.color}30` }}>
                            <span className="text-[10px] font-black uppercase block leading-tight opacity-80" style={{ color: subConfig.color }}>Net</span>
                            <span className="text-lg font-black font-mono leading-none" style={{ color: subConfig.color }}>
                              {formatNet(subRes.net)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                          <div className="flex gap-2 text-xs font-bold font-mono">
                            <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">{subRes.correct} D</span>
                            <span className="bg-red-50 text-red-500 px-2 py-1 rounded-lg">{subRes.wrong} Y</span>
                            <span className="bg-slate-50 text-slate-500 px-2 py-1 rounded-lg">{subRes.empty} B</span>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => onEdit(deneme)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-white/5 hover:bg-blue-50 rounded-lg transition-colors">
                              ✏️
                            </button>
                            <button onClick={() => requestDelete(deneme)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-white/5 hover:bg-red-50 rounded-lg transition-colors">
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // GENEL GÖRÜNÜM
  return (
    <>
      {deleteDialog}
      <div className="space-y-4">
        {denemeler.map((deneme, index) => {
          const result = evaluateDeneme(deneme.scores, deneme.examType);
          const expanded = expandedId === deneme.id;
          
          const prevDeneme = denemeler[index + 1];
          let trend: "up" | "down" | "flat" = "flat";
          if (prevDeneme) {
            const prevResult = evaluateDeneme(prevDeneme.scores, prevDeneme.examType);
            if (result.totalNet > prevResult.totalNet) trend = "up";
            else if (result.totalNet < prevResult.totalNet) trend = "down";
          }

          return (
            <motion.div
              key={deneme.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-[#1e293b] rounded-[1.5rem] shadow-sm border ${expanded ? "border-blue-300 dark:border-blue-500/50 shadow-md" : "border-slate-200 dark:border-white/5"} overflow-hidden transition-all duration-300`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : deneme.id)}
                className="w-full p-5 flex flex-col md:flex-row md:items-center gap-4 text-left focus:outline-none group relative"
              >
                {/* Sol Dekoratif Çizgi */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 to-indigo-500" />
                
                <div className="flex-1 pl-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                      {deneme.name}
                    </h4>
                    {trend === "up" && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Yükseliş 🚀</span>}
                    {trend === "down" && <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Düşüş 📉</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-400">
                    <span>{format(new Date(deneme.date + "T12:00:00"), "d MMM yyyy", { locale: tr })}</span>
                    {deneme.publisher && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>Yayın: {deneme.publisher}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end">
                  <div className="text-center bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GY Net</p>
                    <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base">{formatNet(result.gyNet)}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GK Net</p>
                    <p className="font-mono font-bold text-purple-600 dark:text-purple-400 text-base">{formatNet(result.gkNet)}</p>
                  </div>
                  <div className="text-center bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-500/20 shadow-sm">
                    <p className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest">Toplam</p>
                    <p className="font-mono font-black text-blue-700 dark:text-blue-300 text-xl leading-none mt-0.5">{formatNet(result.totalNet)}</p>
                  </div>
                  <div className="text-center bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm hidden sm:block">
                    <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">P3 Puan</p>
                    <p className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-xl leading-none mt-0.5">{estimateP3Score(result.gyNet, result.gkNet).toFixed(2)}</p>
                  </div>
                  <div className="hidden md:flex w-8 justify-end text-slate-300 group-hover:text-blue-500 transition-colors">
                    <svg className={`w-6 h-6 transition-transform duration-300 ${expanded ? "rotate-180 text-blue-500" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
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
                    className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#151e2b]"
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {result.subjects.map((s) => {
                          const subConfig = DENEME_SUBJECTS.find((sub) => sub.id === s.subjectId);
                          return (
                          <div key={s.subjectId} className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden">
                            {/* Accent line on top */}
                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: subConfig?.color || '#3b82f6' }} />
                            <h5 className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: subConfig?.color || '#64748b' }}>{s.title}</h5>
                            <div className="flex justify-between items-end">
                              <span className="font-mono font-black text-xl text-slate-800 dark:text-white leading-none">
                                {formatNet(s.net)} <span className="text-[10px] font-bold text-slate-400 font-sans tracking-wide">NET</span>
                              </span>
                              <div className="flex gap-1 text-[10px] font-bold font-mono">
                                <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">{s.correct}D</span>
                                <span className="text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 px-1.5 py-0.5 rounded-md">{s.wrong}Y</span>
                              </div>
                            </div>
                            {/* Mini progress bar for accuracy */}
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full mt-3 overflow-hidden flex">
                              <div style={{ width: `${(s.correct / Math.max(1, s.correct + s.wrong + s.empty)) * 100}%` }} className="bg-emerald-400 h-full transition-all duration-500" />
                              <div style={{ width: `${(s.wrong / Math.max(1, s.correct + s.wrong + s.empty)) * 100}%` }} className="bg-rose-400 h-full transition-all duration-500" />
                            </div>
                          </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-200/60 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1.5 rounded-lg text-sm border border-indigo-200 dark:border-indigo-500/30">
                            🎯 Tahmini P3: {estimateP3Score(result.gyNet, result.gkNet).toFixed(3)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEdit(deneme)}
                            className="px-4 py-2 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/5 text-sm font-bold text-slate-600 dark:text-white rounded-xl shadow-sm hover:shadow-md transition-all"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => requestDelete(deneme)}
                            className="px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-sm font-bold text-red-600 rounded-xl shadow-sm hover:shadow-md transition-all"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
