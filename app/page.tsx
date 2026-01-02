"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { ScanDashboard } from "@/components/scan-dashboard"
import { ProductResult, type ProductAnalysis } from "@/components/product-result"
import { ScanHistory } from "@/components/scan-history"
import { UserProfile } from "@/components/user-profile"
import { MetabolicPlanner } from "@/components/metabolic-planner"
import { HealthProfile } from "@/components/health-profile"
import { ProductSkeleton } from "@/components/product-skeleton"
import { RecipesTab } from "@/components/recipes-tab"
import { TrainingTab } from "@/components/training-tab"
import { SettingsPage } from "@/components/settings-page"
import { StoreTab } from "@/components/store-tab"
import { Home, ScanLine, User, Calculator, ChefHat, Dumbbell, Loader2, LayoutDashboard, ShoppingBag, Settings, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"

type View = "dashboard" | "result" | "recipes" | "training" | "profile" | "planner" | "settings" | "store"

// Inicialize o Stripe fora do componente para evitar recriação
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function HomePage() {
  const [currentView, setCurrentView] = useState<View>("dashboard")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysis | null>(null)
  const [scanHistory, setScanHistory] = useState<any[]>([
    {
      id: "1", // O componente ScanHistory espera 'name' e 'scannedAt'
      name: "Whey Protein Isolate",
      scannedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Simula 10 min atrás
      score: 92,
      image: "/placeholder.svg?height=80&width=80",
      status: "healthy",
    },
    {
      id: "2", // O componente ScanHistory espera 'name' e 'scannedAt'
      name: "Barra de Cereal",
      scannedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Simula 1 dia atrás
      score: 45,
      image: "/placeholder.svg?height=80&width=80",
      status: "avoid",
    },
    {
      id: "3", // O componente ScanHistory espera 'name' e 'scannedAt'
      name: "Iogurte Natural",
      scannedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // Simula 25h atrás
      score: 88,
      image: "/placeholder.svg?height=80&width=80",
      status: "healthy",
    },
  ])

  const [userMetabolicPlan, setUserMetabolicPlan] = useState<any>(null)
  const [loadingStripe, setLoadingStripe] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const router = useRouter()
  const bottomNavInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      router.push("/auth/login")
    } else {
      const user = JSON.parse(userStr)
      if (user.subscription === "premium") {
        setIsPremium(true)
      }
    }
  }, [router])

  const handleCheckout = async (priceId: string) => {
    setLoadingStripe(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json()
      
      if (!response.ok) throw new Error(data.message);

      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (error) console.error(error);
      }
    } catch (error) {
      console.error("Erro no checkout:", error)
      alert("Erro ao iniciar o pagamento. Verifique suas chaves do Stripe.")
    } finally {
      setLoadingStripe(false)
    }
  }

  const handleScan = async (fileOrUrl?: File | string): Promise<void> => {
    setIsAnalyzing(true);
    setCurrentView("result");
    setAnalysisResult(null); // Limpa o resultado anterior para evitar mostrar dados antigos

    let displayImage = "/placeholder.svg?height=80&width=80";

    // A API /api/analyze espera uma string base64 da imagem.
    const toBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

    try {
      let imageData: string | undefined;

    if (fileOrUrl instanceof File) {
      displayImage = URL.createObjectURL(fileOrUrl);
      imageData = await toBase64(fileOrUrl);
    } else if (typeof fileOrUrl === "string") {
      displayImage = fileOrUrl;
      imageData = fileOrUrl; // Assume que a string já é uma URL ou base64
    }

      if (!imageData) {
        throw new Error("Nenhuma imagem ou URL fornecida para análise.");
      }

      // ✅ CHAMADA REAL À API: Substitui a simulação por uma chamada real ao seu backend.
      const response = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageData: imageData,
          metabolicPlan: userMetabolicPlan // Adicionando contexto do usuário para uma análise completa
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha na análise da IA');
      }

      const analysis: ProductAnalysis = await response.json();

      setAnalysisResult(analysis);
      setScanHistory(prev => [
        {
          id: `${prev.length + 1}`,
          name: analysis.productName, // Corrigido de productName para name
          scannedAt: new Date().toISOString(), // Corrigido de date para scannedAt e usando ISO string
          score: analysis.longevityScore,
          image: displayImage,
        },
        ...prev
      ]);
    } catch (error) {
      console.error("Erro durante a análise:", error);
      alert(error instanceof Error ? error.message : "Ocorreu um erro ao analisar o produto. Tente novamente.");
      setCurrentView("dashboard"); // Retorna ao dashboard em caso de erro
    } finally {
      setIsAnalyzing(false);
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

  const currentAnalysis = analysisResult;

  return (
    <div className="min-h-screen bg-background text-muted-foreground font-sans selection:bg-primary/30 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-sidebar border-r border-sidebar-border z-50">
        <div className="p-6 flex items-center gap-2 font-bold text-2xl tracking-tighter text-sidebar-foreground">
          <ScanLine className="text-primary" />
          <span>FitVerse<span className="text-primary">AI</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Button variant="ghost" onClick={() => setCurrentView("dashboard")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}><LayoutDashboard className="w-5 h-5" />Dashboard</Button>
          <Button variant="ghost" onClick={() => setCurrentView("training")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "training" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}><Dumbbell className="w-5 h-5" />NutriTrain</Button>
          <Button variant="ghost" onClick={() => setCurrentView("planner")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "planner" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}><Calculator className="w-5 h-5" />Dieta AI</Button>
          <Button variant="ghost" onClick={() => setCurrentView("recipes")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "recipes" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}><ChefHat className="w-5 h-5" />Receitas</Button>
          <Button variant="ghost" onClick={() => setCurrentView("store")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "store" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}><ShoppingBag className="w-5 h-5" />Loja</Button>
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
           <Button variant="ghost" onClick={() => setCurrentView("profile")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "profile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}><User className="w-5 h-5" />Perfil</Button>
           <Button variant="ghost" onClick={() => setCurrentView("settings")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}><Settings className="w-5 h-5" />Configurações</Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen relative">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md px-4 h-16 flex items-center justify-between">
          <div className="md:hidden font-bold text-xl flex items-center gap-2 text-foreground"><ScanLine className="text-primary" /><span>FitVerse</span></div>
          <div className="hidden md:block text-sm font-medium text-muted-foreground">Bem-vindo de volta, Atleta.</div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" onClick={() => router.push("/admin-login")} className="text-xs text-muted-foreground hover:text-foreground transition-all duration-300 ease-in-out">Admin</Button>
             <div className="w-8 h-8 rounded-full bg-accent border border-border flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setCurrentView("profile")}><User className="w-4 h-4 text-muted-foreground" /></div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        {currentView === "dashboard" && <ScanDashboard onScan={handleScan} />}
        {currentView === "result" && (isAnalyzing || !currentAnalysis ? <ProductSkeleton /> : <ProductResult result={currentAnalysis} onBack={() => setCurrentView("dashboard")} />)}
        {currentView === "recipes" && <RecipesTab />}
        {currentView === "training" && <TrainingTab />}
        {currentView === "planner" && <MetabolicPlanner onPlanCreated={setUserMetabolicPlan} />}
        {currentView === "store" && <StoreTab />}
        {currentView === "settings" && <SettingsPage onBack={() => setCurrentView("profile")} />}
        {currentView === "profile" && (<div className="pt-4"><HealthProfile scanHistory={scanHistory} onNavigateToSettings={() => setCurrentView("settings")} onNavigateToSubscription={() => router.push('/subscription')} /></div>)}
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

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border z-50 pb-safe">
        <div className="flex items-center justify-around px-1 py-1.5 max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")} className={`flex flex-col items-center gap-0.5 h-auto p-1 transition-all duration-300 ease-in-out ${currentView === "dashboard" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><Home className="w-5 h-5" /><span className="text-[9px] font-medium">Início</span></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("training")} className={`flex flex-col items-center gap-0.5 h-auto p-1 transition-all duration-300 ease-in-out ${currentView === "training" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><Dumbbell className="w-5 h-5" /><span className="text-[9px] font-medium">NutriTrain</span></Button>
          <Button variant="ghost" size="sm" onClick={handleNavScan} className="flex flex-col items-center gap-0.5 h-auto p-1 text-muted-foreground relative -mt-4"><div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center shadow-xl shadow-primary/30 transition-transform active:scale-95 hover:scale-105 border-4 border-background"><ScanLine className="w-7 h-7 text-primary-foreground" /></div><span className="text-[10px] font-medium mt-10">Scan</span></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("planner")} className={`flex flex-col items-center gap-0.5 h-auto p-1 transition-all duration-300 ease-in-out ${currentView === "planner" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><Calculator className="w-5 h-5" /><span className="text-[9px] font-medium">Dieta AI</span></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("profile")} className={`flex flex-col items-center gap-0.5 h-auto p-1 transition-all duration-300 ease-in-out ${currentView === "profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><User className="w-5 h-5" /><span className="text-[9px] font-medium">Perfil</span></Button>
        </div>
      </nav>
    </div>
  )
}