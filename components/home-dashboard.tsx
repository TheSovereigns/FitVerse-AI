"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
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
    { label: t("dopamine_quick_scan"), icon: ScanLine, view: "dashboard" as View, color: "text-brand" },
    { label: t("view_training"), icon: Dumbbell, view: "training" as View, color: "text-foreground" },
    { label: t("view_recipes"), icon: ChefHat, view: "recipes" as View, color: "text-foreground" },
    { label: t("view_planner"), icon: Calculator, view: "planner" as View, color: "text-foreground" },
  ]

  const calorieRingRadius = 54
  const calorieRingCircumference = 2 * Math.PI * calorieRingRadius
  const calorieRingOffset = calorieRingCircumference - (progressPercent / 100) * calorieRingCircumference

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

      <StreakDisplay compact onNavigate={onNavigate} />
      <BeginnerChecklist />

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
              <span className="text-[10px] text-muted-foreground">kcal left</span>
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
                <MacroPill label="P" value={`${Math.round(dailyTotals.protein)}g`} color="text-brand" />
                <MacroPill label="C" value={`${Math.round(dailyTotals.carbs)}g`} color="text-warning" />
                <MacroPill label="G" value={`${Math.round(dailyTotals.fat)}g`} color="text-destructive" />
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
        className="grid grid-cols-3 gap-3"
      >
        <StatWidget icon={Trophy} label={t("home_longevity")} value={averageLongevityScore || "-"} />
        <StatWidget icon={Droplet} label={t("home_water")} value={`${waterCups * 250}ml`} />
        <StatWidget icon={Zap} label={t("home_protein")} value={`${Math.round(dailyTotals.protein)}g`} />
      </motion.section>

      <HydrationTracker />

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

        {dailyActivity.scannedProducts.length > 0 ? (
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

function StatWidget({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl glass-strong p-4 text-center">
      <Icon className="mx-auto h-4 w-4 text-brand mb-2" />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
