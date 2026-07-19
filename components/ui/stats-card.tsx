"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: number
  trendLabel?: string
  className?: string
}

export function StatsCard({ title, value, icon, trend, trendLabel, className }: StatsCardProps) {
  return (
    <div className={cn("glass-card p-4 card-hover", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-brand-muted flex items-center justify-center text-brand">
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {trend > 0 ? (
            <ArrowUpRight className="w-3 h-3 text-success" />
          ) : trend < 0 ? (
            <ArrowDownRight className="w-3 h-3 text-destructive" />
          ) : (
            <Minus className="w-3 h-3 text-muted-foreground" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {Math.abs(trend)}%
          </span>
          {trendLabel && (
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
