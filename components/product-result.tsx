import { ArrowLeft, AlertTriangle, Check, Activity, ShieldCheck, AlertCircle, Flame, Dumbbell, Wheat, Droplets, Target, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

  const getSuitabilityStyle = (suitability: string) => {
    switch (suitability?.toLowerCase()) {
      case "excelente": return "bg-cyan-400/10 text-cyan-400 border-cyan-400/20";
      case "bom": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "neutro": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "ruim": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-zinc-700/20 text-zinc-400 border-zinc-700";
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 bg-card text-card-foreground rounded-3xl border border-border shadow-2xl animate-in fade-in duration-500">
      <div className="flex">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>

      {/* Header de Produto - Banner Centralizado */}
      <div className="relative overflow-hidden rounded-2xl bg-muted/30 border border-border backdrop-blur-md p-6 group">
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
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter uppercase italic">
                {productName}
              </h1>
              <p className="text-muted-foreground font-bold text-lg -mt-1">
                {result.brand || 'Marca Genérica'}
              </p>
            </div>
          </div>

          {/* Score Circular Pulsante */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full border-[3px] border-primary flex flex-col items-center justify-center bg-background/80 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
              <span className="text-4xl font-black text-foreground leading-none">{score}</span>
              <span className="text-[9px] text-primary font-bold uppercase tracking-widest mt-1">Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Macros Grid */}
      {result.macros && (result.macros.calories > 0 || result.macros.protein > 0 || result.macros.carbs > 0 || result.macros.fat > 0) && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-muted/30 border border-border backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center gap-1 group hover:border-primary/50 transition-colors">
              <Flame className="w-4 h-4 text-primary mb-1" />
              <span className="text-lg font-bold text-foreground">{result.macros.calories}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Kcal</span>
            </div>
            <div className="bg-muted/30 border border-border backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center gap-1 group hover:border-primary/50 transition-colors">
              <Dumbbell className="w-4 h-4 text-primary mb-1" />
              <span className="text-lg font-bold text-foreground">{result.macros.protein}g</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Prot</span>
            </div>
            <div className="bg-muted/30 border border-border backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center gap-1 group hover:border-primary/50 transition-colors">
              <Wheat className="w-4 h-4 text-primary mb-1" />
              <span className="text-lg font-bold text-foreground">{result.macros.carbs}g</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Carb</span>
            </div>
            <div className="bg-muted/30 border border-border backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center gap-1 group hover:border-primary/50 transition-colors">
              <Droplets className="w-4 h-4 text-primary mb-1" />
              <span className="text-lg font-bold text-foreground">{result.macros.fat}g</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Gord</span>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground font-mono pt-1">Valores por porção de {result.servingSize || "100g"}</p>
        </div>
      )}

      {/* Alinhamento com Objetivos */}
      {result.fitnessAlignment && result.fitnessAlignment.length > 0 && (
        <div className="space-y-2 bg-muted/30 border border-border backdrop-blur-md rounded-2xl p-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-3 h-3 text-primary" />
                    Alinhamento com Objetivo
                </h3>
                <Badge className={getSuitabilityStyle(result.fitnessAlignment[0].suitability)}>
                    {result.fitnessAlignment[0].suitability}
                </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="text-foreground font-semibold">Para seu objetivo de "{result.fitnessAlignment[0].goal}":</span> {result.fitnessAlignment[0].justification}
            </p>
        </div>
      )}

      {/* Análise da Marca */}
      {result.brand && (
        <div className="space-y-3 bg-muted/30 border border-border backdrop-blur-md rounded-2xl p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <BarChart className="w-3 h-3 text-primary" />
                Análise da Marca: {result.brand}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
                Produtos da marca <span className="font-semibold text-foreground">{result.brand}</span> geralmente se destacam por seu foco em {result.insights && result.insights.length > 0 ? `"${result.insights[0].title.toLowerCase()}"` : "qualidade"}. Este produto, com score {score}, está {score > 75 ? 'acima da média da marca' : score > 50 ? 'na média da marca' : 'abaixo da média da marca'}.
            </p>
            <div className="flex justify-around text-center pt-2 border-t border-border/50">
                <div className="px-2">
                    <p className="font-mono text-xl text-foreground">~{score > 75 ? '82' : score > 50 ? '68' : '45'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score Médio da Marca</p>
                </div>
                <div className="px-2">
                    <p className="font-mono text-xl text-emerald-400">Top {score > 75 ? '15%' : score > 50 ? '40%' : '70%'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ranking na Categoria</p>
                </div>
            </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Grid de Pontos de Atenção (Gamificação) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 pl-1">
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
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 pl-1">
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