"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Eye, EyeOff, Loader2, Sparkles, Check, ChevronRight, ChevronLeft,
  Scale, Ruler, Calendar, User, Target, Rocket, Heart, Dumbbell,
  TrendingDown, TrendingUp, Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Phase = "form" | "profile" | "generating" | "done"
type ProfileStep = "gender" | "age" | "weight" | "height" | "goal"

export default function SignupPage() {
  const router = useRouter()
  const { signUp, signInWithGoogle } = useAuth()
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const [phase, setPhase] = useState<Phase>("form")
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(isEnglish ? "Passwords do not match" : "As senhas não coincidem")
      return
    }
    if (password.length < 8) {
      setError(isEnglish ? "Password must be at least 8 characters" : "A senha deve ter pelo menos 8 caracteres")
      return
    }
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
      setProfileStep(profileSteps[idx + 1])
    } else {
      saveProfileAndGeneratePlan()
    }
  }

  const handleProfileBack = () => {
    const idx = profileSteps.indexOf(profileStep)
    if (idx > 0) {
      setProfileStep(profileSteps[idx - 1])
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
      setTimeout(() => router.push("/"), 2000)
    } catch (e) {
      console.error("Error saving profile:", e)
      setPhase("done")
      setTimeout(() => router.push("/"), 1500)
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
            <h2 className="text-2xl font-black text-white mb-2">
              {isEnglish ? "What's your gender?" : "Qual seu gênero?"}
            </h2>
            <p className="text-sm text-white/40 mb-8">
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
                      ? "border-primary bg-primary/10 text-white"
                      : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
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
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6"
            >
              <Calendar className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-black text-white mb-2">
              {isEnglish ? "How old are you?" : "Quantos anos você tem?"}
            </h2>
            <p className="text-sm text-white/40 mb-8">
              {isEnglish ? "For accurate caloric calculations" : "Para cálculos calóricos precisos"}
            </p>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="10"
              max="120"
              className="h-16 text-center text-3xl font-black bg-white/5 border-white/10 text-white rounded-2xl"
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
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-6"
            >
              <Scale className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-black text-white mb-2">
              {isEnglish ? "What's your weight?" : "Qual seu peso?"}
            </h2>
            <p className="text-sm text-white/40 mb-8">
              {isEnglish ? "In kilograms" : "Em quilogramas"}
            </p>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="30"
              max="300"
              step="0.1"
              className="h-16 text-center text-3xl font-black bg-white/5 border-white/10 text-white rounded-2xl"
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
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6"
            >
              <Ruler className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-black text-white mb-2">
              {isEnglish ? "What's your height?" : "Qual sua altura?"}
            </h2>
            <p className="text-sm text-white/40 mb-8">
              {isEnglish ? "In centimeters" : "Em centímetros"}
            </p>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min="100"
              max="250"
              step="0.1"
              className="h-16 text-center text-3xl font-black bg-white/5 border-white/10 text-white rounded-2xl"
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
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-yellow-500 flex items-center justify-center mx-auto mb-6"
            >
              <Target className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-black text-white mb-2">
              {isEnglish ? "What's your goal?" : "Qual seu objetivo?"}
            </h2>
            <p className="text-sm text-white/40 mb-8">
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
                      "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                      goal === opt.value
                        ? "border-primary bg-primary/10 text-white"
                        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-bold">{opt.label}</span>
                    <span className="text-[10px] text-white/30">{opt.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] flex">
      {/* Left side - Visual (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-purple-500/20" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-24 h-24 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-8 mx-auto shadow-[0_0_60px_rgba(255,140,0,0.3)]">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
              {isEnglish ? "Start Your Journey" : "Comece Sua Jornada"}
            </h2>
            <p className="text-lg text-white/60 max-w-md">
              {isEnglish
                ? "Join thousands of people transforming their lives with FitVerse AI"
                : "Junte-se a milhares de pessoas transformando suas vidas com FitVerse AI"}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form / Profile / Generating */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="text-2xl font-black text-white">FitVerse AI</span>
            </Link>
          </div>

          {/* Card */}
          <div className="glass-strong border border-white/10 rounded-3xl p-6 md:p-8">
            <AnimatePresence mode="wait">

              {/* ═══════ PHASE: SIGNUP FORM ═══════ */}
              {phase === "form" && (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-black text-white mb-2">
                      {isEnglish ? "Create Account" : "Criar Conta"}
                    </h1>
                    <p className="text-sm text-white/40">
                      {isEnglish ? "Start your free account today" : "Comece sua conta grátis hoje"}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-2 block">
                        {isEnglish ? "Full Name" : "Nome Completo"}
                      </Label>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={isEnglish ? "John Doe" : "João Silva"}
                        required
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/20 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-2 block">Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={isEnglish ? "you@example.com" : "seu@email.com"}
                        required
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/20 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-2 block">
                        {isEnglish ? "Password" : "Senha"}
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/20 rounded-xl pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 top-0 h-full px-3 text-white/40 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-2 block">
                        {isEnglish ? "Confirm Password" : "Confirmar Senha"}
                      </Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/20 rounded-xl"
                      />
                    </div>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/20"
                      />
                      <label className="text-xs text-white/50">
                        {isEnglish ? (
                          <>I agree to the <a href="#" className="text-primary hover:underline">Terms of Use</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a></>
                        ) : (
                          <>Eu aceito os <a href="#" className="text-primary hover:underline">Termos de Uso</a> e a <a href="#" className="text-primary hover:underline">Política de Privacidade</a></>
                        )}
                      </label>
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-base font-black bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:shadow-[0_10px_30px_rgba(255,140,0,0.3)] hover:scale-[1.02] active:scale-[0.98]"
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
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-[#0d0705] px-4 text-white/30">{isEnglish ? "or continue with" : "ou continue com"}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="w-full h-12 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl transition-all"
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
                    <p className="text-sm text-white/40">
                      {isEnglish ? "Already have an account?" : "Já tem conta?"}{" "}
                      <Link href="/auth/login" className="text-primary hover:underline font-medium">
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                      {profileIndex + 1}/{profileSteps.length}
                    </span>
                    <button
                      onClick={() => { saveProfileAndGeneratePlan() }}
                      className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/50"
                    >
                      {isEnglish ? "Skip" : "Pular"}
                    </button>
                  </div>
                  <div className="h-1 bg-white/15 rounded-full overflow-hidden mb-8">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
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
                        className="flex-1 h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        {isEnglish ? "Back" : "Voltar"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={handleProfileNext}
                      disabled={!canProceedProfile() || isSavingProfile}
                      className="flex-1 h-12 font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:shadow-[0_10px_30px_rgba(255,140,0,0.3)] disabled:opacity-40"
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
                    className="w-20 h-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6"
                  >
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-white mb-3">
                    {isEnglish ? "Generating Your Plan..." : "Gerando Seu Plano..."}
                  </h2>
                  <p className="text-sm text-white/60 mb-6">
                    {isEnglish
                      ? "Our AI is building your personalized workout and nutrition plan"
                      : "Nossa IA está construindo seu plano personalizado de treino e nutrição"}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-white/40 uppercase tracking-wider">
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
                    className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
                  >
                    <Check className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-white mb-3">
                    {isEnglish ? "You're All Set!" : "Tudo Pronto!"}
                  </h2>
                  <p className="text-sm text-white/60 mb-6">
                    {isEnglish
                      ? "Redirecting you to your dashboard..."
                      : "Redirecionando para seu painel..."}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-white/40 uppercase tracking-wider">
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
