"use client"

import { Subject } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface SidebarProps {
  subjects: Subject[]
  activeSubjectId: string
  onSelect: (id: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function Sidebar({ subjects, activeSubjectId, onSelect, isOpen, setIsOpen }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const categories = Array.from(new Set(subjects.map(s => s.category)))

  const SidebarContent = () => (
    <div className="h-full flex flex-col p-4 bg-white overflow-y-auto w-72 md:w-full border-r border-slate-100 md:border-r-0">
      <div className="flex items-center justify-between mb-10 mt-4 md:mt-0 px-2">
        <h2 className="font-heading text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
          <span className="bg-accent/10 p-2 rounded-xl text-accent shadow-sm shadow-accent/5">KPSS</span>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">2026</span>
        </h2>
        {isMobile && (
          <button onClick={() => setIsOpen(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 space-y-8">
        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-3 opacity-80">{category}</h3>
            <ul className="space-y-1.5">
              {subjects.filter(s => s.category === category).map(subject => {
                const total = subject.topics.length
                const completed = subject.topics.filter(t => t.done).length
                const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
                const isActive = activeSubjectId === subject.id

                return (
                  <li key={subject.id}>
                    <button
                      onClick={() => {
                        onSelect(subject.id)
                        const element = document.getElementById(`subject-section-${subject.id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        if (isMobile) setIsOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl flex flex-col gap-2 transition-all relative overflow-hidden group ${
                        isActive 
                          ? "bg-accent/5 ring-1 ring-accent/10" 
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="active-pill"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full"
                        />
                      )}
                      
                      <div className="flex items-center justify-between relative z-10">
                        <span className="flex items-center gap-3 text-sm font-semibold">
                          <span className={`text-lg transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {subject.icon}
                          </span>
                          <span className={isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-900 transition-colors"}>
                            {subject.title}
                          </span>
                        </span>
                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-accent/10 text-accent' : 'bg-slate-50 text-slate-400'}`}>
                          {percent}%
                        </span>
                      </div>

                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-1 relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1, ease: "circOut" }}
                          style={{ 
                            backgroundColor: subject.color,
                            boxShadow: isActive ? `0 0 10px ${subject.color}44` : 'none'
                          }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100 px-2">
        <div className="bg-slate-50/50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
           <div className="bg-accent text-white p-2 rounded-lg font-black text-xs shadow-sm">AI</div>
           <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plan Durumu</span>
              <span className="text-xs text-slate-900 font-semibold">Strateji Aktif</span>
           </div>
        </div>
      </div>
    </div>
  )

  if (!isMobile) {
    return (
      <div className="w-80 flex-shrink-0 sticky top-0 h-screen py-6 pl-6 pr-4 border-r border-slate-100 hidden md:block bg-white">
        <SidebarContent />
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/5 backdrop-blur-sm z-40 md:hidden"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 shadow-2xl md:hidden bg-white"
          >
            <SidebarContent />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
