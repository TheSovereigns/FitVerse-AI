"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, AlertTriangle, Check, Activity, ShieldCheck, AlertCircle, Flame, Dumbbell, Wheat, Droplets, Target, BarChart, Sparkles, ChevronRight, Zap, Heart, Brain, Bone, Shield, Leaf, Droplet, Scale, Plus, Minus, Info, Clock, Pill, Apple, Cookie, AlertOctagon, TrendingUp, TrendingDown, Minus as MinusIcon, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ShareActivityButton } from "@/components/share-activity-button"

export interface ProductAnalysis {
  productName: string
  longevityScore: number
  brand?: string
  category?: string
  servingSize?: string
  macros?: { calories: number; protein: number; carbs: number; fat: number; fiber?: number; sugar?: number; sodium?: number }
  micros?: { vitamins?: string[]; minerals?: string[] }
  ingredients?: string[]
  allergens?: string[]
  novaClassification?: { group: number; label: string; description: string }
  glycemicIndex?: { value: number | null; category: string | null; note: string | null }
  healthScore?: { overall: number; nutrientDensity: number; processingLevel: number; additiveRisk: number }
  alerts?: { title: string; description: string; severity?: string }[]
  insights?: { title?: string; description: string }[]
  fitnessAlignment?: {
    goal: string
    suitability: "Excelente" | "Bom" | "Neutro" | "Ruim" | "Excellent" | "Good" | "Neutral" | "Poor"
    justification: string
  }[]
  benefits?: {
    vitamins?: string[]
    minerals?: string[]
    proteins?: string[]
    other?: string[]
  }
  recommendations?: {
    bestFor?: string
    avoidIf?: string
    alternatives?: string
  }
  aiConfidence?: number
}

interface ProductResultProps {
  result: ProductAnalysis | null
  onBack: () => void
  imageData?: string
}

import { useTranslation } from "@/lib/i18n"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { Lock } from "lucide-react"

export function ProductResult({ result, onBack, imageData }: ProductResultProps) {
  const { t } = useTranslation()
  const { plan } = usePlanLimits()
  const isPremium = plan === "pro" || plan === "premium"
  
  const defaultGrams = result?.servingSize ? parseInt(result.servingSize.replace(/\D/g, '')) || 100 : 100
  const [grams, setGrams] = useState(defaultGrams)
  const [showIngredients, setShowIngredients] = useState(false)
  const [showAllAllergens, setShowAllAllergens] = useState(false)
  
  const adjustedMacros = useMemo(() => {
    if (!result?.macros) return null
    const ratio = grams / defaultGrams
    return {
      calories: Math.round(result.macros.calories * ratio),
      protein: Math.round(result.macros.protein * ratio),
      carbs: Math.round(result.macros.carbs * ratio),
      fat: Math.round(result.macros.fat * ratio),
      fiber: Math.round((result.macros.fiber || 0) * ratio),
      sugar: Math.round((result.macros.sugar || 0) * ratio),
    }
  }, [result?.macros, grams, defaultGrams])
  
  const incrementGrams = () => setGrams(prev => prev + 10)
  const decrementGrams = () => setGrams(prev => Math.max(10, prev - 10))

  if (!result || Object.keys(result).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 h-full">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6" />
        <p className="text-xl font-black text-foreground tracking-tighter animate-pulse uppercase tracking-[0.3em] opacity-40">{t("pr_syncing")}</p>
      </div>
    )
  }

  const score = result.healthScore?.overall ?? result.longevityScore ?? 50
  const getSuitabilityColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case "excelente": case "excellent": return "text-emerald-400"
      case "bom": case "good": return "text-blue-400"
      case "neutro": case "neutral": return "text-muted-foreground"
      case "ruim": case "poor": return "text-rose-400"
      default: return "text-muted-foreground"
    }
  }

  const getSuitabilityLabel = (s: string) => {
    const key = s.toLowerCase()
    if (key === "excelente" || key === "excellent") return t("pr_excelente")
    if (key === "bom" || key === "good") return t("pr_bom")
    if (key === "neutro" || key === "neutral") return t("pr_neutro")
    if (key === "ruim" || key === "poor") return t("pr_ruim")
    return s
  }

  const getScoreColor = (val: number) => {
    if (val >= 80) return "text-emerald-400"
    if (val >= 60) return "text-blue-400"
    if (val >= 40) return "text-yellow-400"
    if (val >= 20) return "text-orange-400"
    return "text-rose-400"
  }

  const getNOVAColor = (group: number) => {
    switch (group) {
      case 1: return "text-emerald-400 bg-emerald-500/10"
      case 2: return "text-blue-400 bg-blue-500/10"
      case 3: return "text-yellow-400 bg-yellow-500/10"
      case 4: return "text-rose-400 bg-rose-500/10"
      default: return "text-muted-foreground bg-muted/10"
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high": return "border-rose-500/30 bg-rose-500/5"
      case "medium": return "border-yellow-500/30 bg-yellow-500/5"
      case "low": return "border-blue-500/30 bg-blue-500/5"
      default: return "border-rose-500/30 bg-rose-500/5"
    }
  }

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case "high": return <AlertOctagon className="w-6 h-6 text-rose-500 shrink-0" />
      case "medium": return <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0" />
      case "low": return <Info className="w-6 h-6 text-blue-400 shrink-0" />
      default: return <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
    }
  }

  const healthScore = result.healthScore || { overall: score, nutrientDensity: 50, processingLevel: 50, additiveRisk: 50 }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-32 animate-in fade-in zoom-in duration-1000">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="icon" onClick={onBack} className="w-14 h-14 rounded-2xl bg-card border border-border haptic-press" aria-label="Voltar">
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <div className="flex items-center gap-3">
          <ShareActivityButton
            activityType="scan"
            activityData={{
              productName: result.productName,
              score: result.longevityScore,
              macros: result.macros,
            }}
          />
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-xs font-black uppercase tracking-[0.4em] opacity-40">{t("pr_neural_sync")}</span>
        </div>
      </div>

      {/* Hero Score Card */}
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative bg-card border border-border rounded-3xl md:rounded-2xl p-6 md:p-12 shadow-sm overflow-hidden group"
      >
        <div className="absolute inset-0 mesh-gradient opacity-10 group-hover:opacity-20 transition-opacity" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
           {/* Scanned Image */}
           {imageData && (
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="relative shrink-0"
             >
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-border shadow-xl">
                 <img 
                   src={imageData} 
                   alt={result.productName}
                   className="w-full h-full object-cover"
                 />
               </div>
               <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                 <Check className="w-4 h-4 text-white" />
               </div>
             </motion.div>
           )}

           {/* Score Ring */}
           <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full" />
         <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full border-8 border-border flex flex-col items-center justify-center bg-background/50 shadow-2xl">
                  <span className={cn("text-5xl md:text-7xl font-black tracking-tighter leading-none", getScoreColor(score))}>{score}</span>
                  <span className="text-xs font-black text-primary uppercase tracking-[0.3em] mt-2">{t("pr_score_bio")}</span>
               </div>
               <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 144 144">
                  <circle 
                    cx="72" cy="72" r="64" 
                    className="fill-none stroke-primary/30 stroke-[8]" 
                    strokeDasharray="402" 
                    strokeDashoffset={402 - (402 * score) / 100}
                   strokeLinecap="round"
                 />
              </svg>
           </div>

           <div className="flex-1 text-center md:text-left">
               <Badge className="bg-primary/20 text-primary border-none font-black text-xs tracking-widest px-4 py-2 rounded-full mb-6">
                 {result.category || t("pr_complete_synthesis")}
              </Badge>
               <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-[-0.06em] leading-tight mb-4 break-words">
                  {result.productName}
               </h1>
              <p className="text-2xl font-bold text-muted-foreground opacity-40 uppercase tracking-widest">{result.brand || t("pr_generic")}</p>
              {result.servingSize && (
                <p className="text-lg font-bold text-primary mt-2 uppercase tracking-widest">Porção: {result.servingSize}</p>
              )}
           </div>
        </div>
      </motion.div>

      {/* Health Score Breakdown */}
      {result.healthScore && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-6 md:p-8"
        >
          <h3 className="text-sm font-black uppercase tracking-[0.4em] opacity-30 mb-6">Breakdown da Pontuação</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Geral", value: healthScore.overall, icon: Heart },
              { label: "Densidade Nutricional", value: healthScore.nutrientDensity, icon: Sparkles },
              { label: "Nível de Processamento", value: healthScore.processingLevel, icon: Cookie },
              { label: "Risco de Aditivos", value: healthScore.additiveRisk, icon: Pill },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-foreground/5">
                <item.icon className={cn("w-6 h-6 mx-auto mb-2", getScoreColor(item.value))} />
                <p className={cn("text-2xl font-black", getScoreColor(item.value))}>{item.value}</p>
                <p className="text-xs font-bold text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Gram Adjustment */}
      {result.macros && (
        isPremium ? (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card border border-border rounded-2xl p-4 md:p-6 flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-primary" />
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Peso</span>
            </div>
            
            <div className="flex items-center gap-6">
              <button onClick={decrementGrams} className="w-12 h-12 rounded-full bg-muted/50 hover:bg-muted/50 flex items-center justify-center transition-colors" aria-label="Diminuir 10g">
                <Minus className="w-6 h-6" />
              </button>
              
              <div className="text-center min-w-[100px]">
                <p className="text-4xl font-black text-foreground tracking-tighter">{grams}g</p>
                <p className="text-xs font-bold text-primary opacity-60 uppercase tracking-widest">
                  {grams === defaultGrams ? `(padrão ${defaultGrams}g)` : `(original ${defaultGrams}g)`}
                </p>
              </div>
              
              <button onClick={incrementGrams} className="w-12 h-12 rounded-full bg-muted/50 hover:bg-muted/50 flex items-center justify-center transition-colors" aria-label="Aumentar 10g">
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <input type="range" min="10" max="500" step="10" value={grams} onChange={(e) => setGrams(parseInt(e.target.value))} className="w-full max-w-xs accent-primary" />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card border border-border rounded-2xl border-primary/30 p-4 md:p-6 flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              <span className="text-sm font-bold text-primary uppercase tracking-widest">Ajustar Peso</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">Disponível nos planos Pro e Premium</p>
          </motion.div>
        )
      )}

      {/* Macros */}
      {result.macros && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: "Calorias", val: (isPremium && adjustedMacros) ? adjustedMacros.calories : result.macros.calories, icon: Flame, color: "text-[#FF453A]", unit: "kcal" },
             { label: "Proteína", val: ((isPremium && adjustedMacros) ? adjustedMacros.protein : result.macros.protein), icon: Dumbbell, color: "text-[#0A84FF]", unit: "g" },
             { label: "Carboidratos", val: ((isPremium && adjustedMacros) ? adjustedMacros.carbs : result.macros.carbs), icon: Wheat, color: "text-[#FFD60A]", unit: "g" },
             { label: "Gordura", val: ((isPremium && adjustedMacros) ? adjustedMacros.fat : result.macros.fat), icon: Droplets, color: "text-[#FF375F]", unit: "g" },
             ...(result.macros.fiber ? [{ label: "Fibra", val: (isPremium && adjustedMacros) ? adjustedMacros.fiber : (result.macros.fiber || 0), icon: Leaf, color: "text-emerald-400", unit: "g" }] : []),
             ...(result.macros.sugar ? [{ label: "Açúcar", val: (isPremium && adjustedMacros) ? adjustedMacros.sugar : (result.macros.sugar || 0), icon: Cookie, color: "text-yellow-400", unit: "g" }] : []),
           ].map((m, i) => (
             <motion.div 
               key={i}
               whileHover={{ y: -10 }}
                 className="bg-card border border-border rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center gap-3 shadow-sm"
             >
                 <div className={cn("w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center", m.color)}>
                   <m.icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                   <p className="text-2xl font-black text-foreground tracking-tighter leading-none">{m.val}{m.unit}</p>
                   <p className="text-xs font-black opacity-30 mt-1 uppercase tracking-widest">{m.label}</p>
                </div>
             </motion.div>
           ))}
        </div>
      )}

      {/* NOVA Classification & Glycemic Index */}
      {(result.novaClassification || result.glycemicIndex) && (
        <div className="grid md:grid-cols-2 gap-4">
          {result.novaClassification && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", getNOVAColor(result.novaClassification.group))}>
                  <Cookie className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black">Classificação NOVA</h4>
                  <p className={cn("text-sm font-bold", getNOVAColor(result.novaClassification.group).split(' ')[0])}>
                    Grupo {result.novaClassification.group} - {result.novaClassification.label}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{result.novaClassification.description}</p>
            </motion.div>
          )}

          {result.glycemicIndex?.value !== null && result.glycemicIndex?.category && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-black">Índice Glicêmico</h4>
                  <p className="text-sm font-bold text-purple-400">
                    {result.glycemicIndex.value} - {result.glycemicIndex.category}
                  </p>
                </div>
              </div>
              {result.glycemicIndex.note && (
                <p className="text-sm text-muted-foreground">{result.glycemicIndex.note}</p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Allergens */}
      {result.allergens && result.allergens.length > 0 && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-border border-yellow-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h4 className="text-lg font-black text-yellow-500">Alérgenos Detectados</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.allergens.slice(0, showAllAllergens ? undefined : 6).map((allergen, i) => (
              <Badge key={i} className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-sm font-bold">
                {allergen}
              </Badge>
            ))}
            {result.allergens.length > 6 && (
              <button onClick={() => setShowAllAllergens(!showAllAllergens)} className="text-xs font-bold text-yellow-500 underline">
                {showAllAllergens ? "Ver menos" : `+${result.allergens.length - 6} mais`}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Fitness Alignment */}
      {result.fitnessAlignment && result.fitnessAlignment.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.4em] opacity-30">Alinhamento com Objetivos</h3>
          {result.fitnessAlignment.map((align, i) => (
            <motion.div 
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-card border border-border rounded-2xl p-6 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-black">{align.goal}</h4>
                  <span className={cn("text-sm font-black uppercase tracking-widest", getSuitabilityColor(align.suitability))}>
                    {getSuitabilityLabel(align.suitability)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{align.justification}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {result.alerts && result.alerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.4em] opacity-30">Alertas</h3>
          {result.alerts.map((a, i) => (
            <motion.div 
              key={i}
              whileHover={{ x: 10 }}
              className={cn("p-4 md:p-6 rounded-2xl bg-card border flex items-start gap-4", getSeverityColor(a.severity))}
            >
              {getSeverityIcon(a.severity)}
              <div>
                <h4 className="text-lg font-black tracking-tight mb-1">{a.title}</h4>
                <p className="text-sm font-bold text-muted-foreground">{a.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Benefits / Insights */}
      {result.insights && result.insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.4em] opacity-30">Benefícios</h3>
          {result.insights.map((ins, i) => (
            <motion.div 
              key={i}
              whileHover={{ x: 10 }}
              className="p-4 md:p-6 rounded-2xl bg-card border border-border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-4"
            >
              <Check className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-500/80">{ins.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Ingredients */}
      {result.ingredients && result.ingredients.length > 0 && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <button 
            onClick={() => setShowIngredients(!showIngredients)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <Apple className="w-6 h-6 text-primary" />
              <h4 className="text-lg font-black">Ingredientes ({result.ingredients.length})</h4>
            </div>
            {showIngredients ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          <AnimatePresence>
            {showIngredients && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-2">
                  {result.ingredients.map((ingredient, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-primary/50 shrink-0" />
                      {i === 0 && <span className="text-xs font-black text-primary">(principal)</span>}
                      {ingredient}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Recommendations */}
      {result.recommendations && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="text-sm font-black uppercase tracking-[0.4em] opacity-30 mb-4">Recomendações da IA</h3>
          <div className="space-y-4">
            {result.recommendations.bestFor && (
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-sm font-bold text-emerald-500 mb-1">Melhor para:</p>
                <p className="text-sm text-muted-foreground">{result.recommendations.bestFor}</p>
              </div>
            )}
            {result.recommendations.avoidIf && (
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                <p className="text-sm font-bold text-rose-500 mb-1">Evitar se:</p>
                <p className="text-sm text-muted-foreground">{result.recommendations.avoidIf}</p>
              </div>
            )}
            {result.recommendations.alternatives && (
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <p className="text-sm font-bold text-blue-400 mb-1">Alternativas:</p>
                <p className="text-sm text-muted-foreground">{result.recommendations.alternatives}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Health Benefits */}
      {result.benefits && (
        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase tracking-[0.4em] opacity-30">Benefícios para a Saúde</h3>
          
          {result.benefits.vitamins && result.benefits.vitamins.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-foreground" />
                <h4 className="text-lg font-black uppercase">Vitaminas</h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {result.benefits.vitamins.map((v, i) => {
                  const [name, benefit] = v.split(' - ')
                  return (
                    <div key={i} className="p-3 rounded-2xl bg-foreground/5 border border-foreground/10">
                      <p className="text-sm font-black">{name}</p>
                      {benefit && <p className="text-xs text-muted-foreground mt-1">{benefit}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {result.benefits.minerals && result.benefits.minerals.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Droplet className="w-6 h-6 text-cyan-400" />
                <h4 className="text-lg font-black text-cyan-400 uppercase">Minerais</h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {result.benefits.minerals.map((m, i) => {
                  const [name, benefit] = m.split(' - ')
                  return (
                    <div key={i} className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-sm font-black text-cyan-400">{name}</p>
                      {benefit && <p className="text-xs text-cyan-400/60 mt-1">{benefit}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Confidence */}
      {result.aiConfidence !== undefined && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Confiança da IA: {result.aiConfidence}%
          </p>
        </div>
      )}
    </div>
  )
}
