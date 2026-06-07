"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import {
  ArrowRight,
  Calculator,
  ChefHat,
  Droplet,
  Dumbbell,
  Flame,
  ScanLine,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react"

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
  const remainingCalories = goals ? Math.max(0, goals.calories - dailyTotals.calories) : 0
  const progressPercent = goals ? Math.min(Math.round((dailyTotals.calories / goals.calories) * 100), 100) : 0

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
    <div className="relative space-y-5 pb-safe-nav md:space-y-7">
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-5rem] h-72 bg-[radial-gradient(circle_at_24%_10%,rgba(255,149,0,0.22),transparent_42%),radial-gradient(circle_at_86%_2%,rgba(251,191,36,0.12),transparent_36%)]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-orange-300/22 bg-black/50 p-5 shadow-[inset_0_1px_0_rgba(251,146,60,0.16),0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:rounded-[2.5rem] md:p-7"
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-300 via-orange-500 to-orange-900" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/55 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(251,146,60,0.12),transparent_34%,rgba(245,158,11,0.08))]" />

        <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <Badge className="mb-4 rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-orange-100">
              FitVerse AI
            </Badge>
            <h1 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-foreground md:text-6xl">
              {t("home_greeting")} <span className="text-primary">{t("home_biohacker")}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-xs font-black uppercase tracking-[0.22em] text-orange-50/45 md:text-sm">
              {dateString}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MiniMetric label={t("home_longevity")} value={averageLongevityScore || "-"} icon={Trophy} />
            <MiniMetric label={t("home_water")} value={`${waterCups * 250}ml`} icon={Droplet} />
            <MiniMetric label={t("home_kcal")} value={goals ? remainingCalories : "-"} icon={Flame} />
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.button
          type="button"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigate(goals ? "dashboard" : "planner")}
          className="relative min-h-[280px] overflow-hidden rounded-[2rem] border border-orange-300/18 bg-black/48 p-5 text-left shadow-xl backdrop-blur-2xl md:p-6"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-300 via-orange-500 to-amber-600" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/12 via-transparent to-amber-300/8" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-300/18 bg-orange-500/10 text-amber-100">
                <Target className="h-7 w-7" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-orange-100/45">
                {goals ? t("home_calorie_label") : t("view_planner")}
              </p>
              <h2 className="mt-3 text-4xl font-black leading-none tracking-tight text-orange-50 md:text-6xl">
                {goals ? Math.round(remainingCalories) : t("home_new_plan")}
                {goals && <span className="ml-2 text-base text-orange-100/35">{t("home_kcal")}</span>}
              </h2>
              <p className="mt-4 max-w-xl text-sm font-bold leading-relaxed text-orange-50/52">
                {goals
                  ? `${progressPercent}% ${t("home_start_btn").toLowerCase()}`
                  : "Crie seu plano metabolico para liberar metas, macros e progresso diario."}
              </p>
            </div>

            <div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-orange-950/70">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goals ? progressPercent : 18}%` }}
                  className="h-full rounded-full bg-orange-400"
                />
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-orange-300/16 bg-orange-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-orange-100">
                {goals ? t("home_start_btn") : t("view_planner")}
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </motion.button>

        <div className="grid grid-cols-2 gap-3">
          <ActionTile icon={Droplet} label={t("home_water")} desc={`${waterCups * 250}ml / 3000ml`} onClick={() => setWaterCups((prev) => prev + 1)} />
          <ActionTile icon={Zap} label={t("home_protein")} desc={`${Math.round(dailyTotals.protein)}g / ${goals?.proteinGrams || 0}g`} onClick={() => onNavigate("planner")} />
          <ActionTile icon={Trophy} label={t("home_longevity")} desc={`${averageLongevityScore || 0} ${t("scan_score_label")}`} onClick={() => onNavigate("dashboard")} />
          <ActionTile icon={Sparkles} label={t("dopamine_empty_title")} desc={t("dopamine_empty_xp_hint")} onClick={() => onNavigate("dashboard")} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-tight text-foreground md:text-2xl">{t("dopamine_quick_scan_title")}</h2>
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-100/35">FitVerse</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.view}
              type="button"
              onClick={() => onNavigate(action.view)}
              className="group relative overflow-hidden rounded-[1.5rem] border border-orange-300/14 bg-black/42 p-4 text-left shadow-xl backdrop-blur-2xl transition hover:border-orange-300/35 hover:bg-orange-500/8"
            >
              <action.icon className="mb-4 h-6 w-6 text-amber-200" />
              <p className="text-sm font-black text-orange-50">{action.label}</p>
              <p className="mt-1 line-clamp-2 text-[10px] font-bold text-orange-50/42">{action.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-orange-300/16 bg-black/42 p-4 shadow-xl backdrop-blur-2xl md:p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent" />
        <div className="relative">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">{t("home_bio_logs")}</h2>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-100/38">{t("home_last_24h")}</p>
            </div>
            <Button variant="ghost" onClick={() => onNavigate("profile")} className="h-10 rounded-2xl border border-orange-300/14 bg-orange-500/8 px-4 text-[10px] font-black uppercase tracking-widest text-orange-100 hover:bg-orange-500/16">
              {t("home_see_history")}
            </Button>
          </div>

          {dailyActivity.scannedProducts.length > 0 ? (
            <div className="space-y-3">
              {dailyActivity.scannedProducts.slice(0, 3).map((product: any, index: number) => (
                <motion.div
                  key={`${product.productName}-${index}`}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="flex items-center gap-4 rounded-[1.5rem] border border-orange-300/12 bg-orange-950/14 p-3"
                >
                  <img
                    src={product.image || "/placeholder.svg?width=100&height=100"}
                    alt={product.productName}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black text-orange-50">{product.productName}</p>
                    <Badge className="mt-1 rounded-full border border-orange-300/16 bg-orange-500/10 text-[10px] font-black text-orange-100">
                      {product.longevityScore} {t("scan_score_label")}
                    </Badge>
                  </div>
                  <ArrowRight className="h-5 w-5 text-orange-100/35" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-300/16 bg-orange-500/10 text-amber-100">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-foreground">{t("dopamine_empty_title")}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm font-bold text-orange-50/48">{t("dopamine_empty_subtitle")}</p>
              <Button onClick={() => onNavigate("dashboard")} className="mt-5 h-12 rounded-2xl bg-orange-500 px-6 text-sm font-black uppercase tracking-widest text-black hover:bg-amber-300">
                {t("dopamine_empty_cta")}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function MiniMetric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-orange-300/14 bg-orange-950/20 p-3 backdrop-blur-xl">
      <Icon className="h-4 w-4 text-amber-200" />
      <p className="mt-3 text-lg font-black text-orange-50 md:text-2xl">{value}</p>
      <p className="mt-1 truncate text-[9px] font-black uppercase tracking-widest text-orange-100/38">{label}</p>
    </div>
  )
}

function ActionTile({
  icon: Icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ElementType
  label: string
  desc: string
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="min-h-[136px] rounded-[1.5rem] border border-orange-300/14 bg-black/42 p-4 text-left shadow-xl backdrop-blur-2xl transition hover:border-orange-300/35 hover:bg-orange-500/8"
    >
      <Icon className="mb-4 h-6 w-6 text-amber-200" />
      <p className="text-sm font-black text-orange-50">{label}</p>
      <p className="mt-1 text-[10px] font-bold text-orange-50/42">{desc}</p>
    </motion.button>
  )
}
