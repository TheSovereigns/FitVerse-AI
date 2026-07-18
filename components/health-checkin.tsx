"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { ClipboardCheck, Lock, Lightbulb, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface HealthScores {
  energy: number
  mood: number
  pain: number
  digestion: number
  motivation: number
  recovery: number
  overall: number
}

interface HealthCheckinEntry {
  date: string
  scores: HealthScores
  notes: string
  totalScore: number
}

const STORAGE_KEY = "healthCheckinData"

const questions: { key: keyof HealthScores; en: string; pt: string }[] = [
  { key: "energy", en: "Energy Level", pt: "Nivel de Energia" },
  { key: "mood", en: "Mood", pt: "Humor" },
  { key: "pain", en: "Pain / Discomfort", pt: "Dor / Desconforto" },
  { key: "digestion", en: "Digestion", pt: "Digestao" },
  { key: "motivation", en: "Motivation", pt: "Motivacao" },
  { key: "recovery", en: "Recovery", pt: "Recuperacao" },
  { key: "overall", en: "Overall Feeling", pt: "Sensacao Geral" },
]

function getRecommendation(scores: HealthScores, isEnglish: boolean): string {
  const low = Object.entries(scores).filter(([, v]) => v <= 2)
  if (low.length === 0) {
    return isEnglish
      ? "Everything looks great! Keep up your current routines."
      : "Tudo esta otimo! Mantenha seus rotinas atuais."
  }
  const keys = low.map(([k]) => k)
  if (keys.includes("energy") || keys.includes("recovery")) {
    return isEnglish
      ? "Low energy detected. Prioritize sleep and consider reducing training intensity."
      : "Energia baixa detectada. Priorize o sono e considere reduzir a intensidade do treino."
  }
  if (keys.includes("pain")) {
    return isEnglish
      ? "Pain reported. Consider rest days and consult a professional if persistent."
      : "Dor relatada. Considere dias de descanso e consulte um profissional se persistir."
  }
  if (keys.includes("digestion")) {
    return isEnglish
      ? "Digestive issues noted. Review fiber intake and hydration."
      : "Problemas digestivos notados. Revise a ingesta de fibra e hidratacao."
  }
  if (keys.includes("mood") || keys.includes("motivation")) {
    return isEnglish
      ? "Low mood or motivation. Light exercise and social connection can help."
      : "Humor ou motivacao baixos. Exercicio leve e conexao social podem ajudar."
  }
  return isEnglish
    ? "Some areas need attention. Focus on the basics: sleep, nutrition, and movement."
    : "Algumas areas precisam de atencao. Foco no basico: sono, nutricao e movimento."
}

export function HealthCheckin({ isLocked = false }: { isLocked?: boolean }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [entries, setEntries] = useState<HealthCheckinEntry[]>([])
  const [scores, setScores] = useState<HealthScores>({
    energy: 3, mood: 3, pain: 3, digestion: 3, motivation: 3, recovery: 3, overall: 3,
  })
  const [notes, setNotes] = useState("")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setEntries(JSON.parse(saved))
    } catch {}
  }, [])

  const saveEntries = useCallback((data: HealthCheckinEntry[]) => {
    const cleaned = data.filter((d) => Date.now() - new Date(d.date).getTime() < 180 * 24 * 60 * 60 * 1000)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    setEntries(cleaned)
  }, [])

  const todayEntry = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return entries.find((e) => e.date === today)
  }, [entries])

  const totalScore = useMemo(() => {
    const vals = Object.values(scores)
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }, [scores])

  const weekData = useMemo(() => {
    return entries.slice(-12).map((e, i) => ({
      name: `W${i + 1}`,
      score: e.totalScore,
    }))
  }, [entries])

  const recommendation = useMemo(() => getRecommendation(todayEntry?.scores || scores, isEnglish), [todayEntry, scores, isEnglish])

  const handleLog = () => {
    const today = new Date().toISOString().split("T")[0]
    const entry: HealthCheckinEntry = { date: today, scores, notes, totalScore }
    const existing = entries.findIndex((e) => e.date === today)
    const updated = [...entries]
    if (existing >= 0) updated[existing] = entry
    else updated.push(entry)
    saveEntries(updated)
  }

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
            <ClipboardCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{isEnglish ? "Health Check-in" : "Check-in de Saude"}</h3>
            <p className="text-xs text-muted-foreground">{isEnglish ? "Weekly wellness questionnaire" : "Questionario semanal de bem-estar"}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Lock className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">{isEnglish ? "Pro Feature" : "Recurso Pro"}</p>
          <p className="text-xs text-muted-foreground">{isEnglish ? "Upgrade to Pro for health check-ins" : "Atualize para Pro para check-ins de saude"}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
          <ClipboardCheck className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{isEnglish ? "Health Check-in" : "Check-in de Saude"}</h3>
          <p className="text-xs text-muted-foreground">{isEnglish ? "Rate each area from 1-5" : "Avalie cada area de 1-5"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-muted/50">
        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-foreground">{totalScore}</p>
          <p className="text-[10px] text-muted-foreground">{isEnglish ? "Weekly Score" : "Score Semanal"}</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-emerald-500">{entries.length}</p>
          <p className="text-[10px] text-muted-foreground">{isEnglish ? "Check-ins" : "Check-ins"}</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {questions.map((q) => (
          <div key={q.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{isEnglish ? q.en : q.pt}</span>
              <span className="text-xs font-bold text-foreground">{scores[q.key]}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setScores((prev) => ({ ...prev, [q.key]: v }))}
                  className={cn(
                    "flex-1 h-7 rounded-lg text-xs font-medium transition-all border",
                    scores[q.key] === v
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={isEnglish ? "Optional notes..." : "Notas opcionais..."}
          className="w-full h-14 text-xs bg-muted border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none"
        />
      </div>

      <Button onClick={handleLog} className="w-full h-9 rounded-xl text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white">
        {todayEntry ? (isEnglish ? "Update Check-in" : "Atualizar Check-in") : (isEnglish ? "Submit Check-in" : "Enviar Check-in")}
      </Button>

      {weekData.length > 1 && (
        <div className="mt-4">
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            {isEnglish ? "Trend Over Time" : "Tendencia ao Longo do Tempo"}
          </p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={20} />
                <Tooltip
                  contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(value: number) => [`${value}`, isEnglish ? "Score" : "Score"]}
                />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-muted/50">
        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
            {isEnglish ? "AI Recommendation" : "Recomendacao IA"}
          </p>
          <p className="text-xs text-foreground">{recommendation}</p>
        </div>
      </div>
    </motion.div>
  )
}
