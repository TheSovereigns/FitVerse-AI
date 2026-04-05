"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Dumbbell, Flame, Clock, Zap, Play, Home, Building2, User, ArrowRight, Swords, Activity } from "lucide-react"
import { WorkoutGenerator } from "@/components/workout-generator"
import { ActiveWorkoutSession } from "@/components/active-workout-session"
import { ExerciseDetailModal } from "@/components/exercise-detail-modal"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

interface Exercise {
  name: string
  sets: string
  reps: string
  rest: string
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

export function TrainingTab({ metabolicPlan, scanHistory, userGoal }: TrainingTabProps) {
  const { t, locale } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedWorkouts, setGeneratedWorkouts] = useState<Workout[]>([])
  const [activeFilter, setActiveFilter] = useState("all")
  const [showGeneratorModal, setShowGeneratorModal] = useState(false)
  const [sortBy, setSortBy] = useState("default")
  const [activeSessionWorkout, setActiveSessionWorkout] = useState<Workout | null>(null)
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<any>(null)

  const sampleWorkouts: Workout[] = [
    {
      name: "Treino Full Body",
      category: "Full Body",
      duration: "45 min",
      calories: "350 kcal",
      difficulty: "Intermediário",
      aiVerdict: "Excelente para definição muscular.",
      exercises: [
        { name: "Agachamento", sets: "4", reps: "12", rest: "60s" },
        { name: "Supino", sets: "4", reps: "12", rest: "60s" },
        { name: "Remada", sets: "4", reps: "12", rest: "60s" },
        { name: "Flexão", sets: "3", reps: "15", rest: "45s" },
        { name: "Prancha", sets: "3", reps: "30s", rest: "30s" },
      ],
      criteria: { location: "Casa (Sem Equipamento)" }
    },
    {
      name: "Treino Superior",
      category: "Superior",
      duration: "40 min",
      calories: "280 kcal",
      difficulty: "Iniciante",
      aiVerdict: "Ideal para quem está começando.",
      exercises: [
        { name: "Supino com halteres", sets: "3", reps: "12", rest: "60s" },
        { name: "Rosca direta", sets: "3", reps: "12", rest: "45s" },
        { name: "Desenvolvimento", sets: "3", reps: "12", rest: "60s" },
        { name: "Tríceps pulley", sets: "3", reps: "12", rest: "45s" },
      ],
      criteria: { location: "Academia" }
    },
    {
      name: "Treino Cardio",
      category: "Cardio",
      duration: "30 min",
      calories: "300 kcal",
      difficulty: "Avançado",
      aiVerdict: "Alta queima calórica.",
      exercises: [
        { name: "Burpee", sets: "4", reps: "15", rest: "30s" },
        { name: "Polichinelo", sets: "4", reps: "30s", rest: "30s" },
        { name: "Afundo", sets: "3", reps: "12", rest: "45s" },
        { name: "Mountain climber", sets: "4", reps: "20s", rest: "30s" },
      ],
      criteria: { location: "Casa (Sem Equipamento)" }
    },
  ]

