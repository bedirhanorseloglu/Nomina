"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface ProgressRingProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
}

export default function ProgressRing({ percentage, size = 120, strokeWidth = 8, color = "var(--accent)" }: ProgressRingProps) {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = isMounted ? circumference - (percentage / 100) * circumference : circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          className="text-surface stroke-current"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress track */}
        <motion.circle
          style={{ stroke: color }}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="font-mono text-2xl font-bold text-text-main"
        >
          {percentage.toFixed(0)}%
        </motion.span>
        <span className="text-[10px] text-muted uppercase tracking-widest mt-1">Tamamlandı</span>
      </div>
    </div>
  )
}
