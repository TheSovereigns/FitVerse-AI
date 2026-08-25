"use client"

import { useState, useEffect, useRef } from "react"
import { X, Check, Clock, Flame, Trophy, ChevronRight, Save, Search, Minus, Plus, Zap, Target, Timer } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-[380px] w-full flex flex-col gap-8 text-center">
          <div className="w-24 h-24 rounded-full bg-brand/15 flex items-center justify-center mx-auto">
            <Trophy className="w-12 h-12 text-brand" />
          </div>
          <div>
            <h2 className="text-[30px] font-black text-foreground mb-2">{t("aw_finished_title")}</h2>
            <p className="text-sm text-muted-foreground">{t("aw_finished_sub")} {workout.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-[28px] font-black text-foreground">{formatTime(elapsedTime)}</div>
              <div className="text-[11px] text-muted-foreground uppercase mt-1 tracking-[0.1em]">{t("aw_total_time")}</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <Flame className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <div className="text-[28px] font-black text-foreground">{t("aw_kcal_estimate")}</div>
              <div className="text-[11px] text-muted-foreground uppercase mt-1 tracking-[0.1em]">{t("aw_kcal_est")}</div>
            </div>
          </div>
          <button
            onClick={() => onComplete({ elapsedTime, rpeValues })}
            className="w-full h-14 rounded-2xl border-none bg-brand text-white text-base font-bold cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {t("aw_save_log")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-card border-none cursor-pointer shrink-0 text-white/60">
              <X className="w-[18px] h-[18px]" />
            </button>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-foreground m-0 whitespace-nowrap overflow-hidden text-ellipsis">{workout.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-3 h-3 text-brand" />
                <span className="text-xs text-brand font-bold font-mono">{formatTime(elapsedTime)}</span>
                <span className="text-white/20">|</span>
                <span className="text-xs text-white/40">{currentExerciseIndex + 1}/{totalExercises}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/12 border border-brand/25">
            <Target className="w-3 h-3 text-brand" />
            <span className="text-[11px] font-extrabold text-brand">{currentExerciseIndex + 1}/{totalExercises}</span>
          </div>
        </div>
        {/* Progress bars */}
        <div className="flex gap-1">
          {workout.exercises.map((_: any, idx: number) => {
            const exName = workout.exercises[idx].name
            const exCompleted = completedSets[exName]?.every(Boolean) ?? false
            const isCurrent = idx === currentExerciseIndex
            return (
              <div
                key={idx}
                className={cn(
                  "h-[3px] rounded-sm transition-all duration-500",
                  exCompleted ? "bg-brand flex-1" : isCurrent ? "bg-brand/30 [flex:2]" : "bg-white/[0.08] flex-1"
                )}
              />
            )
          })}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-[180px]">
        {/* Exercise Title */}
        <div className="mb-5">
          <h2 className="text-[26px] font-black text-foreground m-0 leading-tight">{currentExercise.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-white/[0.45] font-bold">{parseInt(currentExercise.sets) || 3} Séries</span>
            <span className="text-xs text-white/[0.45] font-bold">{currentExercise.reps} Reps</span>
          </div>
        </div>

        {/* Stats Widget */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {/* Sets */}
          <div className="rounded-2xl p-3.5 bg-brand/10 border border-brand/[0.18]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-brand" />
              <span className="text-[10px] font-extrabold text-brand uppercase tracking-[0.08em]">Séries</span>
            </div>
            <span className="text-[22px] font-black text-foreground">{completedCount}<span className="text-sm text-white/[0.35]">/{exerciseSets}</span></span>
          </div>
          {/* RPE */}
          <div className="rounded-2xl p-3.5 bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-[0.08em]">RPE</span>
            </div>
            <span className="text-[22px] font-black text-foreground">{rpeValues[currentExercise.name] || "—"}<span className="text-sm text-white/[0.35]">/10</span></span>
          </div>
          {/* Rest */}
          <div className="rounded-2xl p-3.5 bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Timer className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-[0.08em]">Descanso</span>
            </div>
            <span className="text-[22px] font-black text-foreground">60<span className="text-sm text-white/[0.35]">s</span></span>
          </div>
        </div>

        {/* Sets List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-extrabold text-white/[0.35] uppercase tracking-[0.1em]">Séries</span>
            <span className="text-[11px] text-white/[0.35]">{completedCount}/{exerciseSets}</span>
          </div>
          {currentExerciseSets.map((isCompleted: boolean, idx: number) => (
            <div
              key={idx}
              className={cn(
                "p-3.5 rounded-2xl mb-2 border transition-all duration-300",
                isCompleted ? "border-brand/25 bg-brand/[0.08]" : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-3.5">
                {/* Set Number / Check Button */}
                <button
                  onClick={() => handleSetComplete(idx)}
                  disabled={isCompleted}
                  className={cn(
                    "w-11 h-11 rounded-xl border-none flex items-center justify-center shrink-0 transition-all duration-300",
                    isCompleted
                      ? "bg-brand text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
                      : "bg-card text-white/40 cursor-pointer"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-[22px] h-[22px]" strokeWidth={3} />
                  ) : (
                    <span className="text-base font-black">{idx + 1}</span>
                  )}
                </button>

                {/* Set Info + Rep Counter */}
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className={cn("text-sm font-bold", isCompleted ? "text-brand" : "text-foreground")}>Série {idx + 1}</div>
                    <div className={cn("text-[11px] mt-0.5", isCompleted ? "text-brand/60" : "text-white/[0.35]")}>
                      {isCompleted ? "Concluída" : `${currentExercise.reps} reps`}
                    </div>
                  </div>

                  {!isCompleted ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); updateRepCount(idx, -1) }}
                        className="w-8 h-8 rounded-lg bg-card border border-border text-white/50 cursor-pointer flex items-center justify-center"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center font-black text-foreground text-[17px] tabular-nums">
                        {getRepCount(idx)}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateRepCount(idx, 1) }}
                        className="w-8 h-8 rounded-lg bg-card border border-border text-white/50 cursor-pointer flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const newSets = [...currentExerciseSets]
                        newSets[idx] = false
                        setCompletedSets({ ...completedSets, [currentExercise.name]: newSets })
                      }}
                      className="px-3 py-1.5 rounded-lg bg-brand/12 text-brand text-[11px] font-bold border-none cursor-pointer"
                    >
                      {t("aw_undo") || "Desfazer"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Button */}
        <button
          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(getSearchTerm())}`, '_blank')}
          className="w-full px-4 py-3 rounded-[14px] border border-border bg-transparent text-white/[0.35] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          {t("aw_search_google")}
        </button>
      </div>

      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-8">
            <span className="text-xs font-extrabold text-white/[0.35] uppercase tracking-[0.15em]">Descanso</span>

            {/* Big Timer Ring */}
            <div className="relative w-[200px] h-[200px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle
                  cx="100" cy="100" r="90" fill="none" strokeWidth="6"
                  stroke="var(--brand)"
                  strokeDasharray={2 * Math.PI * 90}
                  strokeDashoffset={2 * Math.PI * 90 * (1 - restTimer / 60)}
                  style={{ transition: "stroke-dashoffset 1s linear", strokeLinecap: "round" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[72px] font-black text-foreground font-mono tabular-nums leading-none">
                  {restTimer}
                </span>
                <span className="text-[11px] text-white/30 uppercase mt-1 tracking-[0.1em] font-semibold">segundos</span>
              </div>
            </div>

            {/* Next Exercise Preview */}
            {currentExerciseIndex < totalExercises - 1 && (
              <div className="px-5 py-3 rounded-2xl bg-card border border-border text-center max-w-[280px]">
                <span className="text-[10px] font-extrabold text-white/30 uppercase tracking-[0.1em]">Próximo</span>
                <p className="text-[13px] font-bold text-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                  {workout.exercises[currentExerciseIndex + 1].name}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 w-full max-w-[280px]">
              <button
                onClick={() => setRestTimer(prev => prev + 10)}
                className="flex-1 h-12 rounded-[14px] border border-border bg-transparent text-foreground text-sm font-semibold cursor-pointer"
              >
                +10s
              </button>
              <button
                onClick={() => setIsResting(false)}
                className="flex-1 h-12 rounded-[14px] border-none bg-brand text-white text-sm font-bold cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
              >
                Pular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar — RPE + Next */}
      {isExerciseComplete && !isResting && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border backdrop-blur-lg" style={{ padding: "16px 16px calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          <div className="max-w-[480px] mx-auto flex flex-col gap-3">
            {/* RPE Slider */}
            <div className="p-4 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground">RPE</span>
                <span className="font-black tabular-nums text-brand text-lg">
                  {rpeValues[currentExercise.name] || 5}<span className="text-xs font-bold text-white/[0.35]">/10</span>
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={rpeValues[currentExercise.name] || 5}
                onChange={(e) => setRpeValues({...rpeValues, [currentExercise.name]: parseInt(e.target.value)})}
                className="w-full h-2 rounded accent-brand"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.1em] font-semibold">Fácil</span>
                <span className="text-[10px] text-white/30 uppercase tracking-[0.1em] font-semibold">Máximo</span>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextExercise}
              className="w-full h-14 rounded-2xl border-none bg-brand text-white text-base font-bold cursor-pointer shadow-[0_4px_24px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1"
            >
              {currentExerciseIndex < totalExercises - 1 ? (
                <>Próximo exercício <ChevronRight className="w-5 h-5" /></>
              ) : (
                <>Finalizar <Trophy className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
