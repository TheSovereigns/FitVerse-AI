"use client"

import { useState, useRef, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
  threshold?: number
}

export function PullToRefresh({ onRefresh, children, className, threshold = 80 }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const isPulling = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement
    if (target.scrollTop === 0) {
      startY.current = e.touches[0]?.clientY || 0
      isPulling.current = true
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling.current) return
      const diff = e.touches[0]!.clientY - startY.current
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.5, threshold * 1.5))
      }
    },
    [threshold]
  )

  const handleTouchEnd = useCallback(async () => {
    isPulling.current = false
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
    setPullDistance(0)
  }, [pullDistance, threshold, isRefreshing, onRefresh])

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-transform"
        style={{ transform: `translateY(${pullDistance - 60}px)` }}
      >
        <RefreshCw
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: pullDistance >= threshold ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>
      <div
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
