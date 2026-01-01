"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dumbbell, Flame, Clock, Trophy, Zap, Play, Settings2, Home, Building2, User, ArrowRight, Trash2, Download, ArrowUpDown, Feather, Swords, Activity } from "lucide-react"
import { WorkoutGenerator } from "@/components/workout-generator"
import { ActiveWorkoutSession } from "@/components/active-workout-session"
import { ExerciseDetailModal } from "@/components/exercise-detail-modal"
import { toast } from "sonner"

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
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedWorkouts, setGeneratedWorkouts] = useState<Workout[]>([])
  const [activeFilter, setActiveFilter] = useState("all")
  const [showGeneratorModal, setShowGeneratorModal] = useState(false)
  const [sortBy, setSortBy] = useState("default")
  const [activeSessionWorkout, setActiveSessionWorkout] = useState<Workout | null>(null)
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<any>(null)

  // Carregar treinos salvos ao iniciar
  useEffect(() => {
    const savedWorkouts = localStorage.getItem("nutritrain-workouts")
    if (savedWorkouts) {
      try {
        setGeneratedWorkouts(JSON.parse(savedWorkouts))
      } catch (e) {
        console.error("Falha ao carregar treinos salvos:", e)
      }
    }
  }, [])

  // Salvar treinos sempre que houver atualização
  useEffect(() => {
    if (generatedWorkouts.length > 0) {
      localStorage.setItem("nutritrain-workouts", JSON.stringify(generatedWorkouts))
    }
  }, [generatedWorkouts])

  const handleClearHistory = () => {
    if (window.confirm("Tem certeza que deseja limpar todo o histórico? Essa ação não pode ser desfeita.")) {
      localStorage.removeItem("nutritrain-workouts")
      setGeneratedWorkouts([])
      toast.success("Histórico de treinos limpo.")
    }
  }

  const handleExportWorkouts = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generatedWorkouts, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "meus-treinos-nutritrain.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
    toast.success("Treinos exportados com sucesso!")
  }

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
  }).sort((a, b) => {
    if (sortBy === "default") return 0

    if (sortBy.includes("difficulty")) {
      const getWeight = (w: Workout) => {
        const d = w.difficulty.toLowerCase()
        if (d.includes("iniciante")) return 1
        if (d.includes("intermediário") || d.includes("intermediario")) return 2
        if (d.includes("avançado") || d.includes("avancado")) return 3
        return 0
      }
      return sortBy === "difficulty_desc" ? getWeight(b) - getWeight(a) : getWeight(a) - getWeight(b)
    }

    if (sortBy.includes("duration")) {
      const getDuration = (w: Workout) => parseInt(w.duration.replace(/\D/g, '')) || 0
      return sortBy === "duration_desc" ? getDuration(b) - getDuration(a) : getDuration(a) - getDuration(b)
    }

    return 0
  })

  return (
    <div className="px-4 pt-8 pb-24 text-foreground bg-background min-h-screen">
      {/* Cabeçalho text-foreground */}
      <div className="mb-6">
        <h1 className="text-4xl font-black mb-2 text-balance tracking-tighter uppercase italic">
          NutriTrain <span className="text-primary">AI</span>
        </h1>
        <p className="text-muted-foreground text-pretty font-medium text-sm">
          Gere treinos personalizados com base no seu perfil e objetivos.
        </p>
      </div>

      {/* Filtros Inteligentes (Chips) */}
      <ScrollArea className="w-full whitespace-nowrap -mx-4 px-4 mb-6">
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
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
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

      {/* Estado Vazio ou Loading */}
      {!isGenerating && generatedWorkouts.length === 0 && (
        <div className="w-full">
          <div className="relative bg-card border border-border rounded-[2rem] p-8 text-center overflow-hidden border-b-[6px] border-b-primary">
            {/* Cantoneiras */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-xl opacity-80" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-xl opacity-80" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-xl opacity-80" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-xl opacity-80" />

            <h3 className="text-lg font-bold text-foreground">Nenhum Treino Gerado</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Use o botão abaixo para personalizar e gerar seu plano de treino com IA.
            </p>
            <Dialog open={showGeneratorModal} onOpenChange={setShowGeneratorModal}>
              <DialogTrigger asChild>
                <Button className="w-full max-w-md mx-auto h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 group">
                  Configurar Treino
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card/90 backdrop-blur-xl border-border text-foreground sm:max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Ajuste Fino da IA</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <WorkoutGenerator onGenerate={handleGenerateWorkouts} isLoading={isGenerating} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="px-4 py-12 space-y-6">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-card border-border overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                <div className="h-48 bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lista de Treinos Gerados */}
      {filteredWorkouts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Seus Treinos</h3>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 border-primary/20 hover:bg-primary/5 text-primary"
                  >
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("default")}>Padrão</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("difficulty_desc")}>Dificuldade (Maior)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("difficulty_asc")}>Dificuldade (Menor)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("duration_desc")}>Duração (Maior)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("duration_asc")}>Duração (Menor)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportWorkouts}
                className="h-8 border-primary/20 hover:bg-primary/5 text-primary"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearHistory}
                className="text-muted-foreground hover:text-destructive h-8"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
              <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                {filteredWorkouts.length} Opções
              </Badge>
            </div>
          </div>

          <div className="grid gap-6">
            {filteredWorkouts.map((workout, index) => (
              <div 
                key={index} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards" 
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <WorkoutCard 
                  workout={workout} 
                  onStart={setActiveSessionWorkout} 
                  onExerciseClick={setSelectedExerciseDetail}
                />
              </div>
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

function WorkoutCard({ workout, onStart, onExerciseClick }: { workout: Workout, onStart: (workout: Workout) => void, onExerciseClick: (ex: Exercise) => void }) {
  // Estado local removido em favor do controle global da sessão

  const getDifficultyIcon = (level: string) => {
    const l = level.toLowerCase()
    if (l.includes("iniciante")) return <Feather className="w-5 h-5 text-green-500" />
    if (l.includes("avançado") || l.includes("avancado")) return <Swords className="w-5 h-5 text-red-500" />
    return <Activity className="w-5 h-5 text-yellow-500" />
  }

  return (
    <Card className="bg-card border-border overflow-hidden hover:border-primary/50 transition-all duration-300 ease-in-out group shadow-lg rounded-2xl">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full bg-muted">
          {/* Placeholder visual para o treino - idealmente seria uma imagem gerada ou do banco */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-card to-transparent">
            <Dumbbell className="h-16 w-16 text-muted-foreground/20 group-hover:text-primary transition-colors duration-300" />
          </div>
          
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge className="bg-primary text-primary-foreground border-none hover:bg-primary/90 shadow-lg shadow-primary/20">
              {workout.category}
            </Badge>
          </div>
          
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-primary">{workout.name}</h3>
              {getDifficultyIcon(workout.difficulty)}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-primary" />
                {workout.duration}
              </div>
              <div className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-primary" />
                {workout.calories} kcal
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-primary" />
                {workout.difficulty}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <div className="bg-muted/50 p-3 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground italic">
            "<span className="text-foreground">{workout.aiVerdict}</span>"
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4" /> Circuito Principal
          </h4>
          
          <div className="space-y-3">
            {workout.exercises.slice(0, 3).map((exercise: any, idx: number) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group/item"
                onClick={() => onExerciseClick(exercise)}
              >
                <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {/* Placeholder para imagem do exercício */}
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover/item:text-primary transition-colors">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.sets} x {exercise.reps} • {exercise.rest} descanso
                  </p>
                </div>
              </div>
            ))}
            {workout.exercises.length > 3 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                + {workout.exercises.length - 3} exercícios adicionais
              </p>
            )}
          </div>
        </div>

        <Button 
          className={`w-full font-bold transition-all duration-300 ease-in-out ${
            "bg-primary hover:bg-primary/90 hover:shadow-primary/40 text-primary-foreground"
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