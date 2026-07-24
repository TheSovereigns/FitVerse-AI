"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format, subDays, startOfWeek, endOfWeek, eachWeekOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react"

interface BodyMeasurement {
  date: string
  weight?: number
  bodyFat?: number
  chest?: number
  waist?: number
  hips?: number
  arms?: number
  thighs?: number
}

interface ScanHistoryEntry {
  date: string
  name: string
  score?: number
  kcal?: number
  protein?: number
  carbs?: number
  fat?: number
}

interface GamificationStats {
  totalScans: number
  currentStreak: number
  longestStreak: number
  totalPoints: number
  xpHistory?: { date: string; xp: number }[]
  workoutsCompleted?: number
}

const MACRO_COLORS = {
  protein: "#22c55e",
  carbs: "#3b82f6",
  fat: "#f59e0b",
}

const CHART_COLORS = ["#8b5cf6", "#06b6d4", "#f43f5e", "#10b981", "#f59e0b"]

export function AnalyticsCharts() {
  const { t } = useTranslation()
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([])
  const [gamificationStats, setGamificationStats] = useState<GamificationStats | null>(null)

  useEffect(() => {
    try {
      const storedMeasurements = localStorage.getItem("fitverse-body-measurements")
      if (storedMeasurements) setMeasurements(JSON.parse(storedMeasurements))
    } catch (e) {
      logger.error("[AnalyticsCharts] Failed to parse body measurements:", e)
    }

    try {
      const storedScanHistory = localStorage.getItem("fitverse-scan-history")
      if (storedScanHistory) setScanHistory(JSON.parse(storedScanHistory))
    } catch (e) {
      logger.error("[AnalyticsCharts] Failed to parse scan history:", e)
    }

    try {
      const storedGamification = localStorage.getItem("fitverse-gamification-stats")
      if (storedGamification) setGamificationStats(JSON.parse(storedGamification))
    } catch (e) {
      logger.error("[AnalyticsCharts] Failed to parse gamification stats:", e)
    }
  }, [])

  const weightChartData = useMemo(() => {
    const sorted = [...measurements]
      .filter((m) => m.weight)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)

    return sorted.map((m) => ({
      date: format(new Date(m.date), "dd/MM"),
      weight: m.weight,
    }))
  }, [measurements])

  const macrosChartData = useMemo(() => {
    if (scanHistory.length === 0) return []

    const totals = scanHistory.reduce(
      (acc, scan) => ({
        protein: acc.protein + (scan.protein || 0),
        carbs: acc.carbs + (scan.carbs || 0),
        fat: acc.fat + (scan.fat || 0),
      }),
      { protein: 0, carbs: 0, fat: 0 }
    )

    return [
      { name: t("md_protein") || "Proteína", value: totals.protein, color: MACRO_COLORS.protein },
      { name: t("md_carbs") || "Carbos", value: totals.carbs, color: MACRO_COLORS.carbs },
      { name: t("md_fat") || "Gordura", value: totals.fat, color: MACRO_COLORS.fat },
    ].filter((item) => item.value > 0)
  }, [scanHistory, t])

  const workoutsPerWeekData = useMemo(() => {
    if (!gamificationStats?.xpHistory || gamificationStats.xpHistory.length === 0) {
      return []
    }

    const now = new Date()
    const weeksAgo = 8
    const startDate = subDays(now, weeksAgo * 7)
    const weeks = eachWeekOfInterval({ start: startDate, end: now })

    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart)
      const weekScans = scanHistory.filter((scan) => {
        const scanDate = new Date(scan.date)
        return scanDate >= weekStart && scanDate <= weekEnd
      })

      return {
        week: format(weekStart, "dd/MM", { locale: ptBR }),
        workouts: Math.ceil(weekScans.length / 3),
      }
    })
  }, [gamificationStats, scanHistory])

  const xpOverTimeData = useMemo(() => {
    if (!gamificationStats?.xpHistory || gamificationStats.xpHistory.length === 0) {
      return []
    }

    const sorted = [...gamificationStats.xpHistory]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let cumulative = 0
    return sorted.map((entry) => {
      cumulative += entry.xp
      return {
        date: format(new Date(entry.date), "dd/MM"),
        xp: cumulative,
      }
    })
  }, [gamificationStats])

  const hasAnyData = weightChartData.length > 0 || macrosChartData.length > 0 || workoutsPerWeekData.length > 0 || xpOverTimeData.length > 0

  const renderEmptyState = (title: string) => (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <p className="text-sm text-muted-foreground">{t("analytics_no_data") || "Nenhum dado ainda"}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">{title}</p>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-strong border border-border rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{t("analytics_title") || "Análises"}</h2>
          <p className="text-xs text-muted-foreground">{t("analytics_subtitle") || "Seu progresso detalhado"}</p>
        </div>
      </div>

      {!hasAnyData ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm font-medium text-foreground">{t("analytics_empty_title") || "Comece a registrar seus dados"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("analytics_empty_subtitle") || "Registre medidas corporais, escaneie alimentos e complete treinos para ver suas análises."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Weight Over Time */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass border border-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t("analytics_weight") || "Peso ao Longo do Tempo"}</h3>
            </div>
            {weightChartData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ fill: "var(--primary)", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              renderEmptyState(t("analytics_weight_empty") || "Registre suas medidas corporais")
            )}
          </motion.div>

          {/* Macros Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass border border-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t("analytics_macros") || "Distribuição de Macros"}</h3>
            </div>
            {macrosChartData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macrosChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {macrosChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend
                      formatter={(value: string) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              renderEmptyState(t("analytics_macros_empty") || "Escaneie alimentos para ver seus macros")
            )}
          </motion.div>

          {/* Workouts Per Week */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass border border-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t("analytics_workouts") || "Treinos por Semana"}</h3>
            </div>
            {workoutsPerWeekData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workoutsPerWeekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="workouts" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              renderEmptyState(t("analytics_workouts_empty") || "Complete treinos para ver o gráfico")
            )}
          </motion.div>

          {/* XP Over Time */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass border border-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t("analytics_xp") || "XP Acumulado"}</h3>
            </div>
            {xpOverTimeData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={xpOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="xp"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              renderEmptyState(t("analytics_xp_empty") || "Ganhe XP escaneando e treinando")
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
