import { ArrowLeft, AlertTriangle, CheckCircle, Activity, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ProductAnalysis {
  productName: string
  longevityScore: number
  brand?: string
  alerts?: { title: string; description: string; severity?: string }[]
  insights?: { title?: string; description: string; type?: string }[]
  macros?: { calories: number; protein: number; carbs: number; fat: number }
  ingredients?: string[]
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

  const score = result.longevityScore || 0
  const scoreColor = score >= 70 ? "text-green-500" : score >= 40 ? "text-yellow-500" : "text-red-500"
  const scoreBorder = score >= 70 ? "border-green-500" : score >= 40 ? "border-yellow-500" : "border-red-500"
  const scoreBg = score >= 70 ? "bg-green-500/10" : score >= 40 ? "bg-yellow-500/10" : "bg-red-500/10"

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Análise de Longevidade</h1>
      </div>

      {/* Score Card */}
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between relative overflow-hidden shadow-lg">
        <div className="z-10 max-w-[60%]">
          <h2 className="text-2xl font-bold text-foreground mb-1 leading-tight">{result.productName}</h2>
          <p className="text-muted-foreground text-sm">{result.brand || "Marca não identificada"}</p>
        </div>
        
        <div className={`relative w-20 h-20 flex items-center justify-center rounded-full border-4 ${scoreBorder} bg-background z-10 shadow-2xl`}>
          <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
        </div>
        
        {/* Background Glow */}
        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 ${scoreBg} blur-3xl rounded-full pointer-events-none opacity-50`} />
      </div>

      {/* Alerts */}
      {result.alerts && result.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Pontos de Atenção</h3>
          {result.alerts.map((alert, index) => (
            <div key={index} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-400 text-sm">{alert.title}</p>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {result.insights && result.insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Benefícios</h3>
          {result.insights.map((insight, index) => (
            <div key={index} className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex gap-3 items-start">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-green-400 text-sm">{insight.title || "Ponto Positivo"}</p>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fitness Goal Alignment */}
      {result.fitnessAlignment && result.fitnessAlignment.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-2">
            <Target className="w-3 h-3" />
            Alinhamento com Objetivos
          </h3>
          {result.fitnessAlignment.map((alignment, index) => {
            const suitabilityColor =
              alignment.suitability === "Excelente" ? "text-cyan-400" :
              alignment.suitability === "Bom" ? "text-green-400" :
              alignment.suitability === "Neutro" ? "text-yellow-400" : "text-red-400"
            const suitabilityBg =
              alignment.suitability === "Excelente" ? "bg-cyan-500/10 border-cyan-500/20" :
              alignment.suitability === "Bom" ? "bg-green-500/10 border-green-500/20" :
              alignment.suitability === "Neutro" ? "bg-yellow-500/10 border-yellow-500/20" : "bg-red-500/10 border-red-500/20"

            return (
              <div key={index} className="bg-card border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-foreground text-sm">{alignment.goal}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${suitabilityBg} ${suitabilityColor}`}>{alignment.suitability}</span>
                </div>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{alignment.justification}</p>
              </div>
            )})}
        </div>
      )}
      
      {/* Macros (Optional) */}
      {result.macros && (result.macros.calories > 0 || result.macros.protein > 0) && (
         <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Informação Nutricional</h3>
            <div className="grid grid-cols-4 gap-2">
                <div className="bg-card p-3 rounded-xl text-center border border-border">
                <p className="text-[10px] text-muted-foreground uppercase">Kcal</p>
                <p className="font-bold text-foreground text-sm">{result.macros.calories}</p>
                </div>
                <div className="bg-card p-3 rounded-xl text-center border border-border">
                <p className="text-[10px] text-muted-foreground uppercase">Prot</p>
                <p className="font-bold text-foreground text-sm">{result.macros.protein}g</p>
                </div>
                <div className="bg-card p-3 rounded-xl text-center border border-border">
                <p className="text-[10px] text-muted-foreground uppercase">Carb</p>
                <p className="font-bold text-foreground text-sm">{result.macros.carbs}g</p>
                </div>
                <div className="bg-card p-3 rounded-xl text-center border border-border">
                <p className="text-[10px] text-muted-foreground uppercase">Gord</p>
                <p className="font-bold text-foreground text-sm">{result.macros.fat}g</p>
                </div>
            </div>
         </div>
      )}
    </div>
  )
}