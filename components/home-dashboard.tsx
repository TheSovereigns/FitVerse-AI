"use client"

import { useMemo } from "react"
import { ProgressCircle } from "@/components/progress-circle"
import { Badge } from "@/components/ui/badge"
import { OnboardingCard } from "@/components/onboarding-card"
import { cn } from "@/lib/utils"

type View = "home" | "dashboard" | "result" | "recipes" | "training" | "profile" | "planner" | "settings" | "store" | "chatbot"

export function HomeDashboard({
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

  const averageLongevityScore = useMemo(() => {
    if (!dailyActivity.scannedProducts || dailyActivity.scannedProducts.length === 0) return 0;
    const total = dailyActivity.scannedProducts.reduce((acc: number, product: any) => acc + (product.longevityScore || 0), 0);
    return Math.round(total / dailyActivity.scannedProducts.length);
  }, [dailyActivity.scannedProducts]);

  if (!goals) {
    return <OnboardingCard onCTAClick={() => onNavigate("planner")} />;
  }

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

      {/* Insights Grid */}
      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <div className="p-4 bg-white dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-3xl shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Qualidade</h3>
          <ProgressCircle
            value={averageLongevityScore}
            target={100}
            label="Score"
            unit=""
            color="text-emerald-500 dark:text-emerald-400"
          />
          <p className="text-xs text-gray-500 dark:text-white/60 mt-2 text-center">Média dos produtos</p>
        </div>
        <div className="p-4 bg-white dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-3xl shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Aderência</h3>
          <ProgressCircle
            value={Math.min(Math.round((dailyTotals.calories / (goals?.calories || 1)) * 100), 100)}
            target={100}
            label="Meta"
            unit="%"
            color="text-blue-500 dark:text-blue-400"
          />
          <p className="text-xs text-gray-500 dark:text-white/60 mt-2 text-center">Progresso calórico</p>
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
                    "absolute -top-2 -right-2 border-2 border-gray-50 dark:border-black text-xs font-bold",
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