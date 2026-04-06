"use client"

import React, { useRef, useEffect, useState } from "react"
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion"

interface RollerPickerProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  unit?: string
  label?: string
}

export function RollerPicker({ min, max, value, onChange, unit, label }: RollerPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<number[]>([])

  useEffect(() => {
    const newItems = []
    for (let i = min; i <= max; i++) {
        newItems.push(i)
    }
    setItems(newItems)
  }, [min, max])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const itemHeight = 40 // Matches h-10 (40px)
    const scrollTop = container.scrollTop
    const index = Math.round(scrollTop / itemHeight)
    const newValue = items[index]
    if (newValue !== undefined && newValue !== value) {
      onChange(newValue)
    }
  }

  // Effect to sync scroll with controlled value
  useEffect(() => {
    if (containerRef.current) {
        const itemHeight = 40
        const index = items.indexOf(value)
        if (index !== -1) {
            containerRef.current.scrollTop = index * itemHeight
        }
    }
  }, [value, items])

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{label}</span>}
      <div className="relative w-20 md:w-24 h-40 glass-strong border border-white/10 rounded-2xl overflow-hidden shadow-inner">
        {/* Selection Highlight */}
        <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-primary/20 border-y border-primary/30 pointer-events-none z-10" />
        
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-scroll snap-y snap-mandatory px-4 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Top Padding to center the first item */}
          <div className="h-[60px]" />
          
          {items.map((item) => (
            <div 
              key={item} 
              className={`h-10 flex items-center justify-center snap-center text-xl font-black transition-all duration-300 ${
                item === value ? "text-primary scale-125" : "text-foreground/20"
              }`}
            >
              {item}
            </div>
          ))}

          {/* Bottom Padding to center the last item */}
          <div className="h-[60px]" />
        </div>
      </div>
      {unit && <span className="text-xs font-black opacity-40 uppercase tracking-widest">{unit}</span>}
    </div>
  )
}
