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
    <div className="h-full flex flex-col p-4 bg-surface md:bg-transparent overflow-y-auto w-64 md:w-full border-r border-border-custom md:border-r-0">
      <div className="flex items-center justify-between mb-8 mt-4 md:mt-0 px-2">
        <h2 className="font-heading text-xl font-bold text-text-main tracking-tight flex items-center gap-2">
          <span>🎯</span> KOMUTA
        </h2>
        {isMobile && (
          <button onClick={() => setIsOpen(false)} className="text-muted hover:text-text-main">
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-xs uppercase text-muted tracking-widest mb-3 px-2">{category}</h3>
            <ul className="space-y-1">
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
                        if (isMobile) setIsOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-1 transition-all group ${
                        isActive 
                          ? "bg-card border border-accent/20" 
                          : "hover:bg-card/50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <span>{subject.icon}</span>
                          <span className={isActive ? "text-text-main" : "text-muted group-hover:text-text-main transition-colors"}>
                            {subject.title}
                          </span>
                        </span>
                        <span className="text-xs font-mono text-muted">{percent}%</span>
                      </div>
                      <div className="h-1 w-full bg-surface rounded-full overflow-hidden mt-1">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full ${isActive ? "bg-accent" : "bg-muted"}`}
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
    </div>
  )

  if (!isMobile) {
    return (
      <div className="w-72 flex-shrink-0 sticky top-0 h-screen py-6 pl-6 pr-2 border-r border-border-custom hidden md:block">
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
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 left-0 z-50 shadow-2xl md:hidden"
          >
            <SidebarContent />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
