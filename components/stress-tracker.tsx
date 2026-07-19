"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Brain, Lock, Lightbulb, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"

interface StressEntry {
  date: string
  stress: number
  mood: string
  notes: string
}

const STORAGE_KEY = "stressTrackerData"

const moods = [
  { emoji: "😊", label: { en: "Great", pt: "Otimo" }, value: 5 },
  { emoji: "🙂", label: { en: "Good", pt: "Bom" }, value: 4 },
  { emoji: "😐", label: { en: "Neutral", pt: "Neutro" }, value: 3 },
  { emoji: "😟", label: { en: "Bad", pt: "Ruim" }, value: 2 },
  { emoji: "😰", label: { en: "Terrible", pt: "Pessimo" }, value: 1 },
]

const insights: Record<string, string[]> = {
  high: ["Your stress levels are elevated. Consider a short walk or breathing exercises.", "High stress detected. Prioritize rest and hydration today."],
  medium: ["Moderate stress today. A 10-minute meditation could help.", "You're managing stress well. Keep maintaining your routines."],
  low: ["Great stress management! Your routines are paying off.", "Low stress is ideal for recovery and performance."],
}

export function StressTracker({ isLocked = false }: { isLocked?: boolean }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [entries, setEntries] = useState<StressEntry[]>([])
  const [stress, setStress] = useState(5)
  const [mood, setMood] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setEntries(JSON.parse(saved))
    } catch (e) {
      logger.error("[StressTracker] Failed to parse stress data:", e)
    }
  }, [])

  const saveEntries = useCallback((data: StressEntry[]) => {
    const cleaned = data.filter((d) => Date.now() - new Date(d.date).getTime() < 90 * 24 * 60 * 60 * 1000)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    setEntries(cleaned)
  }, [])

  const todayEntry = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return entries.find((e) => e.date === today)
  }, [entries])

  const weekData = useMemo(() => {
    const dayLabels = isEnglish ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]
    const days: { name: string; stress: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      const found = entries.find((e) => e.date === key)
      days.push({ name: dayLabels[(d.getDay() + 6) % 7]!, stress: found?.stress || 0 })
    }
    return days
  }, [entries, isEnglish])

  const dayPattern = useMemo(() => {
    const dayMap: Record<number, { total: number; count: number }> = {}
    entries.forEach((e) => {
      const day = new Date(e.date).getDay()
      if (!dayMap[day]) dayMap[day] = { total: 0, count: 0 }
      dayMap[day].total += e.stress
      dayMap[day].count++
    })
    const dayLabels = isEnglish ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
    return [0, 1, 2, 3, 4, 5, 6].map((d) => ({
      name: dayLabels[d],
      avg: dayMap[d] ? Math.round(dayMap[d].total / dayMap[d].count) : 0,
    }))
  }, [entries, isEnglish])

  const insight = useMemo(() => {
    if (todayEntry) {
      if (todayEntry.stress >= 7) return insights.high![Math.floor(Math.random() * insights.high!.length)]
      if (todayEntry.stress >= 4) return insights.medium![Math.floor(Math.random() * insights.medium!.length)]
      return insights.low![Math.floor(Math.random() * insights.low!.length)]
    }
    if (stress >= 7) return insights.high![Math.floor(Math.random() * insights.high!.length)]
    if (stress >= 4) return insights.medium![Math.floor(Math.random() * insights.medium!.length)]
    return insights.low![Math.floor(Math.random() * insights.low!.length)]
  }, [todayEntry, stress])

  const handleLog = () => {
    if (!mood) return
    const today = new Date().toISOString().split("T")[0]!
    const entry: StressEntry = { date: today, stress, mood, notes }
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
            <Brain className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{isEnglish ? "Stress & Mood" : "Estresse & Humor"}</h3>
            <p className="text-xs text-muted-foreground">{isEnglish ? "Track daily wellbeing" : "Rastreie o bem-estar diario"}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Lock className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">{isEnglish ? "Pro Feature" : "Recurso Pro"}</p>
          <p className="text-xs text-muted-foreground">{isEnglish ? "Upgrade to Pro to track stress & mood" : "Atualize para Pro para rastrear estresse e humor"}</p>
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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
          <Brain className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{isEnglish ? "Stress & Mood" : "Estresse & Humor"}</h3>
          <p className="text-xs text-muted-foreground">{isEnglish ? "How are you feeling today?" : "Como voce esta se sentindo hoje?"}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{isEnglish ? "Stress Level" : "Nivel de Estresse"}</span>
          <span className="text-xs font-bold text-foreground">{stress}/10</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={stress}
          onChange={(e) => setStress(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">1</span>
          <span className="text-[9px] text-muted-foreground">10</span>
        </div>
      </div>

      <div className="mb-4">
        <span className="text-xs text-muted-foreground block mb-2">{isEnglish ? "Mood" : "Humor"}</span>
        <div className="flex gap-1.5">
          {moods.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.emoji)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 p-2 rounded-xl border transition-all",
                mood === m.emoji ? "border-purple-500 bg-purple-500/10" : "border-border bg-muted/50"
              )}
            >
              <span className="text-lg">{m.emoji}</span>
              <span className="text-[9px] text-muted-foreground">{isEnglish ? m.label.en : m.label.pt}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={isEnglish ? "Optional notes..." : "Notas opcionais..."}
          className="w-full h-16 text-xs bg-muted border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none"
        />
      </div>

      <Button onClick={handleLog} disabled={!mood} className="w-full h-9 rounded-xl text-xs font-medium bg-purple-500 hover:bg-purple-600 text-white">
        {todayEntry ? (isEnglish ? "Update Log" : "Atualizar Registro") : (isEnglish ? "Log Today" : "Registrar Hoje")}
      </Button>

      <div className="mt-4">
        <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          {isEnglish ? "Weekly Stress" : "Estresse Semanal"}
        </p>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={20} />
              <Tooltip
                contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(value: number) => [`${value}/10`, isEnglish ? "Stress" : "Estresse"]}
              />
              <Bar dataKey="stress" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          {isEnglish ? "Stress by Day of Week" : "Estresse por Dia da Semana"}
        </p>
        <div className="flex items-end gap-1 h-12">
          {dayPattern.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full bg-muted rounded-t-sm relative overflow-hidden flex-1 min-h-[2px]">
                <motion.div
                  className="absolute bottom-0 w-full rounded-t-sm bg-purple-500/60"
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.avg / 10) * 100}%` }}
                  transition={{ delay: i * 0.05 }}
                />
              </div>
              <span className="text-[8px] text-muted-foreground">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-muted/50">
        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
            {isEnglish ? "AI Insight" : "Insight IA"}
          </p>
          <p className="text-xs text-foreground">{insight}</p>
        </div>
      </div>
    </motion.div>
  )
}
