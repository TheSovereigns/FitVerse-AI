"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"
import {
  Calendar, Dumbbell, ScanLine, Droplets, Heart, Zap, Star, TrendingUp, TrendingDown, Trophy,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
  startOfMonth, endOfMonth, format, eachDayOfInterval, isSameMonth,
} from "date-fns"
import { ptBR, enUS } from "date-fns/locale"

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

interface Measurement {
  date: string
  weight?: number
  [key: string]: unknown
}

interface ScanEntry {
  name?: string
  scannedAt?: string
  score?: number
}

interface HydrationEntry {
  date: string
  amount: number
}

interface HabitLog {
  date: string
  completed: string[]
}

export function MonthlyReport() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const dateLocale = isEnglish ? enUS : ptBR
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 300); return () => clearTimeout(t) }, [])

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const totalDaysInMonth = monthDays.length

  const data = useMemo(() => {
    if (!mounted) return { dailyData: [], monthScans: 0, monthWater: 0, monthHabits: 0, daysActive: 0, consistency: 0, xp: 0, coins: 0, totalScans: 0, totalWorkouts: 0, weightData: [], topFoodsList: [] }
    const gamStats = safeGet("fitverse-gamification-stats", {
      totalScans: 0, totalWorkouts: 0, totalWater: 0, totalHabits: 0,
    })
    const xp = safeGet("fitverse-xp", 0)
    const coins = safeGet("fitverse-coins", 0)
    const measurements = safeGet<Measurement[]>("fitverse-body-measurements", [])
    const scanHistory = safeGet<ScanEntry[]>("fitverse-scan-history", [])
    const habitLogs = safeGet<HabitLog[]>("habit_logs", [])
    const hydrationHistory = safeGet<HydrationEntry[]>("fitverse-hydration-history", [])

    const monthScanHistory = scanHistory.filter((s) => {
      if (!s.scannedAt) return false
      return isSameMonth(new Date(s.scannedAt), now)
    })

    const monthHydration = hydrationHistory.filter((h) => {
      return isSameMonth(new Date(h.date), now)
    })

    const monthHabitLogs = habitLogs.filter((h) => {
      return isSameMonth(new Date(h.date), now)
    })

    const monthMeasurements = measurements.filter((m) => {
      return isSameMonth(new Date(m.date), now)
    })

    const monthScans = monthScanHistory.length
    const monthWater = monthHydration.reduce((sum, h) => sum + (h.amount || 0), 0)
    const monthHabits = monthHabitLogs.reduce((sum, h) => sum + (h.completed?.length || 0), 0)

    const activeDays = new Set<string>()
    monthScanHistory.forEach((s) => activeDays.add(new Date(s.scannedAt!).toISOString().slice(0, 10)))
    monthHabitLogs.forEach((h) => activeDays.add(h.date))
    monthHydration.forEach((h) => activeDays.add(h.date))
    const daysActive = activeDays.size
    const consistency = totalDaysInMonth > 0 ? Math.round((daysActive / totalDaysInMonth) * 100) : 0

    const dailyData = monthDays.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      const label = format(date, "dd", { locale: dateLocale })
      const dayScans = monthScanHistory.filter((s) => s.scannedAt?.startsWith(dateStr)).length
      const dayWater = monthHydration.filter((h) => h.date === dateStr).reduce((s, h) => s + (h.amount || 0), 0)
      const dayHabits = monthHabitLogs.find((h) => h.date === dateStr)?.completed?.length || 0
      const score = dayScans + (dayWater > 0 ? 1 : 0) + dayHabits
      return { date: dateStr, label, scans: dayScans, water: dayWater, habits: dayHabits, score }
    })

    const weightData = monthMeasurements
      .filter((m) => m.weight != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((m) => ({
        date: format(new Date(m.date), "dd/MM"),
        weight: m.weight,
      }))

    const topFoods = monthScanHistory
      .filter((s) => s.name)
      .reduce<Record<string, { count: number; totalScore: number }>>((acc, s) => {
        const name = s.name!
        if (!acc[name]) acc[name] = { count: 0, totalScore: 0 }
        acc[name].count++
        acc[name].totalScore += s.score || 0
        return acc
      }, {})
    const topFoodsList = Object.entries(topFoods)
      .map(([name, v]) => ({ name, count: v.count, avgScore: Math.round(v.totalScore / v.count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      monthScans, monthWorkouts: gamStats.totalWorkouts, monthWater, monthHabits,
      xp, coins, weightData, dailyData, topFoodsList, consistency, daysActive,
    }
  }, [])

  const stats = [
    { icon: ScanLine, label: t("mr_scans"), value: data.monthScans },
    { icon: Dumbbell, label: isEnglish ? "Workouts" : "Treinos", value: data.monthWorkouts },
    { icon: Droplets, label: t("mr_water"), value: data.monthWater.toFixed(1) },
    { icon: Heart, label: isEnglish ? "Habits" : "Habitos", value: data.monthHabits },
    { icon: Zap, label: "XP", value: data.xp.toLocaleString() },
    { icon: Star, label: isEnglish ? "Coins" : "Moedas", value: data.coins.toLocaleString() },
  ]

  const weightLatest = data.weightData[data.weightData.length - 1]?.weight
  const weightFirst = data.weightData[0]?.weight
  const weightTrend = weightLatest != null && weightFirst != null ? weightLatest - weightFirst : null

  return (
    <div className="glass-strong border border-border rounded-2xl p-6">
      {isLoading && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 skeleton" />
            ))}
          </div>
          <div className="h-32 skeleton" />
          <div className="h-48 skeleton" />
        </div>
      )}
      {!isLoading && (
        <>
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-5 h-5 text-brand" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("mr_monthly_report")}
        </h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {format(monthStart, "MMMM yyyy", { locale: dateLocale })}
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-4 p-4 rounded-2xl border border-border bg-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {isEnglish ? "Consistency Score" : "Score de Consistencia"}
            </p>
            <p className="text-2xl font-bold text-foreground">{data.consistency}<span className="text-sm text-muted-foreground">%</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">
              {isEnglish ? "Active days" : "Dias ativos"}
            </p>
            <p className="text-sm font-semibold text-foreground">{data.daysActive} / {totalDaysInMonth}</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-muted/50 mt-3 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-brand"
            initial={{ width: 0 }}
            animate={{ width: `${data.consistency}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {data.weightData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-4 p-4 rounded-2xl border border-border bg-card"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground">
              {isEnglish ? "Weight Trend" : "Tendencia de Peso"}
            </h3>
            {weightTrend != null && (
              <div className="flex items-center gap-1">
                {weightTrend > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-400" />
                ) : weightTrend < 0 ? (
                  <TrendingDown className="w-3 h-3 text-emerald-400" />
                ) : null}
                <span className={cn(
                  "text-xs font-medium",
                  weightTrend > 0 ? "text-red-400" : weightTrend < 0 ? "text-emerald-400" : "text-muted-foreground"
                )}>
                  {weightTrend > 0 ? "+" : ""}{weightTrend.toFixed(1)} kg
                </span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={35} />
              <Tooltip
                contentStyle={{ background: "hsl(0 0% 6%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: 12 }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--brand))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--brand))" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-4 p-4 rounded-2xl border border-border bg-card"
      >
        <h3 className="text-sm font-medium text-foreground mb-3">
          {isEnglish ? "Daily Activity" : "Atividade Diaria"}
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.dailyData} barCategoryGap="32%" barSize={10}>
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} interval={Math.floor(totalDaysInMonth / 6)} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
            <Tooltip
              contentStyle={{ background: "hsl(0 0% 6%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: 12 }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Bar dataKey="score" fill="hsl(var(--brand))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {data.topFoodsList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-medium text-foreground">
              {isEnglish ? "Top Scanned Foods" : "Alimentos Mais Escaneados"}
            </h3>
          </div>
          <div className="space-y-2">
            {data.topFoodsList.map((food, i) => (
              <div key={food.name} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                  <span className="text-xs font-medium text-foreground">{food.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">
                    {food.count} {t("mr_scans_lower")}
                  </span>
                  <span className="text-xs font-semibold text-brand">
                    {food.avgScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
        </>
      )}
    </div>
  )
}
