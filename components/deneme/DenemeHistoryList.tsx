"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Trash2, Edit3, Target, Search } from "lucide-react";
import AppleEmoji from "../AppleEmoji";
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
              <div key={subId} className="space-y-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: `${subConfig.color}15`, color: subConfig.color }}>
                    {subConfig.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                      {subConfig.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{list.length} Çözüm</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((deneme) => {
                    const res = evaluateDeneme(deneme.scores, deneme.examType);
                    const subRes = res.subjects.find((s) => s.subjectId === subId);
                    if (!subRes) return null;

                    return (
                      <div
                        key={deneme.id}
                        className="p-5 bg-white dark:bg-[#1e293b] rounded-[1.5rem] shadow-sm hover:shadow-md ring-1 ring-slate-100 dark:ring-white/5 hover:ring-slate-200 dark:hover:ring-white/10 transition-all flex flex-col group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-base font-bold text-slate-800 dark:text-white transition-colors" style={{ color: "var(--tw-text-opacity)" }}>
                              {deneme.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-slate-400">
                              <span>{format(new Date(deneme.date + "T12:00:00"), "d MMM yyyy", { locale: tr })}</span>
                              {deneme.publisher && (
                                <span className="bg-slate-50 dark:bg-white/10 px-2 py-0.5 rounded-md text-slate-500">
                                  {deneme.publisher}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="px-3 py-1.5 rounded-xl text-center shrink-0 border" style={{ backgroundColor: `${subConfig.color}10`, borderColor: `${subConfig.color}20` }}>
                            <span className="text-[10px] font-black uppercase block leading-tight opacity-80" style={{ color: subConfig.color }}>Net</span>
                            <span className="text-lg font-black font-mono leading-none" style={{ color: subConfig.color }}>
                              {formatNet(subRes.net)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50 dark:border-white/5">
                          <div className="flex gap-2 text-xs font-bold font-mono">
                            <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">{subRes.correct} D</span>
                            <span className="bg-red-50 text-red-500 px-2 py-1 rounded-lg">{subRes.wrong} Y</span>
                            <span className="bg-slate-50 text-slate-500 px-2 py-1 rounded-lg">{subRes.empty} B</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(deneme)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-white/5 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => requestDelete(deneme)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-white/5 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
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
      <div className="space-y-5">
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
              whileHover={{ y: -4 }}
              className={`bg-white dark:bg-[#1e293b] rounded-3xl transition-all duration-300 ${
                expanded 
                  ? "shadow-md ring-2 ring-[#1cb0f6] dark:ring-[#1cb0f6]" 
                  : "shadow-sm hover:shadow-md ring-1 ring-slate-200 dark:hover:ring-white/10"
              } overflow-hidden group`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : deneme.id)}
                className="w-full p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6 text-left focus:outline-none relative active:scale-[0.98] transition-transform"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className={`text-xl font-black transition-colors ${expanded ? "text-[#1cb0f6]" : "text-slate-800 dark:text-white group-hover:text-[#1cb0f6]"}`}>
                      {deneme.name}
                    </h4>
                    {trend === "up" && <span className="text-[10px] bg-[#58cc02]/10 text-[#58cc02] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest flex items-center gap-1 border border-[#58cc02]/20"><span className="text-sm leading-none">↗</span> Yükseliş</span>}
                    {trend === "down" && <span className="text-[10px] bg-[#ff4b4b]/10 text-[#ff4b4b] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest flex items-center gap-1 border border-[#ff4b4b]/20"><span className="text-sm leading-none">↘</span> Düşüş</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-400 mt-2">
                    <span>{format(new Date(deneme.date + "T12:00:00"), "d MMM yyyy", { locale: tr })}</span>
                    {deneme.publisher && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span>{deneme.publisher}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-10 w-full md:w-auto">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">GY Net</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-lg leading-none">{formatNet(result.gyNet)}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-100 dark:bg-white/5 hidden sm:block" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">GK Net</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-lg leading-none">{formatNet(result.gkNet)}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-100 dark:bg-white/5 hidden sm:block" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-1">Toplam</span>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-2xl leading-none">{formatNet(result.totalNet)}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-100 dark:bg-white/5 hidden sm:block" />
                  <div className="flex flex-col items-center hidden sm:flex">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-500/80 uppercase tracking-widest mb-1">P3 Puan</span>
                    <span className="font-mono font-black text-amber-700 dark:text-amber-400 text-2xl leading-none">{estimateP3Score(result.gyNet, result.gkNet).toFixed(2)}</span>
                  </div>
                  <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all ml-2">
                    <svg className={`w-5 h-5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  >
                    <div className="px-6 pb-6 sm:px-8 sm:pb-8">
                      <div className="w-full h-px bg-slate-100 dark:bg-white/5 mb-8" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {result.subjects.map((s) => {
                          const subConfig = DENEME_SUBJECTS.find((sub) => sub.id === s.subjectId);
                          return (
                          <div key={s.subjectId} className="flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subConfig?.color || '#3b82f6' }} />
                              <h5 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.title}</h5>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="font-mono font-black text-2xl text-slate-800 dark:text-white leading-none">
                                {formatNet(s.net)}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net</span>
                            </div>
                            <div className="flex gap-2 text-[11px] font-bold font-mono mb-3">
                              <span className="text-emerald-500">{s.correct}D</span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-rose-500">{s.wrong}Y</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden flex">
                              <div style={{ width: `${(s.correct / Math.max(1, s.correct + s.wrong + s.empty)) * 100}%` }} className="bg-emerald-400 h-full transition-all duration-500" />
                              <div style={{ width: `${(s.wrong / Math.max(1, s.correct + s.wrong + s.empty)) * 100}%` }} className="bg-rose-400 h-full transition-all duration-500" />
                            </div>
                          </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <AppleEmoji emoji="🎯" size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahmini P3 Puanı</p>
                            <p className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono leading-none mt-0.5">{estimateP3Score(result.gyNet, result.gkNet).toFixed(3)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEdit(deneme)}
                            className="px-5 py-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => requestDelete(deneme)}
                            className="px-5 py-2.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-xl transition-colors"
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
