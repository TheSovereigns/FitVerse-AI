"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Activity, ArrowRight, Building2, Clock, Dumbbell, Flame, Home, Play, Swords, User, Zap } from "lucide-react"
import { logger } from "@/lib/logger"
import { WorkoutGenerator } from "@/components/workout-generator"
import { ActiveWorkoutSession } from "@/components/active-workout-session"
import { LiveWorkout } from "@/components/live-workout"
import { ExerciseDetailModal } from "@/components/exercise-detail-modal"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import { recordAction } from "@/lib/gamification"

interface Exercise {
  name: string
  sets: string | number
  reps?: string
  duration?: string
  rest?: string | number
  notes?: string
}

interface Workout {
  name: string
  category: string
  duration: string
  calories: string
  difficulty: string
  aiVerdict: string
  exercises: Exercise[]
  criteria?: any
}

interface TrainingTabProps {
  metabolicPlan?: any
  scanHistory?: any[]
  userGoal?: string
}

const sampleWorkouts: Workout[] = [
  {
    name: "Treino Full Body",
    category: "Full Body",
    duration: "45 min",
    calories: "350 kcal",
    difficulty: "Intermediario",
    aiVerdict: "Excelente para definicao muscular com foco em movimentos compostos.",
    exercises: [
      { name: "Agachamento", sets: "4", reps: "12", rest: "60s" },
      { name: "Supino", sets: "4", reps: "12", rest: "60s" },
      { name: "Remada", sets: "4", reps: "12", rest: "60s" },
      { name: "Flexao", sets: "3", reps: "15", rest: "45s" },
      { name: "Prancha", sets: "3", reps: "30s", rest: "30s" },
    ],
    criteria: { location: "Casa (Sem Equipamento)" },
  },
  {
    name: "Treino Superior",
    category: "Superior",
    duration: "40 min",
    calories: "280 kcal",
    difficulty: "Iniciante",
    aiVerdict: "Ideal para construir consistencia e controle tecnico.",
    exercises: [
      { name: "Supino com halteres", sets: "3", reps: "12", rest: "60s" },
      { name: "Rosca direta", sets: "3", reps: "12", rest: "45s" },
      { name: "Desenvolvimento", sets: "3", reps: "12", rest: "60s" },
      { name: "Triceps pulley", sets: "3", reps: "12", rest: "45s" },
    ],
    criteria: { location: "Academia" },
  },
  {
    name: "Treino Cardio",
    category: "Cardio",
    duration: "30 min",
    calories: "300 kcal",
    difficulty: "Avancado",
    aiVerdict: "Alta intensidade para condicionamento e gasto calorico.",
    exercises: [
      { name: "Burpee", sets: "4", reps: "15", rest: "30s" },
      { name: "Polichinelo", sets: "4", reps: "30s", rest: "30s" },
      { name: "Afundo", sets: "3", reps: "12", rest: "45s" },
      { name: "Mountain climber", sets: "4", reps: "20s", rest: "30s" },
    ],
    criteria: { location: "Casa (Sem Equipamento)" },
  },
]

