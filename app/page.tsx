"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ScanDashboard } from "@/components/scan-dashboard"
import { ProductResult, type ProductAnalysis } from "@/components/product-result"
import { ScanHistory } from "@/components/scan-history"
import { UserProfile } from "@/components/user-profile"
import { MetabolicPlanner } from "@/components/metabolic-planner"
import { MetabolicDashboard } from "@/components/metabolic-dashboard"
import { HealthProfile } from "@/components/health-profile"
import { ProductSkeleton } from "@/components/product-skeleton"
import { RecipesTab } from "@/components/recipes-tab"
import { TrainingTab } from "@/components/training-tab"
import { SettingsPage } from "@/components/settings-page"
import { StoreTab } from "@/components/store-tab"
import { ChatbotTab } from "@/components/chatbot-tab"
import { ClansTab } from "@/components/clans-tab"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { ProfileSetup } from "@/components/profile-setup"
import { SleepTracker } from "@/components/sleep-tracker"
import { StressTracker } from "@/components/stress-tracker"
import { HealthCheckin } from "@/components/health-checkin"
import { SupplementRecommender } from "@/components/supplement-recommender"
import { MealPlanner } from "@/components/meal-planner"
import { DietaryRestrictions } from "@/components/dietary-restrictions"
import { MicronutrientAnalysis } from "@/components/micronutrient-analysis"
import { SmartSubstitutions } from "@/components/smart-substitutions"
import { PeriodizationEngine } from "@/components/periodization-engine"
import { WorkoutFeedback } from "@/components/workout-feedback"
import { EquipmentSelector } from "@/components/equipment-selector"
import { MobilityRoutines } from "@/components/mobility-routines"
import { LongevityScore } from "@/components/longevity-score"
import { FastingTracker } from "@/components/fasting-tracker"
import { BiologicalAge } from "@/components/biological-age"
import { MoodTracker } from "@/components/mood-tracker"
import { HabitBuilder } from "@/components/habit-builder"
import { GuidedMeditation } from "@/components/guided-meditation"
import { SeasonSystem } from "@/components/season-system"
import { BossBattles } from "@/components/boss-battles"
import { RewardShop } from "@/components/reward-shop"
import { ScanLine, User, Calculator, ChefHat, Dumbbell, Loader2, ShoppingBag, Settings, Bot, Home, ChevronUp, Shield, Users, Moon, Brain, Apple, Activity, Zap, Heart, Timer, Smile, ListChecks, Wind, Trophy, Swords, Gift, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HomeDashboard } from "@/components/home-dashboard"
import { useTranslation } from "@/lib/i18n"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { usePlanLimits } from "@/hooks/usePlanLimits"

