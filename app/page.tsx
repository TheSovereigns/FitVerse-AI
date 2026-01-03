"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
import { ChatbotTab } from "@/components/chatbot-tab"
import { ProgressCircle } from "@/components/progress-circle"
import { ScanLine, User, Calculator, ChefHat, Dumbbell, Loader2, ShoppingBag, Settings, Bot, Home, Zap, BarChart, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type View = "home" | "dashboard" | "result" | "recipes" | "training" | "profile" | "planner" | "settings" | "store" | "chatbot"

// Inicialize o Stripe fora do componente para evitar recriação
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function HomeDashboard({
  userMetabolicPlan,
  dailyActivity,
  onNavigate,
}: {
  userMetabolicPlan: any;
  dailyActivity: any;
  onNavigate: (view: View) => void;
}) {
  const userName = "Atleta"; // Placeholder

  // Calcula os totais de macros dos produtos escaneados no dia
  const dailyTotals = useMemo(() => {
    if (!dailyActivity.scannedProducts || dailyActivity.scannedProducts.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    return dailyActivity.scannedProducts.reduce((acc: any, product: any) => {
      const macros = product.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      acc.calories += macros.calories || 0;
      acc.protein += macros.protein || 0;
      acc.carbs += macros.carbs || 0;
      acc.fat += macros.fat || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [dailyActivity.scannedProducts]);

  const goals = userMetabolicPlan?.macros;
  const remainingCalories = goals ? Math.max(0, goals.calories - dailyTotals.calories) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">
          Olá, <span className="text-primary">{userName}</span>
        </h1>
        <p className="text-gray-500 dark:text-white/60">Seu progresso de hoje.</p>
      </div>

      {/* Main Calorie Circle */}
      <div className="relative flex items-center justify-center animate-in fade-in zoom-in-95 duration-700 my-8 md:my-12">
        <div className="absolute w-72 h-72 md:w-80 md:h-80 rounded-full border border-dashed border-gray-200 dark:border-white/10" />
        <div className="absolute w-64 h-64 md:w-72 md:h-72 rounded-full bg-white dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-white/10" />
        <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full bg-white dark:bg-black/80 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center border border-gray-100 dark:border-white/10">
          <span className="text-sm font-medium text-gray-500 dark:text-white/60">Restantes</span>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tighter">{Math.round(remainingCalories)}</h2>
          <span className="text-lg font-medium text-gray-600 dark:text-white/80">Kcal</span>
        </div>
      </div>

      {/* Macro Grid Card */}
      <div className="p-4 md:p-6 bg-white dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 shadow-lg dark:shadow-none">
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <ProgressCircle
            value={dailyTotals.protein}
            target={goals?.proteinGrams || 0}
            label="Proteína"
            unit="g"
            color="text-indigo-600 dark:text-indigo-400"
          />
          <ProgressCircle
            value={dailyTotals.carbs}
            target={goals?.carbsGrams || 0}
            label="Carbos"
            unit="g"
            color="text-amber-600 dark:text-amber-400"
          />
          <ProgressCircle
            value={dailyTotals.fat}
            target={goals?.fatGrams || 0}
            label="Gordura"
            unit="g"
            color="text-rose-600 dark:text-rose-400"
          />
        </div>
      </div>

      {/* Recently Uploaded List */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white/90 mb-4">Recentemente Adicionado</h3>
        <div className="space-y-3">
          {dailyActivity.scannedProducts.length > 0 ? (
            dailyActivity.scannedProducts.slice(0, 3).map((product: any, index: number) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-white dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-shadow dark:shadow-none">
                <div className="relative">
                  <img src={product.image || "/placeholder.svg?width=64&height=64"} alt={product.productName} className="w-16 h-16 rounded-2xl object-cover bg-gray-700" />
                  <Badge className={cn(
                    "absolute -top-2 -right-2 border-2 border-background text-xs font-bold",
                    product.longevityScore > 80 ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-400/30" :
                    product.longevityScore > 60 ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-400/30" :
                    "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-400/30"
                  )}>
                    {product.longevityScore}
                  </Badge>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{product.productName}</p>
                  <p className="text-sm text-gray-500 dark:text-white/60">{product.macros?.calories || 0} Kcal • {product.brand || 'Desconhecido'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">{product.macros?.protein || 0}g</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">Proteína</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4 bg-white dark:bg-black/60 backdrop-blur-md border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
              <p className="text-sm text-gray-500 dark:text-white/60">Escaneie seu primeiro alimento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<View>("home")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysis | null>(null)
  const [dailyActivity, setDailyActivity] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    scannedProducts: [],
    generatedDiets: [],
    generatedWorkouts: [],
  });
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

  const [userMetabolicPlan, setUserMetabolicPlanState] = useState<any>(null)

  // Função wrapper para salvar o plano no localStorage sempre que for atualizado
  const setUserMetabolicPlan = (plan: any, perfil?: any) => {
    // Combina o plano e o perfil para ter o contexto completo
    const fullPlan = plan && perfil ? { ...plan, perfil } : plan;
    setUserMetabolicPlanState(fullPlan);
    if (fullPlan) {
      // Salva o plano completo para a memória do chatbot
      localStorage.setItem("userMetabolicPlan", JSON.stringify(fullPlan));
      // Salva a dieta gerada na atividade do dia
      if (plan?.diet) {
        setDailyActivity((prev: any) => {
          const updatedActivity = {
            ...prev,
            generatedDiets: prev.generatedDiets.some((d: any) => d.title === plan.diet.title) 
              ? prev.generatedDiets 
              : [...prev.generatedDiets, plan.diet]
          };
          localStorage.setItem("dailyActivity", JSON.stringify(updatedActivity));
          return updatedActivity;
        });
      }
    } else {
      // Limpa se o plano for nulo
      localStorage.removeItem("userMetabolicPlan");
    }
  }

  const [loadingStripe, setLoadingStripe] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const router = useRouter()
  const bottomNavInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("user")

    // Carrega a atividade do dia do localStorage
    const savedActivity = localStorage.getItem("dailyActivity");
    const today = new Date().toISOString().split('T')[0];
    if (savedActivity) {
        try {
            const activity = JSON.parse(savedActivity);
            if (activity.date === today) {
                setDailyActivity(activity);
            } else {
                // Reseta a atividade se for um novo dia
                const newDailyActivity = { date: today, scannedProducts: [], generatedDiets: [], generatedWorkouts: [] };
                setDailyActivity(newDailyActivity);
                localStorage.setItem("dailyActivity", JSON.stringify(newDailyActivity));
            }
        } catch (e) {
            console.error("Falha ao carregar atividade diária", e);
        }
    }

    // Carrega o plano metabólico da "memória" do navegador ao iniciar
    const savedPlan = localStorage.getItem("userMetabolicPlan");
    if (savedPlan) {
        try {
            setUserMetabolicPlanState(JSON.parse(savedPlan));
        } catch (e) {
            console.error("Falha ao carregar plano metabólico do localStorage", e);
        }
    }

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
      console.log("Iniciando checkout com priceId:", priceId);
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro no checkout');
        } catch {
          throw new Error('Erro ao processar pagamento');
        }
      }

      const data = await response.json()
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
      console.log("Enviando imagem para análise...", { hasImage: !!imageData });
      const response = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageData: imageData,
          metabolicPlan: userMetabolicPlan // Adicionando contexto do usuário para uma análise completa
        }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha na análise da IA');
        } catch {
          throw new Error('Falha na análise da IA (Erro de servidor)');
        }
      }

      const analysis: ProductAnalysis = await response.json();

      // Salva o produto analisado na atividade do dia
      setDailyActivity((prev: any) => {
        const updatedActivity = {
          ...prev,
          scannedProducts: [...prev.scannedProducts, analysis]
        };
        localStorage.setItem("dailyActivity", JSON.stringify(updatedActivity));
        return updatedActivity;
      });

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
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-sans selection:bg-primary/30 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-white/10 z-50">
        <div className="p-6 flex items-center gap-2 font-bold text-2xl tracking-tighter text-gray-900 dark:text-white">
          <ScanLine className="text-primary" />
          <span>FitVerse<span className="text-primary">AI</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Button variant="ghost" onClick={() => setCurrentView("home")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "home" ? "bg-gray-100/80 dark:bg-white/10 backdrop-blur-md border border-gray-200/50 dark:border-white/20 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-50/50 hover:backdrop-blur-sm"}`}><Home className="w-5 h-5" />Página Inicial</Button>
          <Button variant="ghost" onClick={() => setCurrentView("dashboard")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "dashboard" ? "bg-gray-100/80 dark:bg-white/10 backdrop-blur-md border border-gray-200/50 dark:border-white/20 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-50/50 hover:backdrop-blur-sm"}`}><ScanLine className="w-5 h-5" />BioScan</Button>
          <Button variant="ghost" onClick={() => setCurrentView("training")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "training" ? "bg-gray-100/80 dark:bg-white/10 backdrop-blur-md border border-gray-200/50 dark:border-white/20 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-50/50 hover:backdrop-blur-sm"}`}><Dumbbell className="w-5 h-5" />NutriTrain</Button>
          <Button variant="ghost" onClick={() => setCurrentView("planner")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "planner" ? "bg-gray-100/80 dark:bg-white/10 backdrop-blur-md border border-gray-200/50 dark:border-white/20 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-50/50 hover:backdrop-blur-sm"}`}><Calculator className="w-5 h-5" />Dieta AI</Button>
          <Button variant="ghost" onClick={() => setCurrentView("recipes")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "recipes" ? "bg-gray-100/80 dark:bg-white/10 backdrop-blur-md border border-gray-200/50 dark:border-white/20 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-50/50 hover:backdrop-blur-sm"}`}><ChefHat className="w-5 h-5" />Receitas</Button>
          <Button variant="ghost" onClick={() => setCurrentView("store")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "store" ? "bg-gray-100/80 dark:bg-white/10 backdrop-blur-md border border-gray-200/50 dark:border-white/20 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-50/50 hover:backdrop-blur-sm"}`}><ShoppingBag className="w-5 h-5" />Loja</Button>
          <Button variant="ghost" onClick={() => setCurrentView("chatbot")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "chatbot" ? "bg-gray-100/80 dark:bg-white/10 backdrop-blur-md border border-gray-200/50 dark:border-white/20 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-50/50 hover:backdrop-blur-sm"}`}><Bot className="w-5 h-5" />AI Chat</Button>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 space-y-2">
           <Button variant="ghost" onClick={() => setCurrentView("profile")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "profile" ? "bg-gray-100/80 dark:bg-white/10 backdrop-blur-md border border-gray-200/50 dark:border-white/20 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-50/50 hover:backdrop-blur-sm"}`}><User className="w-5 h-5" />Perfil</Button>
           <Button variant="ghost" onClick={() => setCurrentView("settings")} className={`w-full justify-start gap-3 transition-all duration-300 ease-in-out ${currentView === "settings" ? "bg-gray-100/80 dark:bg-white/10 backdrop-blur-md border border-gray-200/50 dark:border-white/20 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-gray-50/50 hover:backdrop-blur-sm"}`}><Settings className="w-5 h-5" />Configurações</Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen relative">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 h-16 flex items-center justify-between">
          <div className="md:hidden font-bold text-xl flex items-center gap-2 text-gray-900 dark:text-white"><ScanLine className="text-primary" /><span>FitVerse</span></div>
          <div className="hidden md:block text-sm font-medium text-gray-500 dark:text-gray-400">Bem-vindo de volta, Atleta.</div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" onClick={() => router.push("/admin-login")} className="text-xs text-muted-foreground hover:text-foreground transition-all duration-300 ease-in-out">Admin</Button>
             <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setCurrentView("profile")}><User className="w-4 h-4 text-gray-600 dark:text-gray-300" /></div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        {currentView === "home" && <HomeDashboard userMetabolicPlan={userMetabolicPlan} dailyActivity={dailyActivity} onNavigate={setCurrentView} />}
        {currentView === "dashboard" && <ScanDashboard onScan={handleScan} />}
        {currentView === "result" && (isAnalyzing || !currentAnalysis ? <ProductSkeleton /> : <ProductResult result={currentAnalysis} onBack={() => setCurrentView("dashboard")} />)}
        {currentView === "recipes" && <RecipesTab />}
        {currentView === "training" && <TrainingTab />}
        {currentView === "planner" && <MetabolicPlanner onPlanCreated={setUserMetabolicPlan} />}
        {currentView === "store" && <StoreTab />}
        {currentView === "settings" && <SettingsPage onBack={() => setCurrentView("profile")} />}
        {currentView === "chatbot" && <ChatbotTab />}
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

      {/* Floating Action Button */}
      <Button onClick={handleNavScan} className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50 h-16 w-16 rounded-full bg-primary/80 backdrop-blur-md border border-white/20 text-white shadow-2xl shadow-primary/30 transition-transform hover:scale-110 active:scale-95 animate-in fade-in zoom-in-95 duration-500">
        <ScanLine className="h-8 w-8" />
      </Button>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 z-50">
        <div className="flex items-center justify-around px-1 py-1.5 max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("home")} className={`flex flex-col items-center gap-0.5 h-auto p-1 transition-all duration-300 ease-in-out ${currentView === "home" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><Home className="w-5 h-5" /><span className="text-[9px] font-medium">Início</span></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("training")} className={`flex flex-col items-center gap-0.5 h-auto p-1 transition-all duration-300 ease-in-out ${currentView === "training" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><Dumbbell className="w-5 h-5" /><span className="text-[9px] font-medium">NutriTrain</span></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")} className={`flex flex-col items-center gap-0.5 h-auto p-1 transition-all duration-300 ease-in-out ${currentView === "dashboard" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><ScanLine className="w-5 h-5" /><span className="text-[9px] font-medium">BioScan</span></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("chatbot")} className={`flex flex-col items-center gap-0.5 h-auto p-1 transition-all duration-300 ease-in-out ${currentView === "chatbot" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><Bot className="w-5 h-5" /><span className="text-[9px] font-medium">AI Chat</span></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("profile")} className={`flex flex-col items-center gap-0.5 h-auto p-1 transition-all duration-300 ease-in-out ${currentView === "profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><User className="w-5 h-5" /><span className="text-[9px] font-medium">Perfil</span></Button>
        </div>
      </nav>
    </div>
  )
}