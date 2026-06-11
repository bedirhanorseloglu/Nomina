"use client";

type Props = {
  label: string;
  value: number;
  max?: number;
  onChange: (value: number) => void;
  variant: "correct" | "wrong" | "empty";
};

const variants = {
  correct: {
    label: "text-emerald-600",
    text: "text-emerald-600",
    activeBtn: "hover:bg-slate-200/50 active:bg-slate-300/40",
  },
  wrong: {
    label: "text-red-500",
    text: "text-red-500",
    activeBtn: "hover:bg-slate-200/50 active:bg-slate-300/40",
  },
  empty: {
    label: "text-slate-500 dark:text-slate-400",
    text: "text-slate-500 dark:text-slate-400",
    activeBtn: "hover:bg-slate-200/50 active:bg-slate-300/40 dark:hover:bg-slate-700 dark:active:bg-slate-600",
  },
};

export default function ScoreStepper({
  label,
  value,
  max = 999,
  onChange,
  variant,
}: Props) {
  const v = variants[variant];
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="flex flex-col gap-1 rounded-xl">
      <span className={`text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1.5`}>
        {label}
      </span>
      <div
        className="flex items-center justify-between rounded-full bg-[#f2f2f7] dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-700/40 p-0.5 h-8.5 w-full transition-all duration-200"
      >
        <button
          type="button"
          onClick={dec}
          className={`w-8 h-7.5 rounded-full flex items-center justify-center font-bold transition-all duration-150 cursor-pointer select-none ${v.text} ${v.activeBtn}`}
          aria-label={`${label} azalt`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
          </svg>
        </button>
        
        <div className="w-px h-4 bg-slate-300/60 dark:bg-slate-700 self-center" />
        
        <input
          type="number"
          min={0}
          max={max}
          inputMode="numeric"
          value={value === 0 ? "" : value}
          placeholder="0"
          onChange={(e) => {
            const raw = e.target.value;
            const n = raw === "" ? 0 : parseInt(raw, 10) || 0;
            onChange(Math.min(max, Math.max(0, n)));
          }}
          className={`w-10 h-7.5 text-center font-sans text-base font-black bg-transparent border-0 focus:outline-none placeholder-slate-400 ${v.text}`}
        />
        
        <div className="w-px h-4 bg-slate-300/60 dark:bg-slate-700 self-center" />
        
        <button
          type="button"
          onClick={inc}
          className={`w-8 h-7.5 rounded-full flex items-center justify-center font-bold transition-all duration-150 cursor-pointer select-none ${v.text} ${v.activeBtn}`}
          aria-label={`${label} artır`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>
  );
}


