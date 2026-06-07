"use client"

// FitVerse AI - Main Dashboard
// Auth-protected dashboard with BioScan, training, diet, and more

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
import { ScanLine, User, Calculator, ChefHat, Dumbbell, Loader2, ShoppingBag, Settings, Bot, Home, ChevronUp, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HomeDashboard } from "@/components/home-dashboard"
import { DynamicIsland, type IslandState } from "@/components/dynamic-island"
import { LiquidLaunchpad } from "@/components/liquid-launchpad"
import { useTranslation } from "@/lib/i18n"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { usePlanLimits } from "@/hooks/usePlanLimits"

type View = "home" | "dashboard" | "result" | "recipes" | "training" | "profile" | "planner" | "settings" | "store" | "chatbot"

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
  const [scanError, setScanError] = useState<string | null>(null)
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

      if (!imageData) {
        throw new Error(t("page_error_no_image"))
      }

      // Try to get token directly from localStorage
      let token = ''
      
      try {
        // Find Supabase auth token in localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.includes('sb-') && key.includes('-auth-token')) {
            const storedSession = localStorage.getItem(key)
            if (storedSession) {
              const parsed = JSON.parse(storedSession)
              if (parsed?.access_token) {
                token = parsed.access_token
                break
              }
            }
          }
        }
        
        // If no token, try supabase.auth.getSession() with timeout
        if (!token) {
          const sessionPromise = supabase.auth.getSession()
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 8000)
          )
          
          try {
            const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise])
            token = sessionData.session?.access_token || ''
          } catch (getSessionError) {
            console.error('DEBUG: getSession failed:', getSessionError)
          }
        }
      } catch (e) {
        console.error('Error getting token:', e)
      }
      
      if (!token) {
        throw new Error(isEnglish ? "Please sign in again before scanning." : "Entre novamente antes de escanear.")
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 60000)

      let response
      try {
        response = await fetch('/api/analyze-product', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            imageData: imageData,
            mimeType: imageMimeType,
            metabolicPlan: userMetabolicPlanState,
            locale,
          }),
          signal: controller.signal,
        })
      } catch (fetchError) {
        clearTimeout(timeoutId)
        const message = fetchError instanceof Error && fetchError.name === 'AbortError'
          ? (isEnglish ? "The scan took too long. Please try again with a clearer image." : "A analise demorou demais. Tente novamente com uma imagem mais nitida.")
          : (isEnglish ? "Connection error. Please check your internet." : "Erro de conexao. Verifique sua internet.")

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          toast.error(message)
        } else {
          toast.error(message)
        }
        setIslandState("error")
        setTimeout(() => setIslandState("idle"), 3000)
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
      const message = error instanceof Error ? error.message : t("page_error_retry")
      setIslandState("error")
      setTimeout(() => setIslandState("idle"), 3000)
      setScanError(message)
      toast.error(message)
      setCurrentView("result")
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
      "min-h-screen bg-transparent text-white font-sans selection:bg-primary/30 flex transition-all duration-700",
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
      <aside className="hidden md:flex flex-col w-20 lg:w-24 hover:w-64 lg:hover:w-72 fixed top-1/2 -translate-y-1/2 left-4 lg:left-6 glass-strong border-orange-300/18 z-50 rounded-[2rem] lg:rounded-[2.5rem] transition-all duration-700 ease-in-out group overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
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
        </nav>

        <div className="p-2 lg:p-3 mb-3 lg:mb-4 space-y-2 border-t border-orange-300/12 pt-4 flex flex-col items-center">
          <NavButton icon={User} label={t("nav_profile")} active={currentView === "profile"} onClick={() => setCurrentView("profile")} />
          <NavButton icon={Settings} label={t("nav_settings")} active={currentView === "settings"} onClick={() => setCurrentView("settings")} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-24 lg:pl-32 xl:pl-36 flex flex-col min-h-screen relative transition-all duration-500 max-w-[1600px] xl:max-w-[1800px] mx-auto w-full">
        {/* Header - Visible on all screens */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-orange-300/10 bg-[#070503]/78 px-3 backdrop-blur-2xl md:h-16 md:border-none md:bg-transparent md:px-6 lg:h-14">
          <div className="md:hidden flex min-w-0 items-center gap-2 text-foreground">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-orange-300/14 bg-orange-500/10 shadow-[0_12px_28px_rgba(255,149,0,0.12)]">
              <ScanLine className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-lg font-black tracking-tight">{t("home_brand")}</span>
              <span className="block text-[9px] font-black uppercase tracking-[0.22em] text-orange-100/34">{getViewTitle()}</span>
            </div>
          </div>
          <div className="hidden md:block">
             {/* Large title or scroll transition space */}
          </div>
            <div className="flex items-center gap-2 md:gap-6">
              {(isAdmin || user?.user_metadata?.is_admin) && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => router.push("/admin-dashboard")} 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border border-orange-300/12 bg-orange-500/8 hover:bg-orange-500/16 active:scale-90 haptic-press transition-all font-sans text-orange-100/70 hover:text-orange-50"
                  aria-label={t("home_access_admin")}
                >
                  <Shield className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
              )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCurrentView("profile")}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border border-orange-300/12 bg-orange-500/8 hover:bg-orange-500/16 active:scale-90 haptic-press transition-all font-sans text-orange-100/70 hover:text-orange-50"
              aria-label={t("home_view_profile")}
            >
              <User className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 pb-safe-nav pt-3 md:p-6 md:pb-8 lg:p-8 xl:p-12">
          {currentView === "home" && <HomeDashboard userMetabolicPlan={userMetabolicPlanState} dailyActivity={dailyActivity} onNavigate={setCurrentView} />}
          {currentView === "dashboard" && <ScanDashboard onScan={handleScan} isScanning={isAnalyzing} />}
          {currentView === "result" && (
            scanError ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-full max-w-md glass-strong border border-red-500/20 rounded-[2rem] p-6 text-center space-y-5">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <ScanLine className="w-7 h-7 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">
                      {isEnglish ? "Scan failed" : "Nao foi possivel analisar"}
                    </h2>
                    <p className="mt-2 text-sm font-bold text-muted-foreground">
                      {scanError}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setScanError(null)
                      setCurrentView("dashboard")
                    }}
                    className="w-full h-12 rounded-2xl font-black"
                  >
                    {isEnglish ? "Try another image" : "Tentar outra imagem"}
                  </Button>
                </div>
              </div>
            ) : (
              isAnalyzing || !currentAnalysis
                ? <ProductSkeleton />
                : <ProductResult result={currentAnalysis} onBack={() => setCurrentView("dashboard")} />
            )
          )}
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
                    className="w-full h-12 glass-strong border border-orange-300/16 text-orange-100/70 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-orange-500/10"
                  >
                    {t("home_new_plan")}
                  </Button>
                </div>
              : <MetabolicPlanner onPlanCreated={setUserMetabolicPlan} />
          )}
          {currentView === "store" && <StoreTab />}
          {currentView === "settings" && <SettingsPage onBack={() => setCurrentView("profile")} />}
          {currentView === "chatbot" && <ChatbotTab />}
          {currentView === "profile" && (<div className="pt-4 md:pt-8 lg:pt-12"><HealthProfile scanHistory={scanHistory} onNavigateToSettings={() => setCurrentView("settings")} onNavigateToSubscription={() => router.push('/subscription')} /></div>)}
        </main>
      </div>

      <input
        type="file"
        ref={bottomNavInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleBottomNavFileChange}
      />

      {/* Floating Action Button */}
      <Button 
        onClick={handleNavScan} 
        className="mobile-fab-safe fixed right-5 z-50 h-14 w-14 rounded-full border border-orange-200/35 bg-orange-500 text-black shadow-[0_18px_44px_rgba(255,149,0,0.34)] transition-all duration-500 hover:scale-105 hover:bg-amber-300 active:scale-90 md:bottom-10 md:right-10 md:h-16 md:w-16 xl:bottom-12 xl:right-12"
          aria-label={t("home_scan_product")}
      >
        <ScanLine className="h-7 w-7 text-black md:h-9 md:w-9" />
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
        className="mobile-bottom-safe md:hidden fixed left-3 right-3 z-40 mx-auto flex h-16 max-w-md items-center justify-around rounded-[1.65rem] border border-orange-300/18 bg-[#090603]/76 px-2 shadow-[0_20px_56px_rgba(0,0,0,0.55)] backdrop-blur-2xl active:cursor-grab"
      >
        <button onClick={() => setCurrentView("home")} className="relative flex h-12 w-12 flex-col items-center justify-center rounded-2xl p-2" aria-label={t("nav_home")}>
          <Home className={cn("w-5 h-5", currentView === "home" ? "text-primary" : "text-orange-50/42")} />
          {currentView === "home" && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
        </button>
        <button onClick={() => setCurrentView("training")} className="relative flex h-12 w-12 flex-col items-center justify-center rounded-2xl p-2" aria-label={t("nav_workouts")}>
          <Dumbbell className={cn("w-5 h-5", currentView === "training" ? "text-primary" : "text-orange-50/42")} />
          {currentView === "training" && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
        </button>
        <button onClick={() => setIsMenuExpanded(true)} className="-mt-2 flex h-12 w-12 flex-col items-center justify-center rounded-2xl p-1" aria-label="Abrir menu">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-300/20 bg-orange-500/18 shadow-[0_10px_28px_rgba(255,149,0,0.14)]">
            <ChevronUp className="w-5 h-5 text-primary" />
          </div>
        </button>
        <button onClick={() => setCurrentView("recipes")} className="relative flex h-12 w-12 flex-col items-center justify-center rounded-2xl p-2" aria-label={t("nav_recipes")}>
          <ChefHat className={cn("w-5 h-5", currentView === "recipes" ? "text-primary" : "text-orange-50/42")} />
          {currentView === "recipes" && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
        </button>
        <button onClick={() => setCurrentView("profile")} className="relative flex h-12 w-12 flex-col items-center justify-center rounded-2xl p-2" aria-label={t("nav_profile")}>
          <User className={cn("w-5 h-5", currentView === "profile" ? "text-primary" : "text-orange-50/42")} />
          {currentView === "profile" && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
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
        active ? "text-primary bg-orange-500/12" : "text-orange-50/48 hover:text-orange-50 hover:bg-orange-500/8"
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
