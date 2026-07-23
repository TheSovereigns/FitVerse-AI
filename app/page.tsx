"use client"

import { useState, useEffect, useRef, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScanLine, User, Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { supabase, findProfile } from "@/lib/supabase"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { useAppStore } from "@/stores/app-store"
import { recordAction } from "@/lib/gamification"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MobileMoreSheet } from "@/components/mobile-more-sheet"
import { FeatureErrorBoundary } from "@/components/FeatureErrorBoundary"
import { LandingPage } from "@/components/landing-page"
import { AdBanner } from "@/components/ad-banner"
import type { View, MetabolicPlan, ProductAnalysis } from "@/lib/types"

// Lazy-loaded views for code splitting
const HomeDashboard = lazy(() => import("@/components/home-dashboard").then(m => ({ default: m.HomeDashboard })))
const ScanDashboard = lazy(() => import("@/components/scan-dashboard").then(m => ({ default: m.ScanDashboard })))
const ProductResult = lazy(() => import("@/components/product-result").then(m => ({ default: m.ProductResult })))
const ProductSkeleton = lazy(() => import("@/components/product-skeleton").then(m => ({ default: m.ProductSkeleton })))
const RecipesTab = lazy(() => import("@/components/recipes-tab").then(m => ({ default: m.RecipesTab })))
const TrainingTab = lazy(() => import("@/components/training-tab").then(m => ({ default: m.TrainingTab })))
const MetabolicPlanner = lazy(() => import("@/components/metabolic-planner").then(m => ({ default: m.MetabolicPlanner })))
const MetabolicDashboard = lazy(() => import("@/components/metabolic-dashboard").then(m => ({ default: m.MetabolicDashboard })))
const SettingsPage = lazy(() => import("@/components/settings-page").then(m => ({ default: m.SettingsPage })))
const ChatbotTab = lazy(() => import("@/components/chatbot-tab").then(m => ({ default: m.ChatbotTab })))
const ClansTab = lazy(() => import("@/components/clans-tab").then(m => ({ default: m.ClansTab })))
const HealthProfile = lazy(() => import("@/components/health-profile").then(m => ({ default: m.HealthProfile })))
const OnboardingFlow = lazy(() => import("@/components/onboarding-flow").then(m => ({ default: m.OnboardingFlow })))
const SleepTracker = lazy(() => import("@/components/sleep-tracker").then(m => ({ default: m.SleepTracker })))
const StressTracker = lazy(() => import("@/components/stress-tracker").then(m => ({ default: m.StressTracker })))
const HealthCheckin = lazy(() => import("@/components/health-checkin").then(m => ({ default: m.HealthCheckin })))
const SupplementRecommender = lazy(() => import("@/components/supplement-recommender").then(m => ({ default: m.SupplementRecommender })))
const MealPlanner = lazy(() => import("@/components/meal-planner").then(m => ({ default: m.MealPlanner })))
const DietaryRestrictions = lazy(() => import("@/components/dietary-restrictions").then(m => ({ default: m.DietaryRestrictions })))
const MicronutrientAnalysis = lazy(() => import("@/components/micronutrient-analysis").then(m => ({ default: m.MicronutrientAnalysis })))
const SmartSubstitutions = lazy(() => import("@/components/smart-substitutions").then(m => ({ default: m.SmartSubstitutions })))
const PeriodizationEngine = lazy(() => import("@/components/periodization-engine").then(m => ({ default: m.PeriodizationEngine })))
const WorkoutFeedback = lazy(() => import("@/components/workout-feedback").then(m => ({ default: m.WorkoutFeedback })))
const EquipmentSelector = lazy(() => import("@/components/equipment-selector").then(m => ({ default: m.EquipmentSelector })))
const MobilityRoutines = lazy(() => import("@/components/mobility-routines").then(m => ({ default: m.MobilityRoutines })))
const LongevityScore = lazy(() => import("@/components/longevity-score").then(m => ({ default: m.LongevityScore })))
const FastingTracker = lazy(() => import("@/components/fasting-tracker").then(m => ({ default: m.FastingTracker })))
const BiologicalAge = lazy(() => import("@/components/biological-age").then(m => ({ default: m.BiologicalAge })))
const MoodTracker = lazy(() => import("@/components/mood-tracker").then(m => ({ default: m.MoodTracker })))
const HabitBuilder = lazy(() => import("@/components/habit-builder").then(m => ({ default: m.HabitBuilder })))
const GuidedMeditation = lazy(() => import("@/components/guided-meditation").then(m => ({ default: m.GuidedMeditation })))
const SeasonSystem = lazy(() => import("@/components/season-system").then(m => ({ default: m.SeasonSystem })))
const BossBattles = lazy(() => import("@/components/boss-battles").then(m => ({ default: m.BossBattles })))
const RewardShop = lazy(() => import("@/components/reward-shop").then(m => ({ default: m.RewardShop })))
const FoodDiary = lazy(() => import("@/components/food-diary").then(m => ({ default: m.FoodDiary })))
const BodyTracker = lazy(() => import("@/components/body-tracker").then(m => ({ default: m.BodyTracker })))

