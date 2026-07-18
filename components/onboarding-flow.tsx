"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight, ChevronLeft, Rocket, Moon, Brain, AlertTriangle,
  Dumbbell, Apple, Scale, Heart, Zap, Check, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

interface OnboardingData {
  name: string
  age: string
  weight: string
  height: string
  gender: string
  goal: string
  activityLevel: string
  sleepHours: string
  sleepQuality: string
  stressLevel: string
  injuries: string[]
  equipment: string[]
  dietaryRestrictions: string[]
  experience: string
  workoutsPerWeek: string
  smokingStatus: string
  waterIntake: string
}

const defaultData: OnboardingData = {
  name: "", age: "", weight: "", height: "",
  gender: "", goal: "", activityLevel: "",
  sleepHours: "", sleepQuality: "", stressLevel: "",
  injuries: [], equipment: [], dietaryRestrictions: [],
  experience: "", workoutsPerWeek: "", smokingStatus: "", waterIntake: "",
}

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const isEnglish = locale === "en-US"
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(defaultData)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem("onboarding_completed")
    if (!completed) setIsVisible(true)
  }, [])

  const update = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayItem = (field: 'injuries' | 'equipment' | 'dietaryRestrictions', item: string) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }))
  }

  const totalSteps = 8
  const progress = ((step + 1) / totalSteps) * 100

  const canProceed = () => {
    switch (step) {
      case 0: return data.name.trim().length > 0
      case 1: return data.age && data.weight && data.height && data.gender
      case 2: return data.goal && data.activityLevel
      case 3: return data.sleepHours && data.sleepQuality && data.stressLevel
      case 4: return true
      case 5: return data.experience
      case 6: return true
      case 7: return true
      default: return true
    }
  }

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      await generatePlan()
    }
  }

  const generatePlan = async () => {
    setIsGenerating(true)
    try {
      if (user) {
        await supabase.from("profiles").update({
          name: data.name,
          age: parseInt(data.age),
          weight: parseFloat(data.weight),
          height: parseFloat(data.height),
          gender: data.gender as any,
          fitness_goal: data.goal as any,
          profile_setup_completed: true,
        }).eq("id", user.id)

        const bioProfile = {
          sleepHours: parseFloat(data.sleepHours),
          sleepQuality: data.sleepQuality,
          stressLevel: data.stressLevel,
          injuries: data.injuries,
          equipment: data.equipment,
          dietaryRestrictions: data.dietaryRestrictions,
          experience: data.experience,
          workoutsPerWeek: parseInt(data.workoutsPerWeek || "3"),
          smokingStatus: data.smokingStatus,
          waterIntake: parseFloat(data.waterIntake || "2"),
        }

        localStorage.setItem("bioProfile", JSON.stringify(bioProfile))
        localStorage.setItem("userProfile", JSON.stringify({
          name: data.name, age: data.age, weight: data.weight,
          height: data.height, gender: data.gender, goal: data.goal,
          activityLevel: data.activityLevel,
        }))

        try {
          const token = (await supabase.auth.getSession()).data.session?.access_token
          const resp = await fetch("/api/generate-initial-plan", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              weight: parseFloat(data.weight),
              height: parseFloat(data.height),
              age: parseInt(data.age),
              gender: data.gender,
              activityLevel: data.activityLevel,
              goal: data.goal,
              sleepHours: parseFloat(data.sleepHours),
              sleepQuality: data.sleepQuality,
              stressLevel: data.stressLevel,
              injuries: data.injuries,
              equipment: data.equipment,
              dietaryRestrictions: data.dietaryRestrictions,
              experience: data.experience,
              workoutsPerWeek: parseInt(data.workoutsPerWeek || "3"),
              locale,
            }),
          })

          if (resp.ok) {
            const planData = await resp.json()
            localStorage.setItem("initialPlan", JSON.stringify(planData))
          }
        } catch (e) {
          console.error("Plan generation error:", e)
        }
      }

      localStorage.setItem("onboarding_completed", "true")
      setIsVisible(false)
      onComplete()
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true")
    setIsVisible(false)
    onComplete()
  }

  if (!isVisible) return null

  const l = (pt: string, en: string) => isEnglish ? en : pt

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-background flex flex-col"
      >
        <div className="flex items-center justify-between p-4">
          <span className="text-xs text-muted-foreground">
            {step + 1}/{totalSteps}
          </span>
          <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground">
            {l("Pular", "Skip")}
          </button>
        </div>

        <div className="px-6">
          <div className="h-1 bg-muted rounded-full overflow-hidden mb-6">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              {step === 0 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {l("Qual seu nome?", "What's your name?")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {l("Para personalizarmos sua experiencia", "To personalize your experience")}
                    </p>
                  </div>
                  <Input
                    value={data.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder={l("Seu nome", "Your name")}
                    className="h-14 rounded-2xl border-border bg-card text-foreground text-center text-lg"
                  />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Scale className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {l("Seus dados biometricos", "Your biometric data")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {l("Para calculos precisos de metabolism", "For accurate metabolic calculations")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">{l("Idade", "Age")}</label>
                      <Input
                        type="number" value={data.age}
                        onChange={(e) => update("age", e.target.value)}
                        placeholder="25" min={10} max={120}
                        className="h-12 rounded-xl border-border bg-card text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">{l("Peso (kg)", "Weight (kg)")}</label>
                      <Input
                        type="number" value={data.weight}
                        onChange={(e) => update("weight", e.target.value)}
                        placeholder="70" min={20} max={300} step={0.1}
                        className="h-12 rounded-xl border-border bg-card text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">{l("Altura (cm)", "Height (cm)")}</label>
                      <Input
                        type="number" value={data.height}
                        onChange={(e) => update("height", e.target.value)}
                        placeholder="175" min={100} max={250} step={0.1}
                        className="h-12 rounded-xl border-border bg-card text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">{l("Genero", "Gender")}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "male", label: l("Masc", "Male") },
                          { value: "female", label: l("Fem", "Female") },
                        ].map((g) => (
                          <button
                            key={g.value}
                            onClick={() => update("gender", g.value)}
                            className={cn(
                              "h-12 rounded-xl border text-xs font-semibold transition-all",
                              data.gender === g.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground hover:bg-accent"
                            )}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {l("Seus objetivos", "Your goals")}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Objetivo", "Goal")}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "lose_weight", label: l("Perder Peso", "Lose Weight"), icon: "📉" },
                        { value: "gain_muscle", label: l("Ganhar Massa", "Gain Muscle"), icon: "💪" },
                        { value: "maintain", label: l("Manter Peso", "Maintain"), icon: "⚖️" },
                        { value: "improve_health", label: l("Melhorar Saude", "Improve Health"), icon: "❤️" },
                      ].map((g) => (
                        <button
                          key={g.value}
                          onClick={() => update("goal", g.value)}
                          className={cn(
                            "p-4 rounded-2xl border text-left transition-all",
                            data.goal === g.value
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:bg-accent"
                          )}
                        >
                          <span className="text-xl">{g.icon}</span>
                          <p className={cn("text-sm font-semibold mt-2", data.goal === g.value ? "text-primary" : "text-foreground")}>{g.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Nivel de Atividade", "Activity Level")}</label>
                    <div className="space-y-2">
                      {[
                        { value: "sedentary", label: l("Sedentario (pouco ou nenhum exercicio)", "Sedentary (little or no exercise)") },
                        { value: "moderate", label: l("Moderado (1-3x por semana)", "Moderate (1-3x per week)") },
                        { value: "active", label: l("Ativo (3-5x por semana)", "Active (3-5x per week)") },
                        { value: "athlete", label: l("Atleta (6-7x por semana)", "Athlete (6-7x per week)") },
                      ].map((a) => (
                        <button
                          key={a.value}
                          onClick={() => update("activityLevel", a.value)}
                          className={cn(
                            "w-full p-3 rounded-xl border text-left text-sm transition-all",
                            data.activityLevel === a.value
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : "border-border bg-card text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Moon className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {l("Sono e Estresse", "Sleep & Stress")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {l("Impactam diretamente seus resultados", "Directly impact your results")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Horas de Sono por Noite", "Hours of Sleep per Night")}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["5", "6", "7", "8"].map((h) => (
                        <button
                          key={h}
                          onClick={() => update("sleepHours", h)}
                          className={cn(
                            "h-12 rounded-xl border text-sm font-semibold transition-all",
                            data.sleepHours === h
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Qualidade do Sono", "Sleep Quality")}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "poor", label: l("Ruim", "Poor") },
                        { value: "normal", label: l("Normal", "Normal") },
                        { value: "good", label: l("Otima", "Great") },
                      ].map((q) => (
                        <button
                          key={q.value}
                          onClick={() => update("sleepQuality", q.value)}
                          className={cn(
                            "h-12 rounded-xl border text-sm font-semibold transition-all",
                            data.sleepQuality === q.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Nivel de Estresse", "Stress Level")}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: "low", label: l("Baixo", "Low") },
                        { value: "moderate", label: l("Moderado", "Moderate") },
                        { value: "high", label: l("Alto", "High") },
                        { value: "very_high", label: l("Muito Alto", "Very High") },
                      ].map((s) => (
                        <button
                          key={s.value}
                          onClick={() => update("stressLevel", s.value)}
                          className={cn(
                            "h-12 rounded-xl border text-sm font-semibold transition-all",
                            data.stressLevel === s.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {l("Lesoes e Limitacoes", "Injuries & Limitations")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {l("Seleciona todas que se aplicam", "Select all that apply")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Joelho", "Lombar", "Ombro", "Tornozelo",
                      "Pescoco", "Cotovelo", "Quadril", "Nenhuma",
                    ].map((inj) => (
                      <button
                        key={inj}
                        onClick={() => toggleArrayItem("injuries", inj)}
                        className={cn(
                          "p-3 rounded-xl border text-sm font-medium transition-all",
                          data.injuries.includes(inj)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {inj}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Dumbbell className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {l("Equipamento e Experiencia", "Equipment & Experience")}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Equipamento Disponivel", "Available Equipment")}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "none", label: l("Nenhum", "None") },
                        { value: "dumbbells", label: l("Halteres", "Dumbbells") },
                        { value: "barbell", label: l("Barra", "Barbell") },
                        { value: "machines", label: l("Maquinas", "Machines") },
                        { value: "bands", label: l("Elas Elasticas", "Resistance Bands") },
                        { value: "pullup_bar", label: l("Barra Fixa", "Pull-up Bar") },
                      ].map((eq) => (
                        <button
                          key={eq.value}
                          onClick={() => toggleArrayItem("equipment", eq.value)}
                          className={cn(
                            "p-3 rounded-xl border text-sm font-medium transition-all",
                            data.equipment.includes(eq.value)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {eq.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Experiencia com Treino", "Training Experience")}</label>
                    <div className="space-y-2">
                      {[
                        { value: "beginner", label: l("Iniciante (0-6 meses)", "Beginner (0-6 months)") },
                        { value: "intermediate", label: l("Intermediario (6 meses - 2 anos)", "Intermediate (6mo - 2yr)") },
                        { value: "advanced", label: l("Avancado (2+ anos)", "Advanced (2+ years)") },
                      ].map((e) => (
                        <button
                          key={e.value}
                          onClick={() => update("experience", e.value)}
                          className={cn(
                            "w-full p-3 rounded-xl border text-left text-sm transition-all",
                            data.experience === e.value
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : "border-border bg-card text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Apple className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {l("Restricoes Alimentares", "Dietary Restrictions")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {l("Para adaptar seu plano nutricional", "To adapt your nutritional plan")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "none", label: l("Nenhuma", "None") },
                      { value: "vegetarian", label: l("Vegetariano", "Vegetarian") },
                      { value: "vegan", label: l("Vegano", "Vegan") },
                      { value: "gluten_free", label: l("Sem Gluten", "Gluten Free") },
                      { value: "lactose_free", label: l("Sem Lactose", "Lactose Free") },
                      { value: "diabetic", label: l("Diabetico", "Diabetic") },
                      { value: "hypertension", label: l("Hipertensao", "Hypertension") },
                      { value: "keto", label: l("Cetogenica", "Keto") },
                    ].map((r) => (
                      <button
                        key={r.value}
                        onClick={() => toggleArrayItem("dietaryRestrictions", r.value)}
                        className={cn(
                          "p-3 rounded-xl border text-sm font-medium transition-all",
                          data.dietaryRestrictions.includes(r.value)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Rocket className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {l("Quase pronto!", "Almost ready!")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {l("Iremos gerar seu plano personalizado com IA", "We'll generate your personalized AI plan")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Treinos por Semana", "Workouts per Week")}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["2", "3", "4", "5"].map((w) => (
                        <button
                          key={w}
                          onClick={() => update("workoutsPerWeek", w)}
                          className={cn(
                            "h-12 rounded-xl border text-sm font-semibold transition-all",
                            data.workoutsPerWeek === w
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {w}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Fumante", "Smoker")}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "no", label: l("Nao", "No") },
                        { value: "former", label: l("Ex-fumante", "Former") },
                        { value: "yes", label: l("Sim", "Yes") },
                      ].map((s) => (
                        <button
                          key={s.value}
                          onClick={() => update("smokingStatus", s.value)}
                          className={cn(
                            "h-12 rounded-xl border text-sm font-semibold transition-all",
                            data.smokingStatus === s.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Agua por Dia (L)", "Water per Day (L)")}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["1.5", "2", "2.5", "3"].map((w) => (
                        <button
                          key={w}
                          onClick={() => update("waterIntake", w)}
                          className={cn(
                            "h-12 rounded-xl border text-sm font-semibold transition-all",
                            data.waterIntake === w
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {w}L
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
            className="h-14 rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {isGenerating ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {l("Gerando plano...", "Generating plan...")}</>
            ) : step < totalSteps - 1 ? (
              <>{l("Proximo", "Next")} <ChevronRight className="h-5 w-5 ml-2" /></>
            ) : (
              <><Rocket className="h-5 w-5 mr-2" /> {l("Gerar Meu Plano", "Generate My Plan")}</>
            )}
          </Button>

          {step > 0 && (
            <Button
              onClick={() => setStep(step - 1)}
              variant="ghost"
              className="h-12 rounded-2xl border border-border text-muted-foreground hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {l("Voltar", "Back")}
            </Button>
          )}
        </div>

        <div className="flex justify-center gap-2 pb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all",
                i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"
              )}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}