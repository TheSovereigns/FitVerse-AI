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
        className="relative glass-strong border-white/20 p-6 md:p-12 lg:p-20 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)] group cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 opacity-50" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 md:gap-12">
          <div className="flex-1 text-center sm:text-left">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-2 md:mb-4 block">
              {t("home_calorie_label")}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-none font-black text-foreground tracking-tighter mb-2 flex items-baseline gap-2 justify-center sm:justify-start">
              {Math.round(remainingCalories)}
              <span className="text-lg md:text-2xl opacity-20 tracking-normal font-bold">{t("home_kcal")}</span>
            </h2>
            <div className="h-2 md:h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 mt-2 md:mt-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full mesh-gradient shadow-[0_0_20px_var(--primary)]"
              />
            </div>
          </div>

          <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[0.75rem] md:border-[1rem] border-white/5" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-[0.75rem] md:border-[1rem] border-transparent border-t-primary border-r-primary/50 blur-[2px] shadow-[inset_0_0_20px_rgba(255,149,0,0.5)]"
            />
            <div className="text-center">
              <Target className="w-6 h-6 md:w-10 md:h-10 text-primary mx-auto mb-1 animate-pulse" />
              <span className="text-xl md:text-3xl font-black">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Widget Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        {/* Water Widget */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="relative h-36 md:h-48 glass-strong border-white/20 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden group cursor-pointer flex flex-col justify-end p-4 md:p-6 shadow-xl"
        >
          <div className="relative z-10">
            <Droplet className="w-5 h-5 md:w-8 md:h-8 text-white mb-1 md:mb-2 drop-shadow-[0_0_10px_rgba(10,132,255,1)]" />
            <h3 className="text-lg md:text-2xl font-black text-white tracking-tight">{t("home_water")}</h3>
            <p className="text-white/60 font-bold uppercase tracking-widest text-[8px] md:text-xs mt-0.5">{waterCups * 250}ml / 3000ml</p>
          </div>
          <div className="absolute top-3 right-3 md:top-6 md:right-6 z-10 glass-strong w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg md:text-xl font-black shadow-lg">+</div>
        </motion.div>

        {/* Protein Widget */}
        <div className="relative h-44 md:h-72 glass-strong border-white/20 rounded-[2.5rem] md:rounded-[3.5rem] p-5 md:p-8 flex flex-col justify-between group overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A84FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10">
            <Zap className="w-7 h-7 md:w-10 md:h-10 text-[#0A84FF] mb-2 md:mb-4" />
            <h3 className="text-xl md:text-3xl font-black text-foreground tracking-tight">{t("home_protein")}</h3>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] md:text-xs mt-1">{Math.round(dailyTotals.protein)}g / {goals?.proteinGrams}g</p>
          </div>
          <div className="relative z-10 w-full h-2 md:h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((dailyTotals.protein / goals?.proteinGrams) * 100, 100)}%` }}
              className="h-full bg-[#0A84FF] shadow-[0_0_20px_rgba(10,132,255,0.6)]"
            />
          </div>
        </div>

        {/* Longevity Score - spans full width on mobile if 3rd item */}
        <div className="relative h-44 md:h-72 mesh-gradient rounded-[2.5rem] md:rounded-[3.5rem] p-5 md:p-8 flex flex-col items-center justify-center text-center text-white haptic-press glass-reflection shadow-2xl overflow-hidden col-span-2 md:col-span-1">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          <div className="relative z-10">
            <Trophy className="w-10 h-10 md:w-16 md:h-16 mb-3 md:mb-4 animate-bounce text-yellow-300" />
            <h3 className="text-xs font-black uppercase tracking-[0.4em] opacity-80">{t("home_longevity")}</h3>
            <span className="text-[4rem] md:text-[6rem] font-black tracking-tighter leading-none drop-shadow-2xl">{averageLongevityScore}</span>
          </div>
        </div>
      </div>

      {/* Bio-Logs Recent */}
      <div className="mt-10 md:mt-20">
        <div className="flex items-center justify-between mb-5 md:mb-8 px-2 md:px-6">
          <div className="flex flex-col">
            <h3 className="text-xl md:text-3xl font-black text-foreground tracking-tighter">{t("home_bio_logs")}</h3>
            <span className="text-[9px] md:text-xs font-black text-primary/60 uppercase tracking-[0.3em]">{t("home_last_24h")}</span>
          </div>
          <Button variant="ghost" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 hover:bg-white/5 rounded-full px-4 md:px-6 py-3 md:py-4">
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
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Target className="w-8 h-8 md:w-10 md:h-10 opacity-20" />
              </div>
              <span className="text-xs font-black opacity-20 uppercase tracking-[0.5em]">{t("home_no_record")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}