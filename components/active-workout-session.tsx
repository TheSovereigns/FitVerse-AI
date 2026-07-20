"use client"

import { useState, useEffect, useRef } from "react"
import { X, Check, Clock, Flame, Trophy, ChevronRight, Save, Search, Minus, Plus, Zap, Target, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface ActiveWorkoutSessionProps {
  workout: any
  onClose: () => void
  onComplete: (data: any) => void
}

import { useTranslation } from "@/lib/i18n"
import { EXERCISE_TRANSLATIONS } from "@/lib/exercise-translations"

export function ActiveWorkoutSession({ workout, onClose, onComplete }: ActiveWorkoutSessionProps) {
  const { t, locale } = useTranslation()
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({})
  const [isResting, setIsResting] = useState(false)
  const [restTimer, setRestTimer] = useState(60)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [rpeValues, setRpeValues] = useState<Record<string, number>>({})
  const [isFinished, setIsFinished] = useState(false)
  const [repCount, setRepCount] = useState<Record<string, number[]>>({})

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null)

  const getSearchTerm = () => {
    const name = currentExercise.name.toLowerCase().trim()
    if (locale === "en-US") {
      for (const [pt, en] of Object.entries(EXERCISE_TRANSLATIONS)) {
        if (name.includes(pt)) return en
      }
      return name
    }
    return name + t("em_search_suffix")
  }

  useEffect(() => {
    const saved = localStorage.getItem(`workout_progress_${workout.name}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.workoutName === workout.name) {
          setCurrentExerciseIndex(data.currentExerciseIndex)
          setCompletedSets(data.completedSets)
          setElapsedTime(data.elapsedTime)
          setRpeValues(data.rpeValues)
          if (data.repCount) setRepCount(data.repCount)
        }
      } catch (e) {
        console.error(t("aw_error_progress"), e)
      }
    }
  }, [workout.name])

  useEffect(() => {
    if (!isFinished) {
      localStorage.setItem(`workout_progress_${workout.name}`, JSON.stringify({
        workoutName: workout.name,
        currentExerciseIndex,
        completedSets,
        elapsedTime,
        rpeValues,
        repCount,
      }))
    } else {
      localStorage.removeItem(`workout_progress_${workout.name}`)
    }
  }, [currentExerciseIndex, completedSets, elapsedTime, rpeValues, isFinished, workout.name, repCount])

  useEffect(() => {
    if (!isFinished) {
      workoutTimerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current)
    }
  }, [isFinished])

  useEffect(() => {
    if (isResting && restTimer > 0) {
      timerRef.current = setInterval(() => {
        setRestTimer(prev => prev - 1)
      }, 1000)
    } else if (restTimer === 0) {
      setIsResting(false)
      setRestTimer(60)
      toast.success(t("aw_rest_done"))
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isResting, restTimer, t])

  const currentExercise = workout.exercises[currentExerciseIndex]
  const totalExercises = workout.exercises.length
  const progress = ((currentExerciseIndex) / totalExercises) * 100
  const exerciseSets = parseInt(currentExercise.sets) || 3
  const currentExerciseSets = completedSets[currentExercise.name] || new Array(exerciseSets).fill(false)
  const isExerciseComplete = currentExerciseSets.every(Boolean)
  const completedCount = currentExerciseSets.filter(Boolean).length

  const getRepCount = (setIndex: number) => {
    const reps = repCount[currentExercise.name] || []
    return reps[setIndex] ?? (parseInt(currentExercise.reps) || 10)
  }

  const updateRepCount = (setIndex: number, delta: number) => {
    const key = currentExercise.name
    const current = repCount[key] || new Array(exerciseSets).fill(parseInt(currentExercise.reps) || 10)
    const newVal = Math.max(0, Math.min(30, (current[setIndex] ?? (parseInt(currentExercise.reps) || 10)) + delta))
    const updated = [...current]
    updated[setIndex] = newVal
    setRepCount({ ...repCount, [key]: updated })
  }

  const handleSetComplete = (setIndex: number) => {
    if (currentExerciseSets[setIndex]) return
    const newSets = [...currentExerciseSets]
    newSets[setIndex] = true
    setCompletedSets({ ...completedSets, [currentExercise.name]: newSets })
    setIsResting(true)
    setRestTimer(60)
  }

  const handleNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      setIsResting(false)
      setRestTimer(60)
    } else {
      finishWorkout()
    }
  }

  const finishWorkout = () => {
    setIsFinished(true)
    if (workoutTimerRef.current) clearInterval(workoutTimerRef.current)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">{t("aw_finished_title")}</h2>
            <p className="text-muted-foreground">{t("aw_finished_sub")} {workout.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border p-4">
              <div className="flex flex-col items-center">
                <Clock className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-2xl font-bold text-foreground">{formatTime(elapsedTime)}</span>
                <span className="text-xs text-muted-foreground uppercase">{t("aw_total_time")}</span>
              </div>
            </Card>
            <Card className="bg-card border-border p-4">
              <div className="flex flex-col items-center">
                <Flame className="w-6 h-6 text-red-500 mb-2" />
                <span className="text-2xl font-bold text-foreground">{t("aw_kcal_estimate")}</span>
                <span className="text-xs text-muted-foreground uppercase">{t("aw_kcal_est")}</span>
              </div>
            </Card>
          </div>
          <Button
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => onComplete({ elapsedTime, rpeValues })}
          >
            <Save className="w-5 h-5 mr-2" />
            {t("aw_save_log")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="relative px-5 pt-4 pb-3 bg-gradient-to-b from-primary/8 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground shrink-0 h-9 w-9 -ml-2"
            >
              <X className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-sm truncate">{workout.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-mono font-semibold tabular-nums">{formatTime(elapsedTime)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Target className="w-3 h-3 text-primary" />
              <span className="text-xs font-bold text-primary">{currentExerciseIndex + 1}/{totalExercises}</span>
            </div>
          </div>
        </div>

        {/* Exercise Progress Bar */}
        <div className="flex gap-1">
          {workout.exercises.map((_: any, idx: number) => {
            const exName = workout.exercises[idx].name
            const exSets = parseInt(workout.exercises[idx].sets) || 3
            const exCompleted = completedSets[exName]?.every(Boolean) ?? false
            const isCurrent = idx === currentExerciseIndex
            return (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-500 ${
                  exCompleted
                    ? "flex-1 bg-primary"
                    : isCurrent
                    ? "flex-[2] bg-primary/50"
                    : "flex-1 bg-muted-foreground/15"
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-44 md:pb-28">
        {/* Exercise Title */}
        <div className="mb-5">
          <h2 className="text-2xl md:text-3xl font-black text-foreground leading-tight tracking-tight">
            {currentExercise.name}
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {parseInt(currentExercise.sets) || 3} {t("aw_sets") || "séries"}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {currentExercise.reps} {t("aw_reps")}
            </span>
          </div>
        </div>

        {/* Stats Widget */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-3 border border-primary/10">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{t("aw_sets") || "Séries"}</span>
            </div>
            <span className="text-xl font-black text-foreground">{completedCount}<span className="text-sm font-bold text-muted-foreground">/{exerciseSets}</span></span>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-2xl p-3 border border-orange-500/10">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">RPE</span>
            </div>
            <span className="text-xl font-black text-foreground">{rpeValues[currentExercise.name] || "—"}<span className="text-sm font-bold text-muted-foreground">/10</span></span>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-3 border border-blue-500/10">
            <div className="flex items-center gap-1.5 mb-1">
              <Timer className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{t("aw_rest")}</span>
            </div>
            <span className="text-xl font-black text-foreground">60<span className="text-sm font-bold text-muted-foreground">s</span></span>
          </div>
        </div>

        {/* Sets List */}
        <div className="space-y-3">
          {currentExerciseSets.map((isCompleted, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl border transition-all duration-500 overflow-hidden ${
                isCompleted
                  ? "border-primary/20 bg-gradient-to-r from-primary/8 to-primary/3"
                  : "border-border/50 bg-card"
              }`}
            >
              {/* Completed glow */}
              {isCompleted && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-in fade-in duration-700" />
              )}

              <div className="relative p-4">
                <div className="flex items-center gap-4">
                  {/* Set Number Circle */}
                  <button
                    onClick={() => handleSetComplete(idx)}
                    disabled={isCompleted}
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0
                      ${isCompleted
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-100"
                        : "bg-muted/60 text-muted-foreground hover:bg-primary/15 hover:text-primary hover:scale-105 active:scale-95"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" strokeWidth={3} />
                    ) : (
                      <span className="text-base font-black">{idx + 1}</span>
                    )}
                  </button>

                  {/* Rep Counter Widget */}
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <span className={`text-sm font-bold block ${isCompleted ? "text-primary" : "text-foreground"}`}>
                        {t("aw_set")} {idx + 1}
                      </span>
                      <span className={`text-xs ${isCompleted ? "text-primary/60" : "text-muted-foreground"}`}>
                        {isCompleted ? t("aw_done") : currentExercise.reps + " " + t("aw_reps")}
                      </span>
                    </div>

                    {!isCompleted && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); updateRepCount(idx, -1) }}
                          className="w-8 h-8 rounded-lg bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <span className="w-10 text-center text-lg font-black text-foreground tabular-nums">
                          {getRepCount(idx)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateRepCount(idx, 1) }}
                          className="w-8 h-8 rounded-lg bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    )}

                    {isCompleted && (
                      <button
                        onClick={() => {
                          const newSets = [...currentExerciseSets]
                          newSets[idx] = false
                          setCompletedSets({ ...completedSets, [currentExercise.name]: newSets })
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                      >
                        {t("aw_undo") || "Desfazer"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress indicator bar */}
                {!isCompleted && (
                  <div className="mt-3 h-1 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary/40 to-primary/20 rounded-full transition-all duration-300"
                      style={{ width: `${((idx + 1) / exerciseSets) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Search Button */}
        <button
          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(getSearchTerm())}`, '_blank')}
          className="w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-xl border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-semibold"
        >
          <Search className="w-4 h-4" />
          {t("aw_search_google")}
        </button>
      </div>

      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="fixed inset-0 z-40 bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="text-center space-y-8">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">{t("aw_rest")}</span>

            {/* Circular Timer */}
            <div className="relative w-48 h-48 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
                <circle
                  cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 90}
                  strokeDashoffset={2 * Math.PI * 90 * (1 - restTimer / 60)}
                  className="text-primary transition-all duration-1000 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-black text-foreground font-mono tabular-nums">
                  {restTimer}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-1">segundos</span>
              </div>
            </div>

            {/* Next Exercise Preview */}
            {currentExerciseIndex < totalExercises - 1 && (
              <div className="bg-card/50 rounded-2xl border border-border/30 p-4 max-w-xs mx-auto">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("aw_next")}</span>
                <p className="text-sm font-bold text-foreground mt-1 truncate">
                  {workout.exercises[currentExerciseIndex + 1].name}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 max-w-xs mx-auto">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl border-border/50 font-semibold"
                onClick={() => setRestTimer(prev => prev + 10)}
              >
                +10s
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/25"
                onClick={() => setIsResting(false)}
              >
                {t("aw_skip")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar - RPE + Next */}
      {isExerciseComplete && !isResting && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-2xl border-t border-border/30 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-lg mx-auto space-y-3">
            {/* RPE Slider */}
            <div className="bg-card rounded-2xl border border-border/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground">{t("aw_rpe")}</span>
                <span className="text-lg font-black text-primary tabular-nums">{rpeValues[currentExercise.name] || 5}<span className="text-xs font-bold text-muted-foreground">/10</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={rpeValues[currentExercise.name] || 5}
                onChange={(e) => setRpeValues({...rpeValues, [currentExercise.name]: parseInt(e.target.value)})}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                <span>{t("aw_easy")}</span>
                <span>{t("aw_max")}</span>
              </div>
            </div>

            {/* Next Button */}
            <Button
              className="w-full h-14 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/25"
              onClick={handleNextExercise}
            >
              {currentExerciseIndex < totalExercises - 1 ? (
                <>{t("aw_next")} <ChevronRight className="w-5 h-5 ml-1" /></>
              ) : (
                <>{t("aw_finish")} <Trophy className="w-5 h-5 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
