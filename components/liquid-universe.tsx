"use client"

import React, { useEffect, useRef } from "react"

export function LiquidUniverse() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      
      const xPercent = (clientX / innerWidth) * 100
      const yPercent = (clientY / innerHeight) * 100
      
      containerRef.current.style.setProperty("--mouse-x", `${xPercent}%`)
      containerRef.current.style.setProperty("--mouse-y", `${yPercent}%`)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div ref={containerRef} className="liquid-universe-bg">
      {/* Moving Liquid Mesh Layer */}
      <div className="liquid-mesh opacity-60 dark:opacity-40" aria-hidden="true" />
      
      {/* Siri-style Reactive Ambient Glow */}
      <div className="siri-glow-ambient mix-blend-plus-lighter" aria-hidden="true" />
      
      {/* Noise Texture Overlay for Depth */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  )
}