  useEffect(() => {
    const savedWorkouts = localStorage.getItem("nutritrain-workouts")
    if (savedWorkouts) {
      try { setGeneratedWorkouts(JSON.parse(savedWorkouts)) }
      catch (e) { 
        console.error("Failed to load workouts:", e)
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
    setShowGeneratorModal(false)
    if (criteria.location === "Academia") setActiveFilter("gym")
    else if (criteria.location === "Casa (Halteres)") setActiveFilter("dumbbells")
    else if (criteria.location === "Casa (Sem Equipamento)") setActiveFilter("bodyweight")

    try {
      const response = await fetch("/api/generate-workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...criteria, goal: userGoal || "Hypertrophy & Definition", locale }),
      })
      if (!response.ok) throw new Error("Failed to generate workouts")
      const data = await response.json()
      setGeneratedWorkouts(data.workouts.map((w: any) => ({ ...w, criteria })))
    } catch (error) {
      console.error("Error generating workouts:", error)
      toast.error("Error connecting to AI.")
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

  const filteredWorkouts = generatedWorkouts.filter(workout => {
    if (activeFilter === "all") return true
    const location = (workout.criteria?.location || "").toLowerCase()
    switch (activeFilter) {
      case "gym": return location === "academia"
      case "home": return location.includes("casa")
      case "dumbbells": return location === "casa (halteres)"
      case "bodyweight": return location === "casa (sem equipamento)"
      default: return false
    }
  })

  return (
    <div className="space-y-6 md:space-y-10 pb-safe-nav">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-none">
          Bio<span className="text-primary italic">{t("training_title").replace("Bio", "")}</span>
        </h1>
        <p className="text-xs md:text-lg font-bold text-muted-foreground mt-2 md:mt-3 opacity-50 uppercase tracking-[0.2em]">
          {t("training_subtitle")}
        </p>
      </motion.div>

      {/* Filter Pills — horizontally scrollable on mobile */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 px-0.5 mobile-scroll-x">
        {filters.map(filter => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.id
          return (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "flex items-center gap-2 md:gap-3 px-5 md:px-8 py-3 md:py-4 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-500 shadow-xl whitespace-nowrap shrink-0",
                isActive
                  ? "mesh-gradient text-white shadow-primary/20 scale-105"
                  : "glass-strong border-white/10 text-muted-foreground opacity-60 hover:opacity-100"
              )}
            >
              <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              {filter.label}
            </motion.button>
          )
        })}
      </div>

      {/* Empty State */}
      <AnimatePresence>
        {!isGenerating && generatedWorkouts.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl mx-auto pt-4 md:pt-12">
            <div className="relative glass-strong border-white/20 rounded-[3rem] md:rounded-[4rem] p-10 md:p-16 text-center shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden group">
              <div className="absolute inset-0 mesh-gradient opacity-5 blur-3xl animate-pulse" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] bg-primary/10 flex items-center justify-center mb-6 md:mb-8 border border-primary/20 shadow-inner">
                  <Swords className="w-8 h-8 md:w-12 md:h-12 text-primary" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-3 md:mb-4">{t("training_empty_title")}</h3>
                <p className="text-base md:text-lg text-muted-foreground font-bold opacity-60 mb-8 md:mb-12">
                  {t("training_empty_body")}
                </p>
                <Dialog open={showGeneratorModal} onOpenChange={setShowGeneratorModal}>
                  <DialogTrigger asChild>
                    <Button className="w-full h-16 md:h-24 rounded-[2rem] mesh-gradient text-white font-black text-lg md:text-2xl shadow-2xl haptic-press group luminous-edge">
                      {t("training_sync_btn")}
                      <Zap className="w-6 h-6 md:w-8 md:h-8 ml-3 md:ml-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong text-foreground sm:max-w-2xl rounded-[3rem] md:rounded-[4rem] border-white/10 p-0 shadow-2xl overflow-hidden backdrop-blur-3xl mx-3 md:mx-0">
                    <div className="p-8 md:p-12 pb-0">
                      <h2 className="text-3xl md:text-4xl font-black tracking-tighter">{t("training_generator_title")}</h2>
                      <p className="text-muted-foreground text-sm md:text-lg font-bold opacity-40 uppercase tracking-widest mt-2">{t("training_generator_subtitle")}</p>
                    </div>
                    <ScrollArea className="max-h-[70vh] p-8 md:p-12 pt-6 md:pt-8">
                      <WorkoutGenerator onGenerate={handleGenerateWorkouts} isLoading={isGenerating} />
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout Cards */}
      {filteredWorkouts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest opacity-40">{generatedWorkouts.length} {t("training_title").toLowerCase()}s</p>
            <Button 
              onClick={() => setShowGeneratorModal(true)}
              className="h-10 px-4 rounded-full glass border border-white/10 text-xs font-black uppercase tracking-widest"
            >
              + Novo Treino
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          {filteredWorkouts.map((workout, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <WorkoutCard workout={workout} onStart={setActiveSessionWorkout} onExerciseClick={setSelectedExerciseDetail} />
            </motion.div>
          ))}
          </div>
        </div>
      )}

      <Dialog open={showGeneratorModal} onOpenChange={setShowGeneratorModal}>
        <DialogContent className="glass-strong text-foreground sm:max-w-2xl rounded-[3rem] md:rounded-[4rem] border-white/10 p-0 shadow-2xl overflow-hidden backdrop-blur-3xl mx-3 md:mx-0">
          <div className="p-8 md:p-12 pb-0">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter">{t("training_generator_title")}</h2>
            <p className="text-muted-foreground text-sm md:text-lg font-bold opacity-40 uppercase tracking-widest mt-2">{t("training_generator_subtitle")}</p>
          </div>
          <ScrollArea className="max-h-[70vh] p-8 md:p-12 pt-6 md:pt-8">
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

      {selectedExerciseDetail && (
        <ExerciseDetailModal
          exercise={{ ...selectedExerciseDetail, id: selectedExerciseDetail.name, stepByStepImages: [], safetyTips: [], commonMistakes: [], aiInsight: "Great exercise." }}
          topProducts={[]}
          onClose={() => setSelectedExerciseDetail(null)}
          onFeedback={() => {}}
        />
      )}
    </div>
  )
}

