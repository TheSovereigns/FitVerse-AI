"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Flame, Beef, Cookie, Droplet, Utensils, Sparkles, Target, TrendingDown, TrendingUp, Minus, Zap } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { BioPerfil, MetabolicPlan } from "./metabolic-planner"
import { useTranslation } from "@/lib/i18n"

interface MetabolicDashboardProps {
  plan: MetabolicPlan
  perfil: BioPerfil
  onBack: () => void
}

export function MetabolicDashboard({ plan, perfil, onBack }: MetabolicDashboardProps) {
  const { t } = useTranslation()
  
  const macrosData = [
    { name: t("md_proteins"), value: plan.macros.protein, color: "#FF6B6B", grams: plan.macros.proteinGrams },
    { name: t("md_carbs"), value: plan.macros.carbs, color: "#4ECDC4", grams: plan.macros.carbsGrams },
    { name: t("md_fats"), value: plan.macros.fat, color: "#FFE66D", grams: plan.macros.fatGrams },
  ]

  const goalConfig: Record<string, { label: string, icon: typeof TrendingDown, color: string }> = {
    lose_weight: { label: t("md_lose_weight"), icon: TrendingDown, color: "text-rose-400" },
    gain_muscle: { label: t("md_gain_mass"), icon: TrendingUp, color: "text-emerald-400" },
    maintain: { label: t("md_maintain"), icon: Minus, color: "text-blue-400" },
  }

  const goal = perfil?.goal ? goalConfig[perfil.goal] : goalConfig.maintain
  const GoalIcon = goal.icon

  return (
    <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-4 md:space-y-6 pb-safe-nav animate-in fade-in duration-500">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-2"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack} 
          className="h-10 w-10 rounded-full glass-strong border border-white/10 hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
            {t('mp_title')}
          </h1>
          <p className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em] opacity-60">
            {t("md_personalized_plan")}
          </p>
        </div>
      </motion.div>

      {/* Hero Card - Calories */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative glass-strong border-white/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 shadow-[0_0_60px_rgba(0,0,0,0.3)] overflow-hidden group"
      >
        <div className="absolute inset-0 mesh-gradient opacity-20" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary opacity-60">
              {t("md_daily_goal")}
            </span>
            <div className="flex items-baseline gap-2 justify-center md:justify-start mt-2">
              <span className="text-5xl md:text-7xl font-black text-foreground tracking-tighter">
                {Math.round(plan.macros.calories)}
              </span>
              <span className="text-lg md:text-xl font-bold text-muted-foreground opacity-40">{t("home_kcal")}</span>
            </div>
            <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full glass-strong ${goal.color}`}>
                <GoalIcon className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">{goal.label}</span>
              </div>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            <div className="absolute inset-0 rounded-full border-[12px] md:border-[16px] border-white/5" />
            <motion.div
              initial={{ rotate: -90 }}
              animate={{ rotate: 270 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-[12px] md:border-[16px] border-transparent border-t-primary border-r-primary/50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Target className="w-8 h-8 md:w-10 md:h-10 text-primary mb-1" />
              <span className="text-xl md:text-2xl font-black">100%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Macros Widgets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 mb-3 px-2">
          {t("md_macros")}
        </h2>
        
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {/* Protein */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-strong border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 text-center shadow-lg"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-rose-500/20 flex items-center justify-center mx-auto mb-3">
              <Beef className="w-5 h-5 md:w-6 md:h-5 text-rose-400" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-foreground">{plan.macros.proteinGrams}g</p>
            <p className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest opacity-40 mt-1">{t("md_protein")}</p>
            <div className="mt-3 h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${plan.macros.protein}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full bg-rose-500 rounded-full" 
              />
            </div>
            <Badge className="mt-3 bg-rose-500/20 text-rose-400 border-none text-[9px] font-black">
              {plan.macros.protein}%
            </Badge>
          </motion.div>

          {/* Carbs */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-strong border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 text-center shadow-lg"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mx-auto mb-3">
              <Cookie className="w-5 h-5 md:w-6 md:h-5 text-teal-400" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-foreground">{plan.macros.carbsGrams}g</p>
            <p className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest opacity-40 mt-1">{t("md_carbs")}</p>
            <div className="mt-3 h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${plan.macros.carbs}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-teal-400 rounded-full" 
              />
            </div>
            <Badge className="mt-3 bg-teal-500/20 text-teal-400 border-none text-[9px] font-black">
              {plan.macros.carbs}%
            </Badge>
          </motion.div>

          {/* Fat */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-strong border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 text-center shadow-lg"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
              <Droplet className="w-5 h-5 md:w-6 md:h-5 text-yellow-400" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-foreground">{plan.macros.fatGrams}g</p>
            <p className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest opacity-40 mt-1">{t("md_fat")}</p>
            <div className="mt-3 h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${plan.macros.fat}%` }}
                transition={{ duration: 1, delay: 0.6 }}
                className="h-full bg-yellow-400 rounded-full" 
              />
            </div>
            <Badge className="mt-3 bg-yellow-500/20 text-yellow-400 border-none text-[9px] font-black">
              {plan.macros.fat}%
            </Badge>
          </motion.div>
        </div>
      </motion.div>

      {/* Diet Plan */}
      {plan.diet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 px-2">
            {t("md_meal_plan")}
          </h2>
          
          <div className="glass-strong border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Utensils className="w-5 h-5 md:w-6 md:h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-foreground">{plan.diet.title}</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground opacity-60">{plan.diet.summary}</p>
              </div>
            </div>
            
            <div className="space-y-2 md:space-y-3">
              {plan.diet.meals.map((meal: { name: string; items: string[] }, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-[10px] font-black text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm md:text-base font-black text-foreground">{meal.name}</p>
                  </div>
                  <ul className="space-y-1.5 ml-8">
                    {meal.items.map((item: string, itemIndex: number) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-[11px] md:text-sm text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Prediction Card */}
      {plan.prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-strong border-primary/20 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 md:w-6 md:h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-foreground">{t("md_ai_forecast")}</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground opacity-60">{t("md_powered_by")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-xl md:rounded-2xl mb-4">
            <Zap className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl md:text-3xl font-black text-primary">{plan.prediction.weeks}{t("md_weeks")}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">{t("md_to_reach_goal")}</p>
            </div>
          </div>

          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {plan.prediction.explanation}
          </p>
        </motion.div>
      )}

      {/* Footer */}
      <div className="p-4">
        <p className="text-[8px] md:text-[10px] text-muted-foreground text-center opacity-40">
          {t("md_disclaimer")}
        </p>
      </div>
    </div>
  )
}