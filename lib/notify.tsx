"use client";

import React from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import AppleEmoji from "@/components/AppleEmoji";
import { X } from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "error" | "purple";

export interface NotifyOptions {
  title?: string;
  description?: string;
  badge?: string;
  emoji?: string;
  duration?: number;
  position?: "top-center" | "top-right" | "top-left" | "bottom-center" | "bottom-right" | "bottom-left";
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastCardProps {
  id: string | number;
  type: ToastType;
  title: string;
  description?: string;
  badge?: string;
  emoji?: string;
  duration: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const TYPE_CONFIG: Record<
  ToastType,
  {
    badgeText: string;
    badgeColor: string;
    accentColor: string;
    defaultEmoji: string;
    iconBg: string;
    iconBorder: string;
    glowColor: string;
  }
> = {
  success: {
    badgeText: "BAŞARIYLA KAYDEDİLDİ",
    badgeColor: "text-[#58cc02]",
    accentColor: "#58cc02",
    defaultEmoji: "🎯",
    iconBg: "bg-[#58cc02]/10 dark:bg-[#58cc02]/15",
    iconBorder: "border-[#58cc02]/40 dark:border-[#58cc02]/50",
    glowColor: "rgba(88, 204, 2, 0.2)",
  },
  info: {
    badgeText: "BİLGİ",
    badgeColor: "text-[#1cb0f6]",
    accentColor: "#1cb0f6",
    defaultEmoji: "💡",
    iconBg: "bg-[#1cb0f6]/10 dark:bg-[#1cb0f6]/15",
    iconBorder: "border-[#1cb0f6]/40 dark:border-[#1cb0f6]/50",
    glowColor: "rgba(28, 176, 246, 0.2)",
  },
  purple: {
    badgeText: "HEDEF GÜNCELLENDİ",
    badgeColor: "text-[#af52de]",
    accentColor: "#af52de",
    defaultEmoji: "🎯",
    iconBg: "bg-[#af52de]/10 dark:bg-[#af52de]/15",
    iconBorder: "border-[#af52de]/40 dark:border-[#af52de]/50",
    glowColor: "rgba(175, 82, 222, 0.2)",
  },
  warning: {
    badgeText: "DİKKAT",
    badgeColor: "text-[#ff9500]",
    accentColor: "#ff9500",
    defaultEmoji: "⚡",
    iconBg: "bg-[#ff9500]/10 dark:bg-[#ff9500]/15",
    iconBorder: "border-[#ff9500]/40 dark:border-[#ff9500]/50",
    glowColor: "rgba(255, 149, 0, 0.2)",
  },
  error: {
    badgeText: "HATA",
    badgeColor: "text-[#ff4b4b]",
    accentColor: "#ff4b4b",
    defaultEmoji: "❌",
    iconBg: "bg-[#ff4b4b]/10 dark:bg-[#ff4b4b]/15",
    iconBorder: "border-[#ff4b4b]/40 dark:border-[#ff4b4b]/50",
    glowColor: "rgba(255, 75, 75, 0.2)",
  },
};

export const NotificationCard: React.FC<ToastCardProps> = ({
  id,
  type,
  title,
  description,
  badge,
  emoji,
  duration,
  action,
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const activeEmoji = emoji || config.defaultEmoji;
  const activeBadge = badge || config.badgeText;

  return (
    <motion.div
      initial={{ opacity: 0, y: -22, scale: 0.92, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -16, scale: 0.94, filter: "blur(6px)" }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 26,
        mass: 0.7,
      }}
      className="w-full pointer-events-auto flex items-center justify-center p-1 app-toast-custom font-sans antialiased"
    >
      <div
        className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-b-4 border-slate-200 border-b-slate-300 dark:border-slate-700/90 dark:border-b-slate-950 rounded-2xl p-3.5 pr-4 flex items-center gap-3.5 min-w-[320px] max-w-md transition-all group select-none shadow-xl font-sans"
        style={{
          boxShadow: `0 16px 36px -4px ${config.glowColor}, 0 4px 12px rgba(0, 0, 0, 0.08)`,
        }}
      >
        {/* Left vertical accent indicator */}
        <div
          className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full"
          style={{ backgroundColor: config.accentColor }}
        />

        {/* 3D Icon Container */}
        <div
          className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center border-2 border-b-[3px] ml-1 shadow-2xs transition-transform duration-200 group-hover:scale-105 ${config.iconBg} ${config.iconBorder}`}
        >
          <AppleEmoji emoji={activeEmoji} size={24} />
        </div>

        {/* Content Section */}
        <div className="flex flex-col min-w-0 flex-1 py-0.5 font-sans">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`text-[10.5px] font-black uppercase tracking-wider font-sans ${config.badgeColor}`}
            >
              {activeBadge}
            </span>
          </div>

          <span className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight leading-snug truncate font-sans">
            {title}
          </span>

          {description && (
            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-normal line-clamp-2 font-sans">
              {description}
            </span>
          )}

          {action && (
            <button
              onClick={() => {
                action.onClick();
                toast.dismiss(id);
              }}
              className="mt-2 text-xs font-black uppercase tracking-wider text-white px-3.5 py-1.5 rounded-xl border border-b-2 active:translate-y-0.5 transition-all self-start shadow-xs font-sans"
              style={{
                backgroundColor: config.accentColor,
                borderColor: "rgba(0,0,0,0.2)",
              }}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => toast.dismiss(id)}
          aria-label="Kapat"
          className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 -mr-1"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Dynamic auto-dismiss progress bar */}
        {duration > 0 && (
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{
              duration: duration / 1000,
              ease: "linear",
            }}
            style={{
              originX: 0,
              backgroundColor: config.accentColor,
            }}
            className="absolute bottom-0 left-0 right-0 h-[2.5px] opacity-60 rounded-b-full"
          />
        )}
      </div>
    </motion.div>
  );
};

export const notify = {
  success: (title: string, options?: NotifyOptions) => {
    const duration = options?.duration || 3500;
    return toast.custom(
      (id) => (
        <NotificationCard
          id={id}
          type="success"
          title={title}
          description={options?.description}
          badge={options?.badge || "BAŞARIYLA KAYDEDİLDİ"}
          emoji={options?.emoji || "🎯"}
          duration={duration}
          action={options?.action}
        />
      ),
      {
        duration,
        position: options?.position || "top-center",
      }
    );
  },

  info: (title: string, options?: NotifyOptions) => {
    const duration = options?.duration || 3500;
    return toast.custom(
      (id) => (
        <NotificationCard
          id={id}
          type="info"
          title={title}
          description={options?.description}
          badge={options?.badge || "BİLGİ"}
          emoji={options?.emoji || "💡"}
          duration={duration}
          action={options?.action}
        />
      ),
      {
        duration,
        position: options?.position || "top-center",
      }
    );
  },

  purple: (title: string, options?: NotifyOptions) => {
    const duration = options?.duration || 3500;
    return toast.custom(
      (id) => (
        <NotificationCard
          id={id}
          type="purple"
          title={title}
          description={options?.description}
          badge={options?.badge || "HEDEF GÜNCELLENDİ"}
          emoji={options?.emoji || "🎯"}
          duration={duration}
          action={options?.action}
        />
      ),
      {
        duration,
        position: options?.position || "top-center",
      }
    );
  },

  warning: (title: string, options?: NotifyOptions) => {
    const duration = options?.duration || 4000;
    return toast.custom(
      (id) => (
        <NotificationCard
          id={id}
          type="warning"
          title={title}
          description={options?.description}
          badge={options?.badge || "DİKKAT"}
          emoji={options?.emoji || "⚡"}
          duration={duration}
          action={options?.action}
        />
      ),
      {
        duration,
        position: options?.position || "top-center",
      }
    );
  },

  error: (title: string, options?: NotifyOptions) => {
    const duration = options?.duration || 4500;
    return toast.custom(
      (id) => (
        <NotificationCard
          id={id}
          type="error"
          title={title}
          description={options?.description}
          badge={options?.badge || "HATA"}
          emoji={options?.emoji || "❌"}
          duration={duration}
          action={options?.action}
        />
      ),
      {
        duration,
        position: options?.position || "top-center",
      }
    );
  },

  dismiss: (id?: string | number) => {
    toast.dismiss(id);
  },
};

export default notify;
