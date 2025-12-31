"use client"

import { useState, useEffect, useRef } from "react"
import { X, Check, Clock, Flame, Trophy, ChevronRight, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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
      <div className="fixed inset-0 z-50 bg-[#080808] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="w-24 h-24 bg-[#FF8C00]/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Trophy className="w-12 h-12 text-[#FF8C00]" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Treino Concluído!</h2>
            <p className="text-slate-400">Você dominou o {workout.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-[#121212] border-[#1F1F1F] p-4">
              <div className="flex flex-col items-center">
                <Clock className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-2xl font-bold text-white">{formatTime(elapsedTime)}</span>
                <span className="text-xs text-slate-500 uppercase">Tempo Total</span>
              </div>
            </Card>
            <Card className="bg-[#121212] border-[#1F1F1F] p-4">
              <div className="flex flex-col items-center">
                <Flame className="w-6 h-6 text-red-500 mb-2" />
                <span className="text-2xl font-bold text-white">~200</span>
                <span className="text-xs text-slate-500 uppercase">Kcal Estimadas</span>
              </div>
            </Card>
          </div>

          <Button 
            className="w-full h-14 text-lg font-bold bg-[#FF8C00] hover:bg-[#e67e00] text-black"
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
    <div className="fixed inset-0 z-50 bg-[#080808] flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1F1F1F] bg-[#121212]">
        <div className="flex flex-col">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider truncate max-w-[200px]">{workout.name}</h3>
          <span className="text-xs text-[#FF8C00] font-mono">{formatTime(elapsedTime)}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Barra de Progresso */}
      <Progress value={progress} className="h-1 bg-[#1F1F1F]" indicatorClassName="bg-[#FF8C00]" />

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {/* Card do Exercício */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="outline" className="mb-2 border-[#FF8C00]/30 text-[#FF8C00]">
                Exercício {currentExerciseIndex + 1} de {totalExercises}
              </Badge>
              <h2 className="text-3xl font-bold text-white leading-tight">{currentExercise.name}</h2>
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
                    ? "bg-[#FF8C00]/10 border-[#FF8C00] text-[#FF8C00]" 
                    : "bg-[#121212] border-[#1F1F1F] text-slate-300 hover:border-[#FF8C00]/50 active:scale-[0.98]"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                    ${isCompleted ? "bg-[#FF8C00] border-[#FF8C00] text-black" : "border-slate-600"}
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
          <Card className="bg-[#1A1A1A] border-[#FF8C00]/30 animate-in zoom-in-95 duration-300 shadow-2xl shadow-black/50 sticky bottom-4">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <span className="text-sm text-slate-400 uppercase tracking-widest mb-2">Descanso</span>
              <div className="text-5xl font-black text-white font-mono mb-4 tabular-nums">
                00:{restTimer.toString().padStart(2, '0')}
              </div>
              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1 border-[#333] hover:bg-[#333] text-white"
                  onClick={() => setRestTimer(prev => prev + 10)}
                >
                  +10s
                </Button>
                <Button 
                  className="flex-1 bg-[#FF8C00] text-black hover:bg-[#e67e00]"
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
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-4 border-t border-[#1F1F1F]">
            <div className="bg-[#121212] p-4 rounded-xl border border-[#1F1F1F]">
              <label className="text-sm font-bold text-slate-300 mb-4 block flex justify-between">
                <span>Percepção de Esforço (RPE)</span>
                <span className="text-[#FF8C00]">{rpeValues[currentExercise.name] || 5} / 10</span>
              </label>
              
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={rpeValues[currentExercise.name] || 5}
                onChange={(e) => setRpeValues({...rpeValues, [currentExercise.name]: parseInt(e.target.value)})}
                className="w-full h-2 bg-[#1F1F1F] rounded-lg appearance-none cursor-pointer accent-[#FF8C00]"
              />
              
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Leve</span>
                <span>Máximo</span>
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-slate-200 shadow-lg"
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