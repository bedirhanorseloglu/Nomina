"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { FileText, Brain, Compass, Calendar, Tag, Check, ArrowRight, ArrowLeft, ChevronDown, Globe, Target } from "lucide-react";
import SubjectScoreRow from "./SubjectScoreRow";
import DenemeScoreRing from "./DenemeScoreRing";
import {
  createEmptyScores,
  evaluateDeneme,
  formatNet,
  SubjectScoreInput,
  estimateP3Score,
} from "@/lib/denemeUtils";
import { TOTAL_QUESTIONS, getSubjectConfig, DENEME_SUBJECTS } from "@/lib/denemeConfig";
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
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [examType, setExamType] = useState<"genel" | "brans">(initial?.examType ?? "genel");
  const [bransSubjectId, setBransSubjectId] = useState<string>(initial?.bransSubjectId ?? "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);
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
        <div className="flex p-1 bg-slate-100/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-[20px] shadow-sm border border-slate-200/50 dark:border-slate-700/50 mb-8 overflow-hidden">
          {([
            { id: 1, label: "Giriş Bilgileri", icon: FileText },
            { id: 2, label: examType === "genel" ? "Genel Yetenek" : "Net Girişi", icon: Brain },
            ...(examType === "genel" ? [{ id: 3, label: "Genel Kültür", icon: Compass }] : [])
          ]).map(tab => (
            <button
              key={tab.id}
              type="button"
              disabled={tab.id > 1 && (!name.trim() || !publisher.trim() || (examType === "brans" && !bransSubjectId))}
              onClick={() => setStep(tab.id as 1|2|3)}
              className="relative flex-1 py-3 px-4 text-center disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
            >
              {step === tab.id && (
                <motion.div
                  layoutId="stepTabBg"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-[16px] shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-slate-200/40 dark:border-slate-600/40"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center gap-2">
                <tab.icon className={`w-4 h-4 transition-colors ${step === tab.id ? "text-accent dark:text-white" : "text-slate-400 dark:text-slate-500"}`} />
                <span className={`text-xs font-bold transition-colors tracking-wide ${step === tab.id ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                  {tab.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Premium Form Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 sm:p-10 relative overflow-hidden">
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
                <div className="pb-4 border-b border-slate-100/50 dark:border-slate-700/50">
                  <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Sınav Bilgileri</h3>
                  <p className="text-sm font-bold text-slate-400 mt-1">Deneme türünü ve detaylarını belirleyin.</p>
                </div>

                {/* Clean Apple Style Exam Type Cards using Site Palette */}
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Deneme Türü</span>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Genel Deneme Kartı */}
                    <button
                      type="button"
                      onClick={() => {
                        setExamType("genel");
                        window.history.replaceState(null, '', "?mode=genel");
                      }}
                      className={`relative group flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left focus:outline-none
                        ${examType === "genel"
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                          : "border-slate-200/70 bg-slate-50/80 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800"
                        }`}
                    >
                      {/* Seçili işareti */}
                      <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                        ${examType === "genel" ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700"}`}>
                        {examType === "genel" && (
                          <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </motion.svg>
                        )}
                      </div>

                      {/* İkon */}
                      <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all shadow-sm
                        ${examType === "genel" ? "bg-blue-500 text-white shadow-blue-500/30" : "bg-white text-slate-400 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"}`}>
                        <Globe className="w-5 h-5" />
                      </div>

                      {/* Başlık + Açıklama */}
                      <div>
                        <p className={`text-sm font-black tracking-tight transition-colors ${examType === "genel" ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                          Genel Deneme
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5 leading-snug">
                          120 Soru • GY + GK
                        </p>
                      </div>

                      {/* Alt etiket */}
                      <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full transition-all
                        ${examType === "genel" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300" : "bg-slate-200/60 text-slate-400 dark:bg-slate-800"}`}>
                        Türkiye Geneli
                      </div>
                    </button>

                    {/* Branş Denemesi Kartı */}
                    <button
                      type="button"
                      onClick={() => { 
                        setExamType("brans"); 
                        setStep(1); 
                        window.history.replaceState(null, '', `?mode=brans${bransSubjectId ? `&subject=${bransSubjectId}` : ""}`);
                      }}
                      className={`relative group flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left focus:outline-none
                        ${examType === "brans"
                          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                          : "border-slate-200/70 bg-slate-50/80 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800"
                        }`}
                    >
                      {/* Seçili işareti */}
                      <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                        ${examType === "brans" ? "border-indigo-500 bg-indigo-500" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700"}`}>
                        {examType === "brans" && (
                          <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </motion.svg>
                        )}
                      </div>

                      {/* İkon */}
                      <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all shadow-sm
                        ${examType === "brans" ? "bg-indigo-500 text-white shadow-indigo-500/30" : "bg-white text-slate-400 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"}`}>
                        <Target className="w-5 h-5" />
                      </div>

                      {/* Başlık + Açıklama */}
                      <div>
                        <p className={`text-sm font-black tracking-tight transition-colors ${examType === "brans" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"}`}>
                          Branş Denemesi
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5 leading-snug">
                          Tek ders odaklı
                        </p>
                      </div>

                      {/* Alt etiket */}
                      <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full transition-all
                        ${examType === "brans" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300" : "bg-slate-200/60 text-slate-400 dark:bg-slate-800"}`}>
                        Ders Bazlı
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-7">
                  {examType === "brans" && (
                    <div className="sm:col-span-2 space-y-2 relative">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Branş Seçimi *</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none hover:bg-slate-100/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all text-left"
                        >
                          <span className={bransSubjectId ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}>
                            {bransSubjectId 
                              ? result.subjects.find(s => s.subjectId === bransSubjectId)?.title + ` (${result.subjects.find(s => s.subjectId === bransSubjectId)?.subjectId === "matematik" ? 30 : result.subjects.find(s => s.subjectId === bransSubjectId)?.questionCount} Soru)`
                              : "Lütfen bir branş seçin..."}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {isDropdownOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setIsDropdownOpen(false)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden z-50 py-1"
                              >
                                {result.subjects.filter(s => s.subjectId !== "geometri").map((s) => {
                                  const subjectColor = DENEME_SUBJECTS.find(ds => ds.id === s.subjectId)?.color || "#3b82f6";
                                  const isSelected = bransSubjectId === s.subjectId;
                                  const isHovered = hoveredSubjectId === s.subjectId;
                                  
                                  return (
                                    <button
                                      key={s.subjectId}
                                      type="button"
                                      onClick={() => {
                                        setBransSubjectId(s.subjectId);
                                        setIsDropdownOpen(false);
                                        window.history.replaceState(null, '', `?mode=brans&subject=${s.subjectId}`);
                                      }}
                                      onMouseEnter={() => setHoveredSubjectId(s.subjectId)}
                                      onMouseLeave={() => setHoveredSubjectId(null)}
                                      className="w-full text-left px-5 py-3 text-sm font-bold transition-all"
                                      style={{
                                        backgroundColor: isSelected || isHovered ? `${subjectColor}15` : "transparent",
                                        color: isSelected || isHovered ? subjectColor : undefined
                                      }}
                                    >
                                      {s.title} ({s.subjectId === "matematik" ? 30 : s.questionCount} Soru)
                                      {isSelected && <Check className="w-4 h-4 inline-block float-right mt-0.5" style={{ color: subjectColor }} />}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2 space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Deneme Adı *</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Örn: Pegem 5. Türkiye Geneli"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Tarih *</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> Yayınevi *</span>
                    <input
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="Örn: Yargı, Yediiklim"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all"
                      required
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
                <div className="pb-4 border-b border-slate-100/50 dark:border-slate-700/50">
                  <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                    {examType === "genel" ? "Genel Yetenek" : "Net Girişi"}
                  </h3>
                  <p className="text-sm font-bold text-slate-400 mt-1">Doğru, yanlış ve boş sayılarınızı girin.</p>
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
                <div className="pb-4 border-b border-slate-100/50 dark:border-slate-700/50">
                  <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Genel Kültür</h3>
                  <p className="text-sm font-bold text-slate-400 mt-1">Genel kültür testinin doğru ve yanlışlarını girin.</p>
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
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[15px] font-black text-slate-500 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 border-b-4 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-800 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Geri
              </button>
            ) : onCancel ? (
              <button type="button" onClick={onCancel} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 transition-colors">İptal</button>
            ) : <div />}

            {(step < 3 && examType === "genel") || (step < 2 && examType === "brans") ? (
              <button
                type="button"
                disabled={!name.trim() || !publisher.trim() || (examType === "brans" && !bransSubjectId)}
                onClick={() => setStep((s) => (s + 1) as any)}
                className="flex items-center gap-2 px-7 py-3 rounded-2xl text-[15px] font-black text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border-b-4 border-slate-950 hover:border-slate-800 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:border-b-0 disabled:translate-y-1 shadow-sm"
              >
                İleri <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <motion.button
                type="submit"
                disabled={!name.trim() || !publisher.trim() || !result.isValid}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[15px] font-black text-white bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 border-b-4 border-emerald-700 hover:border-emerald-500 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:border-b-0 disabled:translate-y-1 shadow-sm"
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
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-8 relative overflow-hidden">
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

          <div className="space-y-3 mb-8 relative z-10">
            {(() => {
              const correctCount = examType === "genel" ? result.totalCorrect : (selectedBranchSubject?.correct ?? 0);
              const wrongCount = examType === "genel" ? result.totalWrong : (selectedBranchSubject?.wrong ?? 0);
              const correctPct = maxQuestions === 0 ? 0 : (correctCount / maxQuestions) * 100;
              const wrongPct = maxQuestions === 0 ? 0 : (wrongCount / maxQuestions) * 100;
              
              return (
                <>
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <div className="flex gap-0.5">
                        <span className="w-2 h-2 rounded-l-full bg-[#34c759]"></span>
                        <span className="w-2 h-2 rounded-r-full bg-[#ff3b30]"></span>
                      </div>
                      Cevaplanan <span className="text-slate-800 dark:text-white">{totalAnswered}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      Kalan <span className="text-slate-800 dark:text-white">{maxQuestions - totalAnswered}</span>
                      <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                    </div>
                  </div>
                  <div className="h-4 sm:h-5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full shadow-inner border border-slate-200/60 dark:border-slate-700 p-0.5 sm:p-1 relative">
                    <div className="w-full h-full rounded-full overflow-hidden flex relative">
                      <motion.div 
                        className="h-full bg-[#34c759]"
                        initial={{ width: 0 }}
                        animate={{ width: `${correctPct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                      <motion.div 
                        className="h-full bg-[#ff3b30]"
                        initial={{ width: 0 }}
                        animate={{ width: `${wrongPct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                      {/* Duolingo style 3D highlight */}
                      {totalAnswered > 0 && (
                        <motion.div 
                          className="absolute top-0 left-0 h-[3px] bg-white/30 rounded-full z-10 pointer-events-none mt-[2px] mx-[2px]"
                          initial={{ width: 0 }}
                          animate={{ width: `calc(${correctPct + wrongPct}% - 4px)` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            {examType === "genel" ? (
              <>
                <PremiumWidget label="G. Yetenek" value={formatNet(result.gyNet)} color="blue" />
                <PremiumWidget label="G. Kültür" value={formatNet(result.gkNet)} color="purple" />
                <PremiumWidget label="Doğru" value={String(result.totalCorrect)} color="emerald" />
                <PremiumWidget label="Yanlış" value={String(result.totalWrong)} color="red" />
                
                <div className="col-span-2 rounded-[20px] p-5 text-center bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-500/10 dark:to-orange-500/5 border border-amber-200/50 dark:border-amber-500/20 shadow-sm mt-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600 dark:text-amber-500/80 mb-1">P3 Puan Tahmini</p>
                  <p className="text-3xl font-black font-mono text-amber-800 dark:text-amber-400 tracking-tight">
                    {estimateP3Score(result.gyNet, result.gkNet).toFixed(3)}
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
    blue: "bg-blue-50/50 dark:bg-blue-500/10 border-blue-100/50 dark:border-blue-500/20 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-50/50 dark:bg-purple-500/10 border-purple-100/50 dark:border-purple-500/20 text-purple-600 dark:text-purple-400",
    emerald: "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    red: "bg-red-50/50 dark:bg-red-500/10 border-red-100/50 dark:border-red-500/20 text-red-600 dark:text-red-400",
    slate: "bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-500/20 text-slate-600 dark:text-slate-400"
  };

  return (
    <div className={`rounded-[20px] p-4 text-center border ${colorStyles[color]} transition-transform hover:scale-105 duration-200`}>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-80 mb-0.5">{label}</p>
      <p className="text-xl font-black font-mono tracking-tight">{value}</p>
    </div>
  );
}
