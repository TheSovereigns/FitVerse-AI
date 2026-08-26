"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Moon, Star, Lock, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"

interface SleepEntry {
  date: string
  bedtime: string
  wakeTime: string
  duration: number
  quality: number
}

const STORAGE_KEY = "sleepTrackerData"
const TARGET_HOURS = 8

const sleepTips: Record<number, string[]> = {
  1: ["Try going to bed 30 minutes earlier tonight", "Avoid screens 1 hour before bed"],
  2: ["A consistent bedtime helps regulate your body clock", "Try a warm shower before bed"],
  3: ["Good progress! Try reducing caffeine after 2pm", "Keep your room cool and dark"],
  4: ["Great sleep quality! Keep maintaining your routine", "Consider adding light stretching before bed"],
  5: ["Excellent! You're optimizing your recovery perfectly", "Share your sleep routine with friends for accountability"],
}

function calculateDuration(bedtime: string, wakeTime: string): number {
  const [bH, bM] = bedtime.split(":").map(Number)
  const [wH, wM] = wakeTime.split(":").map(Number)
  let bedMinutes = bH! * 60 + bM!
  let wakeMinutes = wH! * 60 + wM!
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60
  return Math.round(((wakeMinutes - bedMinutes) / 60) * 10) / 10
}

function calculateSleepScore(duration: number, quality: number): number {
  const durationScore = Math.min(duration / TARGET_HOURS, 1.2) * 50
  const qualityScore = (quality / 5) * 50
  return Math.round(durationScore + qualityScore)
}

