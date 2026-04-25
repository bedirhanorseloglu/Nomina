"use client"

import { useState, useRef, useEffect } from "react"
import { Subject } from "@/types"
import { motion, AnimatePresence } from "framer-motion"

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
    <div ref={wrapperRef} className="relative w-full max-w-md z-30">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Konu veya ders ara..."
          className="w-full bg-surface border border-border-custom rounded-lg py-2 pl-10 pr-4 text-sm text-text-main placeholder-muted focus:outline-none focus:border-accent/50 transition-colors"
        />
      </div>

      <AnimatePresence>
        {isOpen && query && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border-custom rounded-lg shadow-2xl overflow-hidden max-h-96 overflow-y-auto"
          >
            {results.map((result) => (
              <div key={result.subject.id} className="p-2 border-b border-border-custom last:border-0">
                <button
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-surface transition-colors flex items-center gap-2"
                  onClick={() => {
                    onSelectSubject(result.subject.id)
                    setIsOpen(false)
                    setQuery("")
                  }}
                >
                  <span>{result.subject.icon}</span>
                  <span className="font-bold text-sm text-text-main">{result.subject.title}</span>
                </button>
                {result.topics.map(topic => (
                  <button
                    key={topic.id}
                    className="w-full text-left pl-9 pr-3 py-1.5 rounded-md hover:bg-surface text-sm text-muted hover:text-text-main transition-colors truncate"
                    onClick={() => {
                      onSelectSubject(result.subject.id)
                      setIsOpen(false)
                      setQuery("")
                    }}
                  >
                    {topic.title}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
