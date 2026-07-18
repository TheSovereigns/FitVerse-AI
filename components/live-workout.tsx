"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Check, Timer, Dumbbell, Trophy, Flame,
  ChevronRight, Volume2, VolumeX, Share2, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { WorkoutTimer } from "./workout-timer"
import { FocusMode } from "./focus-mode"
import { ShareActivityButton } from "./share-activity-button"
import { useFocusMode } from "@/hooks/useFocusMode"
import { useTranslation } from "@/lib/i18n"

interface Exercise {
  name: string
  sets: number
  reps?: string
  duration?: string
  rest?: number
  notes?: string
}

interface Workout {
  name: string
  exercises: Exercise[]
}

interface LiveWorkoutProps {
  workout: Workout
  onBack: () => void
}

export function LiveWorkout({ workout, onBack }: LiveWorkoutProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { isActive: focusActive, activate: activateFocus, deactivate: deactivateFocus } = useFocusMode()

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [isResting, setIsResting] = useState(false)
  const [completedExercises, setCompletedExercises] = useState<number[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [restDuration, setRestDuration] = useState(60)

  const currentExercise = workout.exercises[currentExerciseIndex]
  const totalExercises = workout.exercises.length
  const progressPercent = ((currentExerciseIndex + (currentSet - 1) / (currentExercise?.sets || 1)) / totalExercises) * 100

  useEffect(() => {
    if (isFinished || isResting) return
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isFinished, isResting])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const handleSetComplete = () => {
    if (!currentExercise) return

    if (currentSet < currentExercise.sets) {
      setIsResting(true)
    } else {
      const newCompleted = [...completedExercises, currentExerciseIndex]
      setCompletedExercises(newCompleted)

      if (currentExerciseIndex < totalExercises - 1) {
        setIsResting(true)
      } else {
        setIsFinished(true)
      }
    }
  }

  const handleRestComplete = () => {
    setIsResting(false)
    if (!currentExercise) return

    if (currentSet < currentExercise.sets) {
      setCurrentSet((prev) => prev + 1)
    } else {
      setCurrentSet(1)
      setCurrentExerciseIndex((prev) => prev + 1)
    }
  }

  const handleSkipRest = () => {
    setIsResting(false)
    if (!currentExercise) return

    if (currentSet < currentExercise.sets) {
      setCurrentSet((prev) => prev + 1)
    } else {
      setCurrentSet(1)
      setCurrentExerciseIndex((prev) => prev + 1)
    }
  }

  const estimatedCalories = Math.round(elapsedTime * 0.15)

  if (isFinished) {
    return (
      <FocusMode isActive={focusActive} type="workout" title={workout.name} onDeactivate={deactivateFocus}>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-white/15 to-white/5 mb-6"
          >
            <Trophy className="h-10 w-10 text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black text-foreground mb-2"
          >
            {isEnglish ? "Workout Complete!" : "Treino Concluido!"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-foreground/50 mb-8"
          >
            {workout.name}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4 mb-8 w-full max-w-sm"
          >
            <div className="rounded-2xl border border-white/12 bg-black/30 p-4 text-center">
              <Timer className="h-5 w-5 text-foreground/60 mx-auto mb-2" />
              <p className="text-xl font-black text-foreground">{formatTime(elapsedTime)}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
                {isEnglish ? "Duration" : "Duracao"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-black/30 p-4 text-center">
              <Dumbbell className="h-5 w-5 text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-black text-foreground">{totalExercises}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
                {isEnglish ? "Exercises" : "Exercicios"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-black/30 p-4 text-center">
              <Flame className="h-5 w-5 text-red-400 mx-auto mb-2" />
              <p className="text-xl font-black text-foreground">{estimatedCalories}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">KCAL</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3 w-full max-w-sm"
          >
            <ShareActivityButton
              activityType="workout"
              activityData={{
                name: workout.name,
                exercises: totalExercises,
                duration: elapsedTime,
                calories: estimatedCalories,
              }}
              variant="default"
              className="h-12 rounded-xl bg-white/10 border border-white/20 text-foreground/60 hover:bg-white/15 w-full"
            />
            <Button
              onClick={onBack}
              variant="ghost"
              className="h-12 rounded-xl border border-white/14 bg-white/8 text-foreground/60 hover:bg-white/16 w-full"
            >
              {isEnglish ? "Back to Workouts" : "Voltar aos Treinos"}
            </Button>
          </motion.div>
        </div>
      </FocusMode>
    )
  }

  return (
    <FocusMode isActive={focusActive} type="workout" title={workout.name} onDeactivate={deactivateFocus}>
      <div className="mx-auto w-full max-w-2xl px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl border border-white/14 bg-white/8 text-foreground hover:bg-white/16"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-foreground/60" />
            <span className="text-sm font-black text-foreground tabular-nums">{formatTime(elapsedTime)}</span>
          </div>
          <Button
            onClick={() => activateFocus("workout", workout.name)}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl border border-white/14 bg-white/8 text-foreground hover:bg-white/16"
          >
            <Dumbbell className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
              {currentExerciseIndex + 1}/{totalExercises}
            </span>
            <span className="text-[10px] font-black text-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-white/60 to-white/40 rounded-full"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isResting ? (
            <motion.div
              key="rest"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-8"
            >
              <WorkoutTimer
                restDuration={restDuration}
                isActive={isResting}
                onComplete={handleRestComplete}
                onSkip={handleSkipRest}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`exercise-${currentExerciseIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-[1.5rem] border border-white/14 bg-[#090704]/70 p-6 backdrop-blur-2xl"
            >
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 mb-1">
                  {isEnglish ? "Exercise" : "Exercicio"} {currentExerciseIndex + 1}
                </p>
                <h3 className="text-2xl font-black text-foreground">{currentExercise?.name}</h3>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                  <p className="text-2xl font-black text-foreground">{currentSet}/{currentExercise?.sets}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
                    {isEnglish ? "Series" : "Series"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                  <p className="text-2xl font-black text-foreground">{currentExercise?.reps || currentExercise?.duration || "—"}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
                    {currentExercise?.reps ? (isEnglish ? "Reps" : "Reps") : (isEnglish ? "Time" : "Tempo")}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                  <p className="text-2xl font-black text-foreground">{currentExercise?.rest || restDuration}s</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
                    {isEnglish ? "Rest" : "Descanso"}
                  </p>
                </div>
              </div>

              {currentExercise?.notes && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 mb-6">
                  <p className="text-xs text-foreground/50">{currentExercise.notes}</p>
                </div>
              )}

              <Button
                onClick={handleSetComplete}
                className="w-full h-14 rounded-2xl bg-foreground text-lg font-black uppercase tracking-widest text-background hover:bg-foreground/80 active:scale-[0.98] transition-all"
              >
                <Check className="h-5 w-5 mr-2" />
                {currentSet < (currentExercise?.sets || 1)
                  ? (isEnglish ? "Complete Set" : "Concluir Serie")
                  : (isEnglish ? "Complete Exercise" : "Concluir Exercicio")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex items-center justify-center gap-2">
          {workout.exercises.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === currentExerciseIndex
                  ? "w-6 bg-white"
                    : completedExercises.includes(i)
                      ? "w-1.5 bg-emerald-400"
                      : "w-1.5 bg-white/10"
              )}
            />
          ))}
        </div>
      </div>
    </FocusMode>
  )
}
