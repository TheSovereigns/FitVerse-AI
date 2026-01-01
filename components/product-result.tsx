import { ArrowLeft, AlertTriangle, Check, Activity, ShieldCheck, AlertCircle, Flame, Dumbbell, Wheat, Droplets } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface ProductAnalysis {
  productName: string
  longevityScore: number
  brand?: string
  alerts?: { title: string; description: string }[]
  insights?: { title?: string; description: string }[]
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

export function ProductResult({ result, onBack, imageData }: ProductResultProps) {
  if (!result || Object.keys(result).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 h-full">
        <Activity className="w-10 h-10 text-[#FF8C00] animate-pulse mb-4" />
        <p className="text-slate-400 animate-pulse">Sincronizando bio-marcadores...</p>
      </div>
    )
  }

  // Mapeamento de dados para a nova interface
  const productName = result.productName
  const score = result.longevityScore
  const attentionPoints = result.alerts?.map(a => a.title) ?? []
  const benefits = result.insights?.map(i => i.title || i.description) ?? []

  const getGoalAlignmentPercentage = (suitability: string): number => {
    switch (suitability?.toLowerCase()) {
      case "excelente": return 95
      case "bom": return 75
      case "neutro": return 50
      case "ruim": return 25
      default: return 30 // Valor de fallback
    }
  }

  const goalAlignment = result.fitnessAlignment && result.fitnessAlignment.length > 0
    ? getGoalAlignmentPercentage(result.fitnessAlignment[0].suitability)
    : 30

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 bg-black text-zinc-100 rounded-3xl border border-zinc-800/50 shadow-2xl animate-in fade-in duration-500">
      <div className="flex">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>

      {/* Header de Produto - Banner Centralizado */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900/30 border border-zinc-800 backdrop-blur-md p-6 group">
        {/* Cantoneiras Laranjas (Visual de Laboratório) */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary opacity-80" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary opacity-80" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary opacity-80" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary opacity-80" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center md:text-left space-y-2">
            <Badge variant="outline" className="border-primary text-primary bg-primary/10 px-3 py-1">
              BIO-SCANNER v2.0
            </Badge>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
                {productName}
              </h1>
              <p className="text-zinc-500 text-sm font-medium">
                Análise de composição e impacto metabólico
              </p>
            </div>
          </div>

          {/* Score Circular Pulsante */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full border-[3px] border-primary flex flex-col items-center justify-center bg-black/80 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
              <span className="text-4xl font-black text-white leading-none">{score}</span>
              <span className="text-[9px] text-primary font-bold uppercase tracking-widest mt-1">Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Macros Grid */}
      {result.macros && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-zinc-900/30 border border-zinc-800 backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center gap-1 group hover:border-primary/50 transition-colors">
            <Flame className="w-4 h-4 text-primary mb-1" />
            <span className="text-lg font-bold text-white">{result.macros.calories}</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Kcal</span>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center gap-1 group hover:border-primary/50 transition-colors">
            <Dumbbell className="w-4 h-4 text-primary mb-1" />
            <span className="text-lg font-bold text-white">{result.macros.protein}g</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Prot</span>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center gap-1 group hover:border-primary/50 transition-colors">
            <Wheat className="w-4 h-4 text-primary mb-1" />
            <span className="text-lg font-bold text-white">{result.macros.carbs}g</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Carb</span>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center gap-1 group hover:border-primary/50 transition-colors">
            <Droplets className="w-4 h-4 text-primary mb-1" />
            <span className="text-lg font-bold text-white">{result.macros.fat}g</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Gord</span>
          </div>
        </div>
      )}

      {/* Seção Alinhamento com Objetivos - Barra de Progresso */}
      <div className="space-y-3 bg-zinc-900/20 p-4 rounded-2xl border border-zinc-800/50">
        <div className="flex justify-between items-end">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary" />
            Compatibilidade Metabólica
          </h3>
          <span className="text-primary font-mono font-bold text-lg">{goalAlignment}%</span>
        </div>

        <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
          <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] gap-[1px] opacity-10 pointer-events-none">
            {[...Array(20)].map((_, i) => <div key={i} className="bg-white h-full w-[1px]" />)}
          </div>
          <div
            className="h-full bg-gradient-to-r from-primary to-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)] relative transition-all duration-1000 ease-out"
            style={{ width: `${goalAlignment}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white shadow-[0_0_5px_white]" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Grid de Pontos de Atenção (Gamificação) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 pl-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            Alertas
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {attentionPoints.map((point, i) => (
              <div key={i} className="bg-red-950/20 border border-red-500/20 rounded-lg p-2 flex flex-col items-center text-center gap-2 hover:bg-red-950/30 transition-colors group cursor-default backdrop-blur-md">
                <AlertCircle className="w-5 h-5 text-red-500 drop-shadow-[0_0_3px_rgba(239,68,68,0.5)] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-red-200/80 leading-tight line-clamp-2">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid de Benefícios */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 pl-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Benefícios
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {benefits.map((point, i) => (
              <div key={i} className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-2 flex flex-col items-center text-center gap-2 hover:bg-emerald-950/30 transition-colors group cursor-default backdrop-blur-md">
                <Check className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_3px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-emerald-200/80 leading-tight line-clamp-2">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}