function WorkoutCard({ workout, onStart, onExerciseClick }: { workout: Workout; onStart: (w: Workout) => void; onExerciseClick: (ex: Exercise) => void }) {
  const { t } = useTranslation()
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative glass-strong border-white/20 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)] group cursor-pointer h-full flex flex-col"
    >
      {/* Card visual header */}
      <div className="relative h-40 md:h-64 w-full bg-primary/5 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-10 group-hover:opacity-20 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Dumbbell className="w-16 h-16 md:w-24 md:h-24 text-primary opacity-20 group-hover:scale-110 transition-transform duration-700" />
        </div>
        <div className="absolute top-5 right-5 md:top-8 md:right-8">
          <Badge className="bg-primary text-white border-none font-black text-[10px] tracking-widest px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-lg">
            {workout.category.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="p-6 md:p-10 flex-1 flex flex-col">
        <div className="mb-4 md:mb-6">
          <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">{workout.name}</h3>
          <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-3 text-[10px] md:text-xs font-black uppercase tracking-widest opacity-40">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 md:w-4 md:h-4" /> {workout.duration}</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 md:w-4 md:h-4" /> {workout.calories} KCAL</span>
          </div>
        </div>

        <div className="glass-strong bg-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 mb-5 md:mb-8">
          <p className="text-xs md:text-sm font-bold text-muted-foreground leading-relaxed italic opacity-80">"{workout.aiVerdict}"</p>
        </div>

        <div className="space-y-2 md:space-y-4 mb-6 md:mb-10 flex-1">
          {workout.exercises.slice(0, 3).map((ex, i) => (
            <div
              key={i}
              onClick={(e) => { e.stopPropagation(); onExerciseClick(ex) }}
              className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-white/5 transition-all group/item cursor-pointer"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs md:text-sm">
                  {i + 1}
                </div>
                <div>
                  <p className="font-black text-xs md:text-sm tracking-tight">{ex.name}</p>
                  <p className="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">{ex.sets}x{ex.reps} • {ex.rest}</p>
                </div>
              </div>
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          ))}
        </div>

        <Button
          className="w-full h-14 md:h-20 rounded-[1.75rem] md:rounded-[2rem] mesh-gradient text-white font-black text-base md:text-lg shadow-2xl haptic-press luminous-edge"
          onClick={(e) => { e.stopPropagation(); onStart(workout) }}
        >
          <Play className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 fill-white" /> {t("training_start_btn")}
        </Button>
      </div>
    </motion.div>
  )
}