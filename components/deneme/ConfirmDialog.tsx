"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, Trash2 } from "lucide-react";

type Variant = "danger" | "warning" | "info";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onClose: () => void;
  onConfirm: () => void;
};

const variantConfig: Record<
  Variant,
  { icon: typeof AlertTriangle; iconClass: string; confirmClass: string }
> = {
  danger: {
    icon: Trash2,
    iconClass: "text-red-600 bg-red-50",
    confirmClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-700 bg-amber-50",
    confirmClass: "bg-slate-900 hover:bg-slate-800 text-white",
  },
  info: {
    icon: Info,
    iconClass: "text-slate-600 bg-slate-100",
    confirmClass: "bg-slate-900 hover:bg-slate-800 text-white",
  },
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  variant = "warning",
  onClose,
  onConfirm,
}: Props) {
  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="absolute inset-0 bg-black/30 cursor-default"
          />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-200/80 shadow-xl p-6"
          >
            <div className="flex gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconClass}`}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 pt-0.5">
                <h3
                  id="confirm-dialog-title"
                  className="text-base font-bold text-slate-900 leading-snug"
                >
                  {title}
                </h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{message}</p>
              </div>
            </div>

            <div className="flex gap-2.5 mt-6 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${cfg.confirmClass}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