export function SleepTracker({ isLocked = false }: { isLocked?: boolean }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [bedtime, setBedtime] = useState("23:00")
  const [wakeTime, setWakeTime] = useState("07:00")
  const [quality, setQuality] = useState(3)
  const [showTip, setShowTip] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 300); return () => clearTimeout(t) }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setEntries(JSON.parse(saved))
    } catch (e) {
      logger.error("[SleepTracker] Failed to parse sleep data:", e)
    }
  }, [])

  const saveEntries = useCallback((data: SleepEntry[]) => {
    const cleaned = data.filter((d) => Date.now() - new Date(d.date).getTime() < 90 * 24 * 60 * 60 * 1000)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    setEntries(cleaned)
  }, [])

  const todayEntry = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return entries.find((e) => e.date === today)
  }, [entries])

  const duration = useMemo(() => calculateDuration(bedtime, wakeTime), [bedtime, wakeTime])

  const weekData = useMemo(() => {
    const days: { name: string; hours: number }[] = []
    const dayLabels = isEnglish ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      const found = entries.find((e) => e.date === key)
      days.push({ name: dayLabels[(d.getDay() + 6) % 7]!, hours: found?.duration || 0 })
    }
    return days
  }, [entries, isEnglish])

  const sleepDebt = useMemo(() => {
    const last7 = entries.slice(-7)
    if (last7.length === 0) return 0
    const total = last7.reduce((sum, e) => sum + e.duration, 0)
    const expected = last7.length * TARGET_HOURS
    return Math.round((expected - total) * 10) / 10
  }, [entries])

  const score = useMemo(() => todayEntry ? calculateSleepScore(todayEntry.duration, todayEntry.quality) : calculateSleepScore(duration, quality), [todayEntry, duration, quality])

  const tip = useMemo(() => {
    const q = todayEntry?.quality || quality
    const tips = sleepTips[q] || sleepTips[3]!
    return tips[Math.floor(Math.random() * tips.length)]
  }, [todayEntry, quality])

  const handleLog = () => {
    const today = new Date().toISOString().split("T")[0]!
    const entry: SleepEntry = { date: today, bedtime, wakeTime, duration, quality }
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
        className="rounded-2xl border border-border glass-strong p-5"
      >
        {isLoading && (
          <div className="space-y-4 animate-fade-in">
            <div className="h-20 skeleton" />
            <div className="h-32 skeleton" />
          </div>
        )}
        {!isLoading && (
          <>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted">
            <Moon className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{isEnglish ? "Sleep Tracker" : "Rastreador de Sono"}</h3>
            <p className="text-xs text-muted-foreground">{isEnglish ? "Track & optimize your sleep" : "Rastreie e otimize seu sono"}</p>
          </div>
        </div>
        <div className="paywall-card">
          <div className="paywall-icon"><Lock className="w-6 h-6" /></div>
          <h3 className="text-[15px] font-semibold mb-1">{isEnglish ? "Pro Feature" : "Recurso Pro"}</h3>
          <p className="text-[13px] text-muted-foreground mb-4">{isEnglish ? "Upgrade to Pro to track your sleep" : "Atualize para Pro para rastrear seu sono"}</p>
          <Button className="h-11 rounded-xl bg-brand text-brand-foreground w-full">Unlock with Pro →</Button>
        </div>
          </>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border glass-strong p-5"
    >
      {isLoading && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-3 gap-2">
            <div className="h-20 skeleton" />
            <div className="h-20 skeleton" />
            <div className="h-20 skeleton" />
          </div>
          <div className="h-28 skeleton" />
          <div className="space-y-2">
            <div className="h-12 skeleton" />
            <div className="h-12 skeleton" />
          </div>
        </div>
      )}
      {!isLoading && (
        <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted">
            <Moon className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{isEnglish ? "Sleep Tracker" : "Rastreador de Sono"}</h3>
            <p className="text-xs text-muted-foreground">{isEnglish ? "Last 7 days" : "Ultimos 7 dias"}</p>
          </div>
        </div>
        {todayEntry && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand/10">
            <span className="text-xs font-semibold text-brand">{isEnglish ? "Today" : "Hoje"}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-xl bg-brand-muted card-hover">
          <p className="text-lg font-bold text-foreground">{todayEntry?.duration || duration}h</p>
          <p className="text-[10px] text-muted-foreground">{isEnglish ? "Duration" : "Duracao"}</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-brand-muted card-hover">
          <p className="text-lg font-bold text-foreground">{score}</p>
          <p className="text-[10px] text-muted-foreground">{isEnglish ? "Sleep Score" : "Score Sono"}</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-brand-muted card-hover">
          <p className={cn("text-lg font-bold", sleepDebt > 0 ? "text-red-500" : "text-brand")}>
            {sleepDebt > 0 ? `-${sleepDebt}h` : "0h"}
          </p>
          <p className="text-[10px] text-muted-foreground">{isEnglish ? "Sleep Debt" : "Divida Sono"}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{isEnglish ? "Bedtime" : "Hora de dormir"}</span>
          <div className="relative flex items-center">
            <Clock className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-xl bg-muted/50 border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-border"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{isEnglish ? "Wake time" : "Hora de acordar"}</span>
          <div className="relative flex items-center">
            <Clock className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-xl bg-muted/50 border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-border"
            />
          </div>
        </div>
        <div className="mb-3">
          <span className="text-xs text-muted-foreground block mb-1.5">{isEnglish ? "Sleep quality" : "Qualidade do sono"}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setQuality(star)} className="p-0.5">
                <Star className={cn("h-5 w-5 transition-colors", star <= quality ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleLog} className="w-full h-9 rounded-xl text-xs font-medium bg-brand text-brand-foreground hover:bg-brand/90">
          {todayEntry ? (isEnglish ? "Update Log" : "Atualizar Registro") : (isEnglish ? "Log Sleep" : "Registrar Sono")}
        </Button>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          {isEnglish ? "Weekly Overview" : "Visao Semanal"}
        </p>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 12]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={25} />
              <Tooltip
                contentStyle={{ background: 'hsl(0 0% 6%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                formatter={(value: number) => [`${value}h`, isEnglish ? "Sleep" : "Sono"]}
              />
              <Line type="monotone" dataKey="hours" stroke="#34D399" strokeWidth={2} dot={{ r: 3, fill: "#34D399" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-brand-muted card-hover">
        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
            {isEnglish ? "Tip of the Day" : "Dica do Dia"}
          </p>
          <p className="text-xs text-foreground">{tip}</p>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
          {entries.slice(-5).reverse().map((entry) => (
            <div key={entry.date} className="flex items-center justify-between rounded-xl border border-border p-3 card-hover">
              <div>
                <p className="text-xs font-medium text-foreground">{new Date(entry.date).toLocaleDateString(isEnglish ? "en-US" : "pt-BR", { month: "short", day: "numeric" })} • {entry.duration}h</p>
                <p className="text-[10px] text-muted-foreground">{entry.bedtime} — {entry.wakeTime}</p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-3 w-3", i < entry.quality ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30")} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </motion.div>
  )
}
