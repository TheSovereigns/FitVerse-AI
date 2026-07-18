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
import { ScanLine, User, Calculator, ChefHat, Dumbbell, Loader2, ShoppingBag, Settings, Bot, Home, ChevronUp, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HomeDashboard } from "@/components/home-dashboard"
import { useTranslation } from "@/lib/i18n"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { usePlanLimits } from "@/hooks/usePlanLimits"

type View = "home" | "dashboard" | "result" | "recipes" | "training" | "profile" | "planner" | "settings" | "store" | "chatbot" | "clans"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, profile } = useAuth()
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { plan, scansToday, canScan: checkCanScan, incrementScans, isLoading: planLoading } = usePlanLimits()
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

  const setUserMetabolicPlan = (plan: any, perfil?: any) => {
    const fullPlan = plan && perfil ? { ...plan, perfil } : plan
    setUserMetabolicPlanState(fullPlan)
    if (fullPlan) {
      localStorage.setItem("userMetabolicPlan", JSON.stringify(fullPlan))
      if (plan?.diet) {
        setDailyActivity((prev: any) => {
          const updated = { ...prev, generatedDiets: prev.generatedDiets.some((d: any) => d.title === plan.diet.title) ? prev.generatedDiets : [...prev.generatedDiets, plan.diet] }
          localStorage.setItem("dailyActivity", JSON.stringify(updated))
          return updated
        })
      }
    } else localStorage.removeItem("userMetabolicPlan")
  }

  const getViewTitle = () => {
    switch (currentView) {
      case "home": return t("view_home")
      case "dashboard": return t("view_bioscan")
      case "recipes": return t("view_recipes")
      case "training": return t("view_training")
      case "profile": return t("view_profile")
      case "planner": return t("view_planner")
      case "settings": return t("view_settings")
      case "chatbot": return t("view_chatbot")
      default: return t("view_fitverse")
    }
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

  if (authLoading && !authTimedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const navItems: { view: View; icon: any; label: string }[] = [
    { view: "home", icon: Home, label: t("nav_home") },
    { view: "dashboard", icon: ScanLine, label: t("nav_bioscan") },
    { view: "training", icon: Dumbbell, label: t("nav_workouts") },
    { view: "planner", icon: Calculator, label: t("nav_diet") },
    { view: "recipes", icon: ChefHat, label: t("nav_recipes") },
    { view: "chatbot", icon: Bot, label: t("nav_aichat") },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10">
      <OnboardingFlow onComplete={() => {}} />
      {showProfileSetup && <ProfileSetup onComplete={() => setShowProfileSetup(false)} />}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[72px] hover:w-60 fixed top-0 left-0 h-full glass-strong z-50 transition-all duration-300 ease-out overflow-hidden group">
        <div className="p-4 flex items-center gap-3 mb-6 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <ScanLine className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold tracking-tight opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">FitVerse</span>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={cn(
                "flex items-center gap-3 w-full h-10 px-2 rounded-xl transition-all duration-200 haptic-press",
                currentView === item.view ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-2 py-3 space-y-1 border-t border-border pt-3">
          <button
            onClick={() => setCurrentView("profile")}
            className={cn("flex items-center gap-3 w-full h-10 px-2 rounded-xl transition-all duration-200 haptic-press", currentView === "profile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            <User className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t("nav_profile")}</span>
          </button>
          <button
            onClick={() => setCurrentView("settings")}
            className={cn("flex items-center gap-3 w-full h-10 px-2 rounded-xl transition-all duration-200 haptic-press", currentView === "settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t("nav_settings")}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-[72px] lg:ml-[72px] flex flex-col min-h-screen transition-all duration-300 max-w-[1400px] mx-auto w-full">
        {/* Header */}
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
              <button onClick={() => router.push("/admin-dashboard")} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all haptic-press">
                <Shield className="w-[18px] h-[18px]" />
              </button>
            )}
            <button onClick={() => setCurrentView("profile")} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all haptic-press">
              <User className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 pb-safe-nav pt-4 md:p-6 md:pb-8 lg:p-8">
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
            userMetabolicPlanState?.macros && localStorage.getItem("userMetabolicPlan") !== null
              ? <div className="space-y-4">
                  <MetabolicDashboard plan={userMetabolicPlanState} perfil={userMetabolicPlanState.perfil} onBack={() => setCurrentView("home")} />
                  <Button onClick={() => { setUserMetabolicPlanState(null); localStorage.removeItem("userMetabolicPlan") }} variant="ghost" className="w-full h-11 rounded-xl text-muted-foreground text-xs font-semibold">
                    {t("home_new_plan")}
                  </Button>
                </div>
              : <MetabolicPlanner onPlanCreated={setUserMetabolicPlan} />
          )}
          {currentView === "store" && <StoreTab />}
          {currentView === "settings" && <SettingsPage onBack={() => setCurrentView("profile")} />}
          {currentView === "chatbot" && <ChatbotTab />}
          {currentView === "clans" && <ClansTab />}
          {currentView === "profile" && <div className="pt-4 md:pt-8"><HealthProfile scanHistory={scanHistory} onNavigateToSettings={() => setCurrentView("settings")} onNavigateToSubscription={() => router.push('/subscription')} /></div>}
        </main>
      </div>

      <input type="file" ref={bottomNavInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleBottomNavFileChange} />

      {/* FAB - Scan */}
      <button
        onClick={handleNavScan}
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
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
            className="relative flex h-12 w-12 flex-col items-center justify-center rounded-xl p-2 transition-colors"
            aria-label={item.label}
          >
            <item.icon className={cn("w-5 h-5 transition-colors", currentView === item.view ? "text-primary" : "text-muted-foreground")} />
            {currentView === item.view && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
          </button>
        ))}
        <button onClick={() => setCurrentView("chatbot")} className="relative flex h-12 w-12 flex-col items-center justify-center rounded-xl p-2" aria-label="Menu">
          <div className={cn("w-5 h-5 transition-colors", currentView === "chatbot" ? "text-primary" : "text-muted-foreground")}>
            <Bot className="w-5 h-5" />
          </div>
          {currentView === "chatbot" && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
        </button>
      </nav>
    </div>
  )
}
