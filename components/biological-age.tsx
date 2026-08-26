"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Brain,
  Moon,
  Zap,
  Activity,
  Cigarette,
  TrendingUp,
  TrendingDown,
  Lock,
  ChevronDown,
  ChevronUp,
  Heart,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"

interface BioAgeEntry {
  date: string
  chronologicalAge: number
  biologicalAge: number
  factors: { name: string; impact: number; label: string }[]
}

interface AgeFactor {
  id: string
  name: string
  value: number
  icon: React.ReactNode
}

function calculateBiologicalAge(
  chronologicalAge: number,
  bmi: number,
  sleepQuality: number,
  stressLevel: number,
  activityLevel: number,
  isSmoker: boolean
): { biologicalAge: number; factors: { name: string; impact: number; label: string }[] } {
  const factors: { name: string; impact: number; label: string }[] = []
  let biologicalAge = chronologicalAge

  const bmiImpact = bmi >= 18.5 && bmi <= 24.9
    ? -2
    : bmi >= 25 && bmi <= 29.9
      ? 3
      : bmi >= 30
        ? 6
        : 2
  factors.push({ name: "BMI", impact: bmiImpact, label: bmiImpact <= 0 ? "Optimal" : bmiImpact <= 3 ? "Moderate" : "High" })
  biologicalAge += bmiImpact

  const sleepImpact = sleepQuality >= 8 ? -3 : sleepQuality >= 6 ? -1 : sleepQuality >= 4 ? 2 : 4
  factors.push({ name: "Sleep Quality", impact: sleepImpact, label: sleepImpact <= -1 ? "Excellent" : sleepImpact <= 1 ? "Good" : "Poor" })
  biologicalAge += sleepImpact

  const stressImpact = stressLevel <= 3 ? -2 : stressLevel <= 5 ? 0 : stressLevel <= 7 ? 2 : 4
  factors.push({ name: "Stress Level", impact: stressImpact, label: stressImpact <= -1 ? "Low" : stressImpact <= 1 ? "Moderate" : "High" })
  biologicalAge += stressImpact

  const activityImpact = activityLevel >= 8 ? -4 : activityLevel >= 6 ? -2 : activityLevel >= 4 ? 0 : activityLevel >= 2 ? 3 : 5
  factors.push({ name: "Activity Level", impact: activityImpact, label: activityImpact <= -2 ? "Excellent" : activityImpact <= 0 ? "Good" : "Poor" })
  biologicalAge += activityImpact

  const smokingImpact = isSmoker ? 8 : -1
  factors.push({ name: "Smoking", impact: smokingImpact, label: isSmoker ? "Smoker" : "Non-smoker" })
  biologicalAge += smokingImpact

  biologicalAge = Math.max(18, Math.round(biologicalAge * 10) / 10)

  return { biologicalAge, factors }
}

function getAgeColor(diff: number): string {
  if (diff <= -5) return "text-brand"
  if (diff <= -1) return "text-brand"
  if (diff <= 1) return "text-foreground"
  if (diff <= 5) return "text-orange-500"
  return "text-red-500"
}

function getAgeBg(diff: number): string {
  if (diff <= -5) return "bg-brand"
  if (diff <= -1) return "bg-brand"
  if (diff <= 1) return "bg-foreground"
  if (diff <= 5) return "bg-orange-500"
  return "bg-red-500"
}

const RECOMMENDATIONS: Record<string, string[]> = {
  BMI: ["Maintain a BMI between 18.5-24.9", "Focus on whole foods and lean proteins", "Combine strength and cardio training"],
  "Sleep Quality": ["Aim for 7-9 hours nightly", "Maintain a consistent sleep schedule", "Create a dark, cool sleep environment"],
  "Stress Level": ["Practice daily mindfulness or meditation", "Take regular breaks during work", "Build strong social connections"],
  "Activity Level": ["Exercise at least 150min/week moderate", "Add strength training 2x/week", "Walk more throughout the day"],
  Smoking: ["Quitting can add 10 healthy years", "Seek support programs and patches", "Replace with healthy habits"],
}

