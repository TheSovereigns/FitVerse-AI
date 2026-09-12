"use client"
import { AuthVisual } from "@/components/app-experience"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Eye, EyeOff, Loader2, Check, ChevronRight, ChevronLeft,
  Scale, Ruler, Calendar, User, Target, Rocket, Heart, Dumbbell,
  TrendingDown, TrendingUp, Minus,
} from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const signupSchema = z.object({
  name: z.string().min(1, "validation_required").min(2, "validation_name_min"),
  email: z.string().min(1, "validation_required").email("validation_email_invalid"),
  password: z.string().min(1, "validation_required").min(6, "validation_password_min"),
  confirmPassword: z.string().min(1, "validation_required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "validation_password_confirm",
  path: ["confirmPassword"],
})

type SignupErrors = { name?: string; email?: string; password?: string; confirmPassword?: string }

type Phase = "form" | "profile" | "generating" | "done"
type ProfileStep = "gender" | "age" | "weight" | "height" | "goal"

export default function SignupPage() {
  const router = useRouter()
  const { signUp, signInWithGoogle } = useAuth()
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const [phase, setPhase] = useState<Phase>("form")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<SignupErrors>({})

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [profileStep, setProfileStep] = useState<ProfileStep>("gender")
  const [gender, setGender] = useState("")
  const [age, setAge] = useState("25")
  const [weight, setWeight] = useState("70")
  const [height, setHeight] = useState("170")
  const [goal, setGoal] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const profileSteps: ProfileStep[] = ["gender", "age", "weight", "height", "goal"]
  const profileIndex = profileSteps.indexOf(profileStep)
  const profileProgress = ((profileIndex + 1) / profileSteps.length) * 100

  const validate = (values: { name: string; email: string; password: string; confirmPassword: string }): SignupErrors => {
    const result = signupSchema.safeParse(values)
    if (result.success) return {}
    const errors: SignupErrors = {}
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof SignupErrors
      if (key && !errors[key]) {
        errors[key] = t(issue.message as any)
      }
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const errors = validate({ name, email, password, confirmPassword })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (!acceptTerms) {
      setError(isEnglish ? "You must accept the terms of use" : "Você deve aceitar os termos de uso")
      return
    }

    setIsLoading(true)
    const { error } = await signUp(email, password, name)

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      toast.success(
        isEnglish ? "Account created!" : "Conta criada!",
        { description: isEnglish ? "Now let's set up your profile" : "Agora vamos configurar seu perfil", duration: 3000 }
      )
      setPhase("profile")
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(isEnglish ? "Failed to sign up with Google" : "Falha ao cadastrar com Google")
    }
  }

  const canProceedProfile = () => {
    switch (profileStep) {
      case "gender": return !!gender
      case "age": return !!age && parseInt(age) > 0
      case "weight": return !!weight && parseFloat(weight) > 0
      case "height": return !!height && parseFloat(height) > 0
      case "goal": return !!goal
      default: return false
    }
  }

  const handleProfileNext = () => {
    const idx = profileSteps.indexOf(profileStep)
    if (idx < profileSteps.length - 1) {
      setProfileStep(profileSteps[idx + 1]!)
    } else {
      saveProfileAndGeneratePlan()
    }
  }

  const handleProfileBack = () => {
    const idx = profileSteps.indexOf(profileStep)
    if (idx > 0) {
      setProfileStep(profileSteps[idx - 1]!)
    }
  }

  const saveProfileAndGeneratePlan = async () => {
    setIsSavingProfile(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

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
        .eq("id", session?.user?.id)

      setPhase("generating")

      if (token) {
        try {
          const response = await fetch("/api/generate-initial-plan", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              weight: parseFloat(weight),
              height: parseFloat(height),
              age: parseInt(age),
              gender,
              activityLevel: "moderate",
              goal,
              sleepHours: 7,
              sleepQuality: "good",
              stressLevel: "moderate",
              injuries: [],
              equipment: [],
              dietaryRestrictions: [],
              experience: "beginner",
              workoutsPerWeek: 3,
              locale,
            }),
          })
          const data = await response.json()
          if (data && !data.error) {
            localStorage.setItem("userMetabolicPlan", JSON.stringify(data))
          }
        } catch (planErr) {
          console.error("Plan generation failed:", planErr)
        }
      }

      setPhase("done")
      setTimeout(() => router.push("/app"), 2000)
    } catch (e) {
      console.error("Error saving profile:", e)
      setPhase("done")
      setTimeout(() => router.push("/app"), 1500)
    } finally {
      setIsSavingProfile(false)
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
    { value: "maintain", label: isEnglish ? "Maintain" : "Manter", icon: Minus, desc: isEnglish ? "Keep current physique" : "Manter físico atual" },
    { value: "improve_health", label: isEnglish ? "Improve Health" : "Melhorar Saúde", icon: Heart, desc: isEnglish ? "Feel better overall" : "Sentir-se melhor" },
  ]

  const renderProfileStep = () => {
    switch (profileStep) {
      case "gender":
        return (
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
              {isEnglish ? "What's your gender?" : "Qual seu gênero?"}
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
                    "flex flex-col items-center gap-2 rounded-2xl border border-white/[0.12] bg-black/30 p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                    gender === opt.value
                      ? "border-brand bg-brand/10 text-foreground shadow-[0_0_32px_rgba(52,211,153,0.12)]"
                      : "text-foreground/65 hover:bg-white/[0.06]"
                  )}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <span className="text-sm font-bold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case "age":
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-brand/30 bg-brand/15 shadow-[0_0_42px_rgba(52,211,153,0.16)]"
            >
              <Calendar className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="mb-2 text-3xl font-semibold tracking-[-0.055em] text-foreground">
              {isEnglish ? "How old are you?" : "Quantos anos você tem?"}
            </h2>
            <p className="mb-8 text-sm text-[#B9C3BA]">
              {isEnglish ? "For accurate caloric calculations" : "Para cálculos calóricos precisos"}
            </p>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="10"
              max="120"
              className="h-16 rounded-2xl border-white/[0.12] bg-black/45 text-center text-3xl font-semibold tracking-[-0.05em] text-foreground focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25"
            />
          </div>
        )

      case "weight":
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-brand/30 bg-brand/15 shadow-[0_0_42px_rgba(52,211,153,0.16)]"
            >
              <Scale className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="mb-2 text-3xl font-semibold tracking-[-0.055em] text-foreground">
              {isEnglish ? "What's your weight?" : "Qual seu peso?"}
            </h2>
            <p className="mb-8 text-sm text-[#B9C3BA]">
              {isEnglish ? "In kilograms" : "Em quilogramas"}
            </p>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="30"
              max="300"
              step="0.1"
              className="h-16 rounded-2xl border-white/[0.12] bg-black/45 text-center text-3xl font-semibold tracking-[-0.05em] text-foreground focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25"
            />
          </div>
        )

      case "height":
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-brand/30 bg-brand/15 shadow-[0_0_42px_rgba(52,211,153,0.16)]"
            >
              <Ruler className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="mb-2 text-3xl font-semibold tracking-[-0.055em] text-foreground">
              {isEnglish ? "What's your height?" : "Qual sua altura?"}
            </h2>
            <p className="mb-8 text-sm text-[#B9C3BA]">
              {isEnglish ? "In centimeters" : "Em centímetros"}
            </p>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min="100"
              max="250"
              step="0.1"
              className="h-16 rounded-2xl border-white/[0.12] bg-black/45 text-center text-3xl font-semibold tracking-[-0.05em] text-foreground focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25"
            />
          </div>
        )

      case "goal":
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-brand/30 bg-brand/15 shadow-[0_0_42px_rgba(52,211,153,0.16)]"
            >
              <Target className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="mb-2 text-3xl font-semibold tracking-[-0.055em] text-foreground">
              {isEnglish ? "What's your goal?" : "Qual seu objetivo?"}
            </h2>
            <p className="mb-8 text-sm text-[#B9C3BA]">
              {isEnglish ? "We'll build your plan around this" : "Vamos construir seu plano com base nisso"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {goalOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    onClick={() => setGoal(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border border-white/[0.12] bg-black/30 p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                      goal === opt.value
                        ? "border-brand bg-brand/10 text-foreground shadow-[0_0_32px_rgba(52,211,153,0.12)]"
                        : "text-foreground/65 hover:bg-white/[0.06]"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-bold">{opt.label}</span>
                    <span className="text-[10px] text-[#B9C3BA]">{opt.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="product-experience auth-experience min-h-screen flex bg-[#070A08] text-[#F5F7F4]">
      <AuthVisual signup />
      <div className="relative w-full lg:w-1/2 flex items-center justify-center overflow-hidden bg-[#070A08] p-6 md:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(110,255,141,0.12),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:auto,26px_26px] opacity-70" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-[#6BFF8E]/30 bg-[#101713] shadow-[0_0_32px_rgba(107,255,142,0.13)]">
                <img src="/icon.svg" alt="VyseFit" className="w-6 h-6" />
              </div>
              <span className="text-2xl font-semibold tracking-[-0.06em] text-foreground">VyseFit AI</span>
            </Link>
          </div>

          {/* Card */}
          <div className="rounded-[2rem] border border-white/[0.12] bg-[#0E1411]/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl md:p-8">
            <AnimatePresence mode="wait">

              {/* ═══════ PHASE: SIGNUP FORM ═══════ */}
              {phase === "form" && (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>
                  <div className="text-center mb-6">
                    <h1 className="mb-2 text-3xl font-semibold tracking-[-0.055em] text-foreground">
                      {isEnglish ? "Create Account" : "Criar Conta"}
                    </h1>
                    <p className="text-sm leading-6 text-[#B9C3BA]">
                      {isEnglish ? "Start your free account today" : "Comece sua conta grátis hoje"}
                    </p>
                  </div>

                  {error && (
                    <div role="alert" aria-live="assertive" className="mb-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-[#DEE5DF]">
                        {isEnglish ? "Full Name" : "Nome Completo"}
                      </Label>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => setFieldErrors(prev => ({ ...prev, ...validate({ name, email, password, confirmPassword }) }))}
                        placeholder={isEnglish ? "John Doe" : "João Silva"}
                        className={cn("h-12 rounded-2xl border-white/[0.12] bg-black/45 text-foreground placeholder:text-white/35 focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25", fieldErrors.name && "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/25")}
                        aria-invalid={!!fieldErrors.name}
                      />
                      {fieldErrors.name && (
                        <p className="mt-1.5 text-xs text-red-200" role="alert">{fieldErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-[#DEE5DF]">Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setFieldErrors(prev => ({ ...prev, ...validate({ name, email, password, confirmPassword }) }))}
                        placeholder={isEnglish ? "you@example.com" : "seu@email.com"}
                        className={cn("h-12 rounded-2xl border-white/[0.12] bg-black/45 text-foreground placeholder:text-white/35 focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25", fieldErrors.email && "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/25")}
                        aria-invalid={!!fieldErrors.email}
                      />
                      {fieldErrors.email && (
                        <p className="mt-1.5 text-xs text-red-200" role="alert">{fieldErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-[#DEE5DF]">
                        {isEnglish ? "Password" : "Senha"}
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => setFieldErrors(prev => ({ ...prev, ...validate({ name, email, password, confirmPassword }) }))}
                          placeholder="••••••••"
                          className={cn("h-12 rounded-2xl border-white/[0.12] bg-black/45 pr-12 text-foreground placeholder:text-white/35 focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25", fieldErrors.password && "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/25")}
                          aria-invalid={!!fieldErrors.password}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? (isEnglish ? "Hide password" : "Ocultar senha") : (isEnglish ? "Show password" : "Mostrar senha")}
                          className="absolute right-0 top-0 h-full px-3 text-white/50 hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {fieldErrors.password && (
                        <p className="mt-1.5 text-xs text-red-200" role="alert">{fieldErrors.password}</p>
                      )}
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-[#DEE5DF]">
                        {isEnglish ? "Confirm Password" : "Confirmar Senha"}
                      </Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => setFieldErrors(prev => ({ ...prev, ...validate({ name, email, password, confirmPassword }) }))}
                        placeholder="••••••••"
                        className={cn("h-12 rounded-2xl border-white/[0.12] bg-black/45 text-foreground placeholder:text-white/35 focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25", fieldErrors.confirmPassword && "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/25")}
                        aria-invalid={!!fieldErrors.confirmPassword}
                      />
                      {fieldErrors.confirmPassword && (
                        <p className="mt-1.5 text-xs text-red-200" role="alert">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-black/45 text-brand focus:ring-brand/30"
                      />
                      <label className="text-xs leading-5 text-[#B9C3BA]">
                        {isEnglish ? (
                          <>I agree to the <a href="#" className="text-brand hover:text-brand/80 focus-visible:ring-2 focus-visible:ring-brand/50">Terms of Use</a> and <a href="#" className="text-brand hover:text-brand/80 focus-visible:ring-2 focus-visible:ring-brand/50">Privacy Policy</a></>
                        ) : (
                          <>Eu aceito os <a href="#" className="text-primary hover:underline">Termos de Uso</a> e a <a href="#" className="text-primary hover:underline">Política de Privacidade</a></>
                        )}
                      </label>
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-12 w-full rounded-2xl bg-brand text-base font-semibold text-brand-foreground shadow-[0_12px_34px_rgba(52,211,153,0.22)] hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1411]"
                    >
                      {isLoading ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{isEnglish ? "Creating account..." : "Criando conta..."}</>
                      ) : (
                        isEnglish ? "Create Free Account →" : "Criar minha conta grátis →"
                      )}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/[0.12]" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-[#0E1411] px-4 text-white/45">{isEnglish ? "or continue with" : "ou continue com"}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="h-12 w-full rounded-2xl border border-white/[0.14] bg-white/[0.045] text-foreground hover:bg-white/[0.09] focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {isEnglish ? "Sign up with Google" : "Cadastrar com Google"}
                  </Button>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-[#B9C3BA]">
                      {isEnglish ? "Already have an account?" : "Já tem conta?"}{" "}
                      <Link href="/auth/login" className="font-medium text-brand hover:text-brand/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                        {isEnglish ? "Sign In" : "Entrar"}
                      </Link>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ═══════ PHASE: PROFILE SETUP ═══════ */}
              {phase === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                  {/* Progress bar */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold tracking-[0.18em] text-white/45">
                      {profileIndex + 1}/{profileSteps.length}
                    </span>
                    <button
                      onClick={() => { saveProfileAndGeneratePlan() }}
                      className="text-[10px] font-semibold tracking-[0.18em] text-white/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                    >
                      {isEnglish ? "Skip" : "Pular"}
                    </button>
                  </div>
                  <div className="mb-8 h-1 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-brand shadow-[0_0_16px_rgba(52,211,153,0.7)]"
                      animate={{ width: `${profileProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Step content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={profileStep}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      className="w-full"
                    >
                      {renderProfileStep()}
                    </motion.div>
                  </AnimatePresence>

                  {/* Nav buttons */}
                  <div className="flex gap-3 mt-8">
                    {profileIndex > 0 && (
                      <Button
                        type="button"
                        onClick={handleProfileBack}
                        variant="outline"
                        className="h-12 flex-1 rounded-2xl border border-white/[0.12] bg-white/[0.045] text-foreground hover:bg-white/[0.09] focus-visible:ring-2 focus-visible:ring-brand/50"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        {isEnglish ? "Back" : "Voltar"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={handleProfileNext}
                      disabled={!canProceedProfile() || isSavingProfile}
                      className="h-12 flex-1 rounded-2xl bg-brand font-semibold text-brand-foreground shadow-[0_12px_34px_rgba(52,211,153,0.22)] hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1411] disabled:opacity-40"
                    >
                      {profileIndex === profileSteps.length - 1 ? (
                        isSavingProfile ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEnglish ? "Saving..." : "Salvando..."}</>
                        ) : (
                          <><Rocket className="w-4 h-4 mr-2" />{isEnglish ? "Generate Plan" : "Gerar Plano"}</>
                        )
                      ) : (
                        <>{isEnglish ? "Next" : "Próximo"}<ChevronRight className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ═══════ PHASE: GENERATING PLAN ═══════ */}
              {phase === "generating" && (
                <motion.div key="generating" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-brand/30 bg-brand/15 shadow-[0_0_42px_rgba(52,211,153,0.16)]"
                  >
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </motion.div>
                  <h2 className="mb-3 text-3xl font-semibold tracking-[-0.055em] text-foreground">
                    {isEnglish ? "Generating Your Plan..." : "Gerando Seu Plano..."}
                  </h2>
                  <p className="mb-6 text-sm leading-6 text-[#B9C3BA]">
                    {isEnglish
                      ? "Our AI is building your personalized workout and nutrition plan"
                      : "Nossa IA está construindo seu plano personalizado de treino e nutrição"}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs tracking-[0.12em] text-white/45">
                      {isEnglish ? "This may take a moment" : "Isso pode levar um momento"}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ═══════ PHASE: DONE ═══════ */}
              {phase === "done" && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-brand/30 bg-brand/15 shadow-[0_0_42px_rgba(52,211,153,0.16)]"
                  >
                    <Check className="h-10 w-10 text-brand" />
                  </motion.div>
                  <h2 className="mb-3 text-3xl font-semibold tracking-[-0.055em] text-foreground">
                    {isEnglish ? "You're All Set!" : "Tudo Pronto!"}
                  </h2>
                  <p className="mb-6 text-sm leading-6 text-[#B9C3BA]">
                    {isEnglish
                      ? "Redirecting you to your dashboard..."
                      : "Redirecionando para seu painel..."}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs tracking-[0.12em] text-white/45">
                      {isEnglish ? "Loading your dashboard" : "Carregando seu painel"}
                    </span>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
