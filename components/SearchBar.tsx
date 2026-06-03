"use client"

import { useState, useRef, useEffect } from "react"
import { Subject } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ChevronRight } from "lucide-react"

interface SearchBarProps {
  subjects: Subject[]
  onSelectSubject: (id: string) => void
}

export default function SearchBar({ subjects, onSelectSubject }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const results = query.trim() === "" ? [] : subjects.flatMap(subject => {
    const matchedTopics = subject.topics.filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
    const matchSubject = subject.title.toLowerCase().includes(query.toLowerCase())
    
    if (matchSubject || matchedTopics.length > 0) {
      return [{
        subject,
        topics: matchedTopics
      }]
    }
    return []
  })

  return (
    <div ref={wrapperRef} className="relative w-full z-50">
      <div className="relative group">
        <div className="absolute inset-0 bg-accent/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors flex items-center justify-center">
            <Search className="w-4 h-4" strokeWidth={2.5} />
         </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Komuta: Araştır..."
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-6 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-accent/30 transition-all backdrop-blur-md shadow-inner shadow-black/[0.02] dark:shadow-none"
        />
      </div>

      <AnimatePresence>
        {isOpen && query && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-3 glass rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto z-50 border border-slate-100 dark:border-slate-700"
          >
            <div className="p-2 space-y-1">
              {results.map((result) => (
                <div key={result.subject.id} className="rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/50 p-1">
                  <button
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent/5 transition-colors flex items-center justify-between group"
                    onClick={() => {
                      onSelectSubject(result.subject.id)
                      setIsOpen(false)
                      setQuery("")
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{result.subject.icon}</span>
                      <span className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-slate-100">{result.subject.title}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-accent transition-colors" strokeWidth={2.5} />
                  </button>
                  <div className="space-y-1 mt-1 pl-4 pb-2">
                    {result.topics.map(topic => (
                      <button
                        key={topic.id}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors truncate flex items-center gap-2"
                        onClick={() => {
                          onSelectSubject(result.subject.id)
                          setIsOpen(false)
                          setQuery("")
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        {topic.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
