"use client"

import { useState, useEffect, useRef } from "react"
import { X, Check, Clock, Flame, Trophy, ChevronRight, Save, Loader2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface ActiveWorkoutSessionProps {
  workout: any
  onClose: () => void
  onComplete: (data: any) => void
}

export function ActiveWorkoutSession({ workout, onClose, onComplete }: ActiveWorkoutSessionProps) {
  // --- Estados ---
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({})
  const [isResting, setIsResting] = useState(false)
  const [restTimer, setRestTimer] = useState(60)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [rpeValues, setRpeValues] = useState<Record<string, number>>({})
  const [isFinished, setIsFinished] = useState(false)
  const [exerciseGif, setExerciseGif] = useState<string | null>(null)
  const [isLoadingGif, setIsLoadingGif] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null)

  // --- Persistência Local (Carregar) ---
  useEffect(() => {
    const saved = localStorage.getItem(`workout_progress_${workout.name}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        // Validação simples para garantir que o treino salvo é compatível
        if (data.workoutName === workout.name) {
          setCurrentExerciseIndex(data.currentExerciseIndex)
          setCompletedSets(data.completedSets)
          setElapsedTime(data.elapsedTime)
          setRpeValues(data.rpeValues)
        }
      } catch (e) {
        console.error("Erro ao carregar progresso", e)
      }
    }
  }, [workout.name])

  // --- Persistência Local (Salvar) ---
  useEffect(() => {
    if (!isFinished) {
      localStorage.setItem(`workout_progress_${workout.name}`, JSON.stringify({
        workoutName: workout.name,
        currentExerciseIndex,
        completedSets,
        elapsedTime,
        rpeValues
      }))
    } else {
      localStorage.removeItem(`workout_progress_${workout.name}`)
    }
  }, [currentExerciseIndex, completedSets, elapsedTime, rpeValues, isFinished, workout.name])

  // --- Timer Global do Treino ---
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

  // --- Timer de Descanso ---
  useEffect(() => {
    if (isResting && restTimer > 0) {
      timerRef.current = setInterval(() => {
        setRestTimer(prev => prev - 1)
      }, 1000)
    } else if (restTimer === 0) {
      setIsResting(false)
      setRestTimer(60)
      toast.success("Descanso finalizado! Vamos para a próxima série.")
      // Aqui poderia tocar um som de bip
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isResting, restTimer])

  // --- Dicionário de Fallback (Reserva) ---
  const getFallbackGif = (name: string) => {
    const normalized = name.toLowerCase()
    if (normalized.includes("polichinelo")) return "https://media.giphy.com/media/3o7qDEq2bMbcbPRQ2c/giphy.gif"
    if (normalized.includes("agachamento")) return "https://media.giphy.com/media/l41Yy4J96X8ehz8xG/giphy.gif"
    if (normalized.includes("flexão") || normalized.includes("flexao")) return "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif"
    if (normalized.includes("abdominal")) return "https://media.giphy.com/media/3o7TKMt1VVNkHVyPaE/giphy.gif"
    return null
  }

  // --- Fetch GIF Demonstrativo (ExerciseDB) ---
  useEffect(() => {
    const fetchGif = async () => {
      if (!workout?.exercises?.[currentExerciseIndex]) return
      
      const originalName = workout.exercises[currentExerciseIndex].name
      // Limpeza do nome para aumentar chances de match na API (remove acentos e caracteres especiais)
      const cleanName = originalName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/g, "").trim()

      // Tradução simples PT -> EN para melhorar busca na API (ExerciseDB usa inglês)
      const termMap: Record<string, string> = {
        "agachamento": "squat",
        "flexão": "push up",
        "flexao": "push up",
        "abdominal": "crunch",
        "supino": "bench press",
        "remada": "row",
        "desenvolvimento": "shoulder press",
        "rosca": "curl",
        "polichinelo": "jumping jack",
        "prancha": "plank",
        "puxada": "pull down",
        "elevação": "raise",
        "elevacao": "raise",
        "afundo": "lunge",
        "leg press": "leg press",
        "extensora": "extension",
        "flexora": "curl"
      }
      
      let searchTerm = cleanName
      for (const [pt, en] of Object.entries(termMap)) {
        if (cleanName.includes(pt)) {
          searchTerm = en
          break
        }
      }
      
      // Cache Key baseada no termo de busca
      const cacheKey = `gif_cache_${searchTerm.replace(/\s/g, '_')}`
      
      // 1. Verifica Cache Local (Performance)
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setExerciseGif(cached)
        return
      }

      setIsLoadingGif(true)
      setExerciseGif(null)

      try {
        // Chamada à API ExerciseDB
        const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(searchTerm)}`, {
          headers: {
            'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
            'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
          }
        })

        const data = await response.json()
        
        if (Array.isArray(data) && data.length > 0) {
          // Filtro de Equipamento: Tenta encontrar a variante correta (ex: body weight vs dumbbell)
          const location = workout.criteria?.location || ""
          const targetEquipment = location.includes("Sem Equipamento") ? "body weight" : location.includes("Halteres") ? "dumbbell" : null
          
          const match = targetEquipment ? data.find((ex: any) => ex.equipment === targetEquipment) : data[0]
          const gifUrl = match ? match.gifUrl : data[0].gifUrl

          setExerciseGif(gifUrl)
          localStorage.setItem(cacheKey, gifUrl)
        } else {
          // Tenta fallback se a API não retornar nada
          const fallback = getFallbackGif(originalName)
          if (fallback) setExerciseGif(fallback)
        }
      } catch (error) {
        console.error("Erro ao carregar GIF:", error)
        const fallback = getFallbackGif(originalName)
        if (fallback) setExerciseGif(fallback)
      } finally {
        setIsLoadingGif(false)
      }
    }

    fetchGif()
  }, [currentExerciseIndex, workout])

  // --- Lógica de Navegação ---
  const currentExercise = workout.exercises[currentExerciseIndex]
  const totalExercises = workout.exercises.length
  const progress = ((currentExerciseIndex) / totalExercises) * 100

  const handleSetComplete = (setIndex: number) => {
    const exerciseId = currentExercise.name
    const currentSets = completedSets[exerciseId] || new Array(parseInt(currentExercise.sets)).fill(false)
    
    if (currentSets[setIndex]) return // Já completado

    const newSets = [...currentSets]
    newSets[setIndex] = true
    
    setCompletedSets({
      ...completedSets,
      [exerciseId]: newSets
    })

    // Inicia descanso se não for a última série do último exercício
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

  // --- Tela de Finalização ---
  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Treino Concluído!</h2>
            <p className="text-muted-foreground">Você dominou o {workout.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border p-4">
              <div className="flex flex-col items-center">
                <Clock className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-2xl font-bold text-foreground">{formatTime(elapsedTime)}</span>
                <span className="text-xs text-muted-foreground uppercase">Tempo Total</span>
              </div>
            </Card>
            <Card className="bg-card border-border p-4">
              <div className="flex flex-col items-center">
                <Flame className="w-6 h-6 text-red-500 mb-2" />
                <span className="text-2xl font-bold text-foreground">~200</span>
                <span className="text-xs text-muted-foreground uppercase">Kcal Estimadas</span>
              </div>
            </Card>
          </div>

          <Button 
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => onComplete({ elapsedTime, rpeValues })}
          >
            <Save className="w-5 h-5 mr-2" />
            Salvar no Log
          </Button>
        </div>
      </div>
    )
  }

  const exerciseSets = parseInt(currentExercise.sets) || 3
  const currentExerciseSets = completedSets[currentExercise.name] || new Array(exerciseSets).fill(false)
  const isExerciseComplete = currentExerciseSets.every(Boolean)

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex flex-col">
          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider truncate max-w-[200px]">{workout.name}</h3>
          <span className="text-xs text-primary font-mono">{formatTime(elapsedTime)}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Barra de Progresso */}
      <Progress value={progress} className="h-1 bg-muted" indicatorClassName="bg-primary" />

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {/* Card do Exercício */}
        <div className="space-y-4">
          {/* GIF Demonstrativo */}
          <div className="relative w-full aspect-video bg-muted rounded-xl overflow-hidden border border-border shadow-lg group">
            {isLoadingGif ? (
              <Skeleton className="w-full h-full bg-muted-foreground/20 animate-pulse" />
            ) : exerciseGif ? (
              <img 
                src={exerciseGif} 
                alt={currentExercise.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
                <span className="text-xs uppercase tracking-widest font-medium opacity-50">Sem demonstração</span>
              </div>
            )}
          </div>

          <div className="flex items-start justify-between">
            <div>
              <Badge variant="outline" className="mb-2 border-primary/30 text-primary">
                Exercício {currentExerciseIndex + 1} de {totalExercises}
              </Badge>
              <h2 className="text-3xl font-bold text-foreground leading-tight">{currentExercise.name}</h2>
            </div>
          </div>

          {/* Lista de Séries */}
          <div className="grid gap-3">
            {currentExerciseSets.map((isCompleted, idx) => (
              <button
                key={idx}
                onClick={() => handleSetComplete(idx)}
                disabled={isCompleted}
                className={`
                  w-full p-4 rounded-xl border flex items-center justify-between transition-all duration-300
                  ${isCompleted
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-foreground hover:border-primary/50 active:scale-[0.98]"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                    ${isCompleted ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}
                  `}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>
                  <div className="text-left">
                    <span className="font-bold block">Série {idx + 1}</span>
                    <span className="text-xs opacity-70">{currentExercise.reps} repetições</span>
                  </div>
                </div>
                {isCompleted && <span className="text-xs font-bold uppercase animate-in fade-in">Feito</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Overlay de Descanso */}
        {isResting && (
          <Card className="bg-card border-primary/30 animate-in zoom-in-95 duration-300 shadow-2xl shadow-black/50 dark:shadow-primary/10 sticky bottom-4">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <span className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Descanso</span>
              <div className="text-5xl font-black text-foreground font-mono mb-4 tabular-nums">
                00:{restTimer.toString().padStart(2, '0')}
              </div>
              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setRestTimer(prev => prev + 10)}
                >
                  +10s
                </Button>
                <Button 
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setIsResting(false)}
                >
                  Pular
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Input de RPE (Aparece quando todas as séries acabam) */}
        {isExerciseComplete && !isResting && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-4 border-t border-border">
            <div className="bg-card p-4 rounded-xl border border-border">
              <label className="text-sm font-bold text-foreground mb-4 block flex justify-between">
                <span>Percepção de Esforço (RPE)</span>
                <span className="text-primary">{rpeValues[currentExercise.name] || 5} / 10</span>
              </label>
              
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={rpeValues[currentExercise.name] || 5}
                onChange={(e) => setRpeValues({...rpeValues, [currentExercise.name]: parseInt(e.target.value)})}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Leve</span>
                <span>Máximo</span>
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
              onClick={handleNextExercise}
            >
              {currentExerciseIndex < totalExercises - 1 ? (
                <>Próximo Exercício <ChevronRight className="w-5 h-5 ml-2" /></>
              ) : (
                <>Finalizar Treino <Trophy className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}