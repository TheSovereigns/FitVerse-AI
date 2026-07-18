"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Pill,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface MicronutrientData {
  id: string
  name: string
  unit: string
  current: number
  recommended: number
  foodSources: string[]
}

interface MicronutrientAnalysisProps {
  isLocked?: boolean
  onUpgrade?: () => void
  intakeData?: Record<string, number>
}

const MICRONUTRIENTS: Omit<MicronutrientData, "current">[] = [
  { id: "vitamin-a", name: "Vitamin A", unit: "mcg", recommended: 900, foodSources: ["Sweet potato", "Carrots", "Spinach", "Liver"] },
  { id: "vitamin-b12", name: "Vitamin B12", unit: "mcg", recommended: 2.4, foodSources: ["Fish", "Eggs", "Milk", "Fortified cereals"] },
  { id: "vitamin-c", name: "Vitamin C", unit: "mg", recommended: 90, foodSources: ["Oranges", "Bell peppers", "Broccoli", "Strawberries"] },
  { id: "vitamin-d", name: "Vitamin D", unit: "mcg", recommended: 20, foodSources: ["Salmon", "Egg yolks", "Mushrooms", "Sunlight"] },
  { id: "vitamin-e", name: "Vitamin E", unit: "mg", recommended: 15, foodSources: ["Almonds", "Sunflower seeds", "Avocado", "Olive oil"] },
  { id: "vitamin-k", name: "Vitamin K", unit: "mcg", recommended: 120, foodSources: ["Kale", "Spinach", "Broccoli", "Brussels sprouts"] },
  { id: "iron", name: "Iron", unit: "mg", recommended: 18, foodSources: ["Red meat", "Lentils", "Spinach", "Fortified cereals"] },
  { id: "calcium", name: "Calcium", unit: "mg", recommended: 1000, foodSources: ["Milk", "Yogurt", "Kale", "Sardines"] },
  { id: "magnesium", name: "Magnesium", unit: "mg", recommended: 420, foodSources: ["Dark chocolate", "Avocado", "Nuts", "Legumes"] },
  { id: "zinc", name: "Zinc", unit: "mg", recommended: 11, foodSources: ["Oysters", "Beef", "Pumpkin seeds", "Chickpeas"] },
  { id: "omega-3", name: "Omega-3", unit: "g", recommended: 1.6, foodSources: ["Salmon", "Walnuts", "Flaxseed", "Chia seeds"] },
]

function getStatus(current: number, recommended: number): { label: string; color: string; barColor: string } {
  const ratio = current / recommended
  if (ratio >= 1.0) return { label: "Optimal", color: "text-blue-500", barColor: "bg-blue-500" }
  if (ratio >= 0.8) return { label: "Adequate", color: "text-emerald-500", barColor: "bg-emerald-500" }
  if (ratio >= 0.5) return { label: "Low", color: "text-amber-500", barColor: "bg-amber-500" }
  return { label: "Deficient", color: "text-red-500", barColor: "bg-red-500" }
}

export function MicronutrientAnalysis({ isLocked = false, onUpgrade, intakeData }: MicronutrientAnalysisProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const nutrients: MicronutrientData[] = MICRONUTRIENTS.map((n) => ({
    ...n,
    current: intakeData?.[n.id] ?? Math.round(n.recommended * (0.3 + Math.random() * 0.8) * 10) / 10,
  }))

  const deficient = nutrients.filter((n) => n.current / n.recommended < 0.5)
  const low = nutrients.filter((n) => {
    const r = n.current / n.recommended
    return r >= 0.5 && r < 0.8
  })

  const runAiAnalysis = async () => {
    setIsAnalyzing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsAnalyzing(false)
  }

  if (isLocked) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Micronutrient Analysis</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Upgrade to Premium to unlock detailed vitamin and mineral tracking with AI-powered advice.
        </p>
        <Button onClick={onUpgrade} className="mt-2">
          Upgrade to Premium
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Pill className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Micronutrient Analysis</h2>
          <p className="text-xs text-muted-foreground">Vitamins & minerals from your diet</p>
        </div>
      </div>

      {(deficient.length > 0 || low.length > 0) && (
        <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
          {deficient.length > 0 && (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-foreground">
                <span className="font-medium">Deficient:</span>{" "}
                {deficient.map((n) => n.name).join(", ")}
              </p>
            </div>
          )}
          {low.length > 0 && (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-foreground">
                <span className="font-medium">Low:</span>{" "}
                {low.map((n) => n.name).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        {nutrients.map((nutrient, i) => {
          const ratio = Math.min(nutrient.current / nutrient.recommended, 1.3)
          const status = getStatus(nutrient.current, nutrient.recommended)
          const isExpanded = expanded === nutrient.id

          return (
            <motion.div
              key={nutrient.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : nutrient.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{nutrient.name}</span>
                    <span className={cn("text-[10px] font-medium", status.color)}>{status.label}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(ratio * 100, 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className={cn("h-full rounded-full", status.barColor)}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {nutrient.current} {nutrient.unit}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Rec: {nutrient.recommended} {nutrient.unit}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-3 pb-3"
                >
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <p className="text-[11px] font-medium text-foreground">Food Sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {nutrient.foodSources.map((food) => (
                        <Badge key={food} variant="secondary" className="text-[10px] h-5">
                          {food}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      <Button
        onClick={runAiAnalysis}
        disabled={isAnalyzing}
        variant="outline"
        className="w-full border-border"
      >
        {isAnalyzing ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        {isAnalyzing ? "Analyzing..." : "Get AI Nutritional Advice"}
      </Button>
    </div>
  )
}
