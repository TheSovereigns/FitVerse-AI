"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, SkipForward, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface RestTimerProps {
  duration: number
  isActive: boolean
  onComplete?: () => void
  onSkip?: () => void
  className?: string
}

function RestTimer({ duration, isActive, onComplete, onSkip, className }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isActive) return
    setTimeLeft(duration)
  }, [duration, isActive])

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isActive, onComplete])

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <p className="text-sm text-muted-foreground">Descanso</p>
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90">
          <circle cx="56" cy="56" r="50" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
          <circle cx="56" cy="56" r="50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray={314} strokeDashoffset={314 - (timeLeft / duration) * 314} className="text-warning transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold font-mono">{formatTime(timeLeft)}</span>
        </div>
      </div>
      <Button variant="outline" onClick={onSkip} className="rounded-xl">Pular Descanso</Button>
    </div>
  )
}

interface TimerSet {
  exercise: string
  reps?: number
  duration?: number
  restAfter?: number
}

interface WorkoutTimerProps {
  sets?: TimerSet[]
  onComplete?: () => void
  className?: string
  // Legacy props for backward compatibility
  restDuration?: number
  isActive?: boolean
  onSkip?: () => void
}

export function WorkoutTimer({ sets, onComplete, className, restDuration, isActive, onSkip }: WorkoutTimerProps) {
  // Legacy mode: simple rest timer
  if (!sets && restDuration !== undefined) {
    return (
      <RestTimer
        duration={restDuration}
        isActive={isActive ?? true}
        onComplete={onComplete}
        onSkip={onSkip}
        className={className}
      />
    )
  }

  const timerSets = sets || []
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isResting, setIsResting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [completedSets, setCompletedSets] = useState<number[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentSet = timerSets[currentSetIndex] as TimerSet | undefined
  const isFinished = currentSetIndex >= timerSets.length || !currentSet

  const startTimer = useCallback((seconds: number) => {
    setTimeLeft(seconds)
    setIsRunning(true)
  }, [])

  useEffect(() => {
    if (!currentSet || isFinished) return

    if (isResting) {
      startTimer(currentSet.restAfter || 60)
    } else if (currentSet.duration) {
      startTimer(currentSet.duration)
    }
  }, [currentSetIndex, isResting, currentSet, isFinished, startTimer])

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          handleTimerEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const handleTimerEnd = () => {
    setIsRunning(false)
    if (!currentSet) return
    if (isResting) {
      setIsResting(false)
      setCurrentSetIndex((prev) => prev + 1)
    } else {
      setCompletedSets([...completedSets, currentSetIndex])
      if (currentSet.restAfter && currentSet.restAfter > 0) {
        setIsResting(true)
      } else {
        setCurrentSetIndex((prev) => prev + 1)
      }
    }
  }

  const handleSkip = () => {
    setIsRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isResting) {
      setIsResting(false)
      setCurrentSetIndex((prev) => prev + 1)
    } else {
      setCompletedSets([...completedSets, currentSetIndex])
      setCurrentSetIndex((prev) => prev + 1)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setCurrentSetIndex(0)
    setIsResting(false)
    setTimeLeft(0)
    setCompletedSets([])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("text-center py-8", className)}
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-success/10 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">Treino Completo!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {completedSets.length} séries concluídas
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={handleReset} className="rounded-xl">
            <RotateCcw className="w-4 h-4 mr-2" />
            Recomeçar
          </Button>
          <Button onClick={onComplete} className="rounded-xl">
            Concluir
          </Button>
        </div>
      </motion.div>
    )
  }

  const progress = timerSets.length > 0 ? ((currentSetIndex) / timerSets.length) * 100 : 0

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Séries {currentSetIndex + 1} / {timerSets.length}
        </span>
        <span className="text-xs text-muted-foreground">
          {completedSets.length} concluídas
        </span>
      </div>

      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-1">
          {isResting ? "Descanso" : "Exercício"}
        </p>
        <h3 className="text-lg font-bold text-foreground mb-4">
          {currentSet.exercise}
        </h3>

        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={352}
              strokeDashoffset={352 - (timeLeft / (isResting ? (currentSet.restAfter || 60) : (currentSet.duration || 60))) * 352}
              className={cn("transition-all duration-1000", isResting ? "text-warning" : "text-brand")}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {currentSet.reps && !isResting && (
          <p className="text-sm text-muted-foreground">
            {currentSet.reps} repetições
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        <Button variant="outline" size="lg" onClick={handleReset} className="rounded-xl">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="lg"
          onClick={() => setIsRunning(!isRunning)}
          className="rounded-xl px-8"
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        <Button variant="outline" size="lg" onClick={handleSkip} className="rounded-xl">
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
