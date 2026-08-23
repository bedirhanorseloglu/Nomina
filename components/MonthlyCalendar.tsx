"use client";

import { useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Topic, Subject } from "@/types";
import { UNIVERSITY_CLASSES } from "@/lib/data";
import { ChevronLeft, ChevronRight, Check, X, Calendar, ArrowRight, Search, RotateCcw } from "lucide-react";
import AppleEmoji from "@/components/AppleEmoji";
import { DenemeRecord, evaluateDeneme, formatNet, getDenemeTheme, inferBransSubjectId } from "@/lib/denemeUtils";
import { DENEME_SUBJECTS } from "@/lib/denemeConfig";
import { useAuth } from "@/contexts/AuthContext";
import { loadDenemeYeniden } from "@/lib/firebaseService";

interface MonthlyCalendarProps {
  topics: Topic[];
  subjects: Subject[];
  slotNotes: Record<string, string>;
  completedNotes: Record<string, boolean>;
  dailyGoals?: Record<string, number>;
  dailyGoalTarget?: number;
  isDragging: boolean;
  onDayClick: (date: Date) => void;
  onToggleTopic?: (topicId: string, subjectId?: string) => void;
  onToggleNote?: (slotId: string) => void;
  onUpdateDailyGoal?: (dateStr: string, count: number) => void;
}

const HOLIDAYS = [
  "2026-05-01", "2026-05-19", "2026-07-15", "2026-08-30", "2026-09-05"
];
const EXAM_DATE = "2026-09-06";

