"use client";

import { motion } from "framer-motion";
import { SubjectScoreResult, formatNet } from "@/lib/denemeUtils";
import ScoreStepper from "./ScoreStepper";
import DenemeAlert from "./DenemeAlert";

type Props = {
  subject: SubjectScoreResult;
  onChange: (
    field: "correct" | "wrong" | "empty",
    value: number
  ) => void;
  index: number;
};

export default function SubjectScoreRow({
  subject,
  onChange,
  index,
}: Props) {
  const answered = subject.correct + subject.wrong;
  const accuracy =
    answered === 0 ? 0 : Math.round((subject.correct / answered) * 100);

  const correctPct = (subject.correct / subject.questionCount) * 100;
  const wrongPct = (subject.wrong / subject.questionCount) * 100;
  const emptyPct = (subject.empty / subject.questionCount) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, type: "spring", stiffness: 300, damping: 28 }}
      className={`p-5 rounded-[1.25rem] bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm ${subject.error ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50" : ""}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform duration-200"
            style={{
              backgroundColor: `${subject.color}14`,
              color: subject.color,
            }}
          >
            {subject.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-[#1d1d1f] dark:text-white text-sm tracking-tight truncate">{subject.title}</h4>
              {answered > 0 && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide ${
                  accuracy >= 70 
                    ? "bg-[#e2f1e7] text-[#137333]" 
                    : accuracy >= 40 
                      ? "bg-[#fef3d6] text-[#b06000]" 
                      : "bg-[#fce8e6] text-[#c5221f]"
                }`}>
                  %{accuracy} İsabet
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
              Toplam Soru: <span className="font-sans text-slate-500 font-bold">{subject.questionCount}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <div 
            className="px-3.5 py-1.5 rounded-lg font-sans text-lg font-bold flex items-center gap-1 bg-[#f5f5f7] dark:bg-slate-900/50 border border-slate-200/20 dark:border-slate-700/50"
            style={{ color: subject.color }}
          >
            <span>{formatNet(subject.net)}</span>
            <span className="text-[9px] font-bold uppercase text-slate-400 mt-0.5 ml-0.5">Net</span>
          </div>
        </div>
      </div>

      {/* Stacked D/Y/B Ratio Progress Bar (Apple Style - 4px Thin) */}
      <div className="mt-3.5 h-1 w-full bg-[#e5e5ea] dark:bg-slate-700 rounded-full overflow-hidden flex shadow-none">
        <motion.div 
          className="h-full bg-[#34c759] rounded-l-full" /* Apple Green */
          style={{ width: `${correctPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        <motion.div 
          className="h-full bg-[#ff3b30]" /* Apple Red */
          style={{ width: `${wrongPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        <motion.div 
          className="h-full bg-[#d1d1d6] rounded-r-full" /* Apple Grey */
          style={{ width: `${emptyPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <ScoreStepper
          label="Doğru"
          value={subject.correct}
          max={subject.questionCount}
          variant="correct"
          onChange={(v) => onChange("correct", v)}
        />
        <ScoreStepper
          label="Yanlış"
          value={subject.wrong}
          max={subject.questionCount}
          variant="wrong"
          onChange={(v) => onChange("wrong", v)}
        />
        <ScoreStepper
          label="Boş"
          value={subject.empty}
          max={subject.questionCount}
          variant="empty"
          onChange={(v) => onChange("empty", v)}
        />
      </div>

      {subject.error && (
        <DenemeAlert variant="error" compact className="mt-3">
          {subject.error} — lütfen doğru, yanlış ve boş toplamını kontrol edin.
        </DenemeAlert>
      )}
    </motion.div>
  );
}

