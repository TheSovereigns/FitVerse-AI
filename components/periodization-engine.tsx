"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Zap,
  TrendingUp,
  RotateCcw,
  ChevronRight,
  Lock,
  BarChart3,
  Clock,
  Activity,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

interface Phase {
  id: string
  name: string
  nameKey: string
  duration: string
  focus: string
  intensity: string
  volume: string
  rest: string
  color: string
  icon: any
}

interface PhaseHistory {
  phaseId: string
  completedAt: string
  weekNumber: number
}

interface PeriodizationEngineProps {
  isLocked?: boolean
  currentWeek?: number
  experienceLevel?: string
  onUnlock?: () => void
}

const PHASES: Phase[] = [
  {
    id: "adaptation",
    name: "Adaptation",
    nameKey: "pe_adaptation",
    duration: "1-2 weeks",
    focus: "Movement patterns, form, baseline",
    intensity: "50-60% 1RM",
    volume: "Moderate (2-3 sets)",
    rest: "60-90s",
    color: "text-emerald-500",
    icon: Activity,
  },
  {
    id: "hypertrophy",
    name: "Hypertrophy",
    nameKey: "pe_hypertrophy",
    duration: "3-6 weeks",
    focus: "Muscle growth, time under tension",
    intensity: "65-80% 1RM",
    volume: "High (3-4 sets)",
    rest: "60-90s",
    color: "text-blue-500",
    icon: TrendingUp,
  },
  {
    id: "strength",
    name: "Strength",
    nameKey: "pe_strength",
    duration: "7-9 weeks",
    focus: "Maximal force production",
    intensity: "80-95% 1RM",
    volume: "Low-Moderate (2-4 sets)",
    rest: "3-5min",
    color: "text-orange-500",
    icon: Zap,
  },
  {
    id: "deload",
    name: "Deload",
    nameKey: "pe_deload",
    duration: "10th week",
    focus: "Recovery, regeneration",
    intensity: "40-60% 1RM",
    volume: "Low (1-2 sets)",
    rest: "90-120s",
    color: "text-purple-500",
    icon: RotateCcw,
  },
]

const STORAGE_KEY = "fitverse-periodization-history"

export function PeriodizationEngine({
  isLocked = false,
  currentWeek = 1,
  experienceLevel = "intermediate",
  onUnlock,
}: PeriodizationEngineProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [activePhase, setActivePhase] = useState(0)
  const [history, setHistory] = useState<PhaseHistory[]>([])
  const [showWorkout, setShowWorkout] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const saveHistory = useCallback((newHistory: PhaseHistory[]) => {
    setHistory(newHistory)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
    } catch {}
  }, [])

  const advancePhase = () => {
    const next = Math.min(activePhase + 1, PHASES.length - 1)
    if (next !== activePhase) {
      saveHistory([
        ...history,
        {
          phaseId: PHASES[activePhase].id,
          completedAt: new Date().toISOString(),
          weekNumber: currentWeek,
        },
      ])
    }
    setActivePhase(next)
  }

  const getPhaseProgress = () => {
    return ((activePhase + 1) / PHASES.length) * 100
  }

  const getWorkoutForPhase = (phase: Phase) => {
    const workouts: Record<string, string[]> = {
      adaptation: [
        "Bodyweight Squats - 2x12",
        "Push-ups (knee) - 2x8",
        "Dumbbell Rows - 2x10",
        "Plank Hold - 2x20s",
        "Glute Bridges - 2x12",
      ],
      hypertrophy: [
        "Barbell Back Squat - 4x8-10",
        "Bench Press - 4x8-10",
        "Bent Over Row - 4x8-10",
        "Overhead Press - 3x10-12",
        "Romanian Deadlift - 3x10-12",
      ],
      strength: [
        "Back Squat - 4x5 @85%",
        "Deadlift - 4x3 @90%",
        "Bench Press - 4x5 @85%",
        "Weighted Pull-up - 3x5",
        "Barbell Row - 3x5 @85%",
      ],
      deload: [
        "Goblet Squat - 2x10 @50%",
        "Dumbbell Press - 2x10 @50%",
        "Cable Row - 2x10 @50%",
        "Face Pulls - 2x12",
        "Mobility Work - 10 min",
      ],
    }
    return workouts[phase.id] || []
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
              {isEnglish ? "Periodization Engine" : "Motor de Periodização"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {isEnglish ? "Unlock automatic periodization to optimize your training phases." : "Desbloqueie a periodização automática para otimizar suas fases de treino."}
            </p>
          </div>
          <Button
            onClick={onUnlock}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isEnglish ? "Unlock Pro Feature" : "Desbloquear Recurso Pro"}
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
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isEnglish ? "Periodization Engine" : "Motor de Periodização"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {`${isEnglish ? "Week" : "Semana"} ${currentWeek} • ${experienceLevel}`}
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-primary">
          {activePhase + 1}/{PHASES.length}
        </span>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-5">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${getPhaseProgress()}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="space-y-3 mb-5">
        {PHASES.map((phase, index) => {
          const Icon = phase.icon
          const isActive = index === activePhase
          const isCompleted = index < activePhase

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-3 rounded-xl border transition-all ${
                isActive
                  ? "border-primary bg-primary/5"
                  : isCompleted
                  ? "border-border bg-card opacity-60"
                  : "border-border bg-card opacity-40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isActive ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? phase.color : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-sm font-medium ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {phase.name}
                    </h4>
                    {isCompleted && (
                      <span className="text-[10px] text-emerald-500 font-medium">
                        ✓ Done
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] text-primary font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        {phase.duration}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        {phase.intensity}
                      </span>
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="mt-2 space-y-1"
                    >
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">Focus:</span>{" "}
                        {phase.focus}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">Volume:</span>{" "}
                        {phase.volume}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">Rest:</span>{" "}
                        {phase.rest}
                      </p>
                    </motion.div>
                  )}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-2" />}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* AI Generated Workout */}
      <AnimatePresence>
        {showWorkout && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="p-3 rounded-xl border border-border bg-muted/50">
              <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-2">
                AI Generated Workout — {PHASES[activePhase].name}
              </p>
              <ul className="space-y-1.5">
                {getWorkoutForPhase(PHASES[activePhase]).map((exercise, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-center gap-2"
                  >
                    <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                    {exercise}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowWorkout(!showWorkout)}
          variant="outline"
          className="flex-1 h-10 text-xs border-border text-foreground"
        >
          {showWorkout ? "Hide" : isEnglish ? "View Workout" : "Ver Treino"}
        </Button>
        <Button
          onClick={advancePhase}
          disabled={activePhase >= PHASES.length - 1}
          className="flex-1 h-10 text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {activePhase >= PHASES.length - 1
            ? isEnglish ? "Complete" : "Completar"
            : isEnglish ? "Next Phase" : "Próxima Fase"}
        </Button>
      </div>

      {/* Phase History */}
      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {isEnglish ? "Phase History" : "Histórico de Fases"}
          </p>
          <div className="space-y-1">
            {history.slice(-3).map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground capitalize">
                  {entry.phaseId}
                </span>
                <span className="text-muted-foreground">
                  {new Date(entry.completedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
