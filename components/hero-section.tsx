"use client"

import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { CTAButton } from "@/components/cta-button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

export function HeroSection() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()

  const isEnglish = locale === "en-US"

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const titleWords = isEnglish
    ? ["AI-Powered", "Workout", "&", "Diet", "Plans", "—", "Ready", "in", "Seconds"]
    : ["Treino", "e", "dieta", "personalizados", "por", "IA", "—", "prontos", "em", "segundos"]

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center px-4 md:px-6 lg:px-8 xl:px-12 pt-16 pb-12">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-80 md:h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 md:w-72 md:h-72 bg-purple-500/15 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[600px] md:h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="relative z-10 max-w-3xl xl:max-w-4xl mx-auto text-center">
        {/* Social Proof Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6 md:mb-8"
        >
          <span className="text-yellow-400 text-xs md:text-sm">★★★★★</span>
          <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("hero_social_proof")}
          </span>
        </motion.div>

        {/* Title with Word Animation */}
        <h1 className="text-foreground mb-5 md:mb-7">
          <div className="flex flex-wrap items-center justify-center gap-x-2 md:gap-x-3 gap-y-1">
            {titleWords.map((word, index) => {
              const isAIWord = (isEnglish && word === "AI-Powered") || (!isEnglish && word === "IA")
              return (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.08 + index * 0.06,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className={cn(
                    "inline-block font-black tracking-tight",
                    isAIWord ? "text-primary relative" : "text-foreground",
                  )}
                  style={{
                    fontSize: "clamp(1.5rem, 4.5vw, 3rem)",
                    lineHeight: 1.1,
                  }}
                >
                  {word}
                  {isAIWord && (
                    <motion.span
                      className="absolute -bottom-0.5 left-0 w-full h-1 bg-primary rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.4 + index * 0.06, duration: 0.3 }}
                    />
                  )}
                </motion.span>
              )
            })}
          </div>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-sm md:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto mb-8"
        >
          {t("hero_subtitle")}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-5"
        >
          <CTAButton
            label={t("hero_cta_primary")}
            href={user ? "/?view=planner" : "/auth/login"}
            variant="primary"
            size="md"
            dataCta="hero-primary"
            showArrow
          />

          <CTAButton
            label={t("hero_cta_secondary")}
            variant="secondary"
            size="md"
            dataCta="hero-secondary"
            onClick={() => scrollToSection("como-funciona")}
            showArrow={false}
          />
        </motion.div>
      </div>
    </section>
  )
}