"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Calendar, Dumbbell, ScanLine, Droplets, Heart, Zap, Star } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from "date-fns"
import { ptBR, enUS } from "date-fns/locale"

interface DayData {
  day: string
  label: string
  scans: number
  workouts: number
  water: number
  habits: number
  score: number
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function WeeklyReport() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const dateLocale = isEnglish ? enUS : ptBR
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const data = useMemo(() => {
    if (!mounted) return { dailyData: [], weekScans: 0, weekWater: 0, weekHabits: 0, totalScans: 0, totalWorkouts: 0, xp: 0, coins: 0 }
    const gamStats = safeGet("fitverse-gamification-stats", { totalScans: 0, totalWorkouts: 0, totalWater: 0, totalHabits: 0 })
    const hydrationHistory = safeGet<Array<{ date: string; amount: number }>>("fitverse-hydration-history", [])
    const habitLogs = safeGet<Array<{ date: string; completed: string[] }>>("habit_logs", [])
    const scanHistory = safeGet<Array<{ scannedAt: string }>>("fitverse-scan-history", [])
    const xp = safeGet("fitverse-xp", 0)
    const coins = safeGet("fitverse-coins", 0)

    const dailyData: DayData[] = weekDays.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      const label = format(date, "EEE", { locale: dateLocale })
      const dayScans = scanHistory.filter(s => s.scannedAt?.startsWith(dateStr)).length
      const dayWater = hydrationHistory.filter(h => h.date === dateStr).reduce((sum, h) => sum + (h.amount || 0), 0)
      const dayHabits = habitLogs.find(h => h.date === dateStr)?.completed?.length || 0
      const score = dayScans + dayWater + dayHabits

      return { day: dateStr, label, scans: dayScans, workouts: 0, water: dayWater, habits: dayHabits, score }
    })

    const weekScans = dailyData.reduce((s, d) => s + d.scans, 0)
    const weekWater = dailyData.reduce((s, d) => s + d.water, 0)
    const weekHabits = dailyData.reduce((s, d) => s + d.habits, 0)

    return { dailyData, weekScans, weekWater, weekHabits, totalScans: gamStats.totalScans, totalWorkouts: gamStats.totalWorkouts, xp, coins }
  }, [])

  const stats = [
    { icon: ScanLine, label: t("wr_scans"), value: data.weekScans },
    { icon: Dumbbell, label: isEnglish ? "Workouts" : "Treinos", value: data.totalWorkouts },
    { icon: Droplets, label: t("wr_water"), value: (data.weekWater).toFixed(1) },
    { icon: Heart, label: isEnglish ? "Habits" : "Habitos", value: data.weekHabits },
    { icon: Zap, label: "XP", value: data.xp.toLocaleString() },
    { icon: Star, label: isEnglish ? "Coins" : "Moedas", value: data.coins.toLocaleString() },
  ]

  return (
    <div className="glass-strong border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-brand" />
        <h2 className="text-lg font-semibold text-foreground">{t("wr_weekly_report")}</h2>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        {format(weekStart, "dd MMM", { locale: dateLocale })} - {format(weekEnd, "dd MMM, yyyy", { locale: dateLocale })}
      </p>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 rounded-2xl border border-border bg-card"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-muted mb-1.5">
              <stat.icon className="w-4 h-4 text-brand" />
            </div>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">{isEnglish ? "Daily Activity" : "Atividade Diaria"}</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.dailyData} barCategoryGap="32%" barSize={10}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Bar dataKey="score" fill="hsl(var(--brand))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
