"use client"

// FitVerse AI - Main Dashboard
// Auth-protected dashboard with BioScan, training, diet, and more

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { loadStripe } from "@stripe/stripe-js"
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
import { MealPlate } from "@/components/meal-plate"
import { ScanLine, User, Calculator, ChefHat, Dumbbell, Loader2, ShoppingBag, Settings, Bot, Home, ChevronUp, Shield, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HomeDashboard } from "@/components/home-dashboard"
import { DynamicIsland, type IslandState } from "@/components/dynamic-island"
import { LiquidLaunchpad } from "@/components/liquid-launchpad"
import { useTranslation } from "@/lib/i18n"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { usePlanLimits } from "@/hooks/usePlanLimits"

type View = "home" | "dashboard" | "result" | "recipes" | "training" | "profile" | "planner" | "settings" | "store" | "chatbot" | "plate"

// Inicialize o Stripe fora do componente para evitar recriação
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, profile } = useAuth()
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { plan, scansToday, canScan: checkCanScan, incrementScans, isLoading: planLoading } = usePlanLimits()
  const [currentView, setCurrentView] = useState<View>("home")
  const [islandState, setIslandState] = useState<IslandState>("idle")
  const [isDocked, setIsDocked] = useState(false)
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [authTimedOut, setAuthTimedOut] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysis | null>(null)
  const [dailyActivity, setDailyActivity] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    scannedProducts: [],
    generatedDiets: [],
    generatedWorkouts: [],
  })
  const [scanHistory, setScanHistory] = useState<any[]>([
    {
      id: "1",
      name: "Whey Protein Isolate",
      scannedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      score: 92,
      image: "/placeholder.svg?height=80&width=80",
      status: "healthy",
    },
    {
      id: "2",
      name: "Barra de Cereal",
      scannedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      score: 45,
      image: "/placeholder.svg?height=80&width=80",
      status: "avoid",
    },
    {
      id: "3",
      name: "Iogurte Natural",
      scannedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      score: 88,
      image: "/placeholder.svg?height=80&width=80",
      status: "healthy",
    },
  ])
  const [userMetabolicPlanState, setUserMetabolicPlanState] = useState<any>(null)
  const [loadingStripe, setLoadingStripe] = useState(false)
  const bottomNavInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthTimedOut(true)
    }, 8000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if ((!authLoading || authTimedOut) && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, authTimedOut, router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const view = params.get("view")
    if (view) {
      setCurrentView(view as View)
    }
  }, [])

  // Check admin status - don't block on this
  useEffect(() => {
    if (user) {
      const userMetaAdmin = user.user_metadata?.is_admin === true
      if (userMetaAdmin) {
        setIsAdmin(true)
      }
      supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.is_admin) {
            setIsAdmin(true)
          }
        })
    }
  }, [user])

  // Handle view from URL params
  useEffect(() => {
    const handleRouteChange = () => {
      const params = new URLSearchParams(window.location.search)
      const view = params.get("view")
      if (view) {
        setCurrentView(view as View)
      }
    }
    window.addEventListener("popstate", handleRouteChange)
    const origPush = window.history.pushState
    window.history.pushState = function(...args) {
      origPush.apply(window.history, args)
      handleRouteChange()
    }
    return () => {
      window.removeEventListener("popstate", handleRouteChange)
      window.history.pushState = origPush
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsDocked(window.scrollY > 80)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const savedActivity = localStorage.getItem("dailyActivity")
    const today = new Date().toISOString().split('T')[0]
    if (savedActivity) {
      try {
        const activity = JSON.parse(savedActivity)
        if (activity.date === today) {
          setDailyActivity(activity)
        } else {
          const newDailyActivity = { date: today, scannedProducts: [], generatedDiets: [], generatedWorkouts: [] }
          setDailyActivity(newDailyActivity)
          localStorage.setItem("dailyActivity", JSON.stringify(newDailyActivity))
        }
      } catch {
        console.error(t("page_error_load_activity"))
      }
    }

    if (user) {
      // Check admin from profile (this is stable)
      supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setIsAdmin(data.is_admin === true)
          }
        })
    }
  }, [user, profile, plan])

  const setUserMetabolicPlan = (plan: any, perfil?: any) => {
    const fullPlan = plan && perfil ? { ...plan, perfil } : plan
    setUserMetabolicPlanState(fullPlan)
    if (fullPlan) {
      localStorage.setItem("userMetabolicPlan", JSON.stringify(fullPlan))
      if (plan?.diet) {
        setDailyActivity((prev: any) => {
          const updatedActivity = {
            ...prev,
            generatedDiets: prev.generatedDiets.some((d: any) => d.title === plan.diet.title)
              ? prev.generatedDiets
              : [...prev.generatedDiets, plan.diet]
          }
          localStorage.setItem("dailyActivity", JSON.stringify(updatedActivity))
          return updatedActivity
        })
      }
    } else {
      localStorage.removeItem("userMetabolicPlan")
    }
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

  const handleCheckout = async (priceId: string) => {
    setLoadingStripe(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(t("page_error_checkout"))
        } catch {
          throw new Error(t("page_error_payment"))
        }
      }

      const data = await response.json()
      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
        if (error) console.error(error)
      }
    } catch (error) {
      console.error("Erro no checkout:", error)
      alert(t("page_error_stripe_keys"))
    } finally {
      setLoadingStripe(false)
    }
  }

  const handleScan = async (fileOrUrl?: File | string): Promise<void> => {
    if (!checkCanScan()) {
      setIslandState("error")
      setTimeout(() => setIslandState("idle"), 3000)
      alert(t("page_limit_reached") || "Limite diário de scans atingido. Atualize para um plano superior!")
      return
    }

    setIsAnalyzing(true)
    setIslandState("scanning")
    setCurrentView("result")
    setAnalysisResult(null)

    let displayImage = "/placeholder.svg?height=80&width=80"

    const toBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
      })

    try {
      console.log('DEBUG: entering try block');
      let imageData: string | undefined

      if (fileOrUrl instanceof File) {
        console.log('DEBUG: before toBase64');
        displayImage = URL.createObjectURL(fileOrUrl)
        imageData = await toBase64(fileOrUrl)
        console.log('DEBUG: after toBase64, length:', imageData?.length);
      } else if (typeof fileOrUrl === "string") {
        displayImage = fileOrUrl
        imageData = fileOrUrl
      }

      if (!imageData) {
        throw new Error(t("page_error_no_image"))
      }

      console.log('DEBUG: getting session...');
      
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 10000)
      )
      
      let sessionData
      try {
        sessionData = await Promise.race([sessionPromise, timeoutPromise])
      } catch (sessionError) {
        console.error('Session error:', sessionError)
        // Continue without token - let the API handle auth
        sessionData = { data: { session: null }, error: null }
      }
      
      console.log('DEBUG: session result:', { hasToken: !!sessionData?.data?.session?.access_token, error: sessionData?.error?.message });
      const token = sessionData?.data?.session?.access_token || ''

      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 15000)

      let response
      try {
        console.log('DEBUG: before fetch');
        response = await fetch('/api/analyze-product', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            imageData: imageData,
            metabolicPlan: userMetabolicPlanState,
            locale,
          }),
          signal: controller.signal,
        })
        console.log('DEBUG: after fetch');
      } catch (fetchError) {
        console.log('DEBUG: fetch error:', fetchError);
        clearTimeout(timeoutId)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          toast.error(isEnglish ? "Request timed out. Please try again." : "Tempo limite excedido. Tente novamente.")
        } else {
          toast.error(isEnglish ? "Connection error. Please check your internet." : "Erro de conexão. Verifique sua internet.")
        }
        setIslandState("error")
        setTimeout(() => setIslandState("idle"), 3000)
        setCurrentView("dashboard")
        setIsAnalyzing(false)
        return
      }
      clearTimeout(timeoutId)

      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || t("page_error_ai_fail"))
        } catch {
          throw new Error(t("page_error_ai_server"))
        }
      }

      const analysis: ProductAnalysis = await response.json()

      setDailyActivity((prev: any) => {
        const updatedActivity = {
          ...prev,
          scannedProducts: [...prev.scannedProducts, analysis]
        }
        localStorage.setItem("dailyActivity", JSON.stringify(updatedActivity))
        return updatedActivity
      })

      setAnalysisResult(analysis)
      setIslandState("success")
      setTimeout(() => setIslandState("idle"), 2000)
      setScanHistory(prev => [
        {
          id: `${prev.length + 1}`,
          name: analysis.productName,
          scannedAt: new Date().toISOString(),
          score: analysis.longevityScore,
          image: displayImage,
        },
        ...prev
      ])
      incrementScans()
    } catch (error) {
      console.error("Erro durante a análise:", error)
      setIslandState("error")
      setTimeout(() => setIslandState("idle"), 3000)
      toast.error(error instanceof Error ? error.message : t("page_error_retry"))
      setCurrentView("dashboard")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleNavScan = () => {
    bottomNavInputRef.current?.click()
  }

  const handleBottomNavFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleScan(file)
    }
  }

  const currentAnalysis = analysisResult

  if (authLoading && !authTimedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className={cn(
      "min-h-screen bg-transparent text-gray-900 dark:text-white font-sans selection:bg-primary/30 flex transition-all duration-700",
      isDocked ? "pt-2" : "pt-0"
    )}>
      <DynamicIsland 
        state={islandState} 
        onNavigate={setCurrentView} 
        isDocked={isDocked} 
        title={getViewTitle()} 
      />

      <LiquidLaunchpad 
        isOpen={isMenuExpanded} 
        onClose={() => setIsMenuExpanded(false)} 
        onNavigate={setCurrentView} 
        currentView={currentView}
      />

      {/* Floating Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-20 lg:w-24 hover:w-64 lg:hover:w-72 fixed top-1/2 -translate-y-1/2 left-4 lg:left-6 glass-strong border-white/20 z-50 rounded-[2rem] lg:rounded-[3rem] transition-all duration-700 ease-in-out group overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.3)]">
        <div className="p-4 lg:p-6 flex items-center justify-start gap-3 font-black text-xl tracking-tighter text-foreground mb-6 lg:mb-8 overflow-hidden">
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <ScanLine className="text-primary size-5 lg:size-6" />
          </div>
            <span className="sidebar-brand-label text-sm lg:text-base">{t("home_brand")}</span>
        </div>

        <nav className="flex-1 px-1 lg:px-2 space-y-1 lg:space-y-2 flex flex-col">
          <NavButton icon={Home} label={t("nav_home")} active={currentView === "home"} onClick={() => setCurrentView("home")} />
          <NavButton icon={ScanLine} label={t("nav_bioscan")} active={currentView === "dashboard"} onClick={() => setCurrentView("dashboard")} />
          <NavButton icon={Dumbbell} label={t("nav_workouts")} active={currentView === "training"} onClick={() => setCurrentView("training")} />
          <NavButton icon={Calculator} label={t("nav_diet")} active={currentView === "planner"} onClick={() => setCurrentView("planner")} />
          <NavButton icon={ChefHat} label={t("nav_recipes")} active={currentView === "recipes"} onClick={() => setCurrentView("recipes")} />
          <NavButton icon={ShoppingBag} label={t("nav_store")} active={currentView === "store"} onClick={() => setCurrentView("store")} />
          <NavButton icon={Bot} label={t("nav_aichat")} active={currentView === "chatbot"} onClick={() => setCurrentView("chatbot")} />
          <NavButton icon={Utensils} label={t("nav_plate")} active={currentView === "plate"} onClick={() => setCurrentView("plate")} />
        </nav>

        <div className="p-2 lg:p-3 mb-3 lg:mb-4 space-y-2 border-t border-white/10 pt-4 flex flex-col items-center">
          <NavButton icon={User} label={t("nav_profile")} active={currentView === "profile"} onClick={() => setCurrentView("profile")} />
          <NavButton icon={Settings} label={t("nav_settings")} active={currentView === "settings"} onClick={() => setCurrentView("settings")} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-24 lg:pl-32 xl:pl-36 flex flex-col min-h-screen relative transition-all duration-500 max-w-[1600px] xl:max-w-[1800px] mx-auto w-full">
        {/* Header - Visible on all screens */}
        <header className="sticky top-0 z-40 bg-transparent px-4 md:px-6 h-14 md:h-16 lg:h-14 flex items-center justify-between">
          <div className="md:hidden font-black text-2xl flex items-center gap-2 text-foreground">
            <ScanLine className="text-primary size-7" />
            <span>{t("home_brand")}</span>
          </div>
          <div className="hidden md:block">
             {/* Large title or scroll transition space */}
          </div>
            <div className="flex items-center gap-4 md:gap-6">
              {(isAdmin || user?.user_metadata?.is_admin) && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => router.push("/admin-dashboard")} 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl hover:bg-white/10 active:scale-90 haptic-press transition-all font-sans text-foreground/60 hover:text-foreground"
                  aria-label={t("home_access_admin")}
                >
                  <Shield className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
              )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCurrentView("profile")}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl hover:bg-white/10 active:scale-90 haptic-press transition-all font-sans text-foreground/60 hover:text-foreground"
              aria-label={t("home_view_profile")}
            >
              <User className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 xl:p-12 overflow-y-auto pb-24 md:pb-8">
          {currentView === "home" && <HomeDashboard userMetabolicPlan={userMetabolicPlanState} dailyActivity={dailyActivity} onNavigate={setCurrentView} />}
          {currentView === "dashboard" && <ScanDashboard onScan={handleScan} />}
          {currentView === "result" && (isAnalyzing || !currentAnalysis ? <ProductSkeleton /> : <ProductResult result={currentAnalysis} onBack={() => setCurrentView("dashboard")} />)}
          {currentView === "recipes" && <RecipesTab />}
          {currentView === "training" && <TrainingTab />}
          {currentView === "planner" && (
            userMetabolicPlanState && userMetabolicPlanState.macros && localStorage.getItem("userMetabolicPlan") !== null
              ? <div className="space-y-4">
                  <MetabolicDashboard 
                    plan={userMetabolicPlanState} 
                    perfil={userMetabolicPlanState.perfil} 
                    onBack={() => setCurrentView("home")} 
                  />
                  <Button 
                    onClick={() => {
                      setUserMetabolicPlanState(null);
                      localStorage.removeItem("userMetabolicPlan");
                    }}
                    className="w-full h-12 glass-strong border border-white/20 text-muted-foreground font-black text-xs uppercase tracking-widest rounded-full"
                  >
                    {t("home_new_plan")}
                  </Button>
                </div>
              : <MetabolicPlanner onPlanCreated={setUserMetabolicPlan} />
          )}
          {currentView === "store" && <StoreTab />}
          {currentView === "settings" && <SettingsPage onBack={() => setCurrentView("profile")} />}
          {currentView === "chatbot" && <ChatbotTab />}
          {currentView === "plate" && <MealPlate onBack={() => setCurrentView("home")} />}
          {currentView === "profile" && (<div className="pt-4 md:pt-8 lg:pt-12"><HealthProfile scanHistory={scanHistory} onNavigateToSettings={() => setCurrentView("settings")} onNavigateToSubscription={() => router.push('/subscription')} /></div>)}
        </main>
      </div>

      <input
        type="file"
        ref={bottomNavInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleBottomNavFileChange}
      />

      {/* Floating Action Button */}
      <Button 
        onClick={handleNavScan} 
        className="fixed bottom-28 right-8 md:bottom-10 md:right-10 xl:bottom-12 xl:right-12 z-50 h-16 w-16 md:h-16 md:w-16 lg:h-14 lg:w-14 rounded-full glass-strong bg-primary text-white shadow-2xl transition-all duration-500 hover:scale-110 active:scale-75 border border-white/30"
          aria-label={t("home_scan_product")}
      >
        <ScanLine className="h-8 w-8 md:h-10 md:w-10 text-white" />
      </Button>

      {/* Mobile Bottom Nav - Opens menu on swipe up */}
      <motion.nav
        id="mobile-bottom-nav"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y < -30) setIsMenuExpanded(true)
        }}
        className="md:hidden fixed bottom-6 left-4 right-4 glass-strong rounded-[2rem] z-40 shadow-2xl border border-white/20 h-16 px-2 flex items-center justify-around max-w-md mx-auto active:cursor-grab"
      >
        <button onClick={() => setCurrentView("home")} className="flex flex-col items-center justify-center p-2">
          <Home className={cn("w-6 h-6", currentView === "home" ? "text-primary" : "text-muted-foreground")} />
        </button>
        <button onClick={() => setCurrentView("training")} className="flex flex-col items-center justify-center p-2">
          <Dumbbell className={cn("w-6 h-6", currentView === "training" ? "text-primary" : "text-muted-foreground")} />
        </button>
        <button onClick={() => setIsMenuExpanded(true)} className="flex flex-col items-center justify-center p-2 -mt-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <ChevronUp className="w-5 h-5 text-primary" />
          </div>
        </button>
        <button onClick={() => setCurrentView("chatbot")} className="flex flex-col items-center justify-center p-2">
          <Bot className={cn("w-6 h-6", currentView === "chatbot" ? "text-primary" : "text-muted-foreground")} />
        </button>
        <button onClick={() => setCurrentView("profile")} className="flex flex-col items-center justify-center p-2">
          <User className={cn("w-6 h-6", currentView === "profile" ? "text-primary" : "text-muted-foreground")} />
        </button>
      </motion.nav>
    </div>
  )
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-center lg:justify-start w-full h-10 lg:h-12 px-2 lg:px-3 rounded-xl lg:rounded-[1.25rem] transition-all duration-500 relative haptic-press",
        active ? "text-primary bg-white/10" : "text-foreground/50 hover:text-foreground hover:bg-white/5"
      )}
    >
      {active && <div className="absolute left-0 w-1 h-4 lg:h-6 bg-primary rounded-full" />}
      <Icon className={cn("w-5 h-5 lg:w-6 lg:h-6 shrink-0", active && "drop-shadow-[0_0_6px_rgba(255,149,0,0.4)]")} />
      <span className="sidebar-nav-label font-black text-[10px] uppercase tracking-[0.15em] whitespace-nowrap text-xs">
        {label}
      </span>
    </button>
  )
}

function TabButton({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center size-14 rounded-full transition-all duration-500 relative",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      {active && <div className="absolute top-0 w-1 h-1 bg-primary rounded-full animate-pulse" />}
      <Icon className={cn("size-7 transition-all duration-500", active ? "scale-125 drop-shadow-[0_0_8px_rgba(255,149,0,0.5)]" : "opacity-60")} />
    </button>
  )
}