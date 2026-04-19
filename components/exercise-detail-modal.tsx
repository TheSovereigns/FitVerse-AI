"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
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
  Zap,
  Activity,
  ShieldCheck,
  ChevronRight,
  Flame,
  Target,
  Award,
  Search,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

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
  const { t, locale } = useTranslation()
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

  // Static Video Mappings
  const TECH_VIDEOS: Record<string, string> = {
    "agachamento livre": "https://media.giphy.com/media/1iTH1WIUjM0VATSw/giphy.gif",
    "agachamento": "https://media.giphy.com/media/1iTH1WIUjM0VATSw/giphy.gif",
    "agachamento com halteres (goblet squat)": "https://media.giphy.com/media/3o7qDEq2bMbcbPRQ2c/giphy.gif",
    "flexão de braço": "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
    "flexão": "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
    "polichinelos": "https://media.giphy.com/media/5t9IcRmvr9vgQ/giphy.gif",
    "polichinelo": "https://media.giphy.com/media/5t9IcRmvr9vgQ/giphy.gif",
    "supino": "https://media.giphy.com/media/4BJUu68A2yJq/giphy.gif",
    "abdominal supra": "https://media.giphy.com/media/3o7TKMt1VVNkHVyPaE/giphy.gif",
    "burpee": "https://media.giphy.com/media/23hPPMRp2I7y3/giphy.gif",
  }

  const exerciseNameMap: Record<string, string> = {
    "agachamento livre": "barbell back squat",
    "agachamento": "barbell squat",
    "agachamento com halteres": "goblet squat",
    "agachamento com halteres (goblet squat)": "goblet squat",
    "flexão de braço": "push up",
    "flexão": "push up",
    "polichinelos": "jumping jacks",
    "polichinelo": "jumping jacks",
    "supino": "bench press",
    "supino com halteres": "dumbbell bench press",
    "abdominal supra": "crunch",
    "abdominal": "crunch",
    "burpee": "burpee",
    "prancha": "plank",
    "elevação de perna": "leg raise",
    "afundo": "lunge",
    "afundos": "lunge",
    "remada": "barbell row",
    "remada curvada": "barbell row",
    "desenvolvimento": "overhead press",
    "rosca": "bicep curl",
    "rosca direta": "bicep curl",
    "tríceps": "tricep extension",
    "extensão de tríceps": "tricep extension",
    "crucifixo": "dumbbell fly",
    "voador": "dumbbell fly",
    "stiff": "stiff leg deadlift",
    "leg press": "leg press",
    "extensora": "leg extension",
    "flexora": "leg curl",
    "panturrilha": "calf raise",
    "elevação de calcanhar": "calf raise",
  }

  const getSearchTerm = () => {
    const name = exercise.name.toLowerCase().trim()
    if (locale === "en-US") {
      for (const [pt, en] of Object.entries(exerciseNameMap)) {
        if (name.includes(pt)) return en
      }
      return name
    }
    return name + t("em_search_suffix")
  }

  useEffect(() => {
    const fetchGif = async () => {
      if (!exercise?.name) return
      setIsLoadingGif(true)
      setExerciseGif(null)

      const cleanName = exercise.name
        .replace(/^(Aquecimento|Circuito|Série|Treino)[:\s]+/i, "")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z\s]/g, "")
        .trim()
      
      for (const [key, url] of Object.entries(TECH_VIDEOS)) {
        if (cleanName.includes(key)) {
          setExerciseGif(url)
          setIsLoadingGif(false)
          return
        }
      }

      const termMap: Record<string, string> = {
        "agachamento": "barbell squat",
        "flexão": "push up",
        "abdominal": "crunch",
        "supino": "bench press",
        "remada": "row",
        "desenvolvimento": "shoulder press",
        "rosca": "curl",
        "polichinelo": "jumping jack",
        "prancha": "plank",
        "puxada": "pull down",
        "elevação": "raise",
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
      
      const cacheKey = `gif_cache_${searchTerm.replace(/\s/g, '_')}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setExerciseGif(cached)
        setIsLoadingGif(false)
        return
      }

      try {
        const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(searchTerm)}`, {
          headers: {
            'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
            'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
          }
        })
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          const match = data[0]
          if (match.gifUrl && match.gifUrl.startsWith("http")) {
            setExerciseGif(match.gifUrl)
            localStorage.setItem(cacheKey, match.gifUrl)
          }
        }
      } catch (error) {
        console.error(t("em_error_gif"), error)
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
    if (difficulty === t("wg_beginner")) return "bg-emerald-400/20 text-emerald-400 border-none"
    if (difficulty === t("wg_intermediate")) return "bg-amber-400/20 text-amber-400 border-none"
    return "bg-rose-400/20 text-rose-400 border-none"
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-full h-[70vh] flex flex-col p-0 gap-0 bg-transparent border-none shadow-none overflow-hidden" showCloseButton={false}>
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-1 glass-strong border-t border-white/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Top Handle Bar */}
          <div className="w-8 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2 shrink-0" />

          {/* Header Action Bar */}
          <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-white/10">
             <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">{t("em_exercise")}</span>
             </div>
             <Button variant="ghost" onClick={onClose} className="rounded-full hover:bg-white/10 h-8 w-8 p-0">
                <X className="w-4 h-4" />
             </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4 pb-20">
              {/* Nome do exercício */}
              <div>
                <Badge className={cn("mb-2 px-2 py-1 font-black text-[8px] tracking-wider uppercase", getDifficultyColor(exercise.difficulty))}>
                  {exercise.difficulty}
                </Badge>
                <h2 className="text-2xl font-black text-foreground leading-tight mb-1">
                  {exercise.name}
                </h2>
                <p className="text-sm font-bold text-primary opacity-80">
                  {t("em_focus")} {exercise.muscleGroup}
                </p>
              </div>

              {/* Botão Google Search */}
              <Button
                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(getSearchTerm())}`, '_blank')}
                className="w-full h-12 rounded-xl bg-primary/10 border border-primary/30 text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/20"
              >
                <Search className="w-4 h-4" />
                {t("em_btn_search_google")}
              </Button>

              {/* Equipamento e Local */}
              <div className="flex gap-2">
                 <div className="flex items-center gap-2 glass border-white/10 px-3 py-2 rounded-lg text-xs">
                    <Target className="w-3 h-3 text-primary" />
                    {exercise.equipment === "none" ? t("em_bodyweight") : exercise.equipment}
                 </div>
                 <div className="flex items-center gap-2 glass border-white/10 px-3 py-2 rounded-lg text-xs">
                    <Award className="w-3 h-3 text-primary" />
                    {exercise.location === "home" ? t("em_home_env") : t("em_bio_gym")}
                 </div>
              </div>

              {/* AI Insight */}
              <div className="p-4 glass border-white/10 rounded-xl">
                 <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-40">{t("em_ai_insight")}</span>
                 </div>
                 <p className="text-sm font-bold text-foreground/80 italic">"{exercise.aiInsight}"</p>
              </div>

              {/* Safety Tips */}
              <div className="space-y-2">
                 <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                     {t("em_safety_label")}
                 </h3>
                 <div className="space-y-1">
                    {exercise.safetyTips.map((tip, i) => (
                      <div key={i} className="p-2 glass border-white/5 rounded-lg flex items-start gap-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                         <span className="text-xs font-bold text-foreground/70">{tip}</span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Common Mistakes */}
              <div className="space-y-2">
                 <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                     {t("em_mistakes_label")}
                 </h3>
                 <div className="space-y-1">
                    {exercise.commonMistakes.map((mistake, i) => (
                      <div key={i} className="p-2 glass border-rose-500/10 rounded-lg flex items-start gap-2">
                         <div className="w-2 h-2 rounded-full bg-rose-400 mt-1 shrink-0" />
                         <span className="text-xs font-bold text-rose-100/70">{mistake}</span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Tracker Simples */}
              <div className="p-4 glass-strong border-white/10 rounded-xl">
                 <div className="flex items-center justify-between mb-3">
                     <span className="text-xs font-black uppercase tracking-wider">{t("em_tracker_label").replace("{currentSet}", String(currentSet)).replace("{sets}", String(sets))}</span>
                    <div className="flex gap-2">
                       <button onClick={() => setSets(s => Math.max(1, s - 1))} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">-</button>
                       <button onClick={() => setSets(s => s + 1)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">+</button>
                    </div>
                 </div>
                 <div className="flex gap-1 mb-3">
                    {Array.from({ length: sets }).map((_, i) => (
                       <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < currentSet ? "bg-primary" : "bg-white/10")} />
                    ))}
                 </div>
                 <Button
                   onClick={handleStartRest}
                   className="w-full h-10 rounded-lg mesh-gradient text-white font-black text-xs uppercase tracking-wider"
                 >
                    {currentSet < sets ? t("em_next_set") : t("em_finish")}
                 </Button>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
