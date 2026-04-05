"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, AlertTriangle, Check, Activity, ShieldCheck, AlertCircle, Flame, Dumbbell, Wheat, Droplets, Target, BarChart, Sparkles, ChevronRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface ProductAnalysis {
  productName: string
  longevityScore: number
  brand?: string
  alerts?: { title: string; description: string }[]
  insights?: { title?: string; description: string }[]
  servingSize?: string
  macros?: { calories: number; protein: number; carbs: number; fat: number }
  fitnessAlignment?: {
    goal: string
    suitability: "Excelente" | "Bom" | "Neutro" | "Ruim"
    justification: string
  }[]
}

interface ProductResultProps {
  result: ProductAnalysis | null
  onBack: () => void
  imageData?: string
}

import { useTranslation } from "@/lib/i18n"

export function ProductResult({ result, onBack, imageData }: ProductResultProps) {
  const { t } = useTranslation()
  if (!result || Object.keys(result).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 h-full">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6" />
        <p className="text-xl font-black text-foreground tracking-tighter animate-pulse uppercase tracking-[0.3em] opacity-40">{t("pr_syncing")}</p>
      </div>
    )
  }

  const score = result.longevityScore
  const getSuitabilityColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case "excelente": case "excellent": return "text-emerald-400"
      case "bom": case "good": return "text-blue-400"
      case "neutro": case "neutral": return "text-amber-400"
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in zoom-in duration-1000">
      {/* Revolutionary Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="icon" onClick={onBack} className="w-14 h-14 rounded-2xl glass-strong border-white/10 haptic-press" aria-label="Voltar para scan">
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">{t("pr_neural_sync")}</span>
        </div>
      </div>

      {/* Hero Evaluation Card */}
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative glass-strong border-white/20 rounded-[4rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden group"
      >
        <div className="absolute inset-0 mesh-gradient opacity-10 group-hover:opacity-20 transition-opacity" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
           {/* High-Fidelity Score Ring */}
           <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full" />
              <div className="relative w-48 h-48 rounded-full border-8 border-white/10 flex flex-col items-center justify-center bg-background/50 shadow-2xl backdrop-blur-xl">
                 <span className="text-7xl font-black text-foreground tracking-tighter leading-none">{score}</span>
                 <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">Score Bio</span>
              </div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle 
                   cx="96" cy="96" r="88" 
                   className="fill-none stroke-primary/30 stroke-[8]" 
                   strokeDasharray="552" 
                   strokeDashoffset={552 - (552 * score) / 100}
                   strokeLinecap="round"
                 />
              </svg>
           </div>

           <div className="flex-1 text-center md:text-left">
              <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] tracking-widest px-4 py-2 rounded-full mb-6">
                 {t("pr_complete_synthesis")}
              </Badge>
              <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-[-0.06em] leading-tight mb-4">
                 {result.productName}
              </h1>
              <p className="text-2xl font-bold text-muted-foreground opacity-40 uppercase tracking-widest">{result.brand || t("pr_generic")}</p>
           </div>
        </div>
      </motion.div>

      {/* Macros Bento Grid */}
      {result.macros && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: t("pr_kcal"), val: result.macros.calories, icon: Flame, color: "text-[#FF453A]" },
             { label: t("pr_prot"), val: result.macros.protein + "g", icon: Dumbbell, color: "text-[#0A84FF]" },
             { label: t("pr_carb"), val: result.macros.carbs + "g", icon: Wheat, color: "text-[#FFD60A]" },
             { label: t("pr_fat"), val: result.macros.fat + "g", icon: Droplets, color: "text-[#FF375F]" }
           ].map((m, i) => (
             <motion.div 
               key={i}
               whileHover={{ y: -10 }}
               className="glass-strong border-white/20 rounded-[3rem] p-8 flex flex-col items-center justify-center gap-4 shadow-xl"
             >
                <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center", m.color)}>
                   <m.icon className="w-7 h-7" />
                </div>
                <div className="text-center">
                   <p className="text-3xl font-black text-foreground tracking-tighter leading-none">{m.val}</p>
                   <p className="text-[10px] font-black opacity-30 mt-2 uppercase tracking-widest">{m.label}</p>
                </div>
             </motion.div>
           ))}
        </div>
      )}

      {/* Neural Alignment Protocol */}
      {result.fitnessAlignment && result.fitnessAlignment[0] && (
         <div className="glass-strong border-white/20 rounded-[4rem] p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col md:flex-row gap-10 items-start">
               <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Target className="w-10 h-10" />
               </div>
               <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-2xl font-black tracking-tight">{result.fitnessAlignment?.[0]?.goal}</h3>
                     <span className={cn("text-lg font-black uppercase tracking-widest", getSuitabilityColor(result.fitnessAlignment?.[0]?.suitability))}>
                        {getSuitabilityLabel(result.fitnessAlignment?.[0]?.suitability)}
                     </span>
                  </div>
                  <p className="text-lg font-bold text-muted-foreground leading-relaxed opacity-60">
                     {result.fitnessAlignment?.[0]?.justification}
                  </p>
               </div>
            </div>
         </div>
      )}

      {/* Alertas & Benefícios Bento */}
      <div className="grid md:grid-cols-2 gap-8">
         {/* Alertas */}
         <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.4em] opacity-30 ml-8">{t("pr_bio_risks")}</h3>
            <div className="space-y-4">
               {result.alerts?.map((a, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ x: 10 }}
                    className="p-8 rounded-[3rem] glass-strong border-rose-500/20 bg-rose-500/5 flex items-start gap-6"
                  >
                     <AlertCircle className="w-8 h-8 text-rose-500 shrink-0" />
                     <div>
                        <h4 className="text-xl font-black text-rose-500 tracking-tight mb-1">{a.title}</h4>
                        <p className="text-sm font-bold text-rose-500/60">{a.description}</p>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>

         {/* Benefícios */}
         <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.4em] opacity-30 ml-8">{t("pr_optimizers")}</h3>
            <div className="space-y-4">
               {result.insights?.map((ins, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ x: 10 }}
                    className="p-8 rounded-[3rem] glass-strong border-emerald-500/20 bg-emerald-500/5 flex items-start gap-6"
                  >
                     <Check className="w-8 h-8 text-emerald-500 shrink-0" />
                     <div>
                        <h4 className="text-xl font-black text-emerald-500 tracking-tight mb-1">{ins.title || "Bio-Insight"}</h4>
                        <p className="text-sm font-bold text-emerald-500/60">{ins.description}</p>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}