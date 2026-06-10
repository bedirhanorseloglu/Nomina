"use client"

import { motion, AnimatePresence } from "framer-motion"

interface ResetModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ResetModal({ isOpen, onClose, onConfirm }: ResetModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border-4 border-white/50 dark:border-white/10"
            >
              <div className="w-20 h-20 bg-[#ff2d55]/10 text-[#ff2d55] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 rotate-12 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Emin misin?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                Tüm ilerlemen, planların ve kazandığın günlük serin <strong>kalıcı olarak</strong> silinecek. Bu işlem geri alınamaz.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onConfirm()
                    onClose()
                  }}
                  className="w-full bg-[#ff2d55] border-b-4 border-[#d0193e] hover:bg-[#d0193e] text-white font-black py-4 rounded-2xl transition-all active:translate-y-1 active:border-b-0 active:mb-1"
                >
                  Evet, Her Şeyi Sıfırla
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  Vazgeç
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
