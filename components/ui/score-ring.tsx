"use client"

import { cn } from "@/lib/utils"

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
  variant?: "default" | "compact"
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22C55E"
  if (score >= 60) return "#F59E0B"
  return "#EF4444"
}

export function ScoreRing({ score, size = 80, strokeWidth = 6, className, showLabel = true, variant = "default" }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-bold",
              variant === "compact" ? "text-sm" : "text-lg"
            )}
            style={{ color }}
          >
            {score}
          </span>
          {variant === "default" && (
            <span className="text-[10px] text-muted-foreground">pts</span>
          )}
        </div>
      )}
    </div>
  )
}