import { HomeSkeleton, TrainingSkeleton, RecipesSkeleton, ChatSkeleton, SettingsSkeleton, ProfileSkeleton, PlannerSkeleton } from "@/components/skeleton-loaders-views"

function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-brand animate-spin" />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, profile } = useAuth()
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { plan, limits, scansToday, canScan: checkCanScan, incrementScans, isLoading: planLoading } = usePlanLimits()

  const currentView = useAppStore(s => s.currentView)
  const setCurrentView = useAppStore(s => s.setCurrentView)
  const isAnalyzing = useAppStore(s => s.isAnalyzing)
  const setIsAnalyzing = useAppStore(s => s.setIsAnalyzing)
  const isAdmin = useAppStore(s => s.isAdmin)
  const setIsAdmin = useAppStore(s => s.setIsAdmin)
  const scanError = useAppStore(s => s.scanError)
  const setScanError = useAppStore(s => s.setScanError)
  const analysisResult = useAppStore(s => s.analysisResult)
  const setAnalysisResult = useAppStore(s => s.setAnalysisResult)
  const scannedImage = useAppStore(s => s.scannedImage)
  const setScannedImage = useAppStore(s => s.setScannedImage)
  const dailyActivity = useAppStore(s => s.dailyActivity)
  const setDailyActivity = useAppStore(s => s.setDailyActivity)
  const addScannedProduct = useAppStore(s => s.addScannedProduct)
  const scanHistory = useAppStore(s => s.scanHistory)
  const addScanHistory = useAppStore(s => s.addScanHistory)
  const userMetabolicPlan = useAppStore(s => s.userMetabolicPlan)
  const setUserMetabolicPlanStore = useAppStore(s => s.setUserMetabolicPlan)

  const [authTimedOut, setAuthTimedOut] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const [pendingScan, setPendingScan] = useState<{ analysis: ProductAnalysis; displayImage: string } | null>(null)
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
      findProfile(user.id, user.email).then((p) => { if (p?.is_admin) setIsAdmin(true) })
    }
  }, [user])

  const setUserMetabolicPlan = (plan: MetabolicPlan | null, perfil?: any) => {
    const fullPlan = plan && perfil ? { ...plan, perfil } : plan
    setUserMetabolicPlanStore(fullPlan)
  }

  const getViewTitle = () => {
    const titles: Record<string, string> = {
      home: t("view_home"), dashboard: t("view_bioscan"), recipes: t("view_recipes"),
      training: t("view_training"), profile: t("view_profile"), planner: t("view_planner"),
      settings: t("view_settings"), chatbot: t("view_chatbot"), clans: t("nav_clans"),
      sleep: t("nav_sleep"), stress: t("nav_stress"),
      "health-checkin": t("nav_health_checkin"),
      supplements: t("nav_supplements"),
      "meal-planner": t("nav_meal_plan"),
      dietary: t("nav_diet"), micronutrients: t("nav_micronutrients"),
      substitutions: t("nav_substitutions"),
      periodization: t("nav_periodization"),
      "workout-feedback": t("nav_workout_feedback"),
      equipment: t("nav_equipment"), mobility: t("nav_mobility"),
      longevity: t("nav_longevity"), fasting: t("nav_fasting"),
      "biological-age": t("nav_biological_age"),
      mood: t("nav_mood"), habits: t("nav_habits"),
      meditation: t("nav_meditation"),
      seasons: t("nav_seasons"),
      "boss-battles": t("nav_boss_battles"),
      "reward-shop": t("nav_reward_shop"),
    }
    return titles[currentView] || t("view_fitverse")
  }

  const handleScan = async (fileOrUrl?: File | string): Promise<void> => {
    if (!checkCanScan()) {
      toast.error(t("page_limit_reached"))
      return
    }
    setIsAnalyzing(true)
    setCurrentView("result")
    setAnalysisResult(null)
    setScanError(null)
    setScannedImage(null)

    let displayImage = "/placeholder.svg?height=80&width=80"
    let imageMimeType = "image/jpeg"

    const compressImage = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()
        img.onload = () => {
          let { width, height } = img
          const maxDim = 1024
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height / width) * maxDim)
              width = maxDim
            } else {
              width = Math.round((width / height) * maxDim)
              height = maxDim
            }
          }
          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.7))
        }
        img.onerror = reject
        img.src = URL.createObjectURL(file)
      })

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
        imageMimeType = "image/jpeg"
        imageData = await compressImage(fileOrUrl)
      } else if (typeof fileOrUrl === "string") {
        displayImage = fileOrUrl
        imageData = fileOrUrl
      }
      if (!imageData) throw new Error(t("page_error_no_image"))
      setScannedImage(displayImage)

      let token = ''
      try {
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
        try {
          const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise])
          token = sessionData.session?.access_token || ''
        } catch (e) { logger.error("[Page] Session promise timed out:", e) }
        if (!token) {
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
        }
      } catch (e) { logger.error("[Page] Failed to get auth token:", e) }
      if (!token) throw new Error(isEnglish ? "Please sign in again before scanning." : "Entre novamente antes de escanear.")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)
      let response
      try {
        response = await fetch('/api/analyze-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ imageData, mimeType: imageMimeType, metabolicPlan: userMetabolicPlan, locale }),
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
        const errorData = await response.json().catch((e) => { logger.error("[Page] Failed to parse error response:", e); return null })
        throw new Error(errorData?.error || t("page_error_ai_fail"))
      }
      const analysis: ProductAnalysis = await response.json()
      setAnalysisResult(analysis)
      setPendingScan({ analysis, displayImage })
    } catch (error) {
      const message = error instanceof Error ? error.message : t("page_error_retry")
      setScanError(message)
      toast.error(message)
      setCurrentView("result")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSaveScan = () => {
    if (!pendingScan) return
    const { analysis, displayImage } = pendingScan
    addScannedProduct(analysis)
    const scanId = (analysis as any).scanId || `local-${Date.now()}`
    const scannedAt = (analysis as any).scannedAt || new Date().toISOString()
    addScanHistory({ id: scanId, name: analysis.productName, scannedAt, score: analysis.longevityScore, image: displayImage })
    incrementScans()
    setPendingScan(null)

    const result = recordAction("scan")
    if (result.bossVictory) {
      toast.success(isEnglish ? `Boss defeated! +${result.bossXpEarned} XP` : `Boss derrotado! +${result.bossXpEarned} XP`)
    }
    if (result.newAchievements.length > 0) {
      toast.success(isEnglish ? `Achievement unlocked! +${result.newAchievements.length} achievements` : `Conquista desbloqueada! +${result.newAchievements.length} conquistas`)
    }
    toast.success(isEnglish ? "Scan saved!" : "Escaneamento salvo!")
  }

  const handleDiscardScan = () => {
    setPendingScan(null)
    setAnalysisResult(null)
    setCurrentView("dashboard")
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
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand/10">
      <OnboardingFlow onComplete={() => {}} />


      {/* Desktop sidebar */}
      <DesktopSidebar currentView={currentView} onNavigate={setCurrentView} isFeatureLocked={isFeatureLocked} />

      {/* Main */}
      <div className="md:ml-16 flex flex-col min-h-screen transition-all duration-300 max-w-[1200px] mx-auto w-full">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-4 bg-background/80 backdrop-blur-xl border-b border-border md:border-none md:bg-transparent md:backdrop-blur-none">
          <div className="md:hidden flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center">
              <ScanLine className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight">{t("home_brand")}</span>
              <span className="block text-[10px] text-muted-foreground">{getViewTitle()}</span>
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
          <Suspense fallback={<ViewLoader />}>
            <FeatureErrorBoundary featureName="Dashboard">
            {/* Core views */}
            {currentView === "home" && <HomeDashboard userMetabolicPlan={userMetabolicPlan} dailyActivity={dailyActivity} onNavigate={setCurrentView} />}
            {currentView === "dashboard" && <ScanDashboard onScan={handleScan} isScanning={isAnalyzing} />}
            {currentView === "result" && (
              scanError ? (
                <div className="min-h-[50vh] flex items-center justify-center">
                  <div className="w-full max-w-sm rounded-2xl glass-strong p-6 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center">
                      <ScanLine className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{isEnglish ? "Scan failed" : "Nao foi possivel analisar"}</h2>
                      <p className="mt-1.5 text-sm text-muted-foreground">{scanError}</p>
                    </div>
                    <Button onClick={() => { setScanError(null); setCurrentView("dashboard") }} className="w-full h-11 rounded-xl bg-brand text-white hover:bg-brand/90">
                      {isEnglish ? "Try again" : "Tentar novamente"}
                    </Button>
                  </div>
                </div>
              ) : isAnalyzing || !analysisResult ? <ProductSkeleton /> : <ProductResult result={analysisResult} onBack={() => setCurrentView("dashboard")} imageData={scannedImage || undefined} onSave={handleSaveScan} onDiscard={handleDiscardScan} hasPendingSave={!!pendingScan} />
            )}
            {currentView === "recipes" && <RecipesTab />}
            {currentView === "training" && <TrainingTab />}
            {currentView === "planner" && (
              userMetabolicPlan?.macros
                ? <div className="space-y-4">
                    <MetabolicDashboard plan={userMetabolicPlan as any} perfil={(userMetabolicPlan.perfil || {}) as any} onBack={() => setCurrentView("home")} planLevel={limits.planDetailLevel} onUpgrade={() => router.push("/subscription")} />
                    <Button onClick={() => setUserMetabolicPlan(null)} variant="ghost" className="w-full h-11 rounded-xl text-muted-foreground text-xs font-semibold">
                      {t("home_new_plan")}
                    </Button>
                  </div>
                : <MetabolicPlanner onPlanCreated={setUserMetabolicPlan as any} />
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
            {currentView === "meal-planner" && <MealPlanner isLocked={isFeatureLocked("meal-planner")} macros={userMetabolicPlan?.macros} />}
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
            {currentView === "food-diary" && <FoodDiary onBack={() => setCurrentView("home")} />}
            {currentView === "body" && <BodyTracker />}
            </FeatureErrorBoundary>
          </Suspense>
        </main>
      </div>

      <input type="file" ref={bottomNavInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleBottomNavFileChange} />

      {/* FAB - Scan */}
      <button onClick={handleNavScan}
        className="mobile-fab-safe fixed right-4 z-50 h-14 w-14 rounded-2xl bg-brand text-white shadow-xl shadow-brand/30 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
        aria-label={t("home_scan_product")}
      >
        <ScanLine className="w-6 h-6" />
      </button>

      {/* Mobile bottom nav */}
      <AdBanner position="bottom" />
      <MobileBottomNav currentView={currentView} onNavigate={setCurrentView} onOpenMore={() => setMoreSheetOpen(true)} />
      <MobileMoreSheet open={moreSheetOpen} onClose={() => setMoreSheetOpen(false)} onNavigate={setCurrentView} isFeatureLocked={isFeatureLocked} />

      {/* Save/Discard Scan Modal */}
      {pendingScan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDiscardScan} />
          <div className="relative w-full max-w-sm rounded-3xl glass-strong border border-border p-8 text-center space-y-6 animate-scale-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-brand/10 flex items-center justify-center">
              <ScanLine className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground mb-1">
                {isEnglish ? "Save scan?" : "Salvar escaneamento?"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {pendingScan.analysis.productName}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10">
                <span className="text-sm font-bold text-brand">{pendingScan.analysis.longevityScore}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDiscardScan}
                variant="ghost"
                className="flex-1 h-12 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted font-semibold text-sm"
              >
                {isEnglish ? "Discard" : "Descartar"}
              </Button>
              <Button
                onClick={handleSaveScan}
                className="flex-1 h-12 rounded-xl bg-brand text-white hover:bg-brand/90 font-semibold text-sm"
              >
                {isEnglish ? "Save" : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}