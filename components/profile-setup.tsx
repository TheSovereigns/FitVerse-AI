"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ChevronRight,
  ChevronLeft,
  Scale,
  Ruler,
  Calendar,
  User,
  Target,
  Rocket,
  Heart,
  Dumbbell,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

interface ProfileSetupProps {
  onComplete: () => void
}

type Step = "gender" | "age" | "weight" | "height" | "goal"

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<Step>("gender")
  const [isSaving, setIsSaving] = useState(false)

  const [gender, setGender] = useState<string>("")
  const [age, setAge] = useState("25")
  const [weight, setWeight] = useState("70")
  const [height, setHeight] = useState("170")
  const [goal, setGoal] = useState<string>("")

  const steps: Step[] = ["gender", "age", "weight", "height", "goal"]
  const currentIndex = steps.indexOf(currentStep)
  const progress = ((currentIndex + 1) / steps.length) * 100

  const handleNext = () => {
    const idx = steps.indexOf(currentStep)
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1]!)
    } else {
      handleSave()
    }
  }

  const handleBack = () => {
    const idx = steps.indexOf(currentStep)
    if (idx > 0) {
      setCurrentStep(steps[idx - 1]!)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await supabase
        .from("profiles")
        .update({
          gender: gender || null,
          age: parseInt(age) || null,
          weight: parseFloat(weight) || null,
          height: parseFloat(height) || null,
          fitness_goal: goal || null,
          profile_setup_completed: true,
        })
        .eq("id", user.id)
    } catch (e) {
      console.error("Error saving profile:", e)
    } finally {
      setIsSaving(false)
      onComplete()
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case "gender": return !!gender
      case "age": return !!age && parseInt(age) > 0
      case "weight": return !!weight && parseFloat(weight) > 0
      case "height": return !!height && parseFloat(height) > 0
      case "goal": return !!goal
      default: return false
    }
  }

  const genderOptions = [
    { value: "male", label: isEnglish ? "Male" : "Masculino", icon: "♂" },
    { value: "female", label: isEnglish ? "Female" : "Feminino", icon: "♀" },
    { value: "other", label: isEnglish ? "Other" : "Outro", icon: "⚧" },
  ]

  const goalOptions = [
    { value: "lose_weight", label: isEnglish ? "Lose Weight" : "Perder Peso", icon: TrendingDown, desc: isEnglish ? "Reduce body fat" : "Reduzir gordura corporal" },
    { value: "gain_muscle", label: isEnglish ? "Gain Muscle" : "Ganhar Massa", icon: Dumbbell, desc: isEnglish ? "Build lean muscle" : "Construir massa magra" },
    { value: "maintain", label: isEnglish ? "Maintain" : "Manter", icon: Minus, desc: isEnglish ? "Keep current physique" : "Manter fisico atual" },
    { value: "improve_health", label: isEnglish ? "Improve Health" : "Melhorar Saude", icon: Heart, desc: isEnglish ? "Feel better overall" : "Sentir-se melhor" },
  ]

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
            {currentIndex + 1}/{steps.length}
          </span>
          <button
            onClick={onComplete}
            className="text-[10px] font-black uppercase tracking-widest text-foreground/30 hover:text-foreground/50"
          >
            {isEnglish ? "Skip" : "Pular"}
          </button>
        </div>

        <div className="relative z-10 px-6">
          <div className="h-1 bg-foreground/15 rounded-full overflow-hidden mb-8">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="w-full max-w-md"
            >
              {currentStep === "gender" && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-6"
                  >
                    <User className="h-10 w-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-foreground mb-2">
                    {isEnglish ? "What's your gender?" : "Qual seu genero?"}
                  </h2>
                  <p className="text-sm text-foreground/40 mb-8">
                    {isEnglish ? "This helps us personalize your plan" : "Isso ajuda a personalizar seu plano"}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setGender(opt.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all",
                          gender === opt.value
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-white/10 bg-white/5 text-foreground/50 hover:bg-white/10"
                        )}
                      >
                        <span className="text-3xl">{opt.icon}</span>
                        <span className="text-xs font-black uppercase tracking-wider">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === "age" && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-6"
                  >
                    <Calendar className="h-10 w-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-foreground mb-2">
                    {isEnglish ? "How old are you?" : "Quantos anos voce tem?"}
                  </h2>
                  <p className="text-sm text-foreground/40 mb-8">
                    {isEnglish ? "For accurate calculations" : "Para calculos precisos"}
                  </p>
                  <div className="flex justify-center">
                    <Input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-32 h-16 text-center text-4xl font-black rounded-2xl border-white/10 bg-white/5"
                      min={10}
                      max={120}
                    />
                  </div>
                </div>
              )}

              {currentStep === "weight" && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6"
                  >
                    <Scale className="h-10 w-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-foreground mb-2">
                    {isEnglish ? "What's your weight?" : "Qual seu peso?"}
                  </h2>
                  <p className="text-sm text-foreground/40 mb-8">
                    {isEnglish ? "In kilograms (kg)" : "Em quilogramas (kg)"}
                  </p>
                  <div className="flex justify-center items-center gap-3">
                    <Input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-32 h-16 text-center text-4xl font-black rounded-2xl border-white/10 bg-white/5"
                      min={20}
                      max={300}
                      step={0.1}
                    />
                    <span className="text-lg font-bold text-foreground/40">kg</span>
                  </div>
                </div>
              )}

              {currentStep === "height" && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6"
                  >
                    <Ruler className="h-10 w-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-foreground mb-2">
                    {isEnglish ? "What's your height?" : "Qual sua altura?"}
                  </h2>
                  <p className="text-sm text-foreground/40 mb-8">
                    {isEnglish ? "In centimeters (cm)" : "Em centimetros (cm)"}
                  </p>
                  <div className="flex justify-center items-center gap-3">
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-32 h-16 text-center text-4xl font-black rounded-2xl border-white/10 bg-white/5"
                      min={100}
                      max={250}
                      step={0.1}
                    />
                    <span className="text-lg font-bold text-foreground/40">cm</span>
                  </div>
                </div>
              )}

              {currentStep === "goal" && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center mx-auto mb-6"
                  >
                    <Target className="h-10 w-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-foreground mb-2">
                    {isEnglish ? "What's your goal?" : "Qual seu objetivo?"}
                  </h2>
                  <p className="text-sm text-foreground/40 mb-8">
                    {isEnglish ? "Choose what matters most" : "Escolha o que mais importa"}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {goalOptions.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setGoal(opt.value)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                            goal === opt.value
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-white/10 bg-white/5 text-foreground/50 hover:bg-white/10"
                          )}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-xs font-black uppercase tracking-wider">{opt.label}</span>
                          <span className="text-[10px] text-foreground/30">{opt.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 p-6 flex flex-col gap-3">
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSaving}
            className="h-14 rounded-2xl bg-foreground text-base font-black uppercase tracking-widest text-background hover:bg-foreground/80 disabled:opacity-30"
          >
            {currentIndex < steps.length - 1 ? (
              <>
                {isEnglish ? "Next" : "Proximo"}
                <ChevronRight className="h-5 w-5 ml-2" />
              </>
            ) : isSaving ? (
              <span className="animate-pulse">{isEnglish ? "Saving..." : "Salvando..."}</span>
            ) : (
              <>
                {isEnglish ? "Let's Go!" : "Vamos Lá!"}
                <Rocket className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>

          {currentIndex > 0 && (
            <Button
              onClick={handleBack}
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
                i === currentIndex ? "w-6 bg-foreground" : i < currentIndex ? "w-1.5 bg-foreground/40" : "w-1.5 bg-foreground/15"
              )}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