type CalendarFilter = "all" | "deneme" | "questions" | "completed" | "notes";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. HÜCRE İÇİ TEK BAKIŞTA METİNLERİ OKU ELEMANI (DROPPABLE DAY CELL)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function DroppableDayCell({ 
  date, 
  isCurrentMonth, 
  topicsForDay, 
  allTopics, 
  subjects, 
  slotNotes,
  completedNotes,
  dailyGoals = {},
  denemelerForDay = [],
  isDragging, 
  onSelectDay,
  isFilteredMatch = true,
  hasActiveSearchFilter = false,
}: { 
  date: Date; 
  isCurrentMonth: boolean; 
  topicsForDay: Topic[]; 
  allTopics: Topic[]; 
  subjects: Subject[]; 
  slotNotes: Record<string, string>;
  completedNotes: Record<string, boolean>;
  dailyGoals?: Record<string, number>;
  denemelerForDay?: DenemeRecord[];
  isDragging: boolean; 
  onSelectDay: () => void;
  isFilteredMatch?: boolean;
  hasActiveSearchFilter?: boolean;
}) {
  const dateStr = format(date, "yyyy-MM-dd");
  const dayOfWeek = getDay(date);
  const isHoliday = HOLIDAYS.includes(dateStr);
  const isExamDay = dateStr === EXAM_DATE;
  const classesForDay = UNIVERSITY_CLASSES.filter(c => c.date === dateStr);
  
  const notesForDay = Object.entries(slotNotes)
    .filter(([key, val]) => key.startsWith(dateStr) && val.trim() !== "")
    .map(([key, val]) => ({ 
      key,
      time: key.split("_")[1] || "", 
      text: val,
      isCompleted: completedNotes[key] || false 
    }));

  const completedNotesCount = notesForDay.filter(n => n.isCompleted).length;
  const completedTopicsCount = topicsForDay.filter(t => t.done).length;
  const solvedQuestions = dailyGoals[dateStr] || 0;

  const totalItemsCount = topicsForDay.length + notesForDay.length;
  const completedItemsCount = completedTopicsCount + completedNotesCount;
  const completionRatio = totalItemsCount > 0 ? (completedItemsCount / totalItemsCount) * 100 : 0;

  const { isOver, setNodeRef } = useDroppable({
    id: dateStr,
    data: { acceptsDrop: !isHoliday && !isExamDay },
    disabled: isHoliday || isExamDay
  });

  const isToday = isSameDay(date, new Date());
  const hasDeneme = denemelerForDay.length > 0;
  const bestDeneme = hasDeneme ? denemelerForDay.reduce<{ net: number; name: string; publisher?: string; record: DenemeRecord }>((best, d) => {
    const net = evaluateDeneme(d.scores, d.examType).totalNet;
    return net > best.net ? { net, name: d.name, publisher: d.publisher, record: d } : best;
  }, { net: -999, name: "", publisher: "", record: denemelerForDay[0] }) : null;

  // Max items to display inside cell without overflow
  const maxVisibleItems = 1;
  const combinedActivities = [
    ...topicsForDay.map(t => ({ type: "topic" as const, data: t })),
    ...notesForDay.map(n => ({ type: "note" as const, data: n }))
  ];

  return (
    <div
      ref={setNodeRef}
      onClick={onSelectDay}
      className={`min-h-[58px] sm:min-h-[66px] p-1 sm:p-1.5 border-2 border-b-4 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
        !isCurrentMonth 
          ? 'opacity-25 pointer-events-none border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40' 
          : hasActiveSearchFilter && !isFilteredMatch
            ? 'opacity-25 blur-[0.3px] scale-98 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800'
            : hasActiveSearchFilter && isFilteredMatch
              ? 'border-[#1cb0f6] border-b-[#1899d6] bg-white dark:bg-slate-800 shadow-md scale-[1.01] z-20'
              : 'hover:-translate-y-0.5 shadow-2xs hover:shadow-md'
      } ${
        isToday && !hasActiveSearchFilter
          ? 'bg-[#e8f7ff] dark:bg-[#1cb0f6]/10 border-[#1cb0f6] border-b-[#1899d6] shadow-xs' 
          : !hasActiveSearchFilter
            ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#1cb0f6] dark:hover:border-[#1cb0f6]'
            : ''
      } ${
        isOver ? 'scale-105 z-30 border-[#1cb0f6] border-b-[#1899d6] bg-[#1cb0f6]/10 shadow-xl' : ''
      }`}
    >
      {/* ━━━ INSTANT 3D HOVER OVERLAY (FAREYLES GEZİNCE ANINDA AÇILAN DETAY POPUP) ━━━ */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-80 p-4.5 bg-white dark:bg-slate-800 backdrop-blur-xl text-slate-800 dark:text-white rounded-2xl border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 space-y-3">
        {/* Header: Date & Solved Count */}
        <div className="flex justify-between items-center pb-2.5 border-b-2 border-slate-100 dark:border-slate-700/60">
          <span className="font-black text-xs text-[#1cb0f6] flex items-center gap-2">
            <AppleEmoji emoji="📅" size={16} color="#1cb0f6" />
            <span>{format(date, "d MMMM yyyy, EEEE", { locale: tr })}</span>
          </span>
          {solvedQuestions > 0 && (
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-xl bg-[#ff9500] text-white border-2 border-b-2 border-[#ff9500] border-b-[#d67d00] shadow-2xs">
              ⚡ {solvedQuestions} Soru
            </span>
          )}
        </div>

        {/* Deneme Result */}
        {hasDeneme && bestDeneme && (() => {
          const theme = getDenemeTheme(bestDeneme.record);
          return (
            <div 
              className="p-2.5 rounded-xl border-2 border-b-2 flex items-center justify-between text-xs font-black shadow-2xs"
              style={{ backgroundColor: `${theme.color}12`, borderColor: theme.color }}
            >
              <span className="truncate flex items-center gap-1.5 min-w-0" style={{ color: theme.color }}>
                <AppleEmoji emoji={theme.icon} size={15} />
                <span className="truncate">{theme.title} · {bestDeneme.record.name}</span>
              </span>
              <span 
                className="px-2.5 py-0.5 rounded-lg text-white font-mono font-black text-[11px] border border-green-600 shadow-2xs shrink-0"
                style={{ backgroundColor: "#58cc02" }}
              >
                {formatNet(bestDeneme.net)} Net
              </span>
            </div>
          );
        })()}

        {/* Topics for Day */}
        {topicsForDay.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block">Ders Konuları:</span>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {topicsForDay.map(t => (
                <div key={t.id} className="text-[11px] font-extrabold flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60">
                  <span className="truncate text-slate-700 dark:text-slate-200">· {t.title}</span>
                  {t.done ? (
                    <span className="text-[#58cc02] font-black text-[10px] shrink-0 flex items-center gap-1">
                      <AppleEmoji emoji="✅" size={12} />
                      <span>Bitti</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px] shrink-0 flex items-center gap-1">
                      <AppleEmoji emoji="⏳" size={12} />
                      <span>Bekliyor</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes & Tasks */}
        {notesForDay.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t-2 border-slate-100 dark:border-slate-700/60">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              <span>Saatlik Notlar & Görevler:</span>
              <span className="text-[#1cb0f6] font-mono font-black text-[11px]">{completedNotesCount}/{notesForDay.length} BİTTİ</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {notesForDay.map(n => (
                <div key={n.key} className="text-[11px] font-extrabold flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 min-w-0">
                  <span className="shrink-0 flex items-center">
                    <AppleEmoji emoji={n.isCompleted ? "✅" : "📝"} size={14} />
                  </span>
                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shrink-0">{n.time}</span>
                  <span className={`truncate text-slate-700 dark:text-slate-200 ${n.isCompleted ? 'line-through opacity-50' : ''}`}>{n.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ━━━ ÜST BAŞLIK SATIRI ━━━ */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-xl border-2 border-b-2 transition-all ${
            isToday 
              ? 'bg-[#1cb0f6] text-white border-[#1cb0f6] border-b-[#1899d6] shadow-2xs' 
              : isExamDay 
                ? 'bg-[#ff4b4b] text-white border-[#ff4b4b] border-b-[#e03030]' 
                : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
          }`}>
            {format(date, "d")}
          </span>

          <div className="flex items-center gap-1">
            {isExamDay && <span className="text-[9px] font-black uppercase text-[#ff4b4b] tracking-widest">KPSS</span>}
            {isHoliday && !isExamDay && isCurrentMonth && <AppleEmoji emoji="🏖️" size={14} />}
            {solvedQuestions > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#ff9500] text-white border border-amber-600 shadow-2xs flex items-center gap-0.5">
                <span>⚡</span>
                <span className="font-mono">{solvedQuestions}</span>
              </span>
            )}
          </div>
        </div>

        {/* ━━━ TEK BAKIŞTA LİSTELENEN TÜM AKTİVİTELER (DOĞRUDAN METİNLERİ OKUNUR!) ━━━ */}
        <div className="flex flex-col gap-1 overflow-hidden flex-1 my-1">
          {classesForDay.map(cls => (
            <div key={cls.id} className="w-full h-1.5 bg-[#5866d6] rounded-full shadow-2xs" title={cls.courseName} />
          ))}

          {/* 🎯 1. DENEME SINAVI METİN KARTI */}
          {hasDeneme && bestDeneme && (() => {
            const theme = getDenemeTheme(bestDeneme.record);
            return (
              <div className="text-[10px] font-black px-2 py-1 rounded-lg text-white border-2 border-b-2 shadow-2xs flex items-center justify-between truncate" style={{ backgroundColor: theme.color, borderColor: theme.color }}>
                <span className="truncate flex items-center gap-1">
                  <AppleEmoji emoji={theme.icon} size={11} />
                  <span className="truncate">{theme.subjectTitle ? `${theme.subjectTitle}: ` : ""}{bestDeneme.record.name}</span>
                </span>
                <span className="font-mono text-[10px] shrink-0 ml-1 bg-black/20 px-1 py-0.2 rounded">{formatNet(bestDeneme.net)} Net</span>
              </div>
            );
          })()}

          {/* 2. DERS KONULARI VEYA SAATLİK GÖREV METİNLERİ (DOĞRUDAN METİN OLARAK OKUNUR) */}
          {combinedActivities.slice(0, hasDeneme ? maxVisibleItems - 1 : maxVisibleItems).map((item, idx) => {
            if (item.type === "topic") {
              const topic = item.data;
              const subject = subjects.find(s => s.topics.some(t => t.id === topic.id));
              const isDone = topic.done;
              return (
                <div 
                  key={`topic-${topic.id}-${idx}`} 
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg truncate border-2 border-b-2 shadow-2xs flex items-center justify-between gap-1 transition-transform ${
                    isDone 
                      ? 'bg-[#e5f9e7] dark:bg-[#58cc02]/20 border-[#58cc02] text-[#58cc02] dark:text-[#58cc02]' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                  }`}
                  style={!isDone && subject ? { backgroundColor: `${subject.color}15`, borderColor: `${subject.color}40`, color: subject.color } : undefined}
                >
                  <span className="truncate flex items-center gap-1">
                    <span>{isDone ? "✅" : "📖"}</span>
                    <span className="truncate">{topic.title}</span>
                  </span>
                </div>
              );
            } else {
              const note = item.data;
              const displayText = note.text && note.text.trim() !== "" 
                ? note.text 
                : (note.isCompleted ? "Tamamlanan Görev" : "Çalışma Notu");

              return (
                <div 
                  key={`note-${note.key}-${idx}`}
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg truncate border-2 border-b-2 shadow-2xs flex items-center justify-between gap-1 ${
                    note.isCompleted 
                      ? 'bg-[#e5f9e7] dark:bg-[#58cc02]/20 border-[#58cc02] text-[#58cc02] dark:text-[#58cc02]' 
                      : 'bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <span className="truncate flex items-center gap-1 min-w-0">
                    <span>{note.isCompleted ? "✅" : "📝"}</span>
                    <span className={`truncate ${note.isCompleted ? 'line-through opacity-85' : ''}`}>{displayText}</span>
                  </span>
                </div>
              );
            }
          })}

          {combinedActivities.length > (hasDeneme ? maxVisibleItems - 1 : maxVisibleItems) && (
            <span className="text-[9px] font-extrabold text-slate-400 pl-0.5">
              +{combinedActivities.length - (hasDeneme ? maxVisibleItems - 1 : maxVisibleItems)} aktivite daha
            </span>
          )}
        </div>
      </div>

      {/* ━━━ ALT MİKRO İLERLEME & İKONLAR ━━━ */}
      <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
          {notesForDay.length > 0 && (
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black border ${
              completedNotesCount === notesForDay.length 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#58cc02] border-[#58cc02]' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
            }`}>
              <AppleEmoji emoji="📝" size={10} />
              <span>{completedNotesCount}/{notesForDay.length}</span>
            </div>
          )}

          {allTopics.some(t => t.revisions?.some(r => r.date === dateStr)) && (
            <span className="w-2 h-2 rounded-full bg-[#1cb0f6] border border-[#1899d6] shadow-2xs" title="Tekrar Günü" />
          )}
        </div>

        {/* MİKRO İLERLEME ÇUBUĞU */}
        {totalItemsCount > 0 && (
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600">
            <div 
              className="h-full bg-[#58cc02] rounded-full transition-all duration-300"
              style={{ width: `${completionRatio}%` }}
            />
          </div>
        )}
      </div>
      
      {isDragging && !isHoliday && !isExamDay && isCurrentMonth && (
        <div className="absolute inset-0 bg-[#1cb0f6]/10 border-2 border-dashed border-[#1cb0f6] rounded-2xl pointer-events-none" />
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   2. DETAYLI GÜNLÜK AKTİVİTE MODALI (DAY ACTIVITY MODAL)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function DayActivityModal({
  date,
  topicsForDay,
  subjects,
  slotNotes,
  completedNotes,
  dailyGoals = {},
  denemelerForDay = [],
  onClose,
  onDayClick,
  onToggleTopic,
  onToggleNote,
  onUpdateDailyGoal,
}: {
  date: Date;
  topicsForDay: Topic[];
  subjects: Subject[];
  slotNotes: Record<string, string>;
  completedNotes: Record<string, boolean>;
  dailyGoals?: Record<string, number>;
  denemelerForDay?: DenemeRecord[];
  onClose: () => void;
  onDayClick: (date: Date) => void;
  onToggleTopic?: (topicId: string, subjectId?: string) => void;
  onToggleNote?: (slotId: string) => void;
  onUpdateDailyGoal?: (dateStr: string, count: number) => void;
}) {
  const dateStr = format(date, "yyyy-MM-dd");
  const formattedTitle = format(date, "d MMMM yyyy, EEEE", { locale: tr });
  const isToday = isSameDay(date, new Date());
  
  const notesForDay = Object.entries(slotNotes)
    .filter(([key, val]) => key.startsWith(dateStr) && val.trim() !== "")
    .map(([key, val]) => ({ 
      key,
      time: key.split("_")[1] || "Not", 
      text: val,
      isCompleted: completedNotes[key] || false 
    }));

  const [questionInput, setQuestionInput] = useState<string>((dailyGoals[dateStr] || 0).toString());
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);

  const completedTopics = topicsForDay.filter(t => t.done).length;
  const completedNotesCount = notesForDay.filter(n => n.isCompleted).length;
  const solvedQuestions = dailyGoals[dateStr] || 0;

  const handleSaveQuestions = () => {
    const val = parseInt(questionInput, 10);
    if (!isNaN(val) && val >= 0 && onUpdateDailyGoal) {
      onUpdateDailyGoal(dateStr, val);
    }
    setIsEditingQuestions(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-6">
        
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-slate-100 dark:border-slate-700/60 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-[#e8f7ff] dark:bg-[#1cb0f6]/20 border-2 border-b-4 border-[#1cb0f6] flex items-center justify-center shrink-0 shadow-xs">
              <AppleEmoji emoji="📅" size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-white capitalize">{formattedTitle}</h3>
                {isToday && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#1cb0f6] text-white font-black text-[10px] uppercase">
                    Bugün
                  </span>
                )}
              </div>
              <p className="text-xs font-extrabold text-slate-400 mt-0.5">Günün tüm çalışma, sınav ve görev detayları</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all border-2 border-slate-200 dark:border-slate-600 shadow-2xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>



        {/* 🎯 DENEME SINAVLARI DETAY BÖLÜMÜ */}
        {denemelerForDay.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <AppleEmoji emoji="🎯" size={16} />
              <span>GİRİLEN DENEME SINAVLARI ({denemelerForDay.length})</span>
            </h4>
            <div className="space-y-2.5">
              {denemelerForDay.map(d => {
                const evalRes = evaluateDeneme(d.scores, d.examType, d.bransSubjectId);
                const isBrans = d.examType === "brans";
                const subId = d.bransSubjectId || inferBransSubjectId(d);
                const subConfig = isBrans ? DENEME_SUBJECTS.find(s => s.id === subId) : null;
                const subRes = isBrans ? evalRes.subjects.find(s => s.subjectId === subId) || evalRes.subjects[0] : null;

                const correct = subRes ? subRes.correct : evalRes.totalCorrect;
                const wrong = subRes ? subRes.wrong : evalRes.totalWrong;
                const empty = subRes ? subRes.empty : evalRes.totalEmpty;
                const net = subRes ? subRes.net : evalRes.totalNet;
                const totalQ = subRes ? subRes.questionCount : 120;
                const accuracy = totalQ > 0 ? Math.max(0, Math.round((net / totalQ) * 100)) : 0;

                const cardColor = subConfig?.color || (isBrans ? "#58cc02" : "#1cb0f6");

                return (
                  <div 
                    key={d.id} 
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-b-4 border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden transition-all shadow-2xs"
                  >
                    {/* Top Accent Strip */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1" 
                      style={{ backgroundColor: cardColor }} 
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-sm text-slate-800 dark:text-white truncate">
                          {d.name}
                        </span>

                        {d.publisher && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {d.publisher}
                          </span>
                        )}

                        {/* Branş veya Genel Deneme Rozeti */}
                        {isBrans && subConfig ? (
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black border-2 border-b-2 shadow-2xs shrink-0"
                            style={{ 
                              backgroundColor: `${subConfig.color}15`, 
                              borderColor: subConfig.color, 
                              color: subConfig.color 
                            }}
                          >
                            <AppleEmoji emoji={subConfig.icon} size={13} />
                            <span>{subConfig.title}</span>
                          </span>
                        ) : isBrans ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-100 dark:bg-emerald-950/40 text-[#58cc02] border-2 border-b-2 border-[#58cc02] shadow-2xs shrink-0">
                            <AppleEmoji emoji="🎯" size={13} color="#58cc02" />
                            <span>Branş Denemesi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#1cb0f6]/10 text-[#1cb0f6] border-2 border-b-2 border-[#1cb0f6] shadow-2xs shrink-0">
                            <AppleEmoji emoji="🎯" size={13} />
                            <span>Genel Deneme</span>
                          </span>
                        )}
                      </div>

                      {/* İstatistikler */}
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1 flex-wrap">
                        <span className="text-[#58cc02] font-black">{correct} D</span>
                        <span>·</span>
                        <span className="text-[#ff4b4b] font-black">{wrong} Y</span>
                        <span>·</span>
                        <span className="text-slate-400 font-extrabold">{empty} B</span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span className="font-extrabold font-mono text-slate-500 dark:text-slate-400">%{accuracy} İsabet</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      <div 
                        className="px-3.5 py-1.5 rounded-xl text-white font-mono font-black text-sm shadow-2xs border-2 border-b-4"
                        style={{ 
                          backgroundColor: "#58cc02", 
                          borderColor: "#46a302" 
                        }}
                      >
                        {formatNet(net)} Net
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 📚 DERS KONULARI BÖLÜMÜ */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <AppleEmoji emoji="📚" size={16} />
            <span>PLANLANAN DERS KONULARI ({topicsForDay.length})</span>
          </h4>

          {topicsForDay.length > 0 ? (
            <div className="space-y-2">
              {topicsForDay.map(topic => {
                const subject = subjects.find(s => s.topics.some(t => t.id === topic.id));
                const subjectColor = subject?.color || "#1cb0f6";
                return (
                  <div key={topic.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-b-4 border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 border-b-2 shadow-2xs" style={{ backgroundColor: `${subjectColor}20`, borderColor: subjectColor }}>
                        <AppleEmoji emoji={subject?.icon || "📘"} size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest block truncate" style={{ color: subjectColor }}>
                          {subject?.title || "Ders"}
                        </span>
                        <span className={`text-xs font-black truncate block ${topic.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                          {topic.title}
                        </span>
                      </div>
                    </div>

                    {onToggleTopic && (
                      <button
                        type="button"
                        onClick={() => onToggleTopic(topic.id, subject?.id)}
                        className={`px-3 py-1.5 rounded-xl border-2 border-b-4 font-black text-xs transition-all flex items-center gap-1.5 shrink-0 active:translate-y-0.5 cursor-pointer ${
                          topic.done 
                            ? 'bg-[#58cc02] text-white border-green-700' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-[#58cc02]'
                        }`}
                      >
                        <Check className="w-4 h-4" strokeWidth={3} />
                        <span>{topic.done ? "Tamamlandı" : "Tamamla"}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-400 italic">Bu güne henüz planlanmış bir ders konusu bulunmuyor.</p>
          )}
        </div>

        {/* 📝 SAATLİK NOTLAR VE GÖREVLER BÖLÜMÜ */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <AppleEmoji emoji="📝" size={16} />
            <span>SAATLİK ÇALIŞMA NOTLARI VE GÖREVLER ({notesForDay.length})</span>
          </h4>

          {notesForDay.length > 0 ? (
            <div className="space-y-2">
              {notesForDay.map(n => (
                <div key={n.key} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-b-4 border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono text-xs font-black shrink-0">
                      {n.time}
                    </span>
                    <span className={`text-xs font-bold truncate ${n.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                      {n.text}
                    </span>
                  </div>

                  {onToggleNote && (
                    <button
                      type="button"
                      onClick={() => onToggleNote(n.key)}
                      className={`px-3 py-1.5 rounded-xl border-2 border-b-4 font-black text-xs transition-all flex items-center gap-1.5 shrink-0 active:translate-y-0.5 cursor-pointer ${
                        n.isCompleted 
                          ? 'bg-[#58cc02] text-white border-green-700' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-[#58cc02]'
                      }`}
                    >
                      <Check className="w-4 h-4" strokeWidth={3} />
                      <span>{n.isCompleted ? "Yapıldı" : "Tamamla"}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-400 italic">Bu gün için kaydedilmiş bir not veya görev bulunmuyor.</p>
          )}
        </div>


        {/* FOOTER ACTIONS */}
        <div className="pt-4 border-t-2 border-slate-100 dark:border-slate-700/60 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onDayClick(date);
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#1cb0f6] text-white border-2 border-b-4 border-[#1899d6] font-black text-xs flex items-center justify-center gap-2 shadow-xs active:translate-y-0.5 cursor-pointer"
          >
            <span>Günlük Takvime Git</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   3. ANA AYLIK TAKVİM BÖLÜMÜ (MONTHLY CALENDAR MAIN)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function MonthlyCalendar({ 
  topics, 
  subjects, 
  slotNotes, 
  completedNotes, 
  dailyGoals = {},
  dailyGoalTarget = 100,
  isDragging, 
  onDayClick,
  onToggleTopic,
  onToggleNote,
  onUpdateDailyGoal,
}: MonthlyCalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayModal, setSelectedDayModal] = useState<Date | null>(null);
  const [denemeler, setDenemeler] = useState<DenemeRecord[]>([]);

  // 🔍 TEK BAKIŞTA FİLTRELEME & ARAMA STATE'LERİ
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Load denemeler from user/Firebase or localStorage
  useEffect(() => {
    const fetchDenemeler = async () => {
      if (user?.uid) {
        try {
          const res = await loadDenemeYeniden(user.uid);
          if (res?.denemeler && Array.isArray(res.denemeler)) {
            setDenemeler(res.denemeler as DenemeRecord[]);
            return;
          }
        } catch (e) {}
      }
      if (typeof window !== "undefined") {
        try {
          const local = localStorage.getItem("kpss_2026_denemeler");
          if (local) setDenemeler(JSON.parse(local));
        } catch (e) {}
      }
    };
    fetchDenemeler();
  }, [user?.uid]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const hasActiveSearchFilter = activeFilter !== "all" || searchQuery.trim() !== "";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-4 sm:p-5 border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-md space-y-4">
      
      {/* ━━━ TEK BAKIŞTA ARAMA VE HIZLI FİLTRELEME ÇUBUĞU ━━━ */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-b-4 border-slate-200 dark:border-slate-700/80 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Arama Kutusu */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tek Bakışta Ara (Konu, Ders, Deneme veya Not yazın...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#1cb0f6] transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Hızlı Filtre Butonları */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all active:translate-y-0.5 cursor-pointer border-2 border-b-4 select-none ${
                activeFilter === "all"
                  ? "bg-[#1cb0f6] text-white border-[#1cb0f6] border-b-[#1899d6] shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#1cb0f6] dark:hover:border-[#1cb0f6] hover:text-[#1cb0f6] dark:hover:text-[#38bdf8] hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs"
              }`}
            >
              Tümü
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("deneme")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all active:translate-y-0.5 cursor-pointer flex items-center gap-1.5 border-2 border-b-4 select-none ${
                activeFilter === "deneme"
                  ? "bg-[#af52de] text-white border-[#af52de] border-b-[#9a38ca] shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#af52de] dark:hover:border-[#af52de] hover:text-[#af52de] dark:hover:text-[#c477ee] hover:bg-purple-50 dark:hover:bg-[#af52de]/10 shadow-2xs"
              }`}
            >
              <AppleEmoji emoji="📊" size={14} color={activeFilter === "deneme" ? "#ffffff" : "#af52de"} />
              <span>Denemeler</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("completed")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all active:translate-y-0.5 cursor-pointer flex items-center gap-1.5 border-2 border-b-4 select-none ${
                activeFilter === "completed"
                  ? "bg-[#58cc02] text-white border-[#58cc02] border-b-[#46a302] shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#58cc02] dark:hover:border-[#58cc02] hover:text-[#58cc02] dark:hover:text-[#70df1c] hover:bg-emerald-50 dark:hover:bg-[#58cc02]/10 shadow-2xs"
              }`}
            >
              <AppleEmoji emoji="✅" size={14} color={activeFilter === "completed" ? "#ffffff" : "#58cc02"} />
              <span>Tamamlananlar</span>
            </button>
          </div>

        </div>
      </div>

      {/* 3D Month Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-black capitalize text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <AppleEmoji emoji="📅" size={32} />
          <span>{format(currentDate, "MMMM yyyy", { locale: tr })}</span>
        </h2>
        
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border-2 border-b-4 border-slate-200 dark:border-slate-700 shadow-2xs w-fit">
          <button 
            type="button"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))} 
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 font-black text-slate-600 dark:text-slate-300 hover:text-[#1cb0f6] dark:hover:text-[#38bdf8] hover:border-[#1cb0f6] dark:hover:border-[#1cb0f6] hover:bg-slate-50 dark:hover:bg-slate-700/60 active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
            title="Önceki Ay"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          
          <button 
            type="button"
            onClick={() => setCurrentDate(new Date())} 
            disabled={isSameMonth(currentDate, new Date())}
            className={`px-3.5 sm:px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 select-none ${
              isSameMonth(currentDate, new Date())
                ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-2 border-b-2 border-slate-200 dark:border-slate-700 cursor-default opacity-80'
                : 'bg-[#1cb0f6] text-white border-2 border-b-4 border-[#1cb0f6] border-b-[#1899d6] hover:bg-[#159ee0] active:translate-y-0.5 cursor-pointer shadow-xs animate-in fade-in duration-200'
            }`}
            title={isSameMonth(currentDate, new Date()) ? "Şu anki aydasınız" : "Mevcut aya geri dön"}
          >
            {isSameMonth(currentDate, new Date()) ? (
              <span>Bu Ay</span>
            ) : (
              <span>Bu Aya Dön</span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))} 
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 font-black text-slate-600 dark:text-slate-300 hover:text-[#1cb0f6] dark:hover:text-[#38bdf8] hover:border-[#1cb0f6] dark:hover:border-[#1cb0f6] hover:bg-slate-50 dark:hover:bg-slate-700/60 active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
            title="Sonraki Ay"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
          <div key={day} className="text-center text-xs font-black text-slate-400 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {days.map(day => {
          const dayStr = format(day, "yyyy-MM-dd");
          const topicsForDay = topics.filter(t => t.scheduledDate === dayStr);
          const denemelerForDay = denemeler.filter(d => d.date === dayStr);
          const solvedQuestions = dailyGoals[dayStr] || 0;

          const notesForDay = Object.entries(slotNotes)
            .filter(([key, val]) => key.startsWith(dayStr) && val.trim() !== "");

          // 🔍 FİLTRE VE ARAMA UYUMU HESABI
          let isFilteredMatch = true;
          if (activeFilter === "deneme") isFilteredMatch = denemelerForDay.length > 0;
          else if (activeFilter === "questions") isFilteredMatch = solvedQuestions > 0;
          else if (activeFilter === "completed") isFilteredMatch = topicsForDay.some(t => t.done) || notesForDay.some(([k]) => completedNotes[k]);
          else if (activeFilter === "notes") isFilteredMatch = notesForDay.length > 0;

          if (isFilteredMatch && searchQuery.trim() !== "") {
            const q = searchQuery.toLowerCase();
            const matchesTopic = topicsForDay.some(t => t.title.toLowerCase().includes(q));
            const matchesDeneme = denemelerForDay.some(d => d.name.toLowerCase().includes(q) || (d.publisher && d.publisher.toLowerCase().includes(q)));
            const matchesNote = notesForDay.some(([, val]) => val.toLowerCase().includes(q));
            isFilteredMatch = matchesTopic || matchesDeneme || matchesNote;
          }

          return (
            <DroppableDayCell 
              key={day.toString()}
              date={day}
              isCurrentMonth={isSameMonth(day, monthStart)}
              topicsForDay={topicsForDay}
              allTopics={topics}
              subjects={subjects}
              slotNotes={slotNotes}
              completedNotes={completedNotes}
              dailyGoals={dailyGoals}
              denemelerForDay={denemelerForDay}
              isDragging={isDragging}
              onSelectDay={() => setSelectedDayModal(day)}
              isFilteredMatch={isFilteredMatch}
              hasActiveSearchFilter={hasActiveSearchFilter}
            />
          );
        })}
      </div>
      
      {/* 3D Lejant Bilgilendirme */}
      <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-5 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-1.5 rounded-2xl border-2 border-b-2 border-slate-200 dark:border-slate-700 shadow-2xs">
          <AppleEmoji emoji="🎯" size={15} />
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Deneme Sınavları</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-1.5 rounded-2xl border-2 border-b-2 border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="w-3.5 h-3.5 rounded-full bg-[#58cc02] border-2 border-green-700 shadow-2xs" />
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tamamlanan Konular</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-1.5 rounded-2xl border-2 border-b-2 border-slate-200 dark:border-slate-700 shadow-2xs">
          <AppleEmoji emoji="📝" size={15} />
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Görev & Notlar</span>
        </div>
      </div>

      {/* 4. DETAYLI AKTİVİTE MODALI */}
      {selectedDayModal && (
        <DayActivityModal
          date={selectedDayModal}
          topicsForDay={topics.filter(t => t.scheduledDate === format(selectedDayModal, "yyyy-MM-dd"))}
          subjects={subjects}
          slotNotes={slotNotes}
          completedNotes={completedNotes}
          dailyGoals={dailyGoals}
          denemelerForDay={denemeler.filter(d => d.date === format(selectedDayModal, "yyyy-MM-dd"))}
          onClose={() => setSelectedDayModal(null)}
          onDayClick={onDayClick}
          onToggleTopic={onToggleTopic}
          onToggleNote={onToggleNote}
          onUpdateDailyGoal={onUpdateDailyGoal}
        />
      )}
    </div>
  );
}
