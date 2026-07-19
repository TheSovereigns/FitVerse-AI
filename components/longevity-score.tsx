"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart,
  Moon,
  Zap,
  Activity,
  Droplets,
  Utensils,
  Cigarette,
  TrendingUp,
  TrendingDown,
  Share2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"

interface Factor {
  id: string
  name: string
  value: number
  weight: number
  icon: React.ReactNode
}

interface ScoreEntry {
  date: string
  score: number
  factors: { id: string; name: string; value: number }[]
}

const FACTORS: Omit<Factor, "value">[] = [
  { id: "sleep", name: "Sleep Quality", weight: 15, icon: <Moon className="h-4 w-4" /> },
  { id: "stress", name: "Stress Level", weight: 15, icon: <Zap className="h-4 w-4" /> },
  { id: "activity", name: "Activity Level", weight: 20, icon: <Activity className="h-4 w-4" /> },
  { id: "bmi", name: "BMI", weight: 15, icon: <Heart className="h-4 w-4" /> },
  { id: "smoking", name: "Smoking Status", weight: 15, icon: <Cigarette className="h-4 w-4" /> },
  { id: "water", name: "Water Intake", weight: 10, icon: <Droplets className="h-4 w-4" /> },
  { id: "diet", name: "Diet Quality", weight: 10, icon: <Utensils className="h-4 w-4" /> },
]

const SLIDER_TIPS: Record<string, string[]> = {
  sleep: ["Maintain a consistent sleep schedule", "Aim for 7-9 hours nightly", "Avoid screens 1h before bed"],
  stress: ["Practice daily meditation", "Take regular breaks outdoors", "Prioritize social connections"],
  activity: ["Aim for 150min moderate exercise/week", "Add strength training 2x/week", "Walk more throughout the day"],
  bmi: ["Keep BMI between 18.5-24.9", "Focus on sustainable nutrition", "Combine cardio and strength training"],
  smoking: ["Quitting adds up to 10 healthy years", "Seek support programs", "Replace with healthy habits"],
  water: ["Drink at least 2L daily", "Carry a water bottle", "Drink before each meal"],
  diet: ["Eat whole, unprocessed foods", "Increase vegetable intake", "Limit added sugars and refined carbs"],
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-500"
  if (score >= 70) return "text-green-500"
  if (score >= 50) return "text-yellow-500"
  if (score >= 30) return "text-orange-500"
  return "text-red-500"
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Outstanding"
  if (score >= 70) return "Excellent"
  if (score >= 50) return "Good"
  if (score >= 30) return "Fair"
  return "Poor"
}

function getScoreBg(score: number): string {
  if (score >= 85) return "bg-emerald-500"
  if (score >= 70) return "bg-green-500"
  if (score >= 50) return "bg-yellow-500"
  if (score >= 30) return "bg-orange-500"
  return "bg-red-500"
}

function getFactorColor(value: number): string {
  if (value >= 80) return "bg-emerald-500"
  if (value >= 50) return "bg-yellow-500"
  return "bg-red-500"
}

function calculateFactorScore(factorId: string, rawValue: number): number {
  switch (factorId) {
    case "sleep":
      return Math.min(100, Math.max(0, (rawValue / 10) * 100))
    case "stress":
      return Math.min(100, Math.max(0, (1 - rawValue / 10) * 100))
    case "activity":
      return Math.min(100, Math.max(0, (rawValue / 10) * 100))
    case "bmi": {
      if (rawValue >= 18.5 && rawValue <= 24.9) return 100
      if (rawValue >= 25 && rawValue <= 29.9) return 60
      if (rawValue >= 30) return 30
      if (rawValue < 18.5) return 50
      return 50
    }
    case "smoking":
      return rawValue === 0 ? 100 : rawValue === 1 ? 40 : 0
    case "water":
      return Math.min(100, Math.max(0, (rawValue / 3) * 100))
    case "diet":
      return Math.min(100, Math.max(0, (rawValue / 10) * 100))
    default:
      return 50
  }
}

