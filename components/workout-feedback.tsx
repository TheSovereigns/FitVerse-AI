"use client"

import { useState, useEffect, useCallback } from "react"
import { logger } from "@/lib/logger"
import { motion, AnimatePresence } from "framer-motion"
import {
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

interface PainArea {
  id: string
  label: string
  selected: boolean
}

interface FeedbackEntry {
  date: string
  difficulty: number
  energy: number
  painAreas: string[]
  notes: string
}

interface WorkoutFeedbackProps {
  isPro?: boolean
  workoutName?: string
  exercises?: string[]
  onSubmit?: (feedback: FeedbackEntry) => void
}

const DIFFICULTY_LABELS = ["Very Easy", "Easy", "Moderate", "Hard", "Max Effort"]
const ENERGY_LABELS = ["Exhausted", "Low", "Normal", "Good", "Energized"]

const BODY_AREAS: PainArea[] = [
  { id: "shoulders", label: "Shoulders", selected: false },
  { id: "lower-back", label: "Lower Back", selected: false },
  { id: "knees", label: "Knees", selected: false },
  { id: "neck", label: "Neck", selected: false },
  { id: "wrists", label: "Wrists", selected: false },
  { id: "hips", label: "Hips", selected: false },
  { id: "elbows", label: "Elbows", selected: false },
  { id: "ankles", label: "Ankles", selected: false },
]

const STORAGE_KEY = "fitverse-workout-feedback"

export function WorkoutFeedback({
  isPro = false,
  workoutName = "Today's Workout",
  exercises = [],
  onSubmit,
}: WorkoutFeedbackProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [difficulty, setDifficulty] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [painAreas, setPainAreas] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [showAdjustments, setShowAdjustments] = useState(false)
  const [history, setHistory] = useState<FeedbackEntry[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setHistory(JSON.parse(saved))
    } catch (e) {
      logger.error("[WorkoutFeedback] Failed to parse workout history:", e)
    }
  }, [])

  const togglePain = (id: string) => {
    setPainAreas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const getAdjustmentSuggestions = () => {
    const suggestions: string[] = []

    if (difficulty >= 4) {
      suggestions.push("Reduce weight by 5-10%")
      suggestions.push("Decrease volume by 1 set per exercise")
      suggestions.push("Extend rest periods to 2-3 minutes")
    } else if (difficulty <= 2) {
      suggestions.push("Increase weight by 5-10%")
      suggestions.push("Add 1-2 sets per exercise")
      suggestions.push("Add supersets for efficiency")
    }

    if (energy <= 2) {
      suggestions.push("Add 5 min warm-up with light cardio")
      suggestions.push("Schedule workout later in the day")
      suggestions.push("Check nutrition and sleep quality")
    }

    if (painAreas.length > 0) {
      const subs: Record<string, string> = {
        shoulders: "Replace overhead press with landmine press",
        "lower-back": "Replace barbell row with chest-supported row",
        knees: "Replace squats with leg press or wall sits",
        neck: "Remove shrugs, add face pulls",
        wrists: "Replace barbell curls with hammer curls",
        hips: "Replace deadlifts with hip thrusts",
        elbows: "Replace close-grip bench with wide-grip",
        ankles: "Replace calf raises with seated calf raises",
      }
      painAreas.forEach((area) => {
        if (subs[area]) suggestions.push(subs[area])
      })
    }

    if (suggestions.length === 0) {
      suggestions.push("Great session! Maintain current progression")
      suggestions.push("Consider adding progressive overload next week")
    }

    return suggestions
  }

  const getPainFrequency = (areaId: string) => {
    return history.filter((h) => h.painAreas.includes(areaId)).length
  }

  const handleSubmit = () => {
    const entry: FeedbackEntry = {
      date: new Date().toISOString(),
      difficulty,
      energy,
      painAreas,
      notes,
    }

    const newHistory = [...history, entry].slice(-30)
    setHistory(newHistory)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
    } catch (e) {
      logger.error("[WorkoutFeedback] Failed to save workout history:", e)
    }

    setSubmitted(true)
    onSubmit?.(entry)
  }

  const reset = () => {
    setDifficulty(3)
    setEnergy(3)
    setPainAreas([])
    setNotes("")
    setSubmitted(false)
    setShowAdjustments(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border glass-strong p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10">
            <ThumbsUp className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isEnglish ? "Workout Feedback" : "Feedback do Treino"}
            </h3>
            <p className="text-xs text-muted-foreground">{workoutName}</p>
          </div>
        </div>
        {submitted && (
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Success */}
            <div className="text-center py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto mb-3">
                <ThumbsUp className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {isEnglish ? "Thanks for your feedback!" : "Obrigado pelo seu feedback!"}
              </p>
            </div>

            {/* AI Adjustments */}
            <div>
              <button
                onClick={() => setShowAdjustments(!showAdjustments)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-[10px] font-medium text-brand uppercase tracking-wider">
                  {isPro ? "AI Adjustments" : "Basic Adjustments"}
                </span>
                {showAdjustments ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {showAdjustments && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div className="p-3 rounded-xl border border-border bg-muted/50 space-y-2">
                      {getAdjustmentSuggestions().map((suggestion, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="h-1 w-1 rounded-full bg-brand shrink-0 mt-1.5" />
                          <span className="text-xs text-muted-foreground">
                            {suggestion}
                          </span>
                        </div>
                      ))}

                      {!isPro && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                          <Lock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">
                            Pro: Get AI-powered exercise substitutions
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pain Tracking Over Time */}
            {painAreas.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Pain Tracking
                </p>
                <div className="space-y-1.5">
                  {painAreas.map((areaId) => {
                    const freq = getPainFrequency(areaId)
                    const area = BODY_AREAS.find((a) => a.id === areaId)
                    return (
                      <div
                        key={areaId}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs text-muted-foreground">
                          {area?.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{
                                width: `${Math.min((freq / Math.max(history.length, 1)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-8 text-right">
                            {freq}x
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Before/After */}
            {history.length >= 2 && (
              <div className="pt-3 border-t border-border">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {isEnglish ? "Before vs After" : "Antes vs Depois"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Previous</p>
                    <p className="text-sm font-semibold text-foreground">
                      {history[history.length - 2]!.difficulty}/5
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Today</p>
                    <p className="text-sm font-semibold text-foreground">
                      {difficulty}/5
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Difficulty */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {isEnglish ? "Difficulty" : "Dificuldade"}
              </p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                      difficulty === level
                        ? "bg-brand text-white border-brand"
                        : "bg-card text-muted-foreground border-border hover:border-brand/50"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-1.5">
                {DIFFICULTY_LABELS[difficulty - 1]}
              </p>
            </div>

            {/* Energy */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {isEnglish ? "Energy Level" : "Nível de Energia"}
              </p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                      energy === level
                        ? "bg-brand text-white border-brand"
                        : "bg-card text-muted-foreground border-border hover:border-brand/50"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-1.5">
                {ENERGY_LABELS[energy - 1]}
              </p>
            </div>

            {/* Pain Areas */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {isEnglish ? "Pain Areas" : "Áreas de Dor"}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BODY_AREAS.map((area) => {
                  const isSelected = painAreas.includes(area.id)
                  const freq = getPainFrequency(area.id)
                  return (
                    <button
                      key={area.id}
                      onClick={() => togglePain(area.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                        isSelected
                          ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                          : "bg-card text-muted-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      {area.label}
                      {freq > 0 && (
                        <span className="ml-1 text-[9px] opacity-60">{freq}x</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {isEnglish ? "Notes" : "Notas"}
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did you feel? Any observations..."
                className="w-full min-h-[60px] p-3 rounded-xl bg-card border border-border text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              className="w-full h-10 text-xs font-medium bg-brand text-white hover:bg-brand/90"
            >
              {isEnglish ? "Submit Feedback" : "Enviar Feedback"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
