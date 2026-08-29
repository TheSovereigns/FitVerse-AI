"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight, ChevronLeft, Rocket, Scale, Target, Activity, Check, Loader2, Watch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { z } from "zod"

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
  wearable: string
}

const defaultData: OnboardingData = {
  name: "", age: "", weight: "", height: "",
  gender: "", goal: "", activityLevel: "",
  sleepHours: "", sleepQuality: "", stressLevel: "",
  injuries: [], equipment: [], dietaryRestrictions: [],
  experience: "", workoutsPerWeek: "", smokingStatus: "", waterIntake: "",
  wearable: "",
}

const bioSchema = z.object({
  age: z.coerce.number().min(10).max(120),
  weight: z.coerce.number().min(20).max(300),
  height: z.coerce.number().min(100).max(250),
  gender: z.string().min(1),
})

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
    const skipped = localStorage.getItem("onboarding_skipped")
    if (completed) {
      setIsVisible(false)
      return
    }
    // restore persisted step and data
    const savedStep = localStorage.getItem("vysefit-onboarding-step")
    const savedData = localStorage.getItem("vysefit-onboarding-data")
    if (savedData) {
      try { setData(prev => ({ ...prev, ...JSON.parse(savedData) })) } catch {}
    }
    if (savedStep && !isNaN(parseInt(savedStep))) {
      const s = parseInt(savedStep)
      if (s >= 0 && s < 5) setStep(s)
    }
    // also restore legacy userProfile/bioProfile if exists
    try {
      const up = localStorage.getItem("userProfile")
      if (up) {
        const p = JSON.parse(up)
        setData(prev => ({
          ...prev,
          age: p.age || prev.age,
          weight: p.weight || prev.weight,
          height: p.height || prev.height,
          gender: p.gender || prev.gender,
          goal: p.goal || prev.goal,
        }))
      }
    } catch {}
    setIsVisible(true)
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

  const totalSteps = 5
  const progress = ((step + 1) / totalSteps) * 100

  const canProceed = () => {
    switch (step) {
      case 0: return data.age.trim() !== "" && data.weight.trim() !== "" && data.height.trim() !== "" && data.gender !== ""
      case 1: return !!data.goal
      case 2: return true
      case 3: return true
      case 4: return true
      default: return true
    }
  }

  const persistPerStep = async (): Promise<boolean> => {
    // save step and data locally always
    localStorage.setItem("vysefit-onboarding-step", String(step))
    localStorage.setItem("vysefit-onboarding-data", JSON.stringify(data))
    if (data.wearable) localStorage.setItem("vysefit-wearable", data.wearable)
    if (data.goal) localStorage.setItem("fitverse-fitness-goal", data.goal)

    if (!user) return true
    try {
      const payload: Record<string, any> = {}
      if (data.age) payload.age = parseInt(data.age)
      if (data.weight) payload.weight = parseFloat(data.weight)
      if (data.height) payload.height = parseFloat(data.height)
      if (data.gender) payload.gender = data.gender as any
      if (data.goal) payload.fitness_goal = data.goal as any
      // restrictions persisted each step as well
      if (data.injuries) payload.injuries = data.injuries
      if (data.dietaryRestrictions) payload.dietary_restrictions = data.dietaryRestrictions

      // only update if payload has something
      if (Object.keys(payload).length === 0) return true

      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id)
      if (error) {
        toast.error(t("onboard_save_error"))
        return false
      }
      return true
    } catch (e) {
      toast.error(t("onboard_save_error"))
      return false
    }
  }

  const handleNext = async () => {
    // step 0 validation with zod
    if (step === 0) {
      const parsed = bioSchema.safeParse({
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
      })
      if (!parsed.success) {
        const msg = t("onboard_bio_invalid") || t("validation_age_range")
        toast.error(msg)
        return
      }
      // JS clamp enforcement (also ensure values within range)
      const ageNum = Math.min(120, Math.max(10, Number(data.age)))
      const weightNum = Math.min(300, Math.max(20, Number(data.weight)))
      const heightNum = Math.min(250, Math.max(100, Number(data.height)))
      if (String(ageNum) !== data.age || String(weightNum) !== data.weight || String(heightNum) !== data.height) {
        setData(prev => ({ ...prev, age: String(ageNum), weight: String(weightNum), height: String(heightNum) }))
      }
    }

    const ok = await persistPerStep()
    if (!ok) return

    if (step < totalSteps - 1) {
      const next = step + 1
      setStep(next)
      localStorage.setItem("vysefit-onboarding-step", String(next))
    } else {
      await generatePlan()
    }
  }

  const generatePlan = async () => {
    setIsGenerating(true)
    try {
      if (user) {
        const { error } = await supabase.from("profiles").update({
          age: parseInt(data.age),
          weight: parseFloat(data.weight),
          height: parseFloat(data.height),
          gender: data.gender as any,
          fitness_goal: data.goal as any,
          injuries: data.injuries,
          dietary_restrictions: data.dietaryRestrictions,
          // wearable not stored in profiles yet, keep locally
          profile_setup_completed: true,
        }).eq("id", user.id)

        if (error) {
          toast.error(t("onboard_save_error"))
          setIsGenerating(false)
          return
        }

        const bioProfile = {
          injuries: data.injuries,
          dietaryRestrictions: data.dietaryRestrictions,
          wearable: data.wearable,
        }

        localStorage.setItem("bioProfile", JSON.stringify(bioProfile))
        localStorage.setItem("userProfile", JSON.stringify({
          age: data.age, weight: data.weight,
          height: data.height, gender: data.gender, goal: data.goal,
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
              goal: data.goal,
              injuries: data.injuries,
              dietaryRestrictions: data.dietaryRestrictions,
              wearable: data.wearable,
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
      localStorage.removeItem("onboarding_skipped")
      localStorage.removeItem("vysefit-onboarding-step")
      setIsVisible(false)
      onComplete()
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSkip = () => {
    // Do NOT mark onboarding_completed without profile
    localStorage.setItem("onboarding_skipped", "true")
    // keep current progress for CTA to resume
    localStorage.setItem("vysefit-onboarding-step", String(step))
    localStorage.setItem("vysefit-onboarding-data", JSON.stringify(data))
    setIsVisible(false)
    onComplete()
  }

  if (!isVisible) return null

  const l = (pt: string, en: string) => isEnglish ? en : pt

  // injury / dietary translation helpers using t()
  const injuryOptions = [
    { value: "Joelho", label: t("onboard_injury_knee") },
    { value: "Lombar", label: t("onboard_injury_lower_back") },
    { value: "Ombro", label: t("onboard_injury_shoulder") },
    { value: "Tornozelo", label: t("onboard_injury_ankle") },
    { value: "Pescoco", label: t("onboard_injury_neck") },
    { value: "Cotovelo", label: t("onboard_injury_elbow") },
    { value: "Quadril", label: t("onboard_injury_hip") },
    { value: "Nenhuma", label: t("onboard_injury_none") },
  ]

  const dietaryOptions = [
    { value: "none", label: t("onboard_diet_none") },
    { value: "vegetarian", label: t("onboard_diet_vegetarian") },
    { value: "vegan", label: t("onboard_diet_vegan") },
    { value: "gluten_free", label: t("onboard_diet_gluten_free") },
    { value: "lactose_free", label: t("onboard_diet_lactose_free") },
    { value: "diabetic", label: t("onboard_diet_diabetic") },
    { value: "hypertension", label: t("onboard_diet_hypertension") },
    { value: "keto", label: t("onboard_diet_keto") },
  ]

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
                      <Scale className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {t("onboard_step_bio_title")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("onboard_step_bio_desc")}
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
                      <label className="text-xs text-muted-foreground">{l("Gênero", "Gender")}</label>
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

              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {t("onboard_step_goal_title")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("onboard_step_goal_desc")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "lose_weight", label: l("Perder peso", "Lose weight"), icon: "📉", desc: l("Queimar gordura e definir", "Burn fat and tone up") },
                      { value: "gain_muscle", label: l("Ganhar massa", "Gain muscle"), icon: "💪", desc: l("Construir músculos e força", "Build muscle and strength") },
                      { value: "maintain", label: l("Manter saúde", "Maintain health"), icon: "⚖️", desc: l("Manter forma e equilíbrio", "Stay fit and balanced") },
                      { value: "improve_health", label: l("Melhorar saúde", "Improve health"), icon: "🚀", desc: l("Evoluir bem-estar geral", "Improve overall wellness") },
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
                        <span className="text-2xl">{g.icon}</span>
                        <p className={cn("text-sm font-semibold mt-2", data.goal === g.value ? "text-primary" : "text-foreground")}>{g.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{g.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {t("onboard_step_restrictions_title")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("onboard_step_restrictions_desc")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Lesões e limitações", "Injuries & limitations")}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {injuryOptions.map((inj) => (
                        <button
                          key={inj.value}
                          onClick={() => toggleArrayItem("injuries", inj.value)}
                          className={cn(
                            "p-3 rounded-xl border text-sm font-medium transition-all",
                            data.injuries.includes(inj.value)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {inj.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{l("Restrições alimentares", "Dietary restrictions")}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {dietaryOptions.map((r) => (
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
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Watch className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {t("onboard_step_wearable_title")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("onboard_step_wearable_desc")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { value: "google_fit", label: t("onboard_wearable_google_fit"), icon: "📱" },
                      { value: "apple_health", label: t("onboard_wearable_apple_health"), icon: "⌚" },
                      { value: "fitbit", label: t("onboard_wearable_fitbit"), icon: "🏃" },
                      { value: "", label: t("onboard_wearable_none"), icon: "🚫" },
                    ].map((w) => (
                      <button
                        key={w.value || "none"}
                        onClick={() => update("wearable", w.value)}
                        className={cn(
                          "w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3",
                          data.wearable === w.value
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:bg-accent"
                        )}
                      >
                        <span className="text-xl">{w.icon}</span>
                        <p className={cn("text-sm font-semibold", data.wearable === w.value ? "text-primary" : "text-foreground")}>{w.label}</p>
                        {data.wearable === w.value && <Check className="ml-auto h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{t("onboard_step_wearable_skip")}</p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Rocket className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {t("onboard_step_summary_title")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("onboard_step_summary_desc")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">{l("Idade", "Age")}</span><span className="font-semibold text-foreground">{data.age || "–"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{l("Peso", "Weight")}</span><span className="font-semibold text-foreground">{data.weight ? `${data.weight} kg` : "–"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{l("Altura", "Height")}</span><span className="font-semibold text-foreground">{data.height ? `${data.height} cm` : "–"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{l("Objetivo", "Goal")}</span><span className="font-semibold text-foreground">{data.goal || "–"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{l("Wearable", "Wearable")}</span><span className="font-semibold text-foreground">{data.wearable ? (data.wearable === "google_fit" ? t("onboard_wearable_google_fit") : data.wearable === "apple_health" ? t("onboard_wearable_apple_health") : data.wearable === "fitbit" ? t("onboard_wearable_fitbit") : t("onboard_wearable_none")) : t("onboard_wearable_none")}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{l("Lesões", "Injuries")}</span><span className="font-semibold text-foreground">{data.injuries.length ? data.injuries.map(v => injuryOptions.find(o=>o.value===v)?.label || v).join(", ") : "–"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{l("Dieta", "Diet")}</span><span className="font-semibold text-foreground">{data.dietaryRestrictions.length ? data.dietaryRestrictions.map(v => dietaryOptions.find(o=>o.value===v)?.label || v).join(", ") : "–"}</span></div>
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
              <>{l("Próximo", "Next")} <ChevronRight className="h-5 w-5 ml-2" /></>
            ) : (
              <><Rocket className="h-5 w-5 mr-2" /> {l("Gerar Meu Plano", "Generate My Plan")}</>
            )}
          </Button>

          {step > 0 && (
            <Button
              onClick={() => {
                const prev = step - 1
                setStep(prev)
                localStorage.setItem("vysefit-onboarding-step", String(prev))
              }}
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
