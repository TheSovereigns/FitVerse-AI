"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Zap, ScanLine, Dumbbell, ChefHat, ArrowRight, Play, CheckCircle2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface OnboardingCardProps {
  onCTAClick: () => void
}

export function OnboardingCard({ onCTAClick }: OnboardingCardProps) {
  const { t } = useTranslation()

  const benefits = [
    {
      icon: ScanLine,
      title: t("onboard_benefit1_title"),
      desc: t("onboard_benefit1_desc"),
    },
    {
      icon: Dumbbell,
      title: t("onboard_benefit2_title"),
      desc: t("onboard_benefit2_desc"),
    },
    {
      icon: ChefHat,
      title: t("onboard_benefit3_title"),
      desc: t("onboard_benefit3_desc"),
    },
  ]

  const steps = [
    { num: "01", title: t("onboard_step1_title"), desc: t("onboard_step1_desc") },
    { num: "02", title: t("onboard_step2_title"), desc: t("onboard_step2_desc") },
    { num: "03", title: t("onboard_step3_title"), desc: t("onboard_step3_desc") },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 md:space-y-12 pb-safe-nav">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 md:space-y-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center justify-center p-3 md:p-4 rounded-2xl bg-primary/20 mb-4"
        >
          <Zap className="w-6 h-6 md:w-8 md:h-8 text-primary" />
        </motion.div>
        
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight">
          {t("onboard_hero_title")}<br />
          <span className="text-primary">{t("onboard_hero_subtitle")}</span>
        </h1>
        
        <p className="text-sm md:text-lg font-medium text-muted-foreground opacity-70 max-w-md mx-auto">
          {t("onboard_hero_desc")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4">
          <Button
            onClick={onCTAClick}
            className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-base font-black rounded-full shadow-lg mesh-gradient text-white haptic-press"
          >
            {t("onboard_cta_start")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-base font-black rounded-full border-white/20 text-muted-foreground hover:bg-white/10"
          >
            <Play className="w-4 h-4 mr-2" />
            {t("onboard_cta_how")}
          </Button>
        </div>
      </motion.div>

      {/* Benefits Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 text-center">
          {t("onboard_benefits_title")}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {benefits.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="glass-strong border-white/10 rounded-2xl p-4 md:p-5 text-center hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-5 h-5 md:w-6 md:h-5 text-primary" />
              </div>
              <h3 className="text-sm md:text-base font-black text-foreground mb-1">{item.title}</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground opacity-60">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* How It Works Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 text-center">
          {t("onboard_how_title")}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="relative glass-strong border-white/10 rounded-2xl p-4 md:p-5"
            >
              <span className="text-2xl md:text-3xl font-black text-primary/20">{step.num}</span>
              <h3 className="text-sm md:text-base font-black text-foreground mt-2 mb-1">{step.title}</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground opacity-60">{step.desc}</p>
              {index < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-center space-y-4 md:space-y-6 pb-8"
      >
        <div className="glass-strong border-white/10 rounded-2xl p-6 md:p-8 mesh-gradient/10">
          <h3 className="text-xl md:text-2xl font-black text-foreground mb-2">
            {t("onboard_cta_title")}
          </h3>
          <p className="text-sm text-muted-foreground opacity-60 mb-4">
            {t("onboard_cta_subtitle")}
          </p>
          <Button
            onClick={onCTAClick}
            className="h-12 md:h-14 px-8 md:px-10 text-sm md:text-base font-black rounded-full shadow-lg mesh-gradient text-white haptic-press"
          >
            {t("onboard_cta_journey")}
            <Zap className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}