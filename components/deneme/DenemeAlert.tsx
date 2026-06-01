"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";

type Variant = "error" | "warning" | "info" | "success";

type Props = {
  variant: Variant;
  title?: string;
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
};

const config: Record<
  Variant,
  { Icon: LucideIcon; box: string; iconColor: string; title: string; text: string }
> = {
  error: {
    Icon: XCircle,
    box: "bg-red-50 border-red-100",
    iconColor: "text-red-600",
    title: "text-red-900",
    text: "text-red-800",
  },
  warning: {
    Icon: AlertTriangle,
    box: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-700",
    title: "text-amber-900",
    text: "text-amber-800",
  },
  info: {
    Icon: Info,
    box: "bg-slate-50 border-slate-200",
    iconColor: "text-slate-600",
    title: "text-slate-900",
    text: "text-slate-600",
  },
  success: {
    Icon: CheckCircle2,
    box: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-600",
    title: "text-emerald-900",
    text: "text-emerald-800",
  },
};

export default function DenemeAlert({
  variant,
  title,
  children,
  compact = false,
  className = "",
}: Props) {
  const { Icon, box, iconColor, title: titleClass, text } = config[variant];

  return (
    <div
      role="alert"
      className={`flex gap-3 border rounded-xl ${box} ${
        compact ? "p-3" : "p-4"
      } ${className}`}
    >
      <Icon
        className={`shrink-0 ${iconColor} ${compact ? "w-4 h-4 mt-0.5" : "w-5 h-5"}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {title && (
          <p
            className={`font-bold ${titleClass} ${compact ? "text-xs mb-0.5" : "text-sm mb-1"}`}
          >
            {title}
          </p>
        )}
        <div
          className={`leading-relaxed ${text} ${
            compact ? "text-[11px] font-medium" : "text-sm font-medium"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
