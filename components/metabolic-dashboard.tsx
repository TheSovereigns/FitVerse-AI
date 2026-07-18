"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Beef, Cookie, Droplet, Utensils, Sparkles, Target, TrendingDown, TrendingUp, Minus, Zap, Lock, Crown } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { BioPerfil, MetabolicPlan } from "./metabolic-planner"
import { useTranslation } from "@/lib/i18n"

interface MetabolicDashboardProps {
  plan: MetabolicPlan
  perfil: BioPerfil
  onBack: () => void
  planLevel?: "summary" | "full" | "full+autoadjust"
  onUpgrade?: () => void
}

export function MetabolicDashboard({ plan, perfil, onBack, planLevel = "full", onUpgrade }: MetabolicDashboardProps) {
  const { t } = useTranslation()
  const isLocked = planLevel === "summary"

  const macrosData = [
    { name: t("md_proteins"), value: plan.macros.protein, color: "#FF6B6B", grams: plan.macros.proteinGrams },
    { name: t("md_carbs"), value: plan.macros.carbs, color: "#4ECDC4", grams: plan.macros.carbsGrams },
    { name: t("md_fats"), value: plan.macros.fat, color: "#FFE66D", grams: plan.macros.fatGrams },
  ]

  const goalConfig: Record<string, { label: string, icon: any, color: string }> = {
    lose_weight: { label: t("md_lose_weight"), icon: TrendingDown, color: "text-rose-400" },
    gain_muscle: { label: t("md_gain_mass"), icon: TrendingUp, color: "text-emerald-400" },
    maintain: { label: t("md_maintain"), icon: Minus, color: "text-blue-400" },
  }

  const goal = goalConfig[perfil.goal] || goalConfig.maintain
  const GoalIcon = goal.icon

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6 pb-safe-nav animate-in fade-in duration-500">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-2xl border border-border text-muted-foreground hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{t("mp_title")}</h1>
          <p className="text-xs text-muted-foreground">{t("md_personalized_plan")}</p>
        </div>
      </motion.div>

      {/* Hero Card - Calories */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-3xl p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("md_daily_goal")}</span>
            <div className="flex items-baseline gap-2 justify-center md:justify-start mt-2">
              <span className="text-5xl md:text-7xl font-bold text-foreground">{Math.round(plan.macros.calories)}</span>
              <span className="text-lg text-muted-foreground">{t("home_kcal")}</span>
            </div>
            <div className={`flex items-center gap-2 mt-3 justify-center md:justify-start px-4 py-2 rounded-full bg-muted ${goal.color}`}>
              <GoalIcon className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">{goal.label}</span>
            </div>
          </div>
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            <div className="absolute inset-0 rounded-full border-[12px] border-muted" />
            <motion.div initial={{ rotate: -90 }} animate={{ rotate: 270 }} transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-primary border-r-primary/50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Target className="w-8 h-8 text-primary mb-1" />
              <span className="text-xl font-bold">100%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Macros */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">{t("md_macros")}</h2>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { key: "protein", label: t("md_protein"), icon: Beef, color: "rose", grams: plan.macros.proteinGrams, pct: plan.macros.protein },
            { key: "carbs", label: t("md_carbs"), icon: Cookie, color: "teal", grams: plan.macros.carbsGrams, pct: plan.macros.carbs },
            { key: "fat", label: t("md_fat"), icon: Droplet, color: "yellow", grams: plan.macros.fatGrams, pct: plan.macros.fat },
          ].map((m) => (
            <motion.div key={m.key} whileHover={{ scale: 1.02 }} className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className={`w-10 h-10 rounded-xl bg-${m.color}-500/10 flex items-center justify-center mx-auto mb-3`}>
                <m.icon className={`w-5 h-5 text-${m.color}-500`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{m.grams}g</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 1, delay: 0.4 }}
                  className={`h-full bg-${m.color}-500 rounded-full`}
                />
              </div>
              <Badge className={`mt-2 bg-${m.color}-500/10 text-${m.color}-500 border-none text-[9px]`}>{m.pct}%</Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Diet Plan - Paywall */}
      {plan.diet && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3 relative">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">{t("md_meal_plan")}</h2>
          <div className={`bg-card border border-border rounded-2xl p-4 md:p-6 ${isLocked ? "blur-sm pointer-events-none select-none" : ""}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{plan.diet.title}</h3>
                <p className="text-xs text-muted-foreground">{plan.diet.summary}</p>
              </div>
            </div>
            <div className="space-y-2">
              {plan.diet.meals.map((meal, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="p-3 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{meal.name}</p>
                  </div>
                  <ul className="space-y-1 ml-8">
                    {meal.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="bg-card border border-border rounded-2xl p-6 text-center max-w-xs">
                <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-2">Plano Completo</h3>
                <p className="text-xs text-muted-foreground mb-4">Upgrade para ver todas as refeicoes detalhadas</p>
                <Button onClick={onUpgrade} className="h-10 rounded-xl bg-primary text-primary-foreground">
                  <Crown className="w-4 h-4 mr-2" /> Upgrade Pro
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Prediction */}
      {plan.prediction && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card border border-primary/20 rounded-2xl p-4 md:p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{t("md_ai_forecast")}</h3>
              <p className="text-xs text-muted-foreground">{t("md_powered_by")}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-xl mb-4">
            <Zap className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-primary">{plan.prediction.weeks}{t("md_weeks")}</p>
              <p className="text-xs text-muted-foreground">{t("md_to_reach_goal")}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{plan.prediction.explanation}</p>
        </motion.div>
      )}

      <div className="p-4">
        <p className="text-[10px] text-muted-foreground text-center">{t("md_disclaimer")}</p>
      </div>
    </div>
  )
}