"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, Flame, Clock, Trophy, Zap, Play, Settings2, Home, Building2, User } from "lucide-react"
import { WorkoutGenerator } from "@/components/workout-generator"
import { ActiveWorkoutSession } from "@/components/active-workout-session"
import { ExerciseDetailModal } from "@/components/exercise-detail-modal"
import { toast } from "sonner"

interface TrainingTabProps {
  metabolicPlan?: any
  scanHistory?: any[]
  userGoal?: string
}

export function TrainingTab({ metabolicPlan, scanHistory, userGoal }: TrainingTabProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedWorkouts, setGeneratedWorkouts] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState("all")
  const [showGeneratorModal, setShowGeneratorModal] = useState(false)
  const [activeSessionWorkout, setActiveSessionWorkout] = useState<any>(null)
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<any>(null)

  const handleGenerateWorkouts = async (criteria: any) => {
    setIsGenerating(true)
    setShowGeneratorModal(false) // Fecha o modal ao iniciar

    // Atualiza o filtro automaticamente para corresponder ao treino gerado
    if (criteria.location === "Academia") setActiveFilter("gym")
    else if (criteria.location === "Casa (Halteres)") setActiveFilter("dumbbells")
    else if (criteria.location === "Casa (Sem Equipamento)") setActiveFilter("bodyweight")

    try {
      const response = await fetch("/api/generate-workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...criteria,
          goal: userGoal || "Hipertrofia e Definição",
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        throw new Error(`Failed to generate workouts: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      // Adiciona o critério de geração a cada treino para uma filtragem robusta
      const workoutsWithCriteria = data.workouts.map((w: any) => ({
        ...w,
        criteria: criteria,
      }))
      setGeneratedWorkouts(workoutsWithCriteria)
    } catch (error) {
      console.error("Error generating workouts:", error)
      toast.error("Erro ao conectar com a IA. Gerando treino offline.")

      // Fallback: Gerar treino mockado para não quebrar a experiência
      const isHomeNoEquip = criteria.location === "Casa (Sem Equipamento)"
      const isHomeDumbbells = criteria.location === "Casa (Halteres)"
      
      const mockExercises = isHomeNoEquip ? [
        { name: "Polichinelos", sets: "3", reps: "50", rest: "30s" },
        { name: "Agachamento Livre", sets: "4", reps: "20", rest: "45s" },
        { name: "Flexão de Braço", sets: "3", reps: "12", rest: "60s" },
        { name: "Abdominal Supra", sets: "3", reps: "20", rest: "45s" },
        { name: "Prancha Isométrica", sets: "3", reps: "45s", rest: "45s" }
      ] : isHomeDumbbells ? [
        { name: "Agachamento Goblet", sets: "4", reps: "12", rest: "60s" },
        { name: "Desenvolvimento com Halteres", sets: "3", reps: "12", rest: "60s" },
        { name: "Remada Unilateral", sets: "3", reps: "12", rest: "60s" },
        { name: "Supino Reto com Halteres", sets: "3", reps: "12", rest: "60s" },
        { name: "Rosca Martelo", sets: "3", reps: "15", rest: "45s" }
      ] : [
        { name: "Supino Reto", sets: "4", reps: "10", rest: "90s" },
        { name: "Agachamento Livre", sets: "4", reps: "10", rest: "90s" },
        { name: "Puxada Alta", sets: "3", reps: "12", rest: "60s" },
        { name: "Leg Press 45", sets: "3", reps: "12", rest: "60s" },
        { name: "Elevação Lateral", sets: "3", reps: "15", rest: "45s" }
      ]

      const mockWorkout = {
        name: `Treino ${criteria.focus} (${criteria.location})`,
        category: criteria.focus,
        duration: criteria.duration,
        calories: "350",
        difficulty: criteria.level,
        aiVerdict: "Plano gerado em modo offline. Foco na consistência e execução perfeita.",
        exercises: mockExercises,
        criteria: criteria
      }

      setGeneratedWorkouts([mockWorkout])
    } finally {
      setIsGenerating(false)
    }
  }

  const filters = [
    { id: "all", label: "Todos", icon: Zap },
    { id: "home", label: "Em Casa", icon: Home },
    { id: "gym", label: "Academia", icon: Building2 },
    { id: "dumbbells", label: "Halteres", icon: Dumbbell },
    { id: "bodyweight", label: "Sem Equipamento", icon: User },
  ]

  // Lógica de Filtragem
  const filteredWorkouts = generatedWorkouts.filter((workout) => {
    if (activeFilter === "all") return true
    
    const location = (workout.criteria?.location || "").toLowerCase()
    
    switch (activeFilter) {
      case "gym":
        return location === "academia"
      case "home":
        return location.includes("casa") // Pega "casa (halteres)" e "casa (sem equipamento)"
      case "dumbbells":
        return location === "casa (halteres)"
      case "bodyweight":
        return location === "casa (sem equipamento)"
      default:
        return false
    }
  })

  return (
    <div className="space-y-6 pb-20 text-slate-300">
      {/* Header da Seção */}
      <div className="px-4 pt-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">NutriTrain <span className="text-[#FF8C00]">AI</span></h2>
            <p className="text-xs text-slate-400">Treinos personalizados para sua longevidade</p>
          </div>
          <Dialog open={showGeneratorModal} onOpenChange={setShowGeneratorModal}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" className="border-[#1F1F1F] bg-[#121212] text-[#FF8C00] hover:bg-[#1F1F1F] hover:border-[#FF8C00]/50 transition-all duration-300 ease-in-out">
                <Settings2 className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#121212]/90 backdrop-blur-xl border-[#1F1F1F] text-white sm:max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Ajuste Fino da IA</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <WorkoutGenerator onGenerate={handleGenerateWorkouts} isLoading={isGenerating} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros Inteligentes (Chips) */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-3 pb-2">
            {filters.map((filter) => {
              const Icon = filter.icon
              const isActive = activeFilter === filter.id
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                    ${isActive
                      ? "bg-[#FF8C00] text-black border-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.3)]" 
                      : "bg-[#121212] text-slate-400 border-[#1F1F1F] hover:border-[#FF8C00]/50 hover:text-white"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </button>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>

      {/* Estado Vazio ou Loading */}
      {!isGenerating && generatedWorkouts.length === 0 && (
        <div className="px-4 py-12 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#121212] flex items-center justify-center mx-auto mb-4 border border-[#1F1F1F]">
            <Dumbbell className="h-10 w-10 text-slate-700" />
          </div>
          <h3 className="text-lg font-medium text-white">Nenhum treino gerado</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Use o botão de configurações acima para personalizar e gerar seu plano de treino com IA.
          </p>
          <Button 
            onClick={() => setShowGeneratorModal(true)}
            className="bg-[#FF8C00] hover:bg-[#e67e00] text-black font-bold mt-4 transition-all duration-300 ease-in-out"
          >
            Configurar Treino
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="px-4 py-12 space-y-6">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-[#121212] border-[#1F1F1F] overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                <div className="h-48 bg-[#1A1A1A] animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-6 w-3/4 bg-[#1A1A1A] rounded animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-4 w-16 bg-[#1A1A1A] rounded animate-pulse" />
                    <div className="h-4 w-16 bg-[#1A1A1A] rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lista de Treinos Gerados */}
      {filteredWorkouts.length > 0 && (
        <div className="px-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Seus Treinos</h3>
            <Badge variant="outline" className="border-[#FF8C00] text-[#FF8C00] bg-[#FF8C00]/10">
              {filteredWorkouts.length} Opções
            </Badge>
          </div>

          <div className="grid gap-6">
            {filteredWorkouts.map((workout, index) => (
              <WorkoutCard 
                key={index} 
                workout={workout} 
                onStart={setActiveSessionWorkout} 
                onExerciseClick={setSelectedExerciseDetail}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modo de Treino Ativo (Overlay) */}
      {activeSessionWorkout && (
        <ActiveWorkoutSession 
          workout={activeSessionWorkout} 
          onClose={() => setActiveSessionWorkout(null)}
          onComplete={() => setActiveSessionWorkout(null)}
        />
      )}

      {/* Modal de Detalhes do Exercício (Preview) */}
      {selectedExerciseDetail && (
        <ExerciseDetailModal
          exercise={{
            ...selectedExerciseDetail,
            id: selectedExerciseDetail.name, // Fallback ID
            stepByStepImages: [], // Fallback
            safetyTips: ["Mantenha a postura correta", "Respire adequadamente"], // Fallback
            commonMistakes: ["Exagerar na carga", "Movimento incompleto"], // Fallback
            aiInsight: "Exercício excelente para seu objetivo.", // Fallback
          }}
          topProducts={scanHistory ? scanHistory.filter(i => i.score >= 70).slice(0, 3) : []}
          onClose={() => setSelectedExerciseDetail(null)}
          onFeedback={() => {}}
        />
      )}
    </div>
  )
}

function WorkoutCard({ workout, onStart, onExerciseClick }: { workout: any, onStart: (workout: any) => void, onExerciseClick: (ex: any) => void }) {
  // Estado local removido em favor do controle global da sessão

  return (
    <Card className="bg-[#121212] border-[#1F1F1F] overflow-hidden hover:border-[#FF8C00]/50 transition-all duration-300 ease-in-out group shadow-lg rounded-2xl">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full bg-[#1A1A1A]">
          {/* Placeholder visual para o treino - idealmente seria uma imagem gerada ou do banco */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#121212] to-transparent">
            <Dumbbell className="h-16 w-16 text-slate-800 group-hover:text-[#FF8C00] transition-colors duration-300" />
          </div>
          
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge className="bg-black/60 backdrop-blur text-white border-none hover:bg-black/80">
              {workout.category}
            </Badge>
          </div>
          
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-xl font-bold text-orange-500 mb-1">{workout.name}</h3>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#FF8C00]" />
                {workout.duration}
              </div>
              <div className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-red-500" />
                {workout.calories} kcal
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-yellow-500" />
                {workout.difficulty}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#1F1F1F]">
          <p className="text-sm text-slate-400 italic">
            "<span className="text-slate-300">{workout.aiVerdict}</span>"
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[#FF8C00] uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4" /> Circuito Principal
          </h4>
          
          <div className="space-y-3">
            {workout.exercises.slice(0, 3).map((exercise: any, idx: number) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors cursor-pointer group/item"
                onClick={() => onExerciseClick(exercise)}
              >
                <div className="h-10 w-10 rounded-lg bg-[#1F1F1F] flex-shrink-0 overflow-hidden">
                  {/* Placeholder para imagem do exercício */}
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-600">
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover/item:text-[#FF8C00] transition-colors">{exercise.name}</p>
                  <p className="text-xs text-slate-500">
                    {exercise.sets} x {exercise.reps} • {exercise.rest} descanso
                  </p>
                </div>
              </div>
            ))}
            {workout.exercises.length > 3 && (
              <p className="text-xs text-center text-slate-500 pt-1">
                + {workout.exercises.length - 3} exercícios adicionais
              </p>
            )}
          </div>
        </div>

        <Button 
          className={`w-full font-bold transition-all duration-300 ease-in-out ${
            "bg-gradient-to-r from-[#FF8C00] to-[#FF4500] hover:shadow-orange-500/40 text-white"
          }`}
          onClick={() => {
            onStart(workout)
            toast.success(`Treino Iniciado: ${workout.name}`, {
              description: "Modo de foco ativado.",
              duration: 2000,
            })
          }}
        >
          <Play className="h-4 w-4 mr-2 fill-white" /> Iniciar Treino
        </Button>
      </CardContent>
    </Card>
  )
}