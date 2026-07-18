"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-white/5", className)} style={style} />
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-strong border border-white/10 rounded-[2rem] p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-full" />
        <Skeleton className="h-8 flex-1 rounded-full" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 glass-strong rounded-2xl">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="text-center p-4 glass-strong rounded-2xl">
          <Skeleton className="h-8 w-16 mx-auto mb-2" />
          <Skeleton className="h-3 w-20 mx-auto" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 p-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 glass-strong rounded-xl">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="glass-strong border border-white/10 rounded-[2rem] p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t-lg"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  )
}