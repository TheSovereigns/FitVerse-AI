"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ProgressCircle } from "@/components/progress-circle"
import { Badge } from "@/components/ui/badge"
import { HeroSection } from "@/components/hero-section"
import { TrustBadgesSection } from "@/components/trust-badges-section"
import { BenefitsSection } from "@/components/benefits-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { SocialProofSection } from "@/components/social-proof-section"
import { FooterCTASection } from "@/components/footer-cta-section"
import { FloatingCTAMobile } from "@/components/floating-cta-mobile"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import {
  Droplet,
  Zap,
  Target,
  Trophy,
  ChevronRight,
  ScanLine,
  Dumbbell,
  ChefHat,
  Flame,
  Sparkles,
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

  // Se não tem plano metabólico, mostrar as páginas de onboarding (Hero + Trust Badges + Benefícios + Como funciona + Social Proof + CTA final)
  if (!goals) {
    return (
      <div className="min-h-screen">
        <HeroSection />
        <TrustBadgesSection />
        <BenefitsSection id="por-que-fitverse" />
        <HowItWorksSection id="como-funciona" />
        <SocialProofSection />
        <FooterCTASection id="cta-final" />
        <FloatingCTAMobile />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-10 pb-safe-nav">
      {/* Gamification Bar - Streak & XP */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 p-4 glass-strong rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <span className="text-xl">{t("dopamine_streak_fire")}</span>
          </div>
          <div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">{t("dopamine_streak_text").replace(" dias seguidos!", "")} 3{t("dopamine_streak_text").slice(-1)}</p>
            <p className="text-xs text-primary font-bold">{t("dopamine_level")} 5</p>
          </div>
        </div>
        <div className="flex-1 max-w-[150px]">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "65%" }}
              className="h-full bg-gradient-to-r from-primary to-yellow-500"
            />
          </div>
          <p className="text-[9px] text-muted-foreground opacity-50 mt-1 text-right">{t("dopamine_xp_to_next")}</p>
        </div>
      </motion.div>

      {/* AI Insight of the Day */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative p-4 md:p-6 glass-strong border border-purple-500/20 bg-purple-500/5 rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer"
        onClick={() => onNavigate("chatbot")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-1">{t("dopamine_ai_insight_title")}</p>
            <p className="text-sm md:text-base font-bold text-foreground leading-relaxed">
              {locale === "en-US" 
                ? "Today is protein day! Your muscles need fuel. Consider adding chicken breast or eggs to your next meal."
                : "Hoje é dia de proteína! Seus músculos precisam de combustível. Queijo adicionar frango ou ovos na próxima refeição."}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-400 opacity-50" />
        </div>
      </motion.div>

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-12"
      >
        <h1 className="text-hero-xl font-black text-foreground tracking-[-0.06em] leading-none">
          {t("home_greeting")} <span className="text-primary">{t("home_biohacker")}</span>
        </h1>
        <p className="text-sm md:text-lg font-black text-muted-foreground mt-3 opacity-50 uppercase tracking-[0.3em]">
          {dateString}
        </p>
      </motion.div>

      {/* Main Calorie Ring - mobile-optimized */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="relative glass-strong border-white/20 p-5 md:p-7 lg:p-10 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.4)] group cursor-pointer"
        onClick={() => onNavigate("dashboard")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 opacity-50" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-10">
          <div className="flex-1 text-center sm:text-left">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.5em] mb-1 md:mb-3 block">
              {t("home_calorie_label")}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl leading-none font-black text-foreground tracking-tighter mb-1 flex items-baseline gap-2 justify-center sm:justify-start">
              {Math.round(remainingCalories)}
              <span className="text-sm md:text-xl opacity-20 tracking-normal font-bold">{t("home_kcal")}</span>
            </h2>
            <div className="h-1.5 md:h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 mt-1.5 md:mt-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full mesh-gradient shadow-[0_0_15px_var(--primary)]"
              />
            </div>
          </div>

          <div className="relative w-24 h-24 md:w-40 md:h-40 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[0.5rem] md:border-[0.75rem] border-white/5" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-[0.5rem] md:border-[0.75rem] border-transparent border-t-primary border-r-primary/50 blur-[2px] shadow-[inset_0_0_15px_rgba(255,149,0,0.5)]"
            />
            <div className="text-center">
              <Target className="w-5 h-5 md:w-8 md:h-8 text-primary mx-auto mb-0.5 animate-pulse" />
              <span className="text-lg md:text-2xl font-black">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="relative z-10 mt-4 md:mt-6 flex justify-center">
          <div className="flex items-center gap-2 py-2 px-4 bg-primary/20 rounded-xl border border-primary/30">
            <span className="text-primary font-black text-[10px] md:text-xs uppercase tracking-wider">{t("home_start_btn")} →</span>
          </div>
        </div>
      </motion.div>

      {/* Widget Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-4">
        {/* Water Widget */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="relative h-36 md:h-48 glass-strong border-white/20 rounded-[1.25rem] md:rounded-[2rem] overflow-hidden group cursor-pointer flex flex-col justify-between p-3 md:p-5 shadow-xl"
          onClick={() => setWaterCups(prev => prev + 1)}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <Droplet className="w-5 h-5 md:w-7 md:h-7 text-[#0A84FF] mb-1 drop-shadow-[0_0_10px_rgba(10,132,255,0.8)]" />
            <h3 className="text-base md:text-lg font-black text-foreground tracking-tight">{t("home_water")}</h3>
            <p className="text-muted-foreground font-bold text-[9px] md:text-xs mt-0.5">{waterCups * 250}ml / 3000ml</p>
          </div>
          <div className="relative z-10 w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((waterCups * 250 / 3000) * 100, 100)}%` }}
              className="h-full bg-[#0A84FF]"
            />
          </div>
          <div className="relative z-10 flex items-center justify-center gap-1.5 py-1.5 bg-[#0A84FF]/20 rounded-lg border border-[#0A84FF]/30">
            <span className="text-[#0A84FF] font-black text-[9px] uppercase tracking-wider">{t("home_water_cta")}</span>
          </div>
        </motion.div>

        {/* Protein Widget */}
        <div className="relative h-36 md:h-44 lg:h-48 glass-strong border-white/20 rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-5 flex flex-col justify-between group overflow-hidden shadow-2xl cursor-pointer"
          onClick={() => onNavigate("planner")}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A84FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10">
            <Zap className="w-5 h-5 md:w-7 md:h-7 text-[#0A84FF] mb-1.5" />
            <h3 className="text-base md:text-lg font-black text-foreground tracking-tight">{t("home_protein")}</h3>
            <p className="text-muted-foreground font-bold text-[9px] md:text-xs mt-0.5">{Math.round(dailyTotals.protein)}g / {goals?.proteinGrams}g</p>
          </div>
          <div className="relative z-10 w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((dailyTotals.protein / goals?.proteinGrams) * 100, 100)}%` }}
              className="h-full bg-[#0A84FF] shadow-[0_0_15px_rgba(10,132,255,0.6)]"
            />
          </div>
          <div className="relative z-10 flex items-center justify-center gap-1.5 py-1.5 bg-[#0A84FF]/20 rounded-lg border border-[#0A84FF]/30">
            <span className="text-[#0A84FF] font-black text-[9px] uppercase tracking-wider">{t("home_protein_cta")}</span>
          </div>
        </div>

        {/* Longevity Score - spans full width on mobile if 3rd item */}
        <div className="relative h-36 md:h-44 lg:h-48 mesh-gradient rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-5 flex flex-col items-center justify-between text-center text-white haptic-press glass-reflection shadow-2xl overflow-hidden col-span-2 md:col-span-1 cursor-pointer"
          onClick={() => onNavigate("dashboard")}
        >
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          <div className="relative z-10 flex flex-col items-center">
            <Trophy className="w-6 h-6 md:w-8 md:h-8 mb-1 text-yellow-300" />
            <h3 className="text-[8px] font-black uppercase tracking-[0.4em] opacity-80">{t("home_longevity")}</h3>
            <span className="text-3xl md:text-4xl font-black tracking-tighter leading-none drop-shadow-2xl">{averageLongevityScore}</span>
          </div>
          <div className="relative z-10 flex items-center justify-center gap-1.5 py-1.5 bg-white/20 rounded-lg border border-white/30">
            <span className="text-white font-black text-[9px] uppercase tracking-wider">{t("home_longevity_cta")}</span>
          </div>
        </div>
        </div>
      </div>

      {/* Quick Actions Bento Grid */}
      <div>
        <h3 className="text-[9px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">{t("dopamine_quick_scan_title")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {/* Scan */}
          <motion.div whileTap={{ scale: 0.95 }} className="relative p-3 md:p-4 glass-strong border border-blue-500/20 rounded-xl cursor-pointer group overflow-hidden" onClick={() => onNavigate("dashboard")}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <ScanLine className="w-5 h-5 md:w-7 md:h-7 text-blue-400 mb-1.5" />
              <p className="text-[10px] md:text-xs font-black text-foreground">{t("dopamine_quick_scan")}</p>
              <p className="text-[8px] text-muted-foreground opacity-50">{t("dopamine_quick_scan_desc")}</p>
            </div>
          </motion.div>
          
          {/* Workout */}
          <motion.div whileTap={{ scale: 0.95 }} className="relative p-3 md:p-4 glass-strong border border-orange-500/20 rounded-xl cursor-pointer group overflow-hidden" onClick={() => onNavigate("training")}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <Dumbbell className="w-5 h-5 md:w-7 md:h-7 text-orange-400 mb-1.5" />
              <p className="text-[10px] md:text-xs font-black text-foreground">{t("dopamine_quick_workout")}</p>
              <p className="text-[8px] text-muted-foreground opacity-50">{t("dopamine_quick_workout_desc")}</p>
            </div>
          </motion.div>
          
          {/* Recipes */}
          <motion.div whileTap={{ scale: 0.95 }} className="relative p-3 md:p-4 glass-strong border border-emerald-500/20 rounded-xl cursor-pointer group overflow-hidden" onClick={() => onNavigate("recipes")}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <ChefHat className="w-5 h-5 md:w-7 md:h-7 text-emerald-400 mb-1.5" />
              <p className="text-[10px] md:text-xs font-black text-foreground">{t("dopamine_quick_recipe")}</p>
              <p className="text-[8px] text-muted-foreground opacity-50">{t("dopamine_quick_recipe_desc")}</p>
            </div>
          </motion.div>
          
          {/* My Plan */}
          <motion.div whileTap={{ scale: 0.95 }} className="relative p-3 md:p-4 glass-strong border border-purple-500/20 rounded-xl cursor-pointer group overflow-hidden" onClick={() => onNavigate("planner")}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <Flame className="w-5 h-5 md:w-7 md:h-7 text-purple-400 mb-1.5" />
              <p className="text-[10px] md:text-xs font-black text-foreground">{t("dopamine_quick_plan")}</p>
              <p className="text-[8px] text-muted-foreground opacity-50">{t("dopamine_quick_plan_desc")}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bio-Logs Recent */}
      <div className="mt-8 md:mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h3 className="text-lg md:text-2xl font-black text-foreground tracking-tighter">{t("home_bio_logs")}</h3>
            <span className="text-[8px] md:text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">{t("home_last_24h")}</span>
          </div>
          <Button variant="ghost" className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 hover:bg-white/5 rounded-full px-3 md:px-5 py-2 md:py-3">
            {t("home_see_history")}
          </Button>
        </div>

        <div className="bg-black/5 dark:bg-white/5 rounded-[2.5rem] md:rounded-[3.5rem] p-4 md:p-6 shadow-inner">
          {dailyActivity.scannedProducts.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {dailyActivity.scannedProducts.slice(0, 3).map((product: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 md:gap-6 p-4 md:p-6 glass-strong border-white/10 rounded-[2rem] md:rounded-[2.5rem] hover:scale-[1.01] transition-all cursor-pointer haptic-press group"
                >
                  <img
                    src={product.image || "/placeholder.svg?width=100&height=100"}
                    alt={product.productName}
                    className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] object-cover shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-lg md:text-2xl text-foreground truncate tracking-tight">{product.productName}</p>
                    <div className="flex gap-2 md:gap-3 mt-1 md:mt-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-black text-[10px] px-2 md:px-3 py-1 rounded-full">
                        {product.longevityScore} {t("scan_score_label")}
                      </Badge>
                      <span className="text-[10px] font-bold opacity-30 mt-1 uppercase tracking-[0.2em]">
                        {new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8 opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-16 md:py-24 text-center">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6"
              >
                <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </motion.div>
              <h4 className="text-lg md:text-2xl font-black text-foreground mb-2">{t("dopamine_empty_title")}</h4>
              <p className="text-sm text-muted-foreground opacity-60 mb-6 max-w-xs mx-auto">{t("dopamine_empty_subtitle")}</p>
              <button
                onClick={() => onNavigate("dashboard")}
                className="inline-flex items-center gap-2 py-3 px-6 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all active:scale-95 mb-3"
              >
                {t("dopamine_empty_cta")}
              </button>
              <p className="text-[10px] text-muted-foreground opacity-40">{t("dopamine_empty_xp_hint")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}