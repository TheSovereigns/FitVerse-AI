"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  ChevronDown,
  ChevronUp,
  Lock,
  PlayCircle,
  Footprints,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

interface MobilityExercise {
  id: string
  name: string
  duration: number
  targetArea: string
  instructions: string
}

interface MobilityRoutine {
  id: string
  name: string
  type: "pre" | "post" | "daily"
  duration: string
  exercises: MobilityExercise[]
}

interface MobilityRoutinesProps {
  isLocked?: boolean
  onUnlock?: () => void
}

const BODY_AREAS = [
  { id: "shoulders", label: "Shoulders" },
  { id: "hips", label: "Hips" },
  { id: "spine", label: "Spine" },
  { id: "ankles", label: "Ankles" },
  { id: "wrists", label: "Wrists" },
]

const ROUTINES: MobilityRoutine[] = [
  {
    id: "pre-workout",
    name: "Pre-Workout Mobility",
    type: "pre",
    duration: "5-10 min",
    exercises: [
      {
        id: "pw-1",
        name: "Arm Circles",
        duration: 30,
        targetArea: "shoulders",
        instructions: "Extend arms to sides, make small circles gradually increasing size",
      },
      {
        id: "pw-2",
        name: "Cat-Cow",
        duration: 45,
        targetArea: "spine",
        instructions: "On all fours, alternate arching and rounding your back slowly",
      },
      {
        id: "pw-3",
        name: "Hip Circles",
        duration: 30,
        targetArea: "hips",
        instructions: "Stand on one leg, rotate the other hip in wide circles",
      },
      {
        id: "pw-4",
        name: "Ankle Rotations",
        duration: 30,
        targetArea: "ankles",
        instructions: "Lift foot off ground, rotate ankle clockwise then counterclockwise",
      },
      {
        id: "pw-5",
        name: "Wrist Circles",
        duration: 30,
        targetArea: "wrists",
        instructions: "Extend arms, rotate wrists in both directions",
      },
      {
        id: "pw-6",
        name: "World's Greatest Stretch",
        duration: 60,
        targetArea: "hips",
        instructions: "Lunge forward, place same-side elbow on floor, rotate and reach up",
      },
    ],
  },
  {
    id: "post-workout",
    name: "Post-Workout Stretching",
    type: "post",
    duration: "5-10 min",
    exercises: [
      {
        id: "po-1",
        name: "Standing Quad Stretch",
        duration: 30,
        targetArea: "hips",
        instructions: "Stand on one leg, pull opposite foot toward glutes",
      },
      {
        id: "po-2",
        name: "Pigeon Pose",
        duration: 45,
        targetArea: "hips",
        instructions: "From plank, bring one knee forward, extend other leg back, sink hips",
      },
      {
        id: "po-3",
        name: "Doorway Chest Stretch",
        duration: 30,
        targetArea: "shoulders",
        instructions: "Place forearm on door frame, lean forward until stretch is felt",
      },
      {
        id: "po-4",
        name: "Seated Forward Fold",
        duration: 45,
        targetArea: "spine",
        instructions: "Sit with legs extended, reach toward toes, keep back straight",
      },
      {
        id: "po-5",
        name: "Calf Stretch",
        duration: 30,
        targetArea: "ankles",
        instructions: "Place hands on wall, step one foot back, press heel into floor",
      },
    ],
  },
  {
    id: "daily-mobility",
    name: "Daily Mobility Routine",
    type: "daily",
    duration: "15 min",
    exercises: [
      {
        id: "dm-1",
        name: "Neck CARs",
        duration: 45,
        targetArea: "spine",
        instructions: "Slowly rotate neck in full circles, 5 each direction",
      },
      {
        id: "dm-2",
        name: "Shoulder CARs",
        duration: 45,
        targetArea: "shoulders",
        instructions: "Arms at sides, rotate shoulders in controlled circles",
      },
      {
        id: "dm-3",
        name: "Spinal Waves",
        duration: 60,
        targetArea: "spine",
        instructions: "Standing, undulate spine from tailbone to head like a wave",
      },
      {
        id: "dm-4",
        name: "Hip CARs",
        duration: 45,
        targetArea: "hips",
        instructions: "Standing on one leg, rotate opposite hip through full range",
      },
      {
        id: "dm-5",
        name: "Deep Squat Hold",
        duration: 60,
        targetArea: "hips",
        instructions: "Drop into deep squat, hold bottom position, shift weight side to side",
      },
      {
        id: "dm-6",
        name: "Ankle CARs",
        duration: 45,
        targetArea: "ankles",
        instructions: "Lift foot, rotate ankle slowly through full range of motion",
      },
      {
        id: "dm-7",
        name: "Wrist Stretches",
        duration: 45,
        targetArea: "wrists",
        instructions: "Extend arm, pull fingers back with other hand, then forward",
      },
      {
        id: "dm-8",
        name: "Thoracic Rotation",
        duration: 60,
        targetArea: "spine",
        instructions: "Side-lying, rotate top arm open like a book, follow with eyes",
      },
    ],
  },
]

