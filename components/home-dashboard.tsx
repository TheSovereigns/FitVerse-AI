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
  const isEnglish = locale === "en-US"

  const quickActions = [
    { label: t("dopamine_quick_scan"), desc: t("dopamine_quick_scan_desc"), icon: ScanLine, view: "dashboard" as View },
    { label: t("dopamine_quick_workout"), desc: t("dopamine_quick_workout_desc"), icon: Dumbbell, view: "training" as View },
    { label: t("dopamine_quick_recipe"), desc: t("dopamine_quick_recipe_desc"), icon: ChefHat, view: "recipes" as View },
    { label: t("dopamine_quick_plan"), desc: t("dopamine_quick_plan_desc"), icon: Calculator, view: "planner" as View },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 pb-safe-nav md:space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mobile-glass-glow rounded-[1.35rem] border border-white/10 bg-black/40 p-4 shadow-[0_18px_54px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:rounded-[1.5rem] md:p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50">
              FitVerse AI
            </Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground md:text-4xl">
              {isEnglish ? "Today" : "Hoje"}
            </h1>
            <p className="mt-1 text-sm font-bold capitalize text-foreground/45">{dateString}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
            <Button
              onClick={() => onNavigate("dashboard")}
              className="h-11 min-w-0 rounded-2xl bg-foreground px-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-white/10 sm:px-5"
            >
              <ScanLine className="h-4 w-4" />
              {t("dopamine_quick_scan")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onNavigate("planner")}
              className="h-11 min-w-0 rounded-2xl border border-white/10 bg-white/8 px-3 text-[10px] font-black uppercase tracking-widest text-foreground/50 hover:bg-white/10 sm:px-5"
            >
              <Target className="h-4 w-4" />
              {t("view_planner")}
            </Button>
          </div>
        </div>
      </motion.section>

      <StreakDisplay compact onNavigate={onNavigate} />

      <BeginnerChecklist />

      <section className="grid gap-3 md:gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Panel>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-foreground/60">
                <Flame className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/38">
                {goals ? t("home_calorie_label") : t("view_planner")}
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
                  {goals ? remainingCalories : "--"}
                </span>
                <span className="mb-1 text-sm font-bold text-foreground/38">{t("home_kcal")}</span>
              </div>
              <p className="mt-3 max-w-xl text-sm font-bold leading-relaxed text-foreground/48">
                {goals
                  ? `${consumedCalories} ${t("home_kcal")} ${isEnglish ? "logged today" : "registradas hoje"}.`
                  : isEnglish
                    ? "Create your metabolic plan to unlock daily targets."
                    : "Crie seu plano metabolico para liberar metas diarias."}
              </p>
            </div>

            <div className="w-full rounded-[1.15rem] border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:w-72 md:rounded-[1.25rem]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/38">
                  {isEnglish ? "Daily progress" : "Progresso diario"}
                </span>
                <span className="text-sm font-black text-foreground">{goals ? `${progressPercent}%` : "--"}</span>
              </div>
              <Progress value={goals ? progressPercent : 0} className="h-2 bg-white/10" indicatorClassName="bg-white/30" />
              <Button
                onClick={() => onNavigate(goals ? "dashboard" : "planner")}
                variant="ghost"
                className="mt-4 h-10 w-full rounded-xl border border-white/10 bg-white/8 text-[10px] font-black uppercase tracking-widest text-foreground/50 hover:bg-white/10"
              >
                {goals ? t("home_start_btn") : t("home_new_plan")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-foreground">
                {isEnglish ? "Health snapshot" : "Resumo de saude"}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/35">
                {isEnglish ? "Last activity" : "Atividade recente"}
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-foreground/60" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric label={t("home_longevity")} value={averageLongevityScore || "-"} icon={Trophy} />
            <Metric label={t("home_water")} value={`${waterCups * 250}ml`} icon={Droplet} />
            <Metric label={t("home_protein")} value={`${Math.round(dailyTotals.protein)}g`} icon={Zap} />
          </div>
        </Panel>
      </section>

      <HydrationTracker />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-black tracking-tight text-foreground md:text-xl">
            {isEnglish ? "Quick actions" : "Acoes rapidas"}
          </h2>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">FitVerse</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
          {quickActions.map((action) => (
            <button
              key={action.view}
              type="button"
              onClick={() => onNavigate(action.view)}
              className="min-h-[118px] rounded-[1.15rem] border border-white/10 bg-black/40 p-3.5 text-left shadow-[0_14px_38px_rgba(0,0,0,0.22)] backdrop-blur-xl transition active:scale-[0.98] hover:border-white/20 hover:bg-white/8 md:rounded-[1.25rem] md:p-4"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <action.icon className="h-4 w-4 text-foreground/60" />
              </div>
              <p className="text-sm font-black text-foreground">{action.label}</p>
              <p className="mt-1 line-clamp-2 text-[10px] font-bold leading-relaxed text-foreground/38">{action.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <Panel>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground md:text-xl">{t("home_bio_logs")}</h2>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/35">{t("home_last_24h")}</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => onNavigate("profile")}
            className="h-10 rounded-xl border border-white/10 bg-white/8 px-4 text-[10px] font-black uppercase tracking-widest text-foreground/50 hover:bg-white/10"
          >
            {t("home_see_history")}
          </Button>
        </div>

        {dailyActivity.scannedProducts.length > 0 ? (
          <div className="space-y-2">
            {dailyActivity.scannedProducts.slice(0, 4).map((product: any, index: number) => (
              <motion.div
                key={`${product.productName}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/5 p-3"
              >
                <img
                  src={product.image || "/placeholder.svg?width=100&height=100"}
                  alt={product.productName}
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-foreground">{product.productName}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-foreground/32">
                    {product.longevityScore} {t("scan_score_label")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-foreground/28" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.15rem] border border-white/10 bg-white/5 p-5 text-center md:rounded-[1.25rem] md:p-6">
            <ScanLine className="mx-auto mb-3 h-8 w-8 text-foreground/60" />
            <h3 className="text-base font-black text-foreground">{t("dopamine_empty_title")}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-bold text-foreground/42">{t("dopamine_empty_subtitle")}</p>
            <Button
              onClick={() => onNavigate("dashboard")}
              className="mt-5 h-11 rounded-xl bg-foreground px-5 text-[10px] font-black uppercase tracking-widest text-black hover:bg-white/10"
            >
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mobile-glass-glow rounded-[1.35rem] border border-white/10 bg-black/40 p-4 shadow-[0_18px_54px_rgba(0,0,0,0.26)] backdrop-blur-2xl md:rounded-[1.5rem] md:p-5"
    >
      {children}
    </motion.div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-[1rem] border border-white/10 bg-white/5 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:p-3">
      <Icon className="h-4 w-4 text-foreground/60" />
      <p className="mt-3 truncate text-base font-black text-foreground md:text-lg">{value}</p>
      <p className="mt-1 truncate text-[8px] font-black uppercase tracking-widest text-foreground/34 md:text-[9px]">{label}</p>
    </div>
  )
}
