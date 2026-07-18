"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Activity, ArrowRight, Building2, Clock, Dumbbell, Flame, Home, Play, Swords, User, Zap } from "lucide-react"
import { WorkoutGenerator } from "@/components/workout-generator"
import { ActiveWorkoutSession } from "@/components/active-workout-session"
import { LiveWorkout } from "@/components/live-workout"
import { ExerciseDetailModal } from "@/components/exercise-detail-modal"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

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
      } catch {
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
      const data = await response.json().catch(() => null)
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
    <div className="relative max-w-3xl mx-auto space-y-5 pb-safe-nav md:space-y-7">
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-5rem] h-72 bg-[radial-gradient(circle_at_24%_10%,rgba(255,255,255,0.06),transparent_42%),radial-gradient(circle_at_86%_2%,rgba(255,255,255,0.04),transparent_36%)]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm md:rounded-2xl md:p-7"
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-foreground/30 via-foreground/10 to-foreground/5" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_34%,rgba(255,255,255,0.02))]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-foreground">
              AI Training
            </Badge>
            <h1 className="text-4xl font-black leading-none tracking-tight text-foreground md:text-6xl">
              Bio<span className="text-primary italic">{t("training_title").replace("Bio", "")}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-muted-foreground md:text-base">
              {t("training_subtitle")}
            </p>
          </div>
          <Button onClick={() => setShowGeneratorModal(true)} className="h-12 rounded-2xl bg-foreground px-6 text-sm font-black uppercase tracking-[0.16em] text-background hover:bg-muted/50">
            {t("training_new_workout")}
            <Zap className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.section>

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
                "flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition",
                isActive
                  ? "border-foreground/20 bg-foreground text-background"
                  : "border-border bg-muted/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {filter.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
              <div>
                <p className="text-sm font-black text-foreground">{locale === "en-US" ? "Generating your workout..." : "Gerando seu treino..."}</p>
                <p className="text-xs font-bold text-muted-foreground">{locale === "en-US" ? "This can take a few seconds." : "Isso pode levar alguns segundos."}</p>
              </div>
            </div>
          </motion.div>
        )}

        {!isGenerating && generationError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-red-100">{locale === "en-US" ? "Could not generate workout" : "Nao foi possivel gerar o treino"}</p>
                <p className="text-xs font-bold text-red-50/60">{generationError}</p>
              </div>
              <Button onClick={() => { setGenerationError(null); setShowGeneratorModal(true) }} className="h-10 rounded-2xl bg-foreground text-xs font-black uppercase tracking-widest text-background hover:bg-muted/50">
                {locale === "en-US" ? "Try again" : "Tentar novamente"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredWorkouts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredWorkouts.map((workout, index) => (
            <WorkoutCard key={`${workout.name}-${index}`} workout={workout} index={index} onStart={setActiveSessionWorkout} onStartLive={setLiveWorkout} onExerciseClick={setSelectedExerciseDetail} />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-muted/50 p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/50 text-muted-foreground">
            <Swords className="h-8 w-8" />
          </div>
          <h3 className="text-3xl font-black tracking-tight text-foreground">{t("training_empty_title")}</h3>
          <p className="mx-auto mt-3 max-w-md text-sm font-bold text-muted-foreground">{t("training_empty_body")}</p>
          <Button onClick={() => setShowGeneratorModal(true)} className="mt-6 h-12 rounded-2xl bg-foreground px-6 text-sm font-black uppercase tracking-widest text-background hover:bg-muted/50">
            {t("training_sync_btn")}
          </Button>
        </div>
      )}

      <Dialog open={showGeneratorModal} onOpenChange={setShowGeneratorModal}>
        <DialogContent className="max-w-4xl overflow-hidden rounded-2xl border border-border bg-card p-0 text-foreground shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-3xl font-black tracking-tight">{t("training_generator_title")}</h2>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">{t("training_generator_subtitle")}</p>
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
          onComplete={() => setActiveSessionWorkout(null)}
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
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="relative flex min-h-[440px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-foreground/20 via-foreground/10 to-foreground/5" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/2" />
      <div className="relative flex h-36 items-center justify-center border-b border-border bg-muted/50">
        <Dumbbell className="h-20 w-20 text-primary/28" />
        <Badge className="absolute right-5 top-5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-black uppercase tracking-widest text-foreground">
          {workout.category}
        </Badge>
      </div>

      <div className="relative flex flex-1 flex-col p-5">
        <h3 className="text-2xl font-black leading-tight tracking-tight text-foreground">{workout.name}</h3>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {workout.duration}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1.5">
            <Flame className="h-3.5 w-3.5 text-muted-foreground" />
            {workout.calories}
          </span>
        </div>

        <p className="mt-4 rounded-2xl border border-border bg-muted/50 p-3 text-sm font-bold italic leading-relaxed text-muted-foreground">
          "{workout.aiVerdict}"
        </p>

        <div className="mt-4 flex-1 space-y-2">
          {workout.exercises.slice(0, 3).map((exercise, exerciseIndex) => (
            <button
              key={`${exercise.name}-${exerciseIndex}`}
              type="button"
              onClick={() => onExerciseClick(exercise)}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-muted/50 p-3 text-left transition hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-xs font-black text-foreground">{exerciseIndex + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-foreground">{exercise.name}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{exercise.sets}x{exercise.reps} - {exercise.rest}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <Button onClick={() => onStart(workout)} className="flex-1 h-12 rounded-2xl bg-foreground text-sm font-black uppercase tracking-widest text-background hover:bg-muted/50">
            <Play className="mr-2 h-4 w-4 fill-background" />
            {t("training_start_btn")}
          </Button>
          <Button onClick={() => onStartLive(workout)} variant="ghost" className="h-12 rounded-2xl border border-border bg-muted/50 text-muted-foreground hover:bg-muted/50 px-3">
            <Zap className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  )
}
