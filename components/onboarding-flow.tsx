"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight, ChevronLeft, ScanLine, Dumbbell, ChefHat,
  Calculator, Users, Check, Rocket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface OnboardingStep {
  icon: any
  title: string
  description: string
  color: string
}

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [step, setStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem("onboarding_completed")
    if (!completed) {
      setIsVisible(true)
    }
  }, [])

  const steps: OnboardingStep[] = [
    {
      icon: ScanLine,
      title: isEnglish ? "Scan Any Food" : "Escanear Qualquer Alimento",
      description: isEnglish
        ? "Point your camera at any food label and get instant AI-powered nutritional analysis."
        : "Aponte sua camera para qualquer rotulo de alimento e obtenha analise nutricional instantanea por IA.",
      color: "from-emerald-500 to-green-500",
    },
    {
      icon: Dumbbell,
      title: isEnglish ? "Personalized Workouts" : "Treinos Personalizados",
      description: isEnglish
        ? "AI creates workout plans tailored to your body, goals, and available equipment."
        : "A IA cria planos de treino sob medida para seu corpo, objetivos e equipamentos disponiveis.",
      color: "from-blue-500 to-indigo-500",
    },
    {
      icon: ChefHat,
      title: isEnglish ? "Smart Recipes" : "Receitas Inteligentes",
      description: isEnglish
        ? "Get recipe suggestions based on your metabolic plan and food preferences."
        : "Receba sugestoes de receitas baseadas no seu plano metabolico e preferencias alimentares.",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: Users,
      title: isEnglish ? "Join a Clan" : "Entre em um Cla",
      description: isEnglish
        ? "Connect with others, share progress, take challenges, and stay accountable together."
        : "Conecte-se com outros, compartilhe progresso, faca desafios e mantenham-se responsaveis juntos.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Rocket,
      title: isEnglish ? "You're All Set!" : "Tudo Pronto!",
      description: isEnglish
        ? "Start your biohacking journey now. Your body will thank you."
        : "Comece sua jornada de biohacking agora. Seu corpo vai agradecer.",
      color: "from-orange-500 to-red-500",
    },
  ]

  const current = steps[step]
  const Icon = current.icon
  const progress = ((step + 1) / steps.length) * 100

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      localStorage.setItem("onboarding_completed", "true")
      setIsVisible(false)
      onComplete()
    }
  }

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true")
    setIsVisible(false)
    onComplete()
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-[#050302] flex flex-col"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_50%)]" />

        <div className="relative z-10 flex items-center justify-between p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20">
            {step + 1}/{steps.length}
          </span>
          <button
            onClick={handleSkip}
            className="text-[10px] font-black uppercase tracking-widest text-foreground/30 hover:text-foreground/50"
          >
            {isEnglish ? "Skip" : "Pular"}
          </button>
        </div>

        <div className="relative z-10 px-6">
          <div className="h-1 bg-foreground/15 rounded-full overflow-hidden mb-8">
            <motion.div
              className="h-full bg-gradient-to-r from-foreground to-foreground/70 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className={cn(
                  "w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center mx-auto mb-6",
                  current.color
                )}
              >
                <Icon className="h-10 w-10 text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-black text-foreground mb-3"
              >
                {current.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-foreground/40 leading-relaxed max-w-sm mx-auto"
              >
                {current.description}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 p-6 flex flex-col gap-3">
          <Button
            onClick={handleNext}
            className="h-14 rounded-2xl bg-foreground text-base font-black uppercase tracking-widest text-background hover:bg-foreground/80"
          >
            {step < steps.length - 1 ? (
              <>
                {isEnglish ? "Next" : "Proximo"}
                <ChevronRight className="h-5 w-5 ml-2" />
              </>
            ) : (
              <>
                {isEnglish ? "Get Started" : "Comecar"}
                <Rocket className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>

          {step > 0 && (
            <Button
              onClick={() => setStep(step - 1)}
              variant="ghost"
              className="h-12 rounded-2xl border border-foreground/10 bg-foreground/5 text-foreground/50 hover:bg-foreground/10"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {isEnglish ? "Back" : "Voltar"}
            </Button>
          )}
        </div>

        <div className="relative z-10 flex justify-center gap-2 pb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all",
                i === step ? "w-6 bg-foreground" : i < step ? "w-1.5 bg-foreground/40" : "w-1.5 bg-foreground/15"
              )}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