export function LongevityScore() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const [factors, setFactors] = useState<Factor[]>(() =>
    FACTORS.map((f) => ({
      ...f,
      value: f.id === "smoking" ? 0 : 5,
    }))
  )
  const [history, setHistory] = useState<ScoreEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [showSliders, setShowSliders] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("longevityHistory")
      if (saved) setHistory(JSON.parse(saved))
    } catch (e) {
      logger.error("[LongevityScore] Failed to parse longevityHistory:", e)
    }
  }, [])

  const saveHistory = useCallback((score: number, factorValues: { id: string; name: string; value: number }[]) => {
    const today = new Date().toISOString().split("T")[0]!
    const entry: ScoreEntry = {
      date: today,
      score,
      factors: factorValues,
    }
    setHistory((prev) => {
      const filtered = prev.filter((e) => e.date !== today)
      const updated = [entry, ...filtered].slice(0, 365)
      try {
        localStorage.setItem("longevityHistory", JSON.stringify(updated))
      } catch (e) {
        logger.error("[LongevityScore] Failed to save longevityHistory:", e)
      }
      return updated
    })
  }, [])

  const calculatedFactors = useMemo(
    () =>
      factors.map((f) => ({
        ...f,
        scored: calculateFactorScore(f.id, f.value),
      })),
    [factors]
  )

  const overallScore = useMemo(() => {
    let total = 0
    let totalWeight = 0
    calculatedFactors.forEach((f) => {
      total += (f.scored / 100) * f.weight
      totalWeight += f.weight
    })
    return Math.round((total / totalWeight) * 100)
  }, [calculatedFactors])

  const lowestFactor = useMemo(() => {
    let min = calculatedFactors[0]!
    calculatedFactors.forEach((f) => {
      if (f.scored < min.scored) min = f
    })
    return min
  }, [calculatedFactors])

  const updateFactor = (id: string, value: number) => {
    setFactors((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, value } : f))
      const factorValues = updated.map((f) => ({ id: f.id, name: f.name, value: f.value }))

      const tempCalculated = updated.map((f) => ({
        ...f,
        scored: calculateFactorScore(f.id, f.value),
      }))
      let total = 0
      let totalWeight = 0
      tempCalculated.forEach((f) => {
        total += (f.scored / 100) * f.weight
        totalWeight += f.weight
      })
      const score = Math.round((total / totalWeight) * 100)
      saveHistory(score, factorValues)

      return updated
    })
  }

  const handleShare = async () => {
    const text = `${isEnglish ? "My Longevity Score" : "Meu Score de Longevidade"}: ${overallScore}/100 — ${getScoreLabel(overallScore)}\n\nFitVerse AI`
    try {
      if (navigator.share) {
        await navigator.share({ title: "Longevity Score", text })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      }
    } catch (e) {
      logger.error("[LongevityScore] Failed to share/copy score:", e)
    }
  }

  const circumference = 2 * Math.PI * 60
  const strokeDashoffset = circumference - (overallScore / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
            <Heart className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isEnglish ? "Longevity Score" : "Score de Longevidade"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isEnglish ? "FREE feature" : "Recurso GRATUITO"}
            </p>
          </div>
        </div>
        <Button onClick={handleShare} variant="ghost" size="icon" className="h-8 w-8 rounded-xl border border-border">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
            <motion.circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className={cn(getScoreColor(overallScore).replace("text-", "stroke-"))}
              initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={overallScore}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn("text-3xl font-bold", getScoreColor(overallScore))}
            >
              {overallScore}
            </motion.span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {getScoreLabel(overallScore)}
            </span>
          </div>
        </div>
      </div>

      <Button
        onClick={() => setShowSliders(!showSliders)}
        variant="ghost"
        className="w-full h-8 rounded-xl text-xs font-medium text-muted-foreground mb-3"
      >
        {isEnglish ? "Adjust Factors" : "Ajustar Fatores"}
        {showSliders ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
      </Button>

      <AnimatePresence>
        {showSliders && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="space-y-3">
              {calculatedFactors.map((factor) => (
                <div key={factor.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="text-muted-foreground">{factor.icon}</div>
                      <span className="text-xs font-medium text-foreground">{factor.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {factor.weight}%
                      </span>
                      <span className={cn("text-xs font-bold", getFactorColor(factor.scored))}>
                        {factor.id === "bmi"
                          ? factor.value.toFixed(1)
                          : factor.id === "smoking"
                            ? factor.value === 0
                              ? isEnglish ? "No" : "Nao"
                              : factor.value === 1
                                ? isEnglish ? "Social" : "Social"
                                : isEnglish ? "Daily" : "Diario"
                            : `${Math.round(factor.value * 10)}%`}
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={factor.id === "bmi" ? 15 : factor.id === "smoking" ? 0 : 0}
                    max={factor.id === "bmi" ? 40 : factor.id === "smoking" ? 2 : 10}
                    step={factor.id === "bmi" ? 0.1 : 1}
                    value={factor.value}
                    onChange={(e) => updateFactor(factor.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="h-1 mt-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", getFactorColor(factor.scored))}
                      animate={{ width: `${factor.scored}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setShowTips(!showTips)}
        variant="ghost"
        className="w-full h-8 rounded-xl text-xs font-medium text-muted-foreground mb-2"
      >
        <Lightbulb className="h-3 w-3 mr-1.5 text-yellow-500" />
        {isEnglish ? "Improvement Tips" : "Dicas de Melhoria"}
        {showTips ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
      </Button>

      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-3">
              <p className="text-xs font-semibold text-foreground mb-2">
                {isEnglish ? "Focus on:" : "Foque em:"} {lowestFactor!.name}
              </p>
              <ul className="space-y-1">
                {(SLIDER_TIPS[lowestFactor!.id] || []).map((tip, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 1 && (
        <>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="ghost"
            className="w-full h-8 rounded-xl text-xs font-medium text-muted-foreground mb-2"
          >
            {isEnglish ? "Score History" : "Historico de Scores"}
            <span className="ml-1 text-[10px]">({history.length})</span>
            {showHistory ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.map((entry, i) => {
                    const prev = history[i + 1]
                    const diff = prev ? entry.score - prev.score : 0
                    return (
                      <div key={entry.date} className="flex items-center justify-between rounded-xl border border-border p-2.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", getScoreBg(entry.score))} />
                          <span className="text-xs text-foreground">
                            {new Date(entry.date).toLocaleDateString(isEnglish ? "en-US" : "pt-BR", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{entry.score}</span>
                          {diff !== 0 && (
                            <span className={cn("flex items-center text-[10px] font-medium", diff > 0 ? "text-emerald-500" : "text-red-500")}>
                              {diff > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                              {diff > 0 ? "+" : ""}{diff}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  )
}