type View = "home" | "dashboard" | "result" | "recipes" | "training" | "profile" | "planner" | "settings" | "store" | "chatbot" | "clans"
  | "sleep" | "stress" | "health-checkin" | "supplements"
  | "meal-planner" | "dietary" | "micronutrients" | "substitutions"
  | "periodization" | "workout-feedback" | "equipment" | "mobility"
  | "longevity" | "fasting" | "biological-age"
  | "mood" | "habits" | "meditation"
  | "seasons" | "boss-battles" | "reward-shop"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, profile } = useAuth()
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { plan, limits, scansToday, canScan: checkCanScan, incrementScans, isLoading: planLoading } = usePlanLimits()
  const [currentView, setCurrentView] = useState<View>("home")
  const [authTimedOut, setAuthTimedOut] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysis | null>(null)
  const [dailyActivity, setDailyActivity] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    scannedProducts: [],
    generatedDiets: [],
    generatedWorkouts: [],
  })
  const [scanHistory, setScanHistory] = useState<any[]>([
    { id: "1", name: "Whey Protein Isolate", scannedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), score: 92, image: "/placeholder.svg?height=80&width=80", status: "healthy" },
    { id: "2", name: "Barra de Cereal", scannedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), score: 45, image: "/placeholder.svg?height=80&width=80", status: "avoid" },
    { id: "3", name: "Iogurte Natural", scannedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), score: 88, image: "/placeholder.svg?height=80&width=80", status: "healthy" },
  ])
  const [userMetabolicPlanState, setUserMetabolicPlanState] = useState<any>(null)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const bottomNavInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setAuthTimedOut(true), 8000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if ((!authLoading || authTimedOut) && !user) router.push("/auth/login")
  }, [user, authLoading, authTimedOut, router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const view = params.get("view")
    if (view) setCurrentView(view as View)
  }, [])

  useEffect(() => {
    if (user) {
      const userMetaAdmin = user.user_metadata?.is_admin === true
      if (userMetaAdmin) setIsAdmin(true)
      supabase.from('profiles').select('is_admin').eq('id', user.id).single()
        .then(({ data }) => { if (data?.is_admin) setIsAdmin(true) })
    }
  }, [user])

  useEffect(() => {
    const savedActivity = localStorage.getItem("dailyActivity")
    const today = new Date().toISOString().split('T')[0]
    if (savedActivity) {
      try {
        const activity = JSON.parse(savedActivity)
        if (activity.date === today) setDailyActivity(activity)
        else {
          const fresh = { date: today, scannedProducts: [], generatedDiets: [], generatedWorkouts: [] }
          setDailyActivity(fresh)
          localStorage.setItem("dailyActivity", JSON.stringify(fresh))
        }
      } catch {}
    }
  }, [user, profile, plan])

  useEffect(() => {
    if (user && profile && !profile.profile_setup_completed) setShowProfileSetup(true)
  }, [user, profile])

  useEffect(() => {
    const saved = localStorage.getItem("userMetabolicPlan")
    if (saved) {
      try { setUserMetabolicPlanState(JSON.parse(saved)) } catch {}
    }
  }, [])

  const setUserMetabolicPlan = (plan: any, perfil?: any) => {
    const fullPlan = plan && perfil ? { ...plan, perfil } : plan
    setUserMetabolicPlanState(fullPlan)
    if (fullPlan) {
      localStorage.setItem("userMetabolicPlan", JSON.stringify(fullPlan))
    } else localStorage.removeItem("userMetabolicPlan")
  }

  const getViewTitle = () => {
    const titles: Record<string, string> = {
      home: t("view_home"), dashboard: t("view_bioscan"), recipes: t("view_recipes"),
      training: t("view_training"), profile: t("view_profile"), planner: t("view_planner"),
      settings: t("view_settings"), chatbot: t("view_chatbot"), clans: "Clans",
      sleep: isEnglish ? "Sleep" : "Sono", stress: isEnglish ? "Stress" : "Estresse",
      "health-checkin": isEnglish ? "Health Check" : "Check-in de Saude",
      supplements: isEnglish ? "Supplements" : "Suplementos",
      "meal-planner": isEnglish ? "Meal Plan" : "Plano de Refeicoes",
      dietary: isEnglish ? "Diet" : "Dieta", micronutrients: isEnglish ? "Micronutrients" : "Micronutrientes",
      substitutions: isEnglish ? "Substitutes" : "Substituicoes",
      periodization: isEnglish ? "Periodization" : "Periodizacao",
      "workout-feedback": isEnglish ? "Feedback" : "Feedback",
      equipment: isEnglish ? "Equipment" : "Equipamento", mobility: isEnglish ? "Mobility" : "Mobilidade",
      longevity: isEnglish ? "Longevity" : "Longevidade", fasting: isEnglish ? "Fasting" : "Jejum",
      "biological-age": isEnglish ? "Bio Age" : "Idade Biologica",
      mood: isEnglish ? "Mood" : "Humor", habits: isEnglish ? "Habits" : "Habitos",
      meditation: isEnglish ? "Meditation" : "Meditacao",
      seasons: isEnglish ? "Seasons" : "Temporadas",
      "boss-battles": isEnglish ? "Boss Battles" : "Batalhas",
      "reward-shop": isEnglish ? "Shop" : "Loja",
    }
    return titles[currentView] || t("view_fitverse")
  }

  const handleScan = async (fileOrUrl?: File | string): Promise<void> => {
    if (!checkCanScan()) {
      alert(t("page_limit_reached") || "Limite diario de scans atingido.")
      return
    }
    setIsAnalyzing(true)
    setCurrentView("result")
    setAnalysisResult(null)
    setScanError(null)

    let displayImage = "/placeholder.svg?height=80&width=80"
    let imageMimeType = "image/jpeg"
    const toBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
      })

    try {
      let imageData: string | undefined
      if (fileOrUrl instanceof File) {
        displayImage = URL.createObjectURL(fileOrUrl)
        imageMimeType = fileOrUrl.type || "image/jpeg"
        imageData = await toBase64(fileOrUrl)
      } else if (typeof fileOrUrl === "string") {
        displayImage = fileOrUrl
        imageData = fileOrUrl
      }
      if (!imageData) throw new Error(t("page_error_no_image"))

      let token = ''
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.includes('sb-') && key.includes('-auth-token')) {
            const storedSession = localStorage.getItem(key)
            if (storedSession) {
              const parsed = JSON.parse(storedSession)
              if (parsed?.access_token) { token = parsed.access_token; break }
            }
          }
        }
        if (!token) {
          const sessionPromise = supabase.auth.getSession()
          const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
          try {
            const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise])
            token = sessionData.session?.access_token || ''
          } catch {}
        }
      } catch (e) { console.error('Error getting token:', e) }
      if (!token) throw new Error(isEnglish ? "Please sign in again before scanning." : "Entre novamente antes de escanear.")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)
      let response
      try {
        response = await fetch('/api/analyze-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ imageData, mimeType: imageMimeType, metabolicPlan: userMetabolicPlanState, locale }),
          signal: controller.signal,
        })
      } catch (fetchError) {
        clearTimeout(timeoutId)
        const message = fetchError instanceof Error && fetchError.name === 'AbortError'
          ? (isEnglish ? "Scan took too long. Try again." : "Analise demorou. Tente novamente.")
          : (isEnglish ? "Connection error." : "Erro de conexao.")
        toast.error(message)
        setScanError(message)
        setCurrentView("result")
        setIsAnalyzing(false)
        return
      }
      clearTimeout(timeoutId)
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || t("page_error_ai_fail"))
      }
      const analysis: ProductAnalysis = await response.json()
      setDailyActivity((prev: any) => {
        const updated = { ...prev, scannedProducts: [...prev.scannedProducts, analysis] }
        localStorage.setItem("dailyActivity", JSON.stringify(updated))
        return updated
      })
      setAnalysisResult(analysis)
      setScanHistory(prev => [{ id: `${prev.length + 1}`, name: analysis.productName, scannedAt: new Date().toISOString(), score: analysis.longevityScore, image: displayImage }, ...prev])
      incrementScans()
    } catch (error) {
      const message = error instanceof Error ? error.message : t("page_error_retry")
      setScanError(message)
      toast.error(message)
      setCurrentView("result")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleNavScan = () => bottomNavInputRef.current?.click()
  const handleBottomNavFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleScan(file)
  }

  const isFeatureLocked = (feature: string): boolean => {
    if (plan === "premium") return false
    if (plan === "pro") {
      const proFeatures = ["sleep", "stress", "health-checkin", "meal-planner", "dietary", "smart-substitutions",
        "periodization", "workout-feedback", "mobility", "fasting", "mood", "seasons", "boss-battles"]
      return !proFeatures.includes(feature)
    }
    const freeFeatures = ["longevity", "habits", "workout-feedback", "seasons"]
    return !freeFeatures.includes(feature)
  }

  if (authLoading && !authTimedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const mainNavItems: { view: View; icon: any; label: string }[] = [
    { view: "home", icon: Home, label: t("nav_home") },
    { view: "dashboard", icon: ScanLine, label: t("nav_bioscan") },
    { view: "training", icon: Dumbbell, label: t("nav_workouts") },
    { view: "planner", icon: Calculator, label: t("nav_diet") },
    { view: "recipes", icon: ChefHat, label: t("nav_recipes") },
  ]

  const healthFeatures: { view: View; icon: any; label: string; feature: string }[] = [
    { view: "sleep", icon: Moon, label: isEnglish ? "Sleep" : "Sono", feature: "sleep" },
    { view: "stress", icon: Brain, label: isEnglish ? "Stress" : "Estresse", feature: "stress" },
    { view: "health-checkin", icon: Activity, label: isEnglish ? "Check-in" : "Check-in", feature: "health-checkin" },
    { view: "supplements", icon: Apple, label: isEnglish ? "Supplements" : "Suplementos", feature: "supplements" },
  ]

  const nutritionFeatures: { view: View; icon: any; label: string; feature: string }[] = [
    { view: "meal-planner", icon: ChefHat, label: isEnglish ? "Meal Plan" : "Refeicoes", feature: "meal-planner" },
    { view: "dietary", icon: Apple, label: isEnglish ? "Diet" : "Dieta", feature: "dietary" },
    { view: "micronutrients", icon: Zap, label: isEnglish ? "Micros" : "Micros", feature: "micronutrients" },
    { view: "substitutions", icon: Zap, label: isEnglish ? "Swap" : "Troca", feature: "substitutions" },
  ]

  const trainingFeatures: { view: View; icon: any; label: string; feature: string }[] = [
    { view: "periodization", icon: Activity, label: isEnglish ? "Periodize" : "Periodizar", feature: "periodization" },
    { view: "workout-feedback", icon: Zap, label: isEnglish ? "Feedback" : "Feedback", feature: "workout-feedback" },
    { view: "equipment", icon: Dumbbell, label: isEnglish ? "Equipment" : "Equipamento", feature: "equipment" },
    { view: "mobility", icon: Wind, label: isEnglish ? "Mobility" : "Mobilidade", feature: "mobility" },
  ]

  const biohackingFeatures: { view: View; icon: any; label: string; feature: string }[] = [
    { view: "longevity", icon: Heart, label: isEnglish ? "Longevity" : "Longevidade", feature: "longevity" },
    { view: "fasting", icon: Timer, label: isEnglish ? "Fasting" : "Jejum", feature: "fasting" },
    { view: "biological-age", icon: Zap, label: isEnglish ? "Bio Age" : "Bio Idade", feature: "biological-age" },
  ]

  const mentalFeatures: { view: View; icon: any; label: string; feature: string }[] = [
    { view: "mood", icon: Smile, label: isEnglish ? "Mood" : "Humor", feature: "mood" },
    { view: "habits", icon: ListChecks, label: isEnglish ? "Habits" : "Habitos", feature: "habits" },
    { view: "meditation", icon: Wind, label: isEnglish ? "Meditate" : "Meditacao", feature: "meditation" },
  ]

  const gamificationFeatures: { view: View; icon: any; label: string; feature: string }[] = [
    { view: "seasons", icon: Trophy, label: isEnglish ? "Seasons" : "Temporadas", feature: "seasons" },
    { view: "boss-battles", icon: Swords, label: isEnglish ? "Boss" : "Batalha", feature: "boss-battles" },
    { view: "reward-shop", icon: Gift, label: isEnglish ? "Shop" : "Loja", feature: "reward-shop" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10">
      <OnboardingFlow onComplete={() => {}} />
      {showProfileSetup && <ProfileSetup onComplete={() => setShowProfileSetup(false)} />}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-16 fixed top-0 left-0 h-full bg-card z-50 border-r border-border overflow-hidden">
        <div className="p-3 flex items-center justify-center mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => (
            <button key={item.view} onClick={() => setCurrentView(item.view)}
              className={cn("flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-all", currentView === item.view ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-none">{item.label.split(' ')[0]}</span>
            </button>
          ))}

          <div className="pt-2 pb-1 px-1">
            <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{isEnglish ? "Health" : "Saude"}</span>
          </div>
          {healthFeatures.map((item) => (
            <button key={item.view} onClick={() => setCurrentView(item.view)}
              className={cn("flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-all relative", currentView === item.view ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
            >
              {isFeatureLocked(item.feature) && <Lock className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-primary/50" />}
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </button>
          ))}

          <div className="pt-2 pb-1 px-1">
            <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{isEnglish ? "Training" : "Treino"}</span>
          </div>
          {trainingFeatures.map((item) => (
            <button key={item.view} onClick={() => setCurrentView(item.view)}
              className={cn("flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-all relative", currentView === item.view ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
            >
              {isFeatureLocked(item.feature) && <Lock className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-primary/50" />}
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-2 py-3 space-y-1 border-t border-border pt-3">
          <button onClick={() => setCurrentView("profile")}
            className={cn("flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-all", currentView === "profile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-none">{t("nav_profile").split(' ')[0]}</span>
          </button>
          <button onClick={() => setCurrentView("settings")}
            className={cn("flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-all", currentView === "settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-none">{t("nav_settings").split(' ')[0]}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="md:ml-16 flex flex-col min-h-screen transition-all duration-300 max-w-[1200px] mx-auto w-full">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-4 bg-background/80 backdrop-blur-xl border-b border-border md:border-none md:bg-transparent md:backdrop-blur-none">
          <div className="md:hidden flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ScanLine className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight">{t("home_brand")}</span>
              <span className="block text-[10px] font-medium text-muted-foreground">{getViewTitle()}</span>
            </div>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1.5">
            {(isAdmin || user?.user_metadata?.is_admin) && (
              <button onClick={() => router.push("/admin-dashboard")} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                <Shield className="w-[18px] h-[18px]" />
              </button>
            )}
            <button onClick={() => setCurrentView("profile")} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <User className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-safe-nav pt-4 md:px-8 md:pb-8 lg:px-12 lg:pb-8">
          {/* Core views */}
          {currentView === "home" && <HomeDashboard userMetabolicPlan={userMetabolicPlanState} dailyActivity={dailyActivity} onNavigate={setCurrentView} />}
          {currentView === "dashboard" && <ScanDashboard onScan={handleScan} isScanning={isAnalyzing} />}
          {currentView === "result" && (
            scanError ? (
              <div className="min-h-[50vh] flex items-center justify-center">
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center">
                    <ScanLine className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{isEnglish ? "Scan failed" : "Nao foi possivel analisar"}</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">{scanError}</p>
                  </div>
                  <Button onClick={() => { setScanError(null); setCurrentView("dashboard") }} className="w-full h-11 rounded-xl">
                    {isEnglish ? "Try again" : "Tentar novamente"}
                  </Button>
                </div>
              </div>
            ) : isAnalyzing || !analysisResult ? <ProductSkeleton /> : <ProductResult result={analysisResult} onBack={() => setCurrentView("dashboard")} />
          )}
          {currentView === "recipes" && <RecipesTab />}
          {currentView === "training" && <TrainingTab />}
          {currentView === "planner" && (
            userMetabolicPlanState?.macros
              ? <div className="space-y-4">
                  <MetabolicDashboard plan={userMetabolicPlanState} perfil={userMetabolicPlanState.perfil} onBack={() => setCurrentView("home")} planLevel={limits.planDetailLevel} onUpgrade={() => router.push("/subscription")} />
                  <Button onClick={() => { setUserMetabolicPlanState(null); localStorage.removeItem("userMetabolicPlan") }} variant="ghost" className="w-full h-11 rounded-xl text-muted-foreground text-xs font-semibold">
                    {t("home_new_plan")}
                  </Button>
                </div>
              : <MetabolicPlanner onPlanCreated={setUserMetabolicPlan} />
          )}
          {currentView === "settings" && <SettingsPage onBack={() => setCurrentView("profile")} />}
          {currentView === "chatbot" && <ChatbotTab />}
          {currentView === "clans" && <ClansTab />}
          {currentView === "profile" && <div className="pt-4 md:pt-8"><HealthProfile scanHistory={scanHistory} onNavigateToSettings={() => setCurrentView("settings")} onNavigateToSubscription={() => router.push('/subscription')} /></div>}

          {/* Health features */}
          {currentView === "sleep" && <SleepTracker isLocked={isFeatureLocked("sleep")} />}
          {currentView === "stress" && <StressTracker isLocked={isFeatureLocked("stress")} />}
          {currentView === "health-checkin" && <HealthCheckin isLocked={isFeatureLocked("health-checkin")} />}
          {currentView === "supplements" && <SupplementRecommender isLocked={isFeatureLocked("supplements")} />}

          {/* Nutrition features */}
          {currentView === "meal-planner" && <MealPlanner isLocked={isFeatureLocked("meal-planner")} macros={userMetabolicPlanState?.macros} />}
          {currentView === "dietary" && <DietaryRestrictions />}
          {currentView === "micronutrients" && <MicronutrientAnalysis isLocked={isFeatureLocked("micronutrients")} />}
          {currentView === "substitutions" && <SmartSubstitutions isLocked={isFeatureLocked("substitutions")} />}

          {/* Training features */}
          {currentView === "periodization" && <PeriodizationEngine isLocked={isFeatureLocked("periodization")} />}
          {currentView === "workout-feedback" && <WorkoutFeedback isPro={plan !== "free"} />}
          {currentView === "equipment" && <EquipmentSelector />}
          {currentView === "mobility" && <MobilityRoutines isLocked={isFeatureLocked("mobility")} />}

          {/* Biohacking features */}
          {currentView === "longevity" && <LongevityScore />}
          {currentView === "fasting" && <FastingTracker isLocked={isFeatureLocked("fasting")} />}
          {currentView === "biological-age" && <BiologicalAge isLocked={isFeatureLocked("biological-age")} />}

          {/* Mental features */}
          {currentView === "mood" && <MoodTracker isLocked={isFeatureLocked("mood")} />}
          {currentView === "habits" && <HabitBuilder />}
          {currentView === "meditation" && <GuidedMeditation isLocked={isFeatureLocked("meditation")} />}

          {/* Gamification */}
          {currentView === "seasons" && <SeasonSystem />}
          {currentView === "boss-battles" && <BossBattles isLocked={isFeatureLocked("boss-battles")} />}
          {currentView === "reward-shop" && <RewardShop isLocked={isFeatureLocked("reward-shop")} />}
        </main>
      </div>

      <input type="file" ref={bottomNavInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleBottomNavFileChange} />

      {/* FAB - Scan */}
      <button onClick={handleNavScan}
        className="mobile-fab-safe fixed right-4 z-50 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
        aria-label={t("home_scan_product")}
      >
        <ScanLine className="w-6 h-6" />
      </button>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-safe md:hidden fixed left-3 right-3 z-40 mx-auto flex h-16 max-w-md items-center justify-around rounded-2xl border border-border bg-card/90 backdrop-blur-xl px-2 shadow-lg">
        {[
          { view: "home" as View, icon: Home, label: t("nav_home") },
          { view: "training" as View, icon: Dumbbell, label: t("nav_workouts") },
          { view: "recipes" as View, icon: ChefHat, label: t("nav_recipes") },
          { view: "clans" as View, icon: Users, label: t("nav_clans") },
        ].map((item) => (
          <button key={item.view} onClick={() => setCurrentView(item.view)}
            className="relative flex h-12 w-12 flex-col items-center justify-center rounded-xl p-2 transition-colors"
          >
            <item.icon className={cn("w-5 h-5 transition-colors", currentView === item.view ? "text-primary" : "text-muted-foreground")} />
            {currentView === item.view && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
          </button>
        ))}
        <button onClick={() => setCurrentView("settings")} className="relative flex h-12 w-12 flex-col items-center justify-center rounded-xl p-2">
          <Settings className={cn("w-5 h-5 transition-colors", currentView === "settings" ? "text-primary" : "text-muted-foreground")} />
          {currentView === "settings" && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
        </button>
      </nav>
    </div>
  )
}