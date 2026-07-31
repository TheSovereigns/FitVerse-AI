"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "@/lib/i18n"
import {
  ArrowRight,
  Calculator,
  ChefHat,
  Droplet,
  Dumbbell,
  Flame,
  Play,
  ScanLine,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react"
import { StreakDisplay } from "@/components/streak-display"
import { HydrationTracker } from "@/components/hydration-tracker"
import { BeginnerChecklist } from "@/components/beginner-checklist"

import { View } from "@/lib/types"

export function HomeDashboard({
  userMetabolicPlan,
  dailyActivity,
  onNavigate,
}: {
  userMetabolicPlan: any
  dailyActivity: any
  onNavigate: (view: View) => void
}) {
  const { t, locale } = useTranslation()
  const [waterCups, setWaterCups] = useState(0)

  const dailyTotals = useMemo(() => {
    if (!dailyActivity?.scannedProducts || dailyActivity.scannedProducts.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    }
    return dailyActivity.scannedProducts.reduce((acc: any, product: any) => {
      const macros = product.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 }
      acc.calories += macros.calories || 0
      acc.protein += macros.protein || 0
      acc.carbs += macros.carbs || 0
      acc.fat += macros.fat || 0
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }, [dailyActivity.scannedProducts])

  const goals = userMetabolicPlan?.macros
  const consumedCalories = Math.round(dailyTotals.calories)
  const remainingCalories = goals ? Math.max(0, goals.calories - consumedCalories) : 0
  const progressPercent = goals ? Math.min(Math.round((consumedCalories / goals.calories) * 100), 100) : 0

  const averageLongevityScore = useMemo(() => {
    if (!dailyActivity?.scannedProducts || dailyActivity.scannedProducts.length === 0) return 0
    const total = dailyActivity.scannedProducts.reduce((acc: number, product: any) => acc + (product.longevityScore || 0), 0)
    return Math.round(total / dailyActivity.scannedProducts.length)
  }, [dailyActivity.scannedProducts])

  const dateString = new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })

  const quickActions = [
    { label: t("dopamine_quick_scan"), icon: ScanLine, view: "dashboard" as View, color: "text-brand" },
    { label: t("view_training"), icon: Dumbbell, view: "training" as View, color: "text-foreground" },
    { label: t("view_recipes"), icon: ChefHat, view: "recipes" as View, color: "text-foreground" },
    { label: t("view_planner"), icon: Calculator, view: "planner" as View, color: "text-foreground" },
  ]

  const calorieRingRadius = 54
  const calorieRingCircumference = 2 * Math.PI * calorieRingRadius
  const calorieRingOffset = calorieRingCircumference - (progressPercent / 100) * calorieRingCircumference

  const motivationQuotes = useMemo(() => [
    locale === "pt-BR" ? "A disciplina é a ponte entre metas e realizações." : "Discipline is the bridge between goals and accomplishment.",
    locale === "pt-BR" ? "O corpo alcança o que a mente acredita." : "The body achieves what the mind believes.",
    locale === "pt-BR" ? "Não treine para ser forte, treine para ser invencível." : "Don't train to be strong, train to be invincible.",
    locale === "pt-BR" ? "Cada gota de suor te aproxima do seu melhor." : "Every drop of sweat brings you closer to your best self.",
    locale === "pt-BR" ? "A saúde é a maior riqueza." : "Health is the greatest wealth.",
    locale === "pt-BR" ? "Pequenos passos todos os dias levam a grandes resultados." : "Small steps every day lead to big results.",
    locale === "pt-BR" ? "Seu corpo é o reflexo do seu estilo de vida." : "Your body is a reflection of your lifestyle.",
    locale === "pt-BR" ? "Comece onde você está, use o que tem, faça o que puder." : "Start where you are, use what you have, do what you can.",
    locale === "pt-BR" ? "A consistência é mais importante que a intensidade." : "Consistency is more important than intensity.",
    locale === "pt-BR" ? "Invista em você. É o melhor investimento que existe." : "Invest in yourself. It's the best investment there is.",
  ], [locale])

  const [motivationalQuote] = useState(() => motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)])

  const [weeklyData, setWeeklyData] = useState<{ day: string; label: string; score: number }[]>([])
  const [todayWorkout, setTodayWorkout] = useState<any>(null)
  const [recentAchievement, setRecentAchievement] = useState<{ name: string; desc: string; icon: React.ReactNode } | null>(null)
  const [todayXP, setTodayXP] = useState(0)
  const [todayCoins, setTodayCoins] = useState(0)

  useEffect(() => {
    try {
      const dayNames = locale === "pt-BR" ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

      const appStore = JSON.parse(localStorage.getItem("fitverse-app-store") || "{}") as { state?: { scanHistory?: Array<{ scannedAt: string }> } }
      const scanHistory = appStore?.state?.scanHistory || []
      const hydrationHistory = JSON.parse(localStorage.getItem("fitverse-hydration-history") || "[]") as Array<{ date: string; amount: number }>
      const habitLogs = JSON.parse(localStorage.getItem("habit_logs") || "[]") as Array<{ date: string; completed: string[] }>
      const gamStats = JSON.parse(localStorage.getItem("fitverse-gamification-stats") || "{}") as { totalScans?: number; totalWorkouts?: number; totalWater?: number; totalHabits?: number }

      const days: { day: string; label: string; score: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split("T")[0]
        const dayIdx = d.getDay()
        const dayScans = scanHistory.filter(s => s.scannedAt?.startsWith(dateStr)).length
        const dayWater = hydrationHistory.filter(h => h.date === dateStr).reduce((sum, h) => sum + (h.amount || 0) / 250, 0)
        const dayHabits = habitLogs.find(h => h.date === dateStr)?.completed?.length || 0
        const score = dayScans + Math.round(dayWater) + dayHabits
        days.push({ day: dateStr, label: dayNames[dayIdx], score: Math.min(score, 10) })
      }
      setWeeklyData(days)

      const workouts = JSON.parse(localStorage.getItem("generatedWorkouts") || "[]") as any[]
      if (workouts.length > 0) {
        setTodayWorkout(workouts[0])
      }

      const unlockedIds = JSON.parse(localStorage.getItem("fitverse-achievements") || "[]") as string[]
      if (unlockedIds.length > 0) {
        const lastId = unlockedIds[unlockedIds.length - 1]
        const achievementMap: Record<string, { name: string; desc: string; icon: React.ReactNode }> = {
          "first-scan": { name: "ach_first_scan", desc: "ach_first_scan_desc", icon: <ScanLine className="w-4 h-4" /> },
          "scan-10": { name: "ach_scan_10", desc: "ach_scan_10_desc", icon: <ScanLine className="w-4 h-4" /> },
          "scan-50": { name: "ach_scan_50", desc: "ach_scan_50_desc", icon: <ScanLine className="w-4 h-4" /> },
          "scan-100": { name: "ach_scan_100", desc: "ach_scan_100_desc", icon: <ScanLine className="w-4 h-4" /> },
          "workout-1": { name: "ach_workout_1", desc: "ach_workout_1_desc", icon: <Dumbbell className="w-4 h-4" /> },
          "workout-10": { name: "ach_workout_10", desc: "ach_workout_10_desc", icon: <Dumbbell className="w-4 h-4" /> },
          "workout-50": { name: "ach_workout_50", desc: "ach_workout_50_desc", icon: <Dumbbell className="w-4 h-4" /> },
          "streak-3": { name: "ach_streak_3", desc: "ach_streak_3_desc", icon: <Flame className="w-4 h-4" /> },
          "streak-7": { name: "ach_streak_7", desc: "ach_streak_7_desc", icon: <Flame className="w-4 h-4" /> },
          "streak-30": { name: "ach_streak_30", desc: "ach_streak_30_desc", icon: <Flame className="w-4 h-4" /> },
          "streak-100": { name: "ach_streak_100", desc: "ach_streak_100_desc", icon: <Flame className="w-4 h-4" /> },
          "hydration-7": { name: "ach_hydration_7", desc: "ach_hydration_7_desc", icon: <Droplet className="w-4 h-4" /> },
        }
        setRecentAchievement(achievementMap[lastId] || null)
      }

      setTodayXP(gamStats.totalScans ? gamStats.totalScans * 10 + (gamStats.totalWorkouts || 0) * 25 : 0)
      setTodayCoins(gamStats.totalScans ? gamStats.totalScans * 5 + (gamStats.totalWorkouts || 0) * 15 : 0)
    } catch {}
  }, [locale])

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-safe-nav">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-2"
      >
        <p className="text-sm text-muted-foreground capitalize">{dateString}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t("hd_today")}
        </h1>
      </motion.section>

      {/* Motivational Quote */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className="rounded-2xl glass-strong p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-muted">
            <Sparkles className="h-4 w-4 text-brand" />
          </div>
          <p className="text-sm text-muted-foreground italic leading-relaxed">{motivationalQuote}</p>
        </div>
      </motion.section>

      <StreakDisplay compact onNavigate={onNavigate} />
      <BeginnerChecklist />

      {/* Weekly Activity Mini Chart */}
      {weeklyData.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="rounded-2xl glass-strong p-5"
        >
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t("home_weekly_activity")}</h2>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="20%">
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis hide domain={[0, 10]} />
                <Bar dataKey="score" radius={[4, 4, 4, 4]}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={entry.day}
                      fill={entry.day === new Date().toISOString().split("T")[0] ? "hsl(var(--brand))" : "hsl(var(--brand) / 0.25)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      )}

      {/* Calorie Ring Widget */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl glass-strong p-6"
      >
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <svg width="128" height="128" className="-rotate-90">
              <circle
                cx="64"
                cy="64"
                r={calorieRingRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-border"
              />
              <motion.circle
                cx="64"
                cy="64"
                r={calorieRingRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={calorieRingCircumference}
                initial={{ strokeDashoffset: calorieRingCircumference }}
                animate={{ strokeDashoffset: calorieRingOffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="text-brand"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame className="h-4 w-4 text-brand mb-0.5" />
              <span className="text-2xl font-bold text-foreground">{goals ? remainingCalories : "--"}</span>
              <span className="text-[10px] text-muted-foreground">{t("hd_kcal_left")}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{t("hd_daily_progress")}</span>
                  <span className="text-xs font-semibold text-foreground">{goals ? `${progressPercent}%` : "--"}</span>
                </div>
                <Progress value={goals ? progressPercent : 0} className="h-1.5 bg-border" indicatorClassName="bg-brand" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MacroPill label={t("common_p")} value={`${Math.round(dailyTotals.protein)}g`} color="text-brand" />
                <MacroPill label={t("common_c")} value={`${Math.round(dailyTotals.carbs)}g`} color="text-warning" />
                <MacroPill label={t("common_g")} value={`${Math.round(dailyTotals.fat)}g`} color="text-destructive" />
              </div>

              <Button
                onClick={() => onNavigate(goals ? "dashboard" : "planner")}
                variant="ghost"
                className="h-9 w-full rounded-xl text-xs font-medium"
              >
                {goals ? t("home_start_btn") : t("home_new_plan")}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Quick Stats */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-5 gap-3"
      >
        <StatWidget icon={Trophy} label={t("home_longevity")} value={averageLongevityScore || "-"} />
        <StatWidget icon={Droplet} label={t("home_water")} value={`${waterCups * 250}ml`} />
        <StatWidget icon={Zap} label={t("home_protein")} value={`${Math.round(dailyTotals.protein)}g`} />
        <StatWidget icon={Star} label={t("home_xp_today")} value={todayXP} />
        <StatWidget icon={Target} label={t("home_coins_today")} value={todayCoins} />
      </motion.section>

      <HydrationTracker />

      {/* Today's Workout Card */}
      {todayWorkout && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl glass-strong p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{t("home_today_workout")}</h2>
            <span className="text-[10px] text-muted-foreground">{todayWorkout.muscleGroup || todayWorkout.name || ""}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-foreground truncate">{todayWorkout.name || t("home_today_workout")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {todayWorkout.exercises?.length || 0} {t("home_exercises_count")}
              </p>
            </div>
            <Button
              size="sm"
              className="ml-3 h-9 rounded-xl px-4 text-xs font-medium"
              onClick={() => onNavigate("training")}
            >
              <Play className="mr-1 h-3 w-3" />
              {t("home_start_btn")}
            </Button>
          </div>
        </motion.section>
      )}

      {/* Recent Achievement */}
      {recentAchievement && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="rounded-2xl glass-strong p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
              {recentAchievement.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("home_recent_achievement")}</p>
              <p className="text-sm font-semibold text-foreground truncate">{t(recentAchievement.name)}</p>
            </div>
            <Trophy className="h-4 w-4 text-yellow-400" />
          </div>
        </motion.section>
      )}

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t("hd_quick_actions")}
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.view}
              type="button"
              onClick={() => onNavigate(action.view)}
              className="flex flex-col items-center gap-2 rounded-2xl glass-card p-4 transition-all duration-200 hover:bg-brand/5 active:scale-[0.97]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-muted">
                <action.icon className="h-5 w-5 text-brand" />
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Bio logs */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl glass-strong p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{t("home_bio_logs")}</h2>
          <Button variant="ghost" onClick={() => onNavigate("profile")} className="h-8 rounded-lg px-3 text-xs">
            {t("home_see_history")}
          </Button>
        </div>

        {dailyActivity?.scannedProducts?.length > 0 ? (
          <div className="space-y-2">
            {dailyActivity.scannedProducts.slice(0, 3).map((product: any, index: number) => (
              <motion.div
                key={`${product.productName}-${index}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 rounded-xl bg-muted/50 p-3"
              >
                <img
                  src={product.image || "/placeholder.svg?width=100&height=100"}
                  alt={product.productName}
                  className="h-10 w-10 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{product.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.longevityScore} {t("scan_score_label")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <ScanLine className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <h3 className="text-sm font-medium text-foreground">{t("dopamine_empty_title")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t("dopamine_empty_subtitle")}</p>
            <Button onClick={() => onNavigate("dashboard")} className="mt-4 h-9 rounded-xl px-5 text-xs">
              {t("dopamine_empty_cta")}
            </Button>
          </div>
        )}
      </motion.section>
    </div>
  )
}

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function StatWidget({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl glass-strong p-4 text-center">
      <Icon className="mx-auto h-4 w-4 text-brand mb-2" />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
