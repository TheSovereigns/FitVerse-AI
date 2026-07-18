"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WorkoutTimerProps {
  restDuration: number
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
}

export function WorkoutTimer({ restDuration, isActive, onComplete, onSkip }: WorkoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(restDuration)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setTimeLeft(restDuration)
    setIsPaused(false)
  }, [restDuration, isActive])

  useEffect(() => {
    if (!isActive || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, isPaused, onComplete])

  const progress = ((restDuration - timeLeft) / restDuration) * 100
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (progress / 100) * circumference

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`

  const togglePause = () => setIsPaused((prev) => !prev)

  const reset = () => {
    setTimeLeft(restDuration)
    setIsPaused(false)
  }

  if (!isActive) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center gap-4"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">
        Descanso
      </p>

      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-2xl">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={timeLeft <= 5 ? "#ef4444" : "#f59e0b"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 60 60)"
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "text-4xl font-black tracking-tight tabular-nums",
            timeLeft <= 5 ? "text-red-400" : "text-foreground"
          )}>
            {timeString}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={reset}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl border border-white/10 bg-white/8 text-foreground/60 hover:bg-white/16"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          onClick={togglePause}
          className="h-12 w-12 rounded-2xl bg-foreground text-black hover:bg-foreground/60"
        >
          {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </Button>
        <Button
          onClick={onSkip}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl border border-white/10 bg-white/8 text-foreground/60 hover:bg-white/16"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