export function BiologicalAge({ isLocked = false }: { isLocked?: boolean }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const [chronologicalAge, setChronologicalAge] = useState(30)
  const [bmi, setBmi] = useState(23)
  const [sleepQuality, setSleepQuality] = useState(7)
  const [stressLevel, setStressLevel] = useState(4)
  const [activityLevel, setActivityLevel] = useState(6)
  const [isSmoker, setIsSmoker] = useState(false)
  const [history, setHistory] = useState<BioAgeEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("biologicalAgeHistory")
      if (saved) setHistory(JSON.parse(saved))
    } catch (e) {
      logger.error("[BiologicalAge] Failed to parse biologicalAgeHistory:", e)
    }
  }, [])

  const addEntry = useCallback((entry: BioAgeEntry) => {
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 50)
      try {
        localStorage.setItem("biologicalAgeHistory", JSON.stringify(updated))
      } catch (e) {
        logger.error("[BiologicalAge] Failed to save biologicalAgeHistory:", e)
      }
      return updated
    })
  }, [])

  const { biologicalAge, factors } = useMemo(
    () => calculateBiologicalAge(chronologicalAge, bmi, sleepQuality, stressLevel, activityLevel, isSmoker),
    [chronologicalAge, bmi, sleepQuality, stressLevel, activityLevel, isSmoker]
  )

  const ageDifference = biologicalAge - chronologicalAge
  const healthSpan = useMemo(() => {
    const base = chronologicalAge
    if (ageDifference <= -5) return Math.round(base * 1.15)
    if (ageDifference <= 0) return Math.round(base * 1.08)
    if (ageDifference <= 5) return Math.round(base * 0.95)
    return Math.round(base * 0.85)
  }, [chronologicalAge, ageDifference])

  const handleCalculate = () => {
    setHasCalculated(true)
    const today = new Date().toISOString().split("T")[0]!
    const entry: BioAgeEntry = {
      date: today,
      chronologicalAge,
      biologicalAge,
      factors,
    }
    addEntry(entry)
  }

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border glass-strong p-5 relative overflow-hidden"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted">
            <Brain className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isEnglish ? "Biological Age" : "Idade Biologica"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isEnglish ? "Premium feature" : "Recurso Premium"}
            </p>
          </div>
        </div>
        <div className="paywall-card">
          <div className="paywall-icon"><Lock className="w-6 h-6" /></div>
          <h3 className="text-[15px] font-semibold mb-1">{isEnglish ? "Upgrade to Premium" : "Faca upgrade para Premium"}</h3>
          <p className="text-[13px] text-muted-foreground mb-4">{isEnglish ? "Unlock biological age estimation with Premium" : "Desbloqueie a estimativa de idade biologica com Premium"}</p>
          <Button className="h-11 rounded-xl bg-brand text-brand-foreground w-full">Unlock with Pro →</Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border glass-strong p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted">
            <Brain className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isEnglish ? "Biological Age" : "Idade Biologica"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isEnglish ? "Premium feature" : "Recurso Premium"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="rounded-xl bg-card border border-border p-3">
          <label className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground"><Clock className="h-3.5 w-3.5 text-brand" />{isEnglish ? "Chronological Age" : "Idade Cronologica"}</span>
            <span className="text-xs font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">{chronologicalAge} {isEnglish ? "yrs" : "anos"}</span>
          </label>
          <input
            type="range"
            min={18}
            max={100}
            value={chronologicalAge}
            onChange={(e) => setChronologicalAge(parseInt(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand"
          />
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <span className="text-[10px] text-muted-foreground">{chronologicalAge < 35 ? "Optimal" : chronologicalAge < 55 ? "Medium" : "Mature"}</span>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-3">
          <label className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground"><Activity className="h-3.5 w-3.5 text-brand" />BMI</span>
            <span className="text-xs font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">{bmi.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={15}
            max={40}
            step={0.1}
            value={bmi}
            onChange={(e) => setBmi(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand"
          />
          <div className="flex items-center gap-1.5 mt-2">
            <span className={cn("w-2 h-2 rounded-full", bmi >= 18.5 && bmi <= 24.9 ? "bg-brand" : bmi >= 25 && bmi <= 29.9 ? "bg-amber-500" : "bg-red-500")} />
            <span className="text-[10px] text-muted-foreground">{bmi >= 18.5 && bmi <= 24.9 ? "Optimal" : bmi >= 25 && bmi <= 29.9 ? "Medium" : "High"}</span>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-3">
          <label className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground"><Moon className="h-3.5 w-3.5 text-brand" />{isEnglish ? "Sleep Quality" : "Qualidade do Sono"}</span>
            <span className="text-xs font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">{sleepQuality}/10</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={sleepQuality}
            onChange={(e) => setSleepQuality(parseInt(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand"
          />
          <div className="flex items-center gap-1.5 mt-2">
            <span className={cn("w-2 h-2 rounded-full", sleepQuality >= 8 ? "bg-brand" : sleepQuality >= 6 ? "bg-brand" : sleepQuality >= 4 ? "bg-amber-500" : "bg-red-500")} />
            <span className="text-[10px] text-muted-foreground">{sleepQuality >= 8 ? "Optimal" : sleepQuality >= 6 ? "Good" : sleepQuality >= 4 ? "Medium" : "Poor"}</span>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-3">
          <label className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground"><Brain className="h-3.5 w-3.5 text-brand" />{isEnglish ? "Stress Level" : "Nivel de Estresse"}</span>
            <span className="text-xs font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">{stressLevel}/10</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={stressLevel}
            onChange={(e) => setStressLevel(parseInt(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand"
          />
          <div className="flex items-center gap-1.5 mt-2">
            <span className={cn("w-2 h-2 rounded-full", stressLevel <= 3 ? "bg-brand" : stressLevel <= 5 ? "bg-amber-500" : "bg-red-500")} />
            <span className="text-[10px] text-muted-foreground">{stressLevel <= 3 ? "Optimal" : stressLevel <= 5 ? "Medium" : "High"}</span>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-3">
          <label className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground"><Zap className="h-3.5 w-3.5 text-brand" />{isEnglish ? "Activity Level" : "Nivel de Atividade"}</span>
            <span className="text-xs font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">{activityLevel}/10</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={activityLevel}
            onChange={(e) => setActivityLevel(parseInt(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand"
          />
          <div className="flex items-center gap-1.5 mt-2">
            <span className={cn("w-2 h-2 rounded-full", activityLevel >= 8 ? "bg-brand" : activityLevel >= 6 ? "bg-brand" : activityLevel >= 4 ? "bg-amber-500" : "bg-red-500")} />
            <span className="text-[10px] text-muted-foreground">{activityLevel >= 8 ? "Optimal" : activityLevel >= 6 ? "Good" : activityLevel >= 4 ? "Medium" : "Poor"}</span>
          </div>
        </div>

        <button
          onClick={() => setIsSmoker(!isSmoker)}
          className={cn(
            "w-full rounded-xl bg-card border p-3 flex items-center justify-between transition-all",
            isSmoker ? "border-red-500/30 bg-red-500/5" : "border-border"
          )}
        >
          <div className="flex items-center gap-2">
            <Cigarette className={cn("h-4 w-4", isSmoker ? "text-red-500" : "text-muted-foreground")} />
            <span className="text-xs font-medium text-foreground">{isEnglish ? "Smoking Status" : "Status de Tabagismo"}</span>
          </div>
          <span className={cn("text-xs font-bold", isSmoker ? "text-red-500" : "text-brand")}>
            {isSmoker ? (isEnglish ? "Yes" : "Sim") : (isEnglish ? "No" : "Nao")}
          </span>
        </button>
      </div>

      <Button onClick={handleCalculate} className="w-full h-10 rounded-xl bg-brand hover:bg-brand/90 text-white font-semibold text-sm mb-4">
        <Brain className="h-4 w-4 mr-1.5" />
        {isEnglish ? "Calculate" : "Calcular"}
      </Button>

      {hasCalculated && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-border p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{isEnglish ? "Chronological" : "Cronologica"}</p>
              <p className="text-2xl font-bold text-foreground">{chronologicalAge}</p>
              <p className="text-[10px] text-muted-foreground">{isEnglish ? "years" : "anos"}</p>
            </div>
            <div className="rounded-xl border border-border p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{isEnglish ? "Biological" : "Biologica"}</p>
              <p className={cn("text-2xl font-bold", getAgeColor(ageDifference))}>{biologicalAge}</p>
              <p className="text-[10px] text-muted-foreground">{isEnglish ? "years" : "anos"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">{isEnglish ? "Difference" : "Diferenca"}</span>
              <span className={cn("text-sm font-bold", getAgeColor(ageDifference))}>
                {ageDifference > 0 ? "+" : ""}{ageDifference} {isEnglish ? "years" : "anos"}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">{isEnglish ? "Health Span" : "Expectativa de Vida"}</span>
              <span className="text-sm font-bold text-foreground">{healthSpan} {isEnglish ? "years" : "anos"}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", getAgeBg(ageDifference))}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, 50 - ageDifference * 5))}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {factors.map((factor) => (
              <div key={factor.name} className="flex items-center justify-between rounded-xl border border-border p-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    factor.impact <= -1 ? "bg-brand" : factor.impact <= 1 ? "bg-foreground" : "bg-red-500"
                  )} />
                  <span className="text-xs font-medium text-foreground">{factor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{factor.label}</span>
                  <span className={cn(
                    "flex items-center text-xs font-bold",
                    factor.impact <= -1 ? "text-brand" : factor.impact <= 1 ? "text-foreground" : "text-red-500"
                  )}>
                    {factor.impact > 0 ? "+" : ""}{factor.impact}
                    {factor.impact !== 0 && (
                      factor.impact < 0
                        ? <TrendingDown className="h-3 w-3 ml-0.5" />
                        : <TrendingUp className="h-3 w-3 ml-0.5" />
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setShowRecommendations(!showRecommendations)}
            variant="ghost"
            className="w-full h-8 rounded-xl text-xs font-medium text-muted-foreground mb-2"
          >
            <Heart className="h-3 w-3 mr-1.5 text-brand" />
            {isEnglish ? "Recommendations" : "Recomendacoes"}
            {showRecommendations ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>

          <AnimatePresence>
            {showRecommendations && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="rounded-xl border border-brand/20 bg-brand-muted p-3 space-y-2">
                  {factors.filter((f) => f.impact > 0).map((factor) => (
                    <div key={factor.name}>
                      <p className="text-xs font-semibold text-foreground mb-1">{factor.name} (+{factor.impact} years)</p>
                      <ul className="space-y-0.5">
                        {(RECOMMENDATIONS[factor.name] || []).map((rec, i) => (
                          <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                            <span className="text-brand mt-0.5">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {factors.filter((f) => f.impact > 0).length === 0 && (
                    <p className="text-xs text-brand text-center py-2">
                      {isEnglish ? "All factors look great! Keep it up." : "Todos os fatores estao otimos! Continue assim."}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {history.length > 1 && (
        <>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="ghost"
            className="w-full h-8 rounded-xl text-xs font-medium text-muted-foreground mb-2"
          >
            <Clock className="h-3 w-3 mr-1.5" />
            {isEnglish ? "History" : "Historico"}
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
                    const diff = entry.biologicalAge - entry.chronologicalAge
                    return (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-border p-2.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", getAgeBg(diff))} />
                          <span className="text-xs text-foreground">
                            {new Date(entry.date).toLocaleDateString(isEnglish ? "en-US" : "pt-BR", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{entry.chronologicalAge}→</span>
                          <span className={cn("text-xs font-bold", getAgeColor(diff))}>{entry.biologicalAge}</span>
                          <span className={cn("text-[10px] font-medium", getAgeColor(diff))}>
                            ({diff > 0 ? "+" : ""}{diff})
                          </span>
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
