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
import { Home, ScanLine, User, Calculator, ChefHat, Dumbbell, Loader2, LayoutDashboard, ShoppingBag, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

type View = "dashboard" | "result" | "recipes" | "training" | "profile" | "planner"

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
        body: JSON.stringify({ imageData: imageData }), // A API espera um objeto com a propriedade 'imageData'
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
    <div className="min-h-screen bg-[#080808] text-slate-300 font-sans selection:bg-[#FF8C00]/30 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#121212] border-r border-[#1F1F1F] z-50">
        <div className="p-6 flex items-center gap-2 font-bold text-2xl tracking-tighter text-white">
          <ScanLine className="text-[#FF8C00]" />
          <span>FitVerse<span className="text-[#FF8C00]">AI</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Button variant="ghost" onClick={() => setCurrentView("dashboard")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "dashboard" ? "bg-[#FF8C00]/10 text-[#FF8C00]" : "text-slate-400 hover:text-white hover:bg-[#1F1F1F]"}`}><LayoutDashboard className="w-5 h-5" />Dashboard</Button>
          <Button variant="ghost" onClick={() => setCurrentView("training")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "training" ? "bg-[#FF8C00]/10 text-[#FF8C00]" : "text-slate-400 hover:text-white hover:bg-[#1F1F1F]"}`}><Dumbbell className="w-5 h-5" />NutriTrain</Button>
          <Button variant="ghost" onClick={() => setCurrentView("planner")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "planner" ? "bg-[#FF8C00]/10 text-[#FF8C00]" : "text-slate-400 hover:text-white hover:bg-[#1F1F1F]"}`}><Calculator className="w-5 h-5" />Dieta AI</Button>
          <Button variant="ghost" onClick={() => setCurrentView("recipes")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "recipes" ? "bg-[#FF8C00]/10 text-[#FF8C00]" : "text-slate-400 hover:text-white hover:bg-[#1F1F1F]"}`}><ChefHat className="w-5 h-5" />Receitas</Button>
          <Button variant="ghost" disabled className="w-full justify-start gap-3 text-slate-600 cursor-not-allowed"><ShoppingBag className="w-5 h-5" />Loja <span className="text-[10px] bg-[#1F1F1F] px-1.5 py-0.5 rounded ml-auto">Soon</span></Button>
        </nav>

        <div className="p-4 border-t border-[#1F1F1F] space-y-2">
           <Button variant="ghost" onClick={() => setCurrentView("profile")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "profile" ? "bg-[#FF8C00]/10 text-[#FF8C00]" : "text-slate-400 hover:text-white hover:bg-[#1F1F1F]"}`}><User className="w-5 h-5" />Perfil</Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen relative">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-[#1F1F1F] bg-[#080808]/80 backdrop-blur-md px-4 h-16 flex items-center justify-between">
          <div className="md:hidden font-bold text-xl flex items-center gap-2 text-white"><ScanLine className="text-[#FF8C00]" /><span>FitVerse</span></div>
          <div className="hidden md:block text-sm font-medium text-slate-500">Bem-vindo de volta, Atleta.</div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" onClick={() => router.push("/admin-login")} className="text-xs text-slate-500 hover:text-white transition-all duration-300 ease-in-out">Admin</Button>
             {!isPremium ? (<Button size="sm" onClick={() => handleCheckout("price_1Q...")} disabled={loadingStripe} className="bg-[#ADFF2F] hover:bg-[#98E028] text-black font-bold border-none transition-all duration-300 ease-in-out hover:scale-105">{loadingStripe ? <Loader2 className="w-3 h-3 animate-spin" /> : "Upgrade Premium"}</Button>) : (<span className="text-xs font-bold text-[#ADFF2F] border border-[#ADFF2F]/30 bg-[#ADFF2F]/10 px-3 py-1 rounded-full select-none">PREMIUM</span>)}
             <div className="w-8 h-8 rounded-full bg-[#1F1F1F] border border-[#333] flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setCurrentView("profile")}><User className="w-4 h-4 text-slate-400" /></div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        {currentView === "dashboard" && (
          <div className="space-y-8">
            {/* Widgets de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
               <div className="p-4 rounded-2xl bg-[#121212] border border-[#1F1F1F] space-y-1 shadow-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Calorias</p>
                  <p className="text-xl font-bold text-orange-400">1,250 <span className="text-sm text-slate-500 font-normal">/ 2,400</span></p>
               </div>
               <div className="p-4 rounded-2xl bg-[#121212] border border-[#1F1F1F] space-y-1 shadow-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Proteína</p>
                  <p className="text-xl font-bold text-orange-400">98g <span className="text-sm text-slate-500 font-normal">/ 180g</span></p>
               </div>
               <div className="p-4 rounded-2xl bg-[#121212] border border-[#1F1F1F] space-y-1 shadow-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Treino</p>
                  <p className="text-xl font-bold text-orange-400">Leg Day</p>
               </div>
               <div className="p-4 rounded-2xl bg-[#121212] border border-[#1F1F1F] space-y-1 shadow-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Água</p>
                  <p className="text-xl font-bold text-orange-400">1.5L</p>
               </div>
            </div>

            <ScanDashboard onScan={handleScan} />
          </div>
        )}
        {currentView === "result" && (isAnalyzing || !currentAnalysis ? <ProductSkeleton /> : <ProductResult result={currentAnalysis} onBack={() => setCurrentView("dashboard")} />)}
        {currentView === "recipes" && <RecipesTab />}
        {currentView === "training" && <TrainingTab />}
        {currentView === "planner" && <MetabolicPlanner onPlanCreated={setUserMetabolicPlan} />}
        {currentView === "profile" && (<div className="pt-4"><HealthProfile scanHistory={scanHistory} /></div>)}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-lg border-t border-[#1F1F1F] z-50 pb-safe">
        <div className="flex items-center justify-around px-1 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")} className={`flex flex-col items-center gap-1 h-auto py-2 transition-all duration-300 ease-in-out ${currentView === "dashboard" ? "text-[#FF8C00]" : "text-slate-500 hover:text-white"}`}><Home className="w-5 h-5" /><span className="text-[10px] font-medium">Início</span></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("training")} className={`flex flex-col items-center gap-1 h-auto py-2 transition-all duration-300 ease-in-out ${currentView === "training" ? "text-[#FF8C00]" : "text-slate-500 hover:text-white"}`}><Dumbbell className="w-5 h-5" /><span className="text-[10px] font-medium">Treino</span></Button>
          <Button variant="ghost" size="sm" onClick={handleNavScan} className="flex flex-col items-center gap-1 h-auto py-2 text-slate-400 relative -mt-4"><div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#FF4500] flex items-center justify-center shadow-xl shadow-orange-500/30 transition-transform active:scale-95 hover:scale-105 border-4 border-[#080808]"><ScanLine className="w-7 h-7 text-white" /></div><span className="text-[10px] font-medium mt-10">Scan</span></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("planner")} className={`flex flex-col items-center gap-1 h-auto py-2 transition-all duration-300 ease-in-out ${currentView === "planner" ? "text-[#FF8C00]" : "text-slate-500 hover:text-white"}`}><Calculator className="w-5 h-5" /><span className="text-[10px] font-medium">Dieta</span></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("profile")} className={`flex flex-col items-center gap-1 h-auto py-2 transition-all duration-300 ease-in-out ${currentView === "profile" ? "text-[#FF8C00]" : "text-slate-500 hover:text-white"}`}><User className="w-5 h-5" /><span className="text-[10px] font-medium">Perfil</span></Button>
        </div>
      </nav>
    </div>
  )
}