"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  variant?: "default" | "success" | "warning" | "destructive"
}

const variantColors = {
  default: "bg-foreground",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  variant = "default",
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Progresso</span>
          <span className="text-xs font-medium text-foreground">{percentage}%</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", variantColors[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}