export function MobilityRoutines({
  isLocked = false,
  onUnlock,
}: MobilityRoutinesProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [activeRoutine, setActiveRoutine] = useState<string | null>(null)
  const [activeExercise, setActiveExercise] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [showVideo, setShowVideo] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentRoutine = ROUTINES.find((r) => r.id === activeRoutine)
  const filteredExercises = currentRoutine
    ? selectedArea
      ? currentRoutine.exercises.filter((e) => e.targetArea === selectedArea)
      : currentRoutine.exercises
    : []
  const currentExercise = filteredExercises[activeExercise]

  useEffect(() => {
    if (isRunning && currentExercise) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev >= currentExercise.duration) {
            handleExerciseComplete()
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, currentExercise])

  const handleExerciseComplete = useCallback(() => {
    if (!currentExercise) return
    setCompletedExercises((prev) => [...prev, currentExercise.id])
    setIsRunning(false)
    setTimer(0)

    if (activeExercise < filteredExercises.length - 1) {
      setActiveExercise((prev) => prev + 1)
    } else {
      setActiveRoutine(null)
      setActiveExercise(0)
    }
  }, [currentExercise, activeExercise, filteredExercises.length])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimer(0)
  }

  const startRoutine = (routineId: string) => {
    setActiveRoutine(routineId)
    setActiveExercise(0)
    setTimer(0)
    setIsRunning(false)
    setCompletedExercises([])
  }

  const getProgress = () => {
    if (!currentRoutine) return 0
    const total = filteredExercises.length
    const completed = filteredExercises.filter((e) =>
      completedExercises.includes(e.id)
    ).length
    return total > 0 ? (completed / total) * 100 : 0
  }

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex flex-col items-center text-center py-8 space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {(isEnglish ? "Mobility Routines" : "Rotinas de Mobilidade")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {isEnglish ? "Unlock guided mobility and stretching routines with timers." : "Desbloqueie rotinas guiadas de mobilidade e alongamento com timers."}
            </p>
          </div>
          <Button
            onClick={onUnlock}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {(isEnglish ? "Unlock Pro" : "Desbloquear Pro")}
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {(isEnglish ? "Mobility Routines" : "Rotinas de Mobilidade")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {(isEnglish ? "Pre, post & daily routines" : "Rotinas pre, pos e diarias")}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeRoutine && currentExercise ? (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {currentRoutine?.name || ""}
                </span>
                <span className="text-[10px] text-primary">
                  {activeExercise + 1}/{filteredExercises.length}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${getProgress()}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Timer Display */}
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground mb-1">
                {currentExercise.name}
              </p>
              <motion.p
                key={timer}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold text-foreground tabular-nums"
              >
                {Math.floor(timer / 60)
                  .toString()
                  .padStart(2, "0")}
                :
                {(timer % 60).toString().padStart(2, "0")}
              </motion.p>
              <p className="text-[11px] text-muted-foreground mt-1">
                / {Math.floor(currentExercise.duration / 60)}:
                {(currentExercise.duration % 60).toString().padStart(2, "0")}
              </p>
            </div>

            {/* Instructions */}
            <div className="p-3 rounded-xl border border-border bg-muted/50">
              <p className="text-xs text-muted-foreground">
                {currentExercise.instructions}
              </p>
              <p className="text-[10px] text-primary mt-1.5">
                Target: {currentExercise.targetArea}
              </p>
            </div>

            {/* Video Placeholder */}
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="w-full p-3 rounded-xl border border-border bg-card flex items-center gap-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <PlayCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-foreground">
                  {showVideo ? "Hide" : "Show"} Demo
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Visual demonstration
                </p>
              </div>
            </button>

            <AnimatePresence>
              {showVideo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="h-32 rounded-xl bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                      <p className="text-[10px] text-muted-foreground">
                        Video coming soon
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={resetTimer}
                className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={toggleTimer}
                className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                {isRunning ? (
                  <Pause className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <Play className="h-5 w-5 text-primary-foreground" />
                )}
              </button>
              <button
                onClick={handleExerciseComplete}
                className="h-10 px-4 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <span className="text-xs font-medium text-muted-foreground">Skip</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Body Area Filter */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {(isEnglish ? "Filter by Area" : "Filtrar por Area")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedArea(null)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                    selectedArea === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  All
                </button>
                {BODY_AREAS.map((area) => (
                  <button
                    key={area.id}
                    onClick={() =>
                      setSelectedArea(selectedArea === area.id ? null : area.id)
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                      selectedArea === area.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/30"
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Routine Cards */}
            {ROUTINES.map((routine) => {
              const exerciseCount = selectedArea
                ? routine.exercises.filter((e) => e.targetArea === selectedArea)
                    .length
                : routine.exercises.length
              const typeIcon =
                routine.type === "pre"
                  ? Play
                  : routine.type === "post"
                  ? Timer
                  : Footprints

              return (
                <motion.div
                  key={routine.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl border border-border bg-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {(() => {
                        const Icon = typeIcon
                        return <Icon className="h-4 w-4 text-muted-foreground" />
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground">
                        {routine.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-muted-foreground">
                          {routine.duration}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {exerciseCount} exercises
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {routine.exercises.slice(0, 3).map((ex) => (
                          <span
                            key={ex.id}
                            className="px-1.5 py-0.5 rounded bg-muted text-[9px] text-muted-foreground"
                          >
                            {ex.name}
                          </span>
                        ))}
                        {routine.exercises.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] text-primary">
                            +{routine.exercises.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => startRoutine(routine.id)}
                      disabled={exerciseCount === 0}
                      size="sm"
                      className="h-8 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                    >
                      Start
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