export function TrainingTab({ userGoal }: TrainingTabProps) {
  const { t, locale } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generatedWorkouts, setGeneratedWorkouts] = useState<Workout[]>([])
  const [activeFilter, setActiveFilter] = useState("all")
  const [showGeneratorModal, setShowGeneratorModal] = useState(false)
  const [activeSessionWorkout, setActiveSessionWorkout] = useState<Workout | null>(null)
  const [liveWorkout, setLiveWorkout] = useState<Workout | null>(null)
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<any>(null)

  useEffect(() => {
    const savedWorkouts = localStorage.getItem("nutritrain-workouts")
    if (savedWorkouts) {
      try {
        setGeneratedWorkouts(JSON.parse(savedWorkouts))
      } catch (e) {
        logger.error("[TrainingTab] Failed to parse nutritrain-workouts:", e)
        setGeneratedWorkouts(sampleWorkouts)
      }
    } else {
      setGeneratedWorkouts(sampleWorkouts)
    }
  }, [])

  useEffect(() => {
    if (generatedWorkouts.length > 0) {
      localStorage.setItem("nutritrain-workouts", JSON.stringify(generatedWorkouts))
    }
  }, [generatedWorkouts])

  const handleGenerateWorkouts = async (criteria: any) => {
    setIsGenerating(true)
    setGenerationError(null)
    setShowGeneratorModal(false)

    try {
      let token = ""
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes("sb-") && key.includes("-auth-token")) {
          const storedSession = localStorage.getItem(key)
          if (storedSession) {
            const parsed = JSON.parse(storedSession)
            if (parsed?.access_token) {
              token = parsed.access_token
              break
            }
          }
        }
      }

      if (!token) {
        const { data: { session } } = await supabase.auth.getSession()
        token = session?.access_token || ""
      }

      if (!token) {
        throw new Error(locale === "en-US" ? "Please sign in again before generating a workout." : "Entre novamente antes de gerar um treino.")
      }

      const response = await fetch("/api/generate-workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ ...criteria, goal: userGoal || "Hypertrophy & Definition", locale }),
      })
      const data = await response.json().catch((e) => { logger.error("[TrainingTab] Failed to parse workout response:", e); return null })
      if (!response.ok) {
        const message = data?.error || t("training_error_ai")
        setGenerationError(message)
        toast.error(message)
        return
      }

      if (!Array.isArray(data?.workouts) || data.workouts.length === 0) {
        throw new Error(locale === "en-US" ? "The AI did not return a workout. Try different options." : "A IA nao retornou um treino. Tente outras opcoes.")
      }

      setGeneratedWorkouts(data.workouts.map((workout: any) => ({ ...workout, criteria })))
      setActiveFilter("all")
      toast.success(locale === "en-US" ? "Workout generated!" : "Treino gerado!")
    } catch (error) {
      const message = error instanceof Error ? error.message : t("training_error_ai")
      setGenerationError(message)
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const filters = [
    { id: "all", label: t("filter_all"), icon: Zap },
    { id: "home", label: t("filter_home"), icon: Home },
    { id: "gym", label: t("filter_gym"), icon: Building2 },
    { id: "dumbbells", label: t("filter_dumbbells"), icon: Dumbbell },
    { id: "bodyweight", label: t("filter_bodyweight"), icon: User },
  ]

  const filteredWorkouts = generatedWorkouts.filter((workout) => {
    if (activeFilter === "all") return true
    const location = (workout.criteria?.location || "").toLowerCase()
    switch (activeFilter) {
      case "gym": return location === "academia" || location === "gym"
      case "home": return location.includes("casa") || location.includes("home")
      case "dumbbells": return location.includes("halteres") || location.includes("dumbbell")
      case "bodyweight": return location.includes("sem equipamento") || location.includes("bodyweight") || location.includes("body weight")
      default: return false
    }
  })

  return (
    <div className="relative max-w-2xl mx-auto space-y-6 pb-safe-nav">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-2"
      >
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell className="h-4 w-4 text-brand" />
          <span className="text-xs font-medium text-brand">AI Training</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("training_title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("training_subtitle")}
            </p>
          </div>
          <Button onClick={() => setShowGeneratorModal(true)} className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand/90">
            <Zap className="mr-2 h-4 w-4" />
            {t("training_new_workout")}
          </Button>
        </div>
      </motion.section>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.id
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {filter.label}
            </button>
          )
        })}
      </div>

      {/* Generating / Error */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 animate-pulse text-brand" />
              <div>
                <p className="text-sm font-medium text-foreground">{locale === "en-US" ? "Generating your workout..." : "Gerando seu treino..."}</p>
                <p className="text-xs text-muted-foreground">{locale === "en-US" ? "This can take a few seconds." : "Isso pode levar alguns segundos."}</p>
              </div>
            </div>
          </motion.div>
        )}

        {!isGenerating && generationError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-destructive/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">{locale === "en-US" ? "Could not generate workout" : "Nao foi possivel gerar o treino"}</p>
                <p className="text-xs text-destructive/70">{generationError}</p>
              </div>
              <Button onClick={() => { setGenerationError(null); setShowGeneratorModal(true) }} className="h-9 rounded-xl bg-foreground text-xs font-medium text-background hover:bg-foreground/90">
                {locale === "en-US" ? "Try again" : "Tentar novamente"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout Cards */}
      {filteredWorkouts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredWorkouts.map((workout, index) => (
            <WorkoutCard key={`${workout.name}-${index}`} workout={workout} index={index} onStart={setActiveSessionWorkout} onStartLive={setLiveWorkout} onExerciseClick={setSelectedExerciseDetail} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl glass-strong p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Swords className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{t("training_empty_title")}</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t("training_empty_body")}</p>
          <Button onClick={() => setShowGeneratorModal(true)} className="mt-5 h-11 rounded-xl bg-foreground px-6 text-sm font-medium text-background hover:bg-foreground/90">
            {t("training_sync_btn")}
          </Button>
        </div>
      )}

      {/* Generator Modal */}
      <Dialog open={showGeneratorModal} onOpenChange={setShowGeneratorModal}>
        <DialogContent className="max-w-4xl overflow-hidden rounded-2xl border border-border bg-card p-0 text-foreground shadow-xl">
          <div className="border-b border-border p-6">
            <h2 className="text-xl font-bold">{t("training_generator_title")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("training_generator_subtitle")}</p>
          </div>
          <ScrollArea className="max-h-[70vh] p-6">
            <WorkoutGenerator onGenerate={handleGenerateWorkouts} isLoading={isGenerating} />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {activeSessionWorkout && (
        <ActiveWorkoutSession
          workout={activeSessionWorkout}
          onClose={() => setActiveSessionWorkout(null)}
          onComplete={() => {
            const result = recordAction("workout")
            if (result.newAchievements.length > 0) {
              toast.success(locale === "en-US" ? `Achievement unlocked!` : `Conquista desbloqueada!`)
            }
            setActiveSessionWorkout(null)
          }}
        />
      )}

      {liveWorkout && (
        <LiveWorkout
          workout={liveWorkout}
          onBack={() => setLiveWorkout(null)}
        />
      )}

      {selectedExerciseDetail && (
        <ExerciseDetailModal
          exercise={{ ...selectedExerciseDetail, id: selectedExerciseDetail.name, stepByStepImages: [], safetyTips: [], commonMistakes: [], aiInsight: t("training_ai_insight") }}
          topProducts={[]}
          onClose={() => setSelectedExerciseDetail(null)}
          onFeedback={() => {}}
        />
      )}
    </div>
  )
}

