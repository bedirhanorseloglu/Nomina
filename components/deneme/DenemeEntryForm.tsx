"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { FileText, Brain, Compass, Calendar, Tag, Check, ArrowRight, ArrowLeft } from "lucide-react";
import SubjectScoreRow from "./SubjectScoreRow";
import DenemeScoreRing from "./DenemeScoreRing";
import {
  createEmptyScores,
  evaluateDeneme,
  formatNet,
  SubjectScoreInput,
  estimateP3Score,
} from "@/lib/denemeUtils";
import { TOTAL_QUESTIONS, getSubjectConfig } from "@/lib/denemeConfig";
import DenemeAlert from "./DenemeAlert";

type Props = {
  targetNet: number;
  onSubmit: (payload: {
    name: string;
    date: string;
    publisher?: string;
    note?: string;
    scores: SubjectScoreInput[];
    examType?: "genel" | "brans";
    bransSubjectId?: string;
  }) => void;
  onCancel?: () => void;
  initial?: {
    name: string;
    date: string;
    publisher?: string;
    note?: string;
    scores: SubjectScoreInput[];
    examType?: "genel" | "brans";
    bransSubjectId?: string;
  };
};

export default function DenemeEntryForm({ targetNet, onSubmit, onCancel, initial }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [examType, setExamType] = useState<"genel" | "brans">(initial?.examType ?? "genel");
  const [bransSubjectId, setBransSubjectId] = useState<string>(initial?.bransSubjectId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? format(new Date(), "yyyy-MM-dd"));
  const [publisher, setPublisher] = useState(initial?.publisher ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [scores, setScores] = useState<SubjectScoreInput[]>(initial?.scores ?? createEmptyScores());

  const result = useMemo(() => evaluateDeneme(scores, examType), [scores, examType]);

  const updateScore = (subjectId: string, field: "correct" | "wrong" | "empty", value: number) => {
    setScores((prev) =>
      prev.map((s) => {
        if (s.subjectId !== subjectId) return s;
        const config = getSubjectConfig(subjectId);
        let questionCount = config?.questionCount ?? 0;
        if (examType === "brans" && subjectId === "matematik") {
          questionCount = 30;
        }

        if (field === "correct") {
          const newCorrect = value;
          const newEmpty = Math.max(0, questionCount - (newCorrect + s.wrong));
          return { ...s, correct: newCorrect, empty: newEmpty };
        }
        if (field === "wrong") {
          const newWrong = value;
          const newEmpty = Math.max(0, questionCount - (s.correct + newWrong));
          return { ...s, wrong: newWrong, empty: newEmpty };
        }
        if (field === "empty") {
          const newEmpty = value;
          const newWrong = Math.max(0, questionCount - (s.correct + newEmpty));
          return { ...s, empty: newEmpty, wrong: newWrong };
        }
        return { ...s, [field]: value };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !result.isValid || (examType === "brans" && !bransSubjectId)) return;
    
    onSubmit({
      name: name.trim(),
      date,
      publisher: publisher.trim() || undefined,
      note: note.trim() || undefined,
      scores,
      examType,
      bransSubjectId: examType === "brans" ? bransSubjectId : undefined,
    });
    
    if (!initial) {
      setName("");
      setPublisher("");
      setNote("");
      setScores(createEmptyScores());
      setStep(1);
    }
  };

  const step2Subjects = result.subjects.filter((s) => s.category === "Genel Yetenek");
  const step3Subjects = result.subjects.filter((s) => s.category !== "Genel Yetenek");
  const selectedBranchSubject = examType === "brans" ? result.subjects.find(s => s.subjectId === bransSubjectId) : null;

  const totalAnswered = examType === "genel" ? result.totalCorrect + result.totalWrong : (selectedBranchSubject ? selectedBranchSubject.correct + selectedBranchSubject.wrong : 0);
  const maxQuestions = examType === "genel" ? 120 : (selectedBranchSubject?.questionCount ?? 0);
  const answeredPercentage = maxQuestions > 0 ? (totalAnswered / maxQuestions) * 100 : 0;
  
  const displayNet = examType === "genel" ? result.totalNet : (selectedBranchSubject?.net ?? 0);
  const successRate = maxQuestions > 0 ? (displayNet / maxQuestions) * 100 : 0;

  return (
    <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 xl:gap-10 items-start">
      
      {/* ━━━ SOL PANEL: FORM YÜZEYİ ━━━ */}
      <div className="space-y-6 min-w-0">
        
        {/* Apple Style Segmented Header */}
        <div className="flex p-1 bg-slate-100/60 backdrop-blur-xl rounded-[20px] shadow-sm border border-slate-200/50 mb-8 overflow-hidden">
          {([
            { id: 1, label: "Giriş Bilgileri", icon: FileText },
            { id: 2, label: examType === "genel" ? "Genel Yetenek" : "Net Girişi", icon: Brain },
            ...(examType === "genel" ? [{ id: 3, label: "Genel Kültür", icon: Compass }] : [])
          ]).map(tab => (
            <button
              key={tab.id}
              type="button"
              disabled={tab.id > 1 && (!name.trim() || (examType === "brans" && !bransSubjectId))}
              onClick={() => setStep(tab.id as 1|2|3)}
              className="relative flex-1 py-3 px-4 text-center disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
            >
              {step === tab.id && (
                <motion.div
                  layoutId="stepTabBg"
                  className="absolute inset-0 bg-white rounded-[16px] shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-slate-200/40"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center gap-2">
                <tab.icon className={`w-4 h-4 transition-colors ${step === tab.id ? "text-accent" : "text-slate-400"}`} />
                <span className={`text-xs font-bold transition-colors tracking-wide ${step === tab.id ? "text-slate-900" : "text-slate-500"}`}>
                  {tab.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Premium Form Card */}
        <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 sm:p-10 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.section
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-8"
              >
                <div className="pb-4 border-b border-slate-100/50">
                  <h3 className="text-xl font-black tracking-tight text-slate-800">Sınav Bilgileri</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Deneme türünü ve detaylarını belirleyin.</p>
                </div>

                {/* Apple Style Segmented Picker for Exam Type */}
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Deneme Türü</span>
                  <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-200/50">
                    <button type="button" onClick={() => setExamType("genel")}
                      className={`relative flex-1 py-3 text-xs font-bold transition-colors rounded-xl ${examType === "genel" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
                      {examType === "genel" && <motion.div layoutId="examTypeBg" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                      <span className="relative z-10">Genel Deneme</span>
                    </button>
                    <button type="button" onClick={() => { setExamType("brans"); setStep(1); }}
                      className={`relative flex-1 py-3 text-xs font-bold transition-colors rounded-xl ${examType === "brans" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
                      {examType === "brans" && <motion.div layoutId="examTypeBg" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                      <span className="relative z-10">Branş Denemesi</span>
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-7">
                  {examType === "brans" && (
                    <div className="sm:col-span-2 space-y-2">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Branş Seçimi *</span>
                      <select 
                        value={bransSubjectId} 
                        onChange={(e) => setBransSubjectId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all cursor-pointer appearance-none"
                        required
                      >
                        <option value="" disabled>Lütfen bir branş seçin...</option>
                        {result.subjects.filter(s => s.subjectId !== "geometri").map(s => (
                          <option key={s.subjectId} value={s.subjectId}>
                            {s.title} ({s.subjectId === "matematik" ? 30 : s.questionCount} Soru)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="sm:col-span-2 space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Deneme Adı *</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Örn: Pegem 5. Türkiye Geneli"
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Tarih *</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> Yayınevi</span>
                    <input
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="Örn: Yargı, Yediiklim"
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Notlar (Opsiyonel)</span>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Bu deneme ile ilgili tespitlerinizi buraya not alabilirsiniz..."
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all resize-none min-h-[100px]"
                    />
                  </div>
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-8"
              >
                <div className="pb-4 border-b border-slate-100/50">
                  <h3 className="text-xl font-black tracking-tight text-slate-800">
                    {examType === "genel" ? "Genel Yetenek" : "Net Girişi"}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Doğru, yanlış ve boş sayılarınızı girin.</p>
                </div>
                
                <div className="space-y-5">
                  {(examType === "genel" ? step2Subjects : result.subjects.filter((s) => s.subjectId === bransSubjectId)).map((subject, i) => (
                    <SubjectScoreRow
                      key={subject.subjectId}
                      subject={subject}
                      index={i}
                      onChange={(field, value) => updateScore(subject.subjectId, field, value)}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-8"
              >
                <div className="pb-4 border-b border-slate-100/50">
                  <h3 className="text-xl font-black tracking-tight text-slate-800">Genel Kültür</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Sözel ve bilgi ağırlıklı testler.</p>
                </div>
                
                <div className="space-y-5">
                  {step3Subjects.map((subject, i) => (
                    <SubjectScoreRow
                      key={subject.subjectId}
                      subject={subject}
                      index={i}
                      onChange={(field, value) => updateScore(subject.subjectId, field, value)}
                    />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Footer Controls */}
          <div className="mt-10 pt-6 border-t border-slate-100/60 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Geri
              </button>
            ) : onCancel ? (
              <button type="button" onClick={onCancel} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 transition-colors">İptal</button>
            ) : <div />}

            {(step < 3 && examType === "genel") || (step < 2 && examType === "brans") ? (
              <button
                type="button"
                disabled={!name.trim() || (examType === "brans" && !bransSubjectId)}
                onClick={() => setStep((s) => (s + 1) as any)}
                className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
              >
                İleri <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <motion.button
                type="submit"
                disabled={!name.trim() || !result.isValid}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-accent to-emerald-500 hover:from-accent hover:to-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_8px_20px_rgba(16,185,129,0.3)]"
              >
                <Check className="w-4 h-4" />
                {initial ? "Değişiklikleri Kaydet" : "Denemeyi Kaydet"}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ━━━ SAĞ PANEL: CANLI SKOR WIDGETLARI ━━━ */}
      <aside className="lg:sticky lg:top-28 h-fit space-y-6">
        <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-8 relative overflow-hidden">
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-accent/10 to-transparent rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center mb-8 relative z-10">Canlı Skor Paneli</h4>
          
          <div className="flex justify-center mb-8 relative z-10">
            <DenemeScoreRing
              value={displayNet}
              max={maxQuestions}
              size={200}
              label={examType === "genel" ? "Toplam Net" : "Ders Neti"}
              color={examType === "brans" ? selectedBranchSubject?.color : undefined}
            />
          </div>

          <div className="space-y-2 mb-8 relative z-10">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Cevaplanan: {totalAnswered}</span>
              <span>Kalan: {maxQuestions - totalAnswered}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                className="h-full bg-gradient-to-r from-accent to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${answeredPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            {examType === "genel" ? (
              <>
                <PremiumWidget label="G. Yetenek" value={formatNet(result.gyNet)} color="blue" />
                <PremiumWidget label="G. Kültür" value={formatNet(result.gkNet)} color="purple" />
                <PremiumWidget label="Doğru" value={String(result.totalCorrect)} color="emerald" />
                <PremiumWidget label="Yanlış" value={String(result.totalWrong)} color="red" />
                
                <div className="col-span-2 rounded-[20px] p-5 text-center bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/50 shadow-sm mt-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600 mb-1">P3 Puan Tahmini</p>
                  <p className="text-3xl font-black font-mono text-amber-800 tracking-tight">
                    {estimateP3Score(result.totalNet).toFixed(3)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <PremiumWidget label="Doğru" value={String(selectedBranchSubject?.correct ?? 0)} color="emerald" />
                <PremiumWidget label="Yanlış" value={String(selectedBranchSubject?.wrong ?? 0)} color="red" />
                <PremiumWidget label="Boş" value={String(selectedBranchSubject?.empty ?? 0)} color="slate" />
                <PremiumWidget label="İsabet Oranı" value={`%${Math.round(successRate)}`} color="blue" />
              </>
            )}
          </div>

          {examType === "genel" && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Hedef Net: {targetNet}</p>
              <div className="text-xs font-bold">
                {result.totalNet >= targetNet ? (
                  <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">🎉 Hedef aşıldı! (+{(result.totalNet - targetNet).toFixed(1)} Net)</span>
                ) : (
                  <span className="text-slate-500">Hedefe <strong className="text-accent font-mono text-sm px-1">{(targetNet - result.totalNet).toFixed(1)}</strong> net kaldı.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {!result.isValid && (
          <DenemeAlert variant="error" title="Girdi doğrulanamadı">
            Bir veya daha fazla derste soru limiti aşıldı. Doğru, yanlış ve boş sayılarının
            toplamı, o dersin soru sayısını geçmemelidir.
          </DenemeAlert>
        )}

        {examType === "brans" && !bransSubjectId && step > 1 && (
          <DenemeAlert variant="warning" title="Branş seçimi gerekli">
            Devam etmek için hangi branş dersine ait deneme girdiğinizi seçmelisiniz.
          </DenemeAlert>
        )}
      </aside>
    </form>
  );
}

function PremiumWidget({ label, value, color }: { label: string; value: string; color: "blue"|"purple"|"emerald"|"red"|"slate" }) {
  const colorStyles = {
    blue: "bg-blue-50/50 border-blue-100/50 text-blue-600",
    purple: "bg-purple-50/50 border-purple-100/50 text-purple-600",
    emerald: "bg-emerald-50/50 border-emerald-100/50 text-emerald-600",
    red: "bg-red-50/50 border-red-100/50 text-red-600",
    slate: "bg-slate-50 border-slate-200/50 text-slate-600"
  };

  return (
    <div className={`rounded-[20px] p-4 text-center border ${colorStyles[color]} transition-transform hover:scale-105 duration-200`}>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-80 mb-0.5">{label}</p>
      <p className="text-xl font-black font-mono tracking-tight">{value}</p>
    </div>
  );
}
