"use client"

import { cn } from "@/lib/utils"

interface ShimmerCardProps {
  className?: string
  rows?: number
}

export function ShimmerCard({ className, rows = 3 }: ShimmerCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-muted rounded-full w-1/3 animate-pulse" />
          <div className="h-2 bg-muted rounded-full w-1/2 animate-pulse" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div
            className="h-2 bg-muted rounded-full animate-pulse"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        </div>
      ))}
    </div>
  )
}