function WorkoutCard({ workout, index, onStart, onStartLive, onExerciseClick }: { workout: Workout; index: number; onStart: (workout: Workout) => void; onStartLive: (workout: Workout) => void; onExerciseClick: (exercise: Exercise) => void }) {
  const { t } = useTranslation()

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col overflow-hidden rounded-2xl glass-strong"
    >
      {/* Card header with icon */}
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10">
            <Dumbbell className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{workout.name}</h3>
            <span className="text-xs text-muted-foreground">{workout.category}</span>
          </div>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          {workout.difficulty}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Stats */}
        <div className="mb-4 flex gap-3">
          <span className="flex items-center gap-1 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {workout.duration}
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
            <Flame className="h-3 w-3" />
            {workout.calories}
          </span>
        </div>

        {/* AI Verdict */}
        <p className="mb-4 rounded-xl bg-muted/30 p-3 text-xs italic text-muted-foreground">
          &ldquo;{workout.aiVerdict}&rdquo;
        </p>

        {/* Exercises */}
        <div className="mb-4 flex-1 space-y-2">
          {workout.exercises.slice(0, 3).map((exercise, exerciseIndex) => (
            <button
              key={`${exercise.name}-${exerciseIndex}`}
              type="button"
              onClick={() => onExerciseClick(exercise)}
              className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 text-left transition hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-bold text-foreground">{exerciseIndex + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{exercise.name}</p>
                  <p className="text-[10px] text-muted-foreground">{exercise.sets}x{exercise.reps} - {exercise.rest}</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={() => onStart(workout)} className="flex-1 h-11 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand/90">
            <Play className="mr-2 h-4 w-4 fill-background" />
            {t("training_start_btn")}
          </Button>
          <Button onClick={() => onStartLive(workout)} variant="outline" className="h-11 w-11 rounded-xl border-border px-0">
            <Zap className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  )
}
