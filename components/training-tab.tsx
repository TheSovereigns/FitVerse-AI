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

      if (!response.ok) throw new Error("Failed to generate workouts")

      const data = await response.json()
      setGeneratedWorkouts(data.workouts)
    } catch (error) {
      console.error("Error generating workouts:", error)
      // Aqui você poderia adicionar um toast de erro
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
    
    // Busca flexível nos dados do treino (nome, categoria, etc)
    const searchStr = JSON.stringify(workout).toLowerCase()
    
    if (activeFilter === "gym") return searchStr.includes("academia") || searchStr.includes("gym")
    if (activeFilter === "home") return searchStr.includes("casa") || searchStr.includes("home") || searchStr.includes("halteres") || searchStr.includes("dumbbells") || searchStr.includes("sem equipamento") || searchStr.includes("bodyweight") || searchStr.includes("calistenia")
    if (activeFilter === "dumbbells") return searchStr.includes("halteres") || searchStr.includes("dumbbells")
    if (activeFilter === "bodyweight") return searchStr.includes("sem equipamento") || searchStr.includes("calistenia") || searchStr.includes("bodyweight")
    
    return true
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
              <WorkoutCard key={index} workout={workout} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function WorkoutCard({ workout }: { workout: any }) {
  const [isStarted, setIsStarted] = useState(false)

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
              <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors">
                <div className="h-10 w-10 rounded-lg bg-[#1F1F1F] flex-shrink-0 overflow-hidden">
                  {/* Placeholder para imagem do exercício */}
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-600">
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{exercise.name}</p>
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
            isStarted 
              ? "bg-green-600 hover:bg-green-700 text-white shadow-none" 
              : "bg-gradient-to-r from-[#FF8C00] to-[#FF4500] hover:shadow-orange-500/40 text-white"
          }`}
          onClick={() => {
            setIsStarted(true)
            toast.success(`Treino Iniciado: ${workout.name}`, {
              description: "Prepare-se! O cronômetro foi ativado.",
              duration: 3000,
            })
          }}
          disabled={isStarted}
        >
          {isStarted ? "Treino em Andamento..." : <><Play className="h-4 w-4 mr-2 fill-white" /> Iniciar Treino</>}
        </Button>
      </CardContent>
    </Card>
  )
}