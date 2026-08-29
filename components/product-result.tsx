"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, AlertTriangle, Check, AlertCircle, Flame, Dumbbell, Wheat, Droplets, Sparkles, Heart, Leaf, Droplet, Scale, Plus, Minus, Info, Pill, Apple, Cookie, AlertOctagon, TrendingUp, Target, ChevronDown, ChevronUp, GitCompareArrows } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ShareActivityButton } from "@/components/share-activity-button"
import { toast } from "sonner"

export interface ProductAnalysis {
  productName: string
  longevityScore: number
  brand?: string
  category?: string
  servingSize?: string
  macros?: { calories: number; protein: number; carbs: number; fat: number; fiber?: number; sugar?: number; sodium?: number }
  micros?: { vitamins?: string[]; minerals?: string[] }
  ingredients?: string[]
  ingredientDetails?: { name: string; estimatedGrams: number; calories: number; protein: number; carbs: number; fat: number; fiber?: number }[]
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
  onSave?: () => void
  onDiscard?: () => void
  hasPendingSave?: boolean
}

import { useTranslation } from "@/lib/i18n"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { Lock } from "lucide-react"

export function ProductResult({ result, onBack, imageData, onSave, onDiscard, hasPendingSave }: ProductResultProps) {
  const { t } = useTranslation()
  const { plan } = usePlanLimits()
  const isPremium = plan === "pro" || plan === "premium"

  const [activeTab, setActiveTab] = useState<"overview"|"nutrients"|"ingredients"|"coach">("overview")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggleExpanded = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const defaultGrams = result?.servingSize ? parseInt(result.servingSize.replace(/\D/g, '')) || 100 : 100
  const [grams, setGrams] = useState(defaultGrams)
  const [showIngredients, setShowIngredients] = useState(false)
  const [showAllAllergens, setShowAllAllergens] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const [compareData, setCompareData] = useState<{ productName: string; brand?: string; score?: number; macros?: { calories: number; protein: number; carbs: number; fat: number }; category?: string } | null>(null)
  const hasIngredientDetails = (result?.ingredientDetails?.length ?? 0) > 0

  const defaultIngredientWeights = useMemo(() => {
    if (!result?.ingredientDetails) return []
    return result.ingredientDetails.map(ing => ({
      name: ing.name,
      grams: ing.estimatedGrams,
      calories: ing.calories,
      protein: ing.protein,
      carbs: ing.carbs,
      fat: ing.fat,
      fiber: ing.fiber ?? 0,
    }))
  }, [result?.ingredientDetails])

  const [ingredientWeights, setIngredientWeights] = useState<{name: string; grams: number; calories: number; protein: number; carbs: number; fat: number; fiber: number}[]>([])

  useEffect(() => {
    if (defaultIngredientWeights.length > 0) {
      setIngredientWeights(defaultIngredientWeights)
    }
  }, [defaultIngredientWeights])

  const totalIngredientGrams = useMemo(() => {
    return ingredientWeights.reduce((sum, iw) => sum + iw.grams, 0)
  }, [ingredientWeights])

  const toFavoriteId = (name: string) => name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  useEffect(() => {
    if (!result) return
    try {
      const favs = JSON.parse(localStorage.getItem("fitverse-favorites") || "[]") as string[]
      setIsFavorite(favs.includes(toFavoriteId(result.productName)))
    } catch {}
    try {
      const compare = JSON.parse(localStorage.getItem("fitverse-compare") || "null") as { productName: string } | null
      setIsComparing(compare?.productName === result.productName)
      if (compare?.productName === result.productName) {
        setCompareData(compare as { productName: string; brand?: string; score?: number; macros?: { calories: number; protein: number; carbs: number; fat: number }; category?: string })
      }
    } catch {}
  }, [result])

  useEffect(() => {
    if (isComparing) {
      try {
        const stored = localStorage.getItem("fitverse-compare")
        if (stored) setCompareData(JSON.parse(stored))
      } catch {}
    } else {
      setCompareData(null)
    }
  }, [isComparing])

  const toggleFavorite = () => {
    if (!result) return
    try {
      const favId = toFavoriteId(result.productName)
      const favs = JSON.parse(localStorage.getItem("fitverse-favorites") || "[]") as string[]
      const next = favs.includes(favId)
        ? favs.filter(f => f !== favId)
        : [...favs, favId]
      localStorage.setItem("fitverse-favorites", JSON.stringify(next))
      setIsFavorite(next.includes(favId))
      toast.success(next.includes(favId) ? t("scan_added_favorite") : t("scan_removed_favorite"))
    } catch {}
  }

  const toggleCompare = () => {
    if (!result) return
    try {
      const current = JSON.parse(localStorage.getItem("fitverse-compare") || "null") as { productName: string } | null
      if (current?.productName === result.productName) {
        localStorage.removeItem("fitverse-compare")
        setIsComparing(false)
      } else {
        localStorage.setItem("fitverse-compare", JSON.stringify({
          productName: result.productName,
          brand: result.brand,
          score: result.longevityScore,
          macros: result.macros,
          category: result.category,
        }))
        setIsComparing(true)
        toast.success(t("scan_compared"))
      }
    } catch {}
  }
  
  const adjustedMacros = useMemo(() => {
    if (!result?.macros) return null

    if (hasIngredientDetails && ingredientWeights.length > 0) {
      // Build map of original grams per ingredient to correctly scale when grams are edited.
      // Scaling needs originalGrams (estimatedGrams); fallback to defaultGrams / 100 or iw.grams (no scaling) if unavailable.
      const originalGramsMap: Record<string, number> = {}
      defaultIngredientWeights.forEach((iw) => {
        originalGramsMap[iw.name] = iw.grams
      })
      const totals = ingredientWeights.reduce(
        (acc, iw) => {
          const originalGrams = originalGramsMap[iw.name] || (result as any).grams || defaultGrams || iw.grams
          const ratio = iw.grams / (originalGrams || iw.grams || 1)
          acc.calories += iw.calories * ratio
          acc.protein += iw.protein * ratio
          acc.carbs += iw.carbs * ratio
          acc.fat += iw.fat * ratio
          acc.fiber += (iw.fiber || 0) * ratio
          return acc
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      )
      return {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        fiber: Math.round(totals.fiber),
        sugar: Math.round((result.macros.sugar || 0) * (totalIngredientGrams / (defaultGrams || 1))),
      }
    }

    const ratio = grams / (defaultGrams || 1)
    return {
      calories: Math.round(result.macros.calories * ratio),
      protein: Math.round(result.macros.protein * ratio),
      carbs: Math.round(result.macros.carbs * ratio),
      fat: Math.round(result.macros.fat * ratio),
      fiber: Math.round((result.macros.fiber || 0) * ratio),
      sugar: Math.round((result.macros.sugar || 0) * ratio),
    }
  }, [result?.macros, grams, defaultGrams, ingredientWeights, hasIngredientDetails, defaultIngredientWeights, totalIngredientGrams, result])
  
  const incrementGrams = () => setGrams(prev => prev + 10)
  const decrementGrams = () => setGrams(prev => Math.max(10, prev - 10))

  if (!result || Object.keys(result).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 h-full">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6" />
        <p className="text-xl font-bold text-foreground tracking-tighter animate-pulse uppercase tracking-widest opacity-40">{t("pr_syncing")}</p>
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

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "nutrients" as const, label: "Nutrients" },
    { id: "ingredients" as const, label: "Ingredients" },
    { id: "coach" as const, label: "Coach" },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 pb-32 animate-in fade-in zoom-in duration-1000">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="w-14 h-14 rounded-2xl bg-card border border-border haptic-press" aria-label="Voltar">
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <div className="flex items-center gap-3">
          <button onClick={toggleFavorite} className="w-14 h-14 rounded-2xl bg-card border border-border haptic-press flex items-center justify-center" aria-label="Favorite">
            <Heart className={cn("w-8 h-8", isFavorite ? "fill-rose-500 text-rose-500" : "")} />
          </button>
          <button onClick={toggleCompare} className={cn("w-14 h-14 rounded-2xl border haptic-press flex items-center justify-center", isComparing ? "bg-brand/10 border-brand/30" : "bg-card border-border")} aria-label="Compare">
            <GitCompareArrows className={cn("w-8 h-8", isComparing ? "text-brand" : "")} />
          </button>
          <ShareActivityButton
            activityType="scan"
            activityData={{
              productName: result.productName,
              score: result.longevityScore,
              macros: result.macros,
            }}
          />
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="section-label opacity-40">{t("pr_neural_sync")}</span>
        </div>
      </div>

      {/* Product identity header - always visible */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative glass-strong border border-border rounded-2xl p-5 md:p-6 overflow-hidden"
      >
        <div className="flex items-center gap-4">
          {imageData && (
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-border shadow">
                <img src={imageData} alt={result.productName} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Badge className="bg-brand/20 text-brand border-none font-bold text-[11px] tracking-wider px-3 py-1 rounded-full mb-2">
              {result.category || t("pr_complete_synthesis")}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight break-words line-clamp-2">
              {result.productName}
            </h1>
            <p className="text-sm font-bold text-muted-foreground opacity-60 uppercase tracking-widest truncate">{result.brand || t("pr_generic")}</p>
            {result.servingSize && (
              <p className="text-xs font-bold text-brand mt-1 uppercase tracking-widest">Porção: {result.servingSize}</p>
            )}
          </div>
          <div className="hidden md:flex flex-col items-center">
            <span className={cn("text-3xl font-black", getScoreColor(score))}>{score}</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t("pr_score_bio")}</span>
          </div>
        </div>
      </motion.div>

      {/* Tab bar sticky */}
      <div className="sticky top-14 z-10 flex gap-1 p-1 rounded-xl bg-muted/50 backdrop-blur-xl border border-border mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab: Score ring + Macros + Alerts only */}
      {activeTab === "overview" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Score Ring Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative glass-strong border border-border rounded-2xl p-6 md:p-8 shadow-sm overflow-hidden group"
          >
            <div className="absolute inset-0 mesh-gradient opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full" />
                <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full border-8 border-border flex flex-col items-center justify-center bg-background/50 shadow-2xl">
                  <span className={cn("text-5xl md:text-7xl font-black tracking-tighter leading-none", getScoreColor(score))}>{score}</span>
                  <span className="text-xs font-black text-primary uppercase tracking-widest mt-2">{t("pr_score_bio")}</span>
                </div>
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 144 144">
                  <defs>
                    <linearGradient id="scoreGradientOverview" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(160, 84%, 50%)" />
                      <stop offset="100%" stopColor="hsl(160, 84%, 40%)" />
                    </linearGradient>
                  </defs>
                  <circle cx="72" cy="72" r="64" className="fill-none stroke-primary/30 stroke-[8]" />
                  <circle cx="72" cy="72" r="64" fill="none" stroke="url(#scoreGradientOverview)" strokeWidth="8" strokeLinecap="round" strokeDasharray="402" strokeDashoffset={402 - (402 * score) / 100} />
                </svg>
              </div>
            </div>
            {result.healthScore && (
              <div className="relative z-10 mt-6 space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-widest opacity-30">{t("pr_breakdown")}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t("pr_overall"), value: healthScore.overall },
                    { label: t("pr_nutrient_density"), value: healthScore.nutrientDensity },
                    { label: t("pr_processing"), value: healthScore.processingLevel },
                    { label: t("pr_additive_risk"), value: healthScore.additiveRisk },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground line-clamp-1">{item.label}</span>
                        <span className={cn("text-xs font-black", getScoreColor(item.value))}>{item.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={cn("h-full rounded-full", getScoreColor(item.value).replace("text-", "bg-").replace("400", "500"))} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Weight Adjustment - keep in overview */}
          {result.macros && (
            isPremium ? (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-6 h-6 text-brand" />
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t("pr_weight_adjust")}</span>
                </div>
                {hasIngredientDetails ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-3">{t("pr_ingredients_detected").replace("{count}", String(ingredientWeights.length))}</p>
                    {ingredientWeights.map((iw, i) => {
                      const originalIng = defaultIngredientWeights[i]
                      if (!originalIng) return null
                      const ratio = iw.grams / (originalIng.grams || 1)
                      const ingCal = Math.round(iw.calories * ratio)
                      const ingProt = Math.round(iw.protein * ratio)
                      const ingCarbs = Math.round(iw.carbs * ratio)
                      const ingFat = Math.round(iw.fat * ratio)
                      return (
                        <div key={i} className="p-3 rounded-xl bg-foreground/5 border border-foreground/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-foreground line-clamp-1 flex-1 mr-2">{iw.name}</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => { const next = [...ingredientWeights]; next[i] = { ...next[i], grams: Math.max(5, next[i].grams - 10) }; setIngredientWeights(next) }} aria-label={`Decrease ${iw.name}`} className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center transition-colors"><Minus className="w-4 h-4" /></button>
                              <input type="number" value={iw.grams} onChange={(e) => { const val = Math.max(5, parseInt(e.target.value) || 5); const next = [...ingredientWeights]; next[i] = { ...next[i], grams: val }; setIngredientWeights(next) }} aria-label={`${iw.name} grams`} className="w-16 text-center text-sm font-black bg-muted/30 rounded-lg px-2 py-1 border border-border focus:border-primary focus:outline-none" />
                              <button onClick={() => { const next = [...ingredientWeights]; next[i] = { ...next[i], grams: next[i].grams + 10 }; setIngredientWeights(next) }} aria-label={`Increase ${iw.name}`} className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center transition-colors"><Plus className="w-4 h-4" /></button>
                              <span className="text-xs font-bold text-muted-foreground ml-1">g</span>
                            </div>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span><Flame className="w-3 h-3 inline text-[#FF453A]" /> {ingCal}</span>
                            <span><Dumbbell className="w-3 h-3 inline text-[#0A84FF]" /> {ingProt}g</span>
                            <span><Wheat className="w-3 h-3 inline text-[#FFD60A]" /> {ingCarbs}g</span>
                            <span><Droplets className="w-3 h-3 inline text-[#FF375F]" /> {ingFat}g</span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs font-bold text-muted-foreground uppercase">{t("pr_total")}</span>
                      <span className="text-lg font-bold text-brand">{totalIngredientGrams}g</span>
                    </div>
                    <button onClick={() => setIngredientWeights(defaultIngredientWeights)} className="w-full text-xs font-bold text-muted-foreground hover:text-foreground py-2 rounded-xl hover:bg-muted/30 transition-colors">{t("pr_reset_weights")}</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6">
                      <button onClick={decrementGrams} className="w-12 h-12 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center transition-colors" aria-label="Diminuir 10g"><Minus className="w-6 h-6" /></button>
                      <div className="text-center min-w-[100px]">
                        <p className="text-4xl font-black text-foreground tracking-tighter">{grams}g</p>
                        <p className="text-xs font-bold text-primary opacity-60 uppercase tracking-widest">{grams === defaultGrams ? `(padrão ${defaultGrams}g)` : `(original ${defaultGrams}g)`}</p>
                      </div>
                      <button onClick={incrementGrams} className="w-12 h-12 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center transition-colors" aria-label="Aumentar 10g"><Plus className="w-6 h-6" /></button>
                    </div>
                    <input type="range" min="10" max="500" step="10" value={grams} onChange={(e) => setGrams(parseInt(e.target.value))} className="w-full max-w-xs accent-primary" />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border rounded-2xl border-brand/30 p-4 md:p-6 flex flex-col items-center gap-4">
                <div className="flex items-center gap-3"><Lock className="w-6 h-6 text-brand" /><span className="text-sm font-bold text-brand uppercase tracking-widest">{t("pr_weight_adjust")}</span></div>
                <p className="text-sm text-muted-foreground text-center line-clamp-2">{t("pr_weight_desc")}</p>
              </motion.div>
            )
          )}

          {/* Macros */}
          {result.macros && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border rounded-2xl p-5 md:p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-30">{t("pr_macros")}</h3>
              <div className="space-y-3">
                {[
                  { label: t("common_p"), val: (isPremium && adjustedMacros) ? adjustedMacros.protein : result.macros.protein, color: "bg-brand", textColor: "text-brand", max: 50 },
                  { label: t("common_c"), val: (isPremium && adjustedMacros) ? adjustedMacros.carbs : result.macros.carbs, color: "bg-amber-400", textColor: "text-amber-400", max: 80 },
                  { label: t("common_g"), val: (isPremium && adjustedMacros) ? adjustedMacros.fat : result.macros.fat, color: "bg-rose-400", textColor: "text-rose-400", max: 30 },
                  ...(result.macros.fiber ? [{ label: "Fibra", val: (isPremium && adjustedMacros) ? adjustedMacros.fiber : (result.macros.fiber || 0), color: "bg-emerald-400", textColor: "text-emerald-400", max: 15 }] : []),
                  ...(result.macros.sugar ? [{ label: "Açúcar", val: (isPremium && adjustedMacros) ? adjustedMacros.sugar : (result.macros.sugar || 0), color: "bg-yellow-400", textColor: "text-yellow-400", max: 25 }] : []),
                ].map((m, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-foreground">{m.label}</span><span className={`text-sm font-black ${m.textColor}`}>{Math.round(m.val)}g</span></div>
                    <div className="h-2 rounded-full bg-border overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((m.val / m.max) * 100, 100)}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full rounded-full ${m.color}`} /></div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-border"><p className="text-sm font-black text-foreground">{(isPremium && adjustedMacros ? adjustedMacros.calories : result.macros.calories)} kcal</p><p className="text-xs text-muted-foreground mt-0.5">{t("pr_total_cal")}</p></div>
            </motion.div>
          )}

          {/* Alerts */}
          {result.alerts && result.alerts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-30">Alertas</h3>
              {result.alerts.map((a, i) => {
                const expKey = `alert-${i}`
                const isExp = expanded[expKey]
                return (
                  <motion.div key={i} whileHover={{ x: 10 }} className={cn("p-4 md:p-6 rounded-2xl glass-strong border flex items-start gap-4", getSeverityColor(a.severity))}>
                    {getSeverityIcon(a.severity)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold tracking-tight mb-1 line-clamp-2">{a.title}</h4>
                      <p className={cn("text-sm font-bold text-muted-foreground", !isExp && "line-clamp-2")}>{a.description}</p>
                      {a.description && a.description.length > 100 && (
                        <button onClick={() => toggleExpanded(expKey)} className="text-xs font-bold text-brand mt-1 hover:underline">{isExp ? "Ver menos" : "Expand"}</button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {result.aiConfidence !== undefined && (
            <div className="text-center py-2"><p className="text-xs text-muted-foreground">Confiança da IA: {result.aiConfidence}%</p></div>
          )}
        </div>
      )}

      {/* Nutrients tab */}
      {activeTab === "nutrients" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* NOVA + GI */}
          {(result.novaClassification || result.glycemicIndex) && (
            <div className="grid md:grid-cols-2 gap-4">
              {result.novaClassification && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", getNOVAColor(result.novaClassification.group))}><Cookie className="w-6 h-6" /></div>
                    <div><h4 className="text-lg font-bold">Classificação NOVA</h4><p className={cn("text-sm font-bold", getNOVAColor(result.novaClassification.group).split(' ')[0])}>Grupo {result.novaClassification.group} - {result.novaClassification.label}</p></div>
                  </div>
                  <p className={cn("text-sm text-muted-foreground", !expanded["nova-desc"] && "line-clamp-2")}>{result.novaClassification.description}</p>
                  {result.novaClassification.description && result.novaClassification.description.length > 100 && (
                    <button onClick={() => toggleExpanded("nova-desc")} className="text-xs font-bold text-brand mt-1 hover:underline">{expanded["nova-desc"] ? "Ver menos" : "Expand"}</button>
                  )}
                </motion.div>
              )}
              {result.glycemicIndex?.value !== null && result.glycemicIndex?.category && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-purple-400" /></div>
                    <div><h4 className="text-lg font-bold">Índice Glicêmico</h4><p className="text-sm font-bold text-purple-400">{result.glycemicIndex.value} - {result.glycemicIndex.category}</p></div>
                  </div>
                  {result.glycemicIndex.note && (
                    <>
                      <p className={cn("text-sm text-muted-foreground", !expanded["gi-note"] && "line-clamp-2")}>{result.glycemicIndex.note}</p>
                      {result.glycemicIndex.note.length > 100 && (
                        <button onClick={() => toggleExpanded("gi-note")} className="text-xs font-bold text-brand mt-1 hover:underline">{expanded["gi-note"] ? "Ver menos" : "Expand"}</button>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Macros detail */}
          {result.macros && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border rounded-2xl p-5 md:p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-30">Detalhe de Macros + Vitaminas</h3>
              <div className="space-y-3">
                {[
                  { label: t("common_p"), val: (isPremium && adjustedMacros) ? adjustedMacros.protein : result.macros.protein, color: "bg-brand", textColor: "text-brand", max: 50 },
                  { label: t("common_c"), val: (isPremium && adjustedMacros) ? adjustedMacros.carbs : result.macros.carbs, color: "bg-amber-400", textColor: "text-amber-400", max: 80 },
                  { label: t("common_g"), val: (isPremium && adjustedMacros) ? adjustedMacros.fat : result.macros.fat, color: "bg-rose-400", textColor: "text-rose-400", max: 30 },
                  ...(result.macros.fiber ? [{ label: "Fibra", val: (isPremium && adjustedMacros) ? adjustedMacros.fiber : (result.macros.fiber || 0), color: "bg-emerald-400", textColor: "text-emerald-400", max: 15 }] : []),
                  ...(result.macros.sugar ? [{ label: "Açúcar", val: (isPremium && adjustedMacros) ? adjustedMacros.sugar : (result.macros.sugar || 0), color: "bg-yellow-400", textColor: "text-yellow-400", max: 25 }] : []),
                  ...(result.macros.sodium ? [{ label: "Sódio", val: result.macros.sodium, color: "bg-blue-400", textColor: "text-blue-400", max: 2300 }] : []),
                ].map((m, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-foreground">{m.label}</span><span className={`text-sm font-black ${m.textColor}`}>{Math.round(m.val)}g</span></div>
                    <div className="h-2 rounded-full bg-border overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((m.val / m.max) * 100, 100)}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} className={`h-full rounded-full ${m.color}`} /></div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-border flex justify-between"><p className="text-sm font-black text-foreground">{(isPremium && adjustedMacros ? adjustedMacros.calories : result.macros.calories)} kcal</p><p className="text-xs text-muted-foreground">Total</p></div>
            </motion.div>
          )}

          {/* Vitamins/minerals */}
          {result.micros && ((result.micros.vitamins && result.micros.vitamins.length > 0) || (result.micros.minerals && result.micros.minerals.length > 0)) && (
            <div className="grid md:grid-cols-2 gap-4">
              {result.micros.vitamins && result.micros.vitamins.length > 0 && (
                <div className="glass-strong border border-border rounded-2xl p-5">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2"><Pill className="w-4 h-4 text-brand" /> Vitaminas</h4>
                  <div className="flex flex-wrap gap-2">{result.micros.vitamins.map((v,i)=>(<Badge key={i} variant="secondary" className="bg-brand/10 text-brand border-brand/20">{v}</Badge>))}</div>
                </div>
              )}
              {result.micros.minerals && result.micros.minerals.length > 0 && (
                <div className="glass-strong border border-border rounded-2xl p-5">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2"><Droplet className="w-4 h-4 text-cyan-400" /> Minerais</h4>
                  <div className="flex flex-wrap gap-2">{result.micros.minerals.map((m,i)=>(<Badge key={i} variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">{m}</Badge>))}</div>
                </div>
              )}
            </div>
          )}

          {/* Health Benefits detailed */}
          {result.benefits && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-30">Benefícios para a Saúde</h3>
              {result.benefits.vitamins && result.benefits.vitamins.length > 0 && (
                <div className="glass-strong border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4"><Sparkles className="w-6 h-6 text-foreground" /><h4 className="text-lg font-bold uppercase">Vitaminas</h4></div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {result.benefits.vitamins.map((v, i) => {
                      const [name, benefit] = v.split(' - ')
                      const expKey = `ben-vit-${i}`
                      const isExp = expanded[expKey]
                      return (
                        <div key={i} className="p-3 rounded-2xl bg-foreground/5 border border-foreground/10">
                          <p className="text-sm font-black line-clamp-2">{name}</p>
                          {benefit && (<><p className={cn("text-xs text-muted-foreground mt-1", !isExp && "line-clamp-2")}>{benefit}</p>{benefit.length > 80 && (<button onClick={() => toggleExpanded(expKey)} className="text-[11px] font-bold text-brand mt-1">{isExp ? "Ver menos" : "Expand"}</button>)}</>)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {result.benefits.minerals && result.benefits.minerals.length > 0 && (
                <div className="glass-strong border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4"><Droplet className="w-6 h-6 text-cyan-400" /><h4 className="text-lg font-bold text-cyan-400 uppercase">Minerais</h4></div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {result.benefits.minerals.map((m, i) => {
                      const [name, benefit] = m.split(' - ')
                      const expKey = `ben-min-${i}`
                      const isExp = expanded[expKey]
                      return (
                        <div key={i} className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                          <p className="text-sm font-black text-cyan-400 line-clamp-2">{name}</p>
                          {benefit && (<><p className={cn("text-xs text-cyan-400/60 mt-1", !isExp && "line-clamp-2")}>{benefit}</p>{benefit.length > 80 && (<button onClick={() => toggleExpanded(expKey)} className="text-[11px] font-bold text-cyan-400 mt-1">{isExp ? "Ver menos" : "Expand"}</button>)}</>)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {result.benefits.proteins && result.benefits.proteins.length > 0 && (
                <div className="glass-strong border border-border rounded-2xl p-6">
                  <h4 className="text-lg font-bold uppercase mb-3">Proteínas</h4>
                  <div className="flex flex-wrap gap-2">{result.benefits.proteins.map((p,i)=>(<Badge key={i} variant="secondary">{p}</Badge>))}</div>
                </div>
              )}
            </div>
          )}

          {/* Insights as Nutrients benefits */}
          {result.insights && result.insights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-30">Benefícios</h3>
              {result.insights.map((ins, i) => {
                const expKey = `insight-nut-${i}`
                const isExp = expanded[expKey]
                return (
                  <motion.div key={i} whileHover={{ x: 10 }} className="p-4 md:p-6 rounded-2xl glass-strong border border-border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-4">
                    <Check className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {ins.title && <p className="text-sm font-black mb-1 line-clamp-2">{ins.title}</p>}
                      <p className={cn("text-sm font-bold text-emerald-500/80", !isExp && "line-clamp-2")}>{ins.description}</p>
                      {ins.description.length > 100 && (<button onClick={() => toggleExpanded(expKey)} className="text-xs font-bold text-emerald-600 mt-1">{isExp ? "Ver menos" : "Expand"}</button>)}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Ingredients tab */}
      {activeTab === "ingredients" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {result.allergens && result.allergens.length > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4"><AlertTriangle className="w-6 h-6 text-yellow-500" /><h4 className="text-lg font-bold text-yellow-500">Alérgenos Detectados</h4></div>
              <div className="flex flex-wrap gap-2">
                {result.allergens.slice(0, showAllAllergens ? undefined : 6).map((allergen, i) => (<Badge key={i} className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-sm font-bold">{allergen}</Badge>))}
                {result.allergens.length > 6 && (<button onClick={() => setShowAllAllergens(!showAllAllergens)} className="text-xs font-bold text-yellow-500 underline">{showAllAllergens ? "Ver menos" : `+${result.allergens.length - 6} mais`}</button>)}
              </div>
            </motion.div>
          )}

          {result.ingredients && result.ingredients.length > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border rounded-2xl p-6">
              <button onClick={() => setShowIngredients(!showIngredients)} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3"><Apple className="w-6 h-6 text-brand" /><h4 className="text-lg font-bold">Ingredientes ({result.ingredients.length})</h4></div>
                {showIngredients ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              <AnimatePresence>
                {showIngredients && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-4 space-y-2">
                      {result.ingredients.map((ingredient, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="w-2 h-2 rounded-full bg-brand/50 shrink-0" />
                          {i === 0 && <span className="text-xs font-black text-brand">(principal)</span>}
                          <span className="line-clamp-2 flex-1">{ingredient}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {result.ingredientDetails && result.ingredientDetails.length > 0 && !showIngredients && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border rounded-2xl p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2"><Leaf className="w-5 h-5 text-brand" /> Detalhe por Ingrediente</h4>
              <div className="space-y-2">
                {result.ingredientDetails.map((ing, i) => {
                  const expKey = `ing-detail-${i}`
                  const isExp = expanded[expKey]
                  return (
                    <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border">
                      <p className="text-sm font-bold text-foreground">{ing.name} — {ing.estimatedGrams}g</p>
                      <p className={cn("text-xs text-muted-foreground mt-1", !isExp && "line-clamp-2")}>{ing.calories} kcal · P {ing.protein}g · C {ing.carbs}g · G {ing.fat}g {ing.fiber ? `· Fibra ${ing.fiber}g` : ""}</p>
                      {(String(ing.name).length > 60) && (<button onClick={() => toggleExpanded(expKey)} className="text-[11px] font-bold text-brand mt-1">{isExp ? "Ver menos" : "Expand"}</button>)}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {(!result.ingredients || result.ingredients.length === 0) && (!result.allergens || result.allergens.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="empty-state-icon"><Apple className="w-8 h-8" /></div>
              <h3 className="text-base font-semibold mb-1">Sem ingredientes detectados</h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground max-w-[280px] mb-4">Não foi possível identificar a lista de ingredientes para este produto.</p>
            </div>
          )}
        </div>
      )}

      {/* Coach tab */}
      {activeTab === "coach" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {result.fitnessAlignment && result.fitnessAlignment.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-30">Alinhamento com Objetivos</h3>
              {result.fitnessAlignment.map((align, i) => {
                const expKey = `fitness-${i}`
                const isExp = expanded[expKey]
                return (
                  <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Target className="w-6 h-6" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <h4 className="text-lg font-bold line-clamp-2 flex-1">{align.goal}</h4>
                        <span className={cn("text-sm font-black uppercase tracking-widest shrink-0", getSuitabilityColor(align.suitability))}>{getSuitabilityLabel(align.suitability)}</span>
                      </div>
                      <p className={cn("text-sm text-muted-foreground", !isExp && "line-clamp-2")}>{align.justification}</p>
                      {align.justification.length > 100 && (<button onClick={() => toggleExpanded(expKey)} className="text-xs font-bold text-brand mt-1 hover:underline">{isExp ? "Ver menos" : "Expand"}</button>)}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {result.recommendations && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border rounded-2xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-30 mb-4">Recomendações da IA</h3>
              <div className="space-y-4">
                {result.recommendations.bestFor && (
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-sm font-bold text-emerald-500 mb-1">Melhor para:</p>
                    <p className={cn("text-sm text-muted-foreground", !expanded["rec-best"] && "line-clamp-2")}>{result.recommendations.bestFor}</p>
                    {result.recommendations.bestFor.length > 100 && (<button onClick={() => toggleExpanded("rec-best")} className="text-xs font-bold text-emerald-600 mt-1">{expanded["rec-best"] ? "Ver menos" : "Expand"}</button>)}
                  </div>
                )}
                {result.recommendations.avoidIf && (
                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                    <p className="text-sm font-bold text-rose-500 mb-1">Evitar se:</p>
                    <p className={cn("text-sm text-muted-foreground", !expanded["rec-avoid"] && "line-clamp-2")}>{result.recommendations.avoidIf}</p>
                    {result.recommendations.avoidIf.length > 100 && (<button onClick={() => toggleExpanded("rec-avoid")} className="text-xs font-bold text-rose-500 mt-1">{expanded["rec-avoid"] ? "Ver menos" : "Expand"}</button>)}
                  </div>
                )}
                {result.recommendations.alternatives && (
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <p className="text-sm font-bold text-blue-400 mb-1">Alternativas:</p>
                    <p className={cn("text-sm text-muted-foreground", !expanded["rec-alt"] && "line-clamp-2")}>{result.recommendations.alternatives}</p>
                    {result.recommendations.alternatives.length > 100 && (<button onClick={() => toggleExpanded("rec-alt")} className="text-xs font-bold text-blue-400 mt-1">{expanded["rec-alt"] ? "Ver menos" : "Expand"}</button>)}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {result.insights && result.insights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-30">Insights do Coach</h3>
              {result.insights.map((ins, i) => {
                const expKey = `insight-coach-${i}`
                const isExp = expanded[expKey]
                return (
                  <motion.div key={i} whileHover={{ x: 10 }} className="p-4 md:p-6 rounded-2xl glass-strong border border-border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-4">
                    <Check className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {ins.title && <p className="text-sm font-black mb-1 line-clamp-2">{ins.title}</p>}
                      <p className={cn("text-sm font-bold text-emerald-500/80", !isExp && "line-clamp-2")}>{ins.description}</p>
                      {ins.description.length > 100 && (<button onClick={() => toggleExpanded(expKey)} className="text-xs font-bold text-emerald-600 mt-1">{isExp ? "Ver menos" : "Expand"}</button>)}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {(!result.fitnessAlignment || result.fitnessAlignment.length === 0) && (!result.recommendations || (!result.recommendations.bestFor && !result.recommendations.avoidIf && !result.recommendations.alternatives)) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="empty-state-icon"><Target className="w-8 h-8" /></div>
              <h3 className="text-base font-semibold mb-1">Sem recomendações</h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground max-w-[280px] mb-4">Nenhuma recomendação de coach disponível para este produto ainda.</p>
              <Button className="h-11 rounded-xl bg-brand text-brand-foreground">Explorar treinos</Button>
            </div>
          )}
        </div>
      )}

      {/* Compare Side by Side - always visible regardless of tab */}
      {compareData && compareData.productName !== result.productName && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest opacity-30">{t("scan_compare")}</h3>
            <button onClick={() => { localStorage.removeItem("fitverse-compare"); setIsComparing(false); setCompareData(null) }} className="text-xs font-bold text-muted-foreground underline">{t("scan_clear_compare")}</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2 line-clamp-2">{result.productName}</p>
              {result.brand && <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{result.brand}</p>}
              <p className={cn("text-3xl font-black", getScoreColor(score))}>{score}</p>
              {result.macros && (<div className="mt-2 space-y-1 text-xs text-muted-foreground"><p>{result.macros.calories} kcal</p><p>P: {result.macros.protein}g | C: {result.macros.carbs}g | G: {result.macros.fat}g</p></div>)}
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 line-clamp-2">{compareData.productName}</p>
              {compareData.brand && <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{compareData.brand}</p>}
              {compareData.score != null && (<p className={cn("text-3xl font-black", getScoreColor(compareData.score))}>{compareData.score}</p>)}
              {compareData.macros && (<div className="mt-2 space-y-1 text-xs text-muted-foreground"><p>{compareData.macros.calories} kcal</p><p>P: {compareData.macros.protein}g | C: {compareData.macros.carbs}g | G: {compareData.macros.fat}g</p></div>)}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
