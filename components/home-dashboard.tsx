"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
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
  ScanLine,
  ShieldCheck,
  Target,
  Trophy,
  Zap,
} from "lucide-react"
import { StreakDisplay } from "@/components/streak-display"
import { HydrationTracker } from "@/components/hydration-tracker"
import { BeginnerChecklist } from "@/components/beginner-checklist"

type View = "home" | "dashboard" | "result" | "recipes" | "training" | "profile" | "planner" | "settings" | "store" | "chatbot"

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
    if (!dailyActivity.scannedProducts || dailyActivity.scannedProducts.length === 0) {
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
    if (!dailyActivity.scannedProducts || dailyActivity.scannedProducts.length === 0) return 0
    const total = dailyActivity.scannedProducts.reduce((acc: number, product: any) => acc + (product.longevityScore || 0), 0)
    return Math.round(total / dailyActivity.scannedProducts.length)
  }, [dailyActivity.scannedProducts])

  const dateString = new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })

  const quickActions = [
    { label: t("dopamine_quick_scan"), desc: t("dopamine_quick_scan_desc"), icon: ScanLine, view: "dashboard" as View },
    { label: t("dopamine_quick_workout"), desc: t("dopamine_quick_workout_desc"), icon: Dumbbell, view: "training" as View },
    { label: t("dopamine_quick_recipe"), desc: t("dopamine_quick_recipe_desc"), icon: ChefHat, view: "recipes" as View },
    { label: t("dopamine_quick_plan"), desc: t("dopamine_quick_plan_desc"), icon: Calculator, view: "planner" as View },
  ]

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-safe-nav md:space-y-6">
      {/* Header card */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-5 md:p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-2 rounded-lg border border-brand/20 bg-brand-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
              FitVerse AI
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {t("hd_today")}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground capitalize">{dateString}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onNavigate("dashboard")} className="h-10 rounded-xl px-4 text-xs bg-brand text-brand-foreground hover:bg-brand/90">
              <ScanLine className="h-4 w-4" />
              {t("dopamine_quick_scan")}
            </Button>
            <Button variant="outline" onClick={() => onNavigate("planner")} className="h-10 rounded-xl px-4 text-xs">
              <Target className="h-4 w-4" />
              {t("view_planner")}
            </Button>
          </div>
        </div>
      </motion.section>

      <StreakDisplay compact onNavigate={onNavigate} />
      <BeginnerChecklist />

      {/* Calorie + Health */}
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Panel>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Flame className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {goals ? t("home_calorie_label") : t("view_planner")}
              </p>
              <div className="mt-1.5 flex items-end gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {goals ? remainingCalories : "--"}
                </span>
                <span className="mb-0.5 text-sm text-muted-foreground">{t("home_kcal")}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {goals
                  ? `${consumedCalories} ${t("home_kcal")} ${t("hd_logged_today")}.`
                  : t("hd_create_plan_hint")}
              </p>
            </div>

            <div className="w-full rounded-xl border border-border bg-muted/50 p-4 md:w-64">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("hd_daily_progress")}
                </span>
                <span className="text-sm font-bold text-foreground">{goals ? `${progressPercent}%` : "--"}</span>
              </div>
              <Progress value={goals ? progressPercent : 0} className="h-1.5 bg-border" indicatorClassName="bg-primary" />
              <Button
                onClick={() => onNavigate(goals ? "dashboard" : "planner")}
                variant="ghost"
                className="mt-3 h-9 w-full rounded-lg text-xs"
              >
                {goals ? t("home_start_btn") : t("home_new_plan")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">
                {t("hd_health_snapshot")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("hd_last_activity")}
              </p>
            </div>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric label={t("home_longevity")} value={averageLongevityScore || "-"} icon={Trophy} />
            <Metric label={t("home_water")} value={`${waterCups * 250}ml`} icon={Droplet} />
            <Metric label={t("home_protein")} value={`${Math.round(dailyTotals.protein)}g`} icon={Zap} />
          </div>
        </Panel>
      </section>

      <HydrationTracker />

      {/* Quick actions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground md:text-lg">
            {t("hd_quick_actions")}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.view}
              type="button"
              onClick={() => onNavigate(action.view)}
              className="min-h-[100px] rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:bg-muted/50 active:scale-[0.98]"
            >
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <action.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">{action.label}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{action.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Bio logs */}
      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground md:text-lg">{t("home_bio_logs")}</h2>
            <p className="text-xs text-muted-foreground">{t("home_last_24h")}</p>
          </div>
          <Button variant="ghost" onClick={() => onNavigate("profile")} className="h-9 rounded-lg px-3 text-xs">
            {t("home_see_history")}
          </Button>
        </div>

        {dailyActivity.scannedProducts.length > 0 ? (
          <div className="space-y-2">
            {dailyActivity.scannedProducts.slice(0, 4).map((product: any, index: number) => (
              <motion.div
                key={`${product.productName}-${index}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3"
              >
                <img
                  src={product.image || "/placeholder.svg?width=100&height=100"}
                  alt={product.productName}
                  className="h-10 w-10 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{product.productName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {product.longevityScore} {t("scan_score_label")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <ScanLine className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">{t("dopamine_empty_title")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t("dopamine_empty_subtitle")}</p>
            <Button onClick={() => onNavigate("dashboard")} className="mt-4 h-10 rounded-xl px-5 text-xs">
              {t("dopamine_empty_cta")}
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4 md:p-5"
    >
      {children}
    </motion.div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/50 p-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="mt-2 truncate text-lg font-bold text-foreground">{value}</p>
      <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}
