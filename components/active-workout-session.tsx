"use client"

import { useState, useEffect, useRef } from "react"
import { X, Check, Clock, Flame, Trophy, ChevronRight, Save, Loader2, Image as ImageIcon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface ActiveWorkoutSessionProps {
  workout: any
  onClose: () => void
  onComplete: (data: any) => void
}

import { useTranslation } from "@/lib/i18n"
import { EXERCISE_TRANSLATIONS, EXERCISE_SEARCH_TERMS } from "@/lib/exercise-translations"

export function ActiveWorkoutSession({ workout, onClose, onComplete }: ActiveWorkoutSessionProps) {
  const { t, locale } = useTranslation()
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

  const getSearchTerm = () => {
    const name = currentExercise.name.toLowerCase().trim()
    if (locale === "en-US") {
      for (const [pt, en] of Object.entries(EXERCISE_TRANSLATIONS)) {
        if (name.includes(pt)) return en
      }
      return name
    }
    return name + t("em_search_suffix")
  }

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
        console.error(t("aw_error_progress"), e)
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
      toast.success(t("aw_rest_done"))
      // Aqui poderia tocar um som de bip
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isResting, restTimer, t])

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
      let searchTerm = cleanName
      for (const [pt, en] of Object.entries(EXERCISE_SEARCH_TERMS)) {
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
          const targetEquipment = location.includes(t("aw_no_equipment")) ? "body weight" : location.includes(t("aw_dumbbells")) ? "dumbbell" : null
          
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
        console.error(t("aw_error_gif"), error)
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
            <h2 className="text-3xl font-bold text-foreground mb-2">{t("aw_finished_title")}</h2>
            <p className="text-muted-foreground">{t("aw_finished_sub")} {workout.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border p-4">
              <div className="flex flex-col items-center">
                <Clock className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-2xl font-bold text-foreground">{formatTime(elapsedTime)}</span>
                <span className="text-xs text-muted-foreground uppercase">{t("aw_total_time")}</span>
              </div>
            </Card>
            <Card className="bg-card border-border p-4">
              <div className="flex flex-col items-center">
                <Flame className="w-6 h-6 text-red-500 mb-2" />
                <span className="text-2xl font-bold text-foreground">{t("aw_kcal_estimate")}</span>
                <span className="text-xs text-muted-foreground uppercase">{t("aw_kcal_est")}</span>
              </div>
            </Card>
          </div>

          <Button 
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => onComplete({ elapsedTime, rpeValues })}
          >
            <Save className="w-5 h-5 mr-2" />
            {t("aw_save_log")}
          </Button>
        </div>
      </div>
    )
  }

  const exerciseSets = parseInt(currentExercise.sets) || 3
  const currentExerciseSets = completedSets[currentExercise.name] || new Array(exerciseSets).fill(false)
  const isExerciseComplete = currentExerciseSets.every(Boolean)

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-300 h-[100dvh]">
      {/* Header Compacto */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground shrink-0 h-9 w-9"
            aria-label={t("aw_close_workout")}
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-sm truncate">{workout.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-primary font-mono tabular-nums">{formatTime(elapsedTime)}</span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-xs text-muted-foreground">{currentExerciseIndex + 1}/{totalExercises}</span>
            </div>
          </div>
        </div>
        {/* Dots de progresso */}
        <div className="flex items-center gap-1.5 shrink-0">
          {workout.exercises.map((_: any, idx: number) => {
            const exName = workout.exercises[idx].name
            const exSets = parseInt(workout.exercises[idx].sets) || 3
            const exCompleted = completedSets[exName]?.every(Boolean) ?? false
            const isCurrent = idx === currentExerciseIndex
            return (
              <div
                key={idx}
                className={`rounded-full transition-all duration-300 ${
                  exCompleted
                    ? "w-2 h-2 bg-primary"
                    : isCurrent
                    ? "w-6 h-2 bg-primary/60"
                    : "w-2 h-2 bg-muted-foreground/30"
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Barra de Progresso Finissima */}
      <Progress value={progress} className="h-0.5 bg-muted" indicatorClassName="bg-gradient-to-r from-primary to-primary/70" />

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-40 md:pb-20 space-y-5">
        {/* Info do Exercício + Busca */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  {t("aw_exercise_of")} {currentExerciseIndex + 1}
                </span>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground leading-tight tracking-tight">
              {currentExercise.name}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-foreground">{parseInt(currentExercise.sets) || 3}</span> {t("aw_sets") || "séries"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-foreground">{currentExercise.reps}</span> {t("aw_reps")}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(getSearchTerm())}`, '_blank')}
            className="shrink-0 h-10 w-10 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5"
            title={t("aw_search_google")}
          >
            <Search className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* GIF do Exercício */}
        {(exerciseGif || isLoadingGif) && (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-muted/50 border border-border/30">
            {isLoadingGif ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : exerciseGif ? (
              <img
                src={exerciseGif}
                alt={currentExercise.name}
                className="w-full h-full object-contain p-2"
              />
            ) : null}
          </div>
        )}

        {/* Lista de Séries - Grid Visual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("aw_sets") || "Séries"}</span>
            <span className="text-xs text-muted-foreground">
              {currentExerciseSets.filter(Boolean).length}/{currentExerciseSets.length}
            </span>
          </div>
          <div className="grid gap-2">
            {currentExerciseSets.map((isCompleted, idx) => (
              <button
                key={idx}
                onClick={() => handleSetComplete(idx)}
                disabled={isCompleted}
                className={`
                  group relative w-full p-4 rounded-2xl border transition-all duration-500 overflow-hidden
                  ${isCompleted
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/60 bg-card hover:border-primary/40 hover:bg-primary/[0.02] active:scale-[0.98]"
                  }
                `}
              >
                {/* Background de progresso */}
                {isCompleted && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 animate-in fade-in duration-500" />
                )}

                <div className="relative flex items-center gap-4">
                  {/* Número da série */}
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0
                    ${isCompleted
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    }
                  `}>
                    {isCompleted ? (
                      <Check className="w-5 h-5 animate-in spin-in-90 duration-300" />
                    ) : (
                      <span className="text-sm font-black">{idx + 1}</span>
                    )}
                  </div>

                  {/* Info da série */}
                  <div className="flex-1 text-left">
                    <span className={`font-bold block text-sm ${isCompleted ? "text-primary" : "text-foreground"}`}>
                      {t("aw_set")} {idx + 1}
                    </span>
                    <span className={`text-xs ${isCompleted ? "text-primary/60" : "text-muted-foreground"}`}>
                      {currentExercise.reps} {t("aw_reps")}
                    </span>
                  </div>

                  {/* Status */}
                  {isCompleted ? (
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary animate-in fade-in slide-in-from-right-2 duration-300">
                      {t("aw_done")}
                    </span>
                  ) : (
                    <div className="w-8 h-8 rounded-lg border-2 border-dashed border-muted-foreground/20 group-hover:border-primary/40 flex items-center justify-center transition-colors">
                      <span className="text-[10px] font-bold text-muted-foreground/40 group-hover:text-primary/60">+</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Overlay de Descanso */}
        {isResting && (
          <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-2xl border-t border-border/50 md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:pb-0 md:bg-transparent md:border-none md:backdrop-blur-none">
            <div className="bg-card rounded-3xl border border-border/50 p-6 animate-in zoom-in-95 duration-300 shadow-2xl shadow-black/30">
              <div className="flex flex-col items-center text-center">
                {/* Timer circular */}
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/50" />
                    <circle
                      cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - restTimer / 60)}
                      className="text-primary transition-all duration-1000 ease-linear"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-foreground font-mono tabular-nums">
                      {restTimer.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{t("aw_rest")}</span>
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-border/50 font-semibold"
                    onClick={() => setRestTimer(prev => prev + 10)}
                  >
                    {t("aw_add_time")}
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20"
                    onClick={() => setIsResting(false)}
                  >
                    {t("aw_skip")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RPE + Próximo (quando exercício completo) */}
        {isExerciseComplete && !isResting && (
          <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-2xl border-t border-border/50 md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:pb-0 md:bg-transparent md:border-none md:backdrop-blur-none animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-3">
              {/* RPE */}
              <div className="bg-card rounded-2xl border border-border/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-foreground">{t("aw_rpe")}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-primary tabular-nums">{rpeValues[currentExercise.name] || 5}</span>
                    <span className="text-xs text-muted-foreground">/10</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rpeValues[currentExercise.name] || 5}
                  onChange={(e) => setRpeValues({...rpeValues, [currentExercise.name]: parseInt(e.target.value)})}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  <span>{t("aw_easy")}</span>
                  <span>{t("aw_max")}</span>
                </div>
              </div>

              {/* Botão Próximo */}
              <Button
                className="w-full h-14 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20"
                onClick={handleNextExercise}
              >
                {currentExerciseIndex < totalExercises - 1 ? (
                  <>{t("aw_next")} <ChevronRight className="w-5 h-5 ml-1" /></>
                ) : (
                  <>{t("aw_finish")} <Trophy className="w-5 h-5 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}