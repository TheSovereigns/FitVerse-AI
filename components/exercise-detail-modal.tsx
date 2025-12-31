"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Apple,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react"

interface Exercise {
  id: string
  name: string
  muscleGroup: string
  difficulty: "Iniciante" | "Intermediário" | "Avançado"
  equipment: "none" | "dumbbells" | "gym" | "home"
  location: "home" | "gym"
  goalAlignment: string[]
  aiInsight: string
  preWorkoutTip?: string
  videoUrl?: string
  safetyTips: string[]
  commonMistakes: string[]
  stepByStepImages: { label: string; query: string }[]
}

interface ExerciseDetailModalProps {
  exercise: Exercise
  topProducts: any[]
  onClose: () => void
  onFeedback: (exerciseId: string, difficulty: number) => void
}

export function ExerciseDetailModal({ exercise, topProducts, onClose, onFeedback }: ExerciseDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(12)
  const [restTime, setRestTime] = useState(60)
  const [currentSet, setCurrentSet] = useState(1)
  const [isResting, setIsResting] = useState(false)
  const [timer, setTimer] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null)
  const [exerciseGif, setExerciseGif] = useState<string | null>(null)
  const [isLoadingGif, setIsLoadingGif] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, timer])

  // --- Fetch GIF Demonstrativo (ExerciseDB) ---
  useEffect(() => {
    const fetchGif = async () => {
      if (!exercise?.name) return
      
      // Cache Key baseada no nome do exercício
      const cacheKey = `gif_cache_${exercise.name}`
      
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
        const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(exercise.name)}`, {
          headers: {
            'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
            'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
          }
        })

        const data = await response.json()
        
        if (Array.isArray(data) && data.length > 0) {
          const match = data[0] // Pega o primeiro resultado
          const gifUrl = match.gifUrl

          setExerciseGif(gifUrl)
          localStorage.setItem(cacheKey, gifUrl)
        }
      } catch (error) {
        console.error("Erro ao carregar GIF:", error)
      } finally {
        setIsLoadingGif(false)
      }
    }

    fetchGif()
  }, [exercise.name])

  const handleStartRest = () => {
    if (currentSet < sets) {
      setIsResting(true)
      setTimer(restTime)
      setCurrentSet((prev) => prev + 1)
    } else {
      setShowFeedback(true)
    }
  }

  const handleResetWorkout = () => {
    setCurrentSet(1)
    setIsResting(false)
    setTimer(0)
    setShowFeedback(false)
  }

  const handleSubmitFeedback = () => {
    if (selectedDifficulty) {
      onFeedback(exercise.id, selectedDifficulty)
      onClose()
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "Iniciante") return "bg-green-500/20 text-green-400 border-green-500/40"
    if (difficulty === "Intermediário") return "bg-amber-500/20 text-amber-400 border-amber-500/40"
    return "bg-orange-500/20 text-orange-400 border-orange-500/40"
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl glass border-orange-500/30 shadow-2xl shadow-orange-500/20 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Video Player Section */}
            <div className="relative aspect-video bg-slate-950 rounded-t-lg overflow-hidden border-b border-orange-500/30">
              {isLoadingGif ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#121212]">
                  <Loader2 className="w-10 h-10 text-[#FF8C00] animate-spin" />
                </div>
              ) : exerciseGif ? (
                <img 
                  src={exerciseGif} 
                  alt={exercise.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-[#121212]">
                  <ImageIcon className="w-16 h-16 mb-3 opacity-20" />
                  <span className="text-sm uppercase tracking-widest font-medium opacity-50">
                    Demonstração indisponível
                  </span>
                </div>
              )}

              {/* Controls Overlay (Only if using video tag, kept for compatibility if needed) */}
              {/* Video Controls Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-4 opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-orange-500/80 hover:bg-orange-500 text-white rounded-full shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    const video = e.currentTarget.closest("div")?.querySelector("video")
                    if (video) {
                      if (isPlaying) video.pause()
                      else video.play()
                    }
                  }}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </Button>
              </div>

              {/* Loading Placeholder */}
              {exerciseGif && (
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-orange-500/30">
                  <p className="text-xs text-orange-400 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    GIF Demonstrativo
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Exercise Header */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{exercise.name}</h2>
                <p className="text-orange-400 font-medium mb-3">{exercise.muscleGroup}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getDifficultyColor(exercise.difficulty)}>{exercise.difficulty}</Badge>
                  {exercise.equipment === "none" && (
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">Sem Equipamento</Badge>
                  )}
                  {exercise.equipment === "dumbbells" && (
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">Halteres</Badge>
                  )}
                  {exercise.location === "home" && (
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">Casa</Badge>
                  )}
                  {exercise.location === "gym" && (
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">Academia</Badge>
                  )}
                </div>
              </div>

              {/* Step-by-Step Gallery */}
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-orange-400" />
                  Passo a Passo Visual
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {exercise.stepByStepImages.map((step, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden border border-orange-500/20"
                    >
                      <img
                        src={`/.jpg?height=200&width=200&query=${encodeURIComponent(step.query)}`}
                        alt={step.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white font-medium text-center">{step.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insight */}
              <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white mb-2">Por que isto é bom para você?</h3>
                    <p className="text-sm text-slate-300">{exercise.aiInsight}</p>
                  </div>
                </div>
              </Card>

              {/* Safety Tips */}
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Dicas de Segurança
                </h3>
                <ul className="space-y-2">
                  {exercise.safetyTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Mistakes */}
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Erros Comuns a Evitar
                </h3>
                <ul className="space-y-2">
                  {exercise.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Workout Tracker */}
              {!showFeedback ? (
                <Card className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/30">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Timer className="w-4 h-4 text-orange-400" />
                    Contador de Treino
                  </h3>

                  {/* Set/Rep Configuration */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Séries</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-orange-500/50 text-orange-400 bg-transparent"
                          onClick={() => setSets(Math.max(1, sets - 1))}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-white font-bold min-w-[2ch] text-center">{sets}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-orange-500/50 text-orange-400 bg-transparent"
                          onClick={() => setSets(sets + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Reps</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-orange-500/50 text-orange-400 bg-transparent"
                          onClick={() => setReps(Math.max(1, reps - 1))}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-white font-bold min-w-[2ch] text-center">{reps}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-orange-500/50 text-orange-400 bg-transparent"
                          onClick={() => setReps(reps + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Descanso</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-orange-500/50 text-orange-400 bg-transparent"
                          onClick={() => setRestTime(Math.max(15, restTime - 15))}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-white font-bold text-sm min-w-[3ch] text-center">{restTime}s</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-orange-500/50 text-orange-400 bg-transparent"
                          onClick={() => setRestTime(restTime + 15)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Current Set Display */}
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-orange-400 mb-1">
                      {currentSet}/{sets}
                    </p>
                    <p className="text-sm text-slate-400">Série Atual</p>
                    {isResting && (
                      <div className="mt-3">
                        <p className="text-2xl font-bold text-cyan-400 animate-pulse">{timer}s</p>
                        <p className="text-xs text-cyan-400">Descansando...</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartRest}
                      disabled={isResting}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentSet < sets ? "Concluir Série" : "Finalizar Treino"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleResetWorkout}
                      className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 bg-transparent"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ) : (
                // Feedback Section
                <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                  <h3 className="font-semibold text-white mb-4 text-center text-lg">Quão difícil foi?</h3>
                  <p className="text-sm text-slate-300 text-center mb-6">
                    A IA usará seu feedback para ajustar a intensidade dos próximos treinos
                  </p>
                  <div className="grid grid-cols-5 gap-2 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <Button
                        key={level}
                        variant="outline"
                        className={`h-12 ${
                          selectedDifficulty === level
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg shadow-purple-500/30"
                            : "border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                        }`}
                        onClick={() => setSelectedDifficulty(level)}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mb-6">
                    <span>Muito Fácil</span>
                    <span>Muito Difícil</span>
                  </div>
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={!selectedDifficulty}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50"
                  >
                    Enviar Feedback
                  </Button>
                </Card>
              )}

              {/* Pre-Workout Products */}
              {exercise.preWorkoutTip && topProducts.length > 0 && (
                <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
                  <div className="flex items-start gap-3">
                    <Apple className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2">Sugestão Pré-Treino</h3>
                      <p className="text-sm text-slate-300 mb-3">{exercise.preWorkoutTip}</p>
                      <div className="space-y-2">
                        <p className="text-xs text-cyan-400 font-medium">Produtos nota A do seu histórico:</p>
                        {topProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg"
                          >
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-8 h-8 rounded object-cover border border-cyan-500/30"
                            />
                            <span className="flex-1">{product.name}</span>
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40">{product.score}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
