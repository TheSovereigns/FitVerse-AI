"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, TrendingUp, Calendar, Flame, Beef, Cookie, Droplet, Sparkles } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { BioPerfil, MetabolicPlan } from "./metabolic-planner"

interface MetabolicDashboardProps {
  plan: MetabolicPlan
  perfil: BioPerfil
  onBack: () => void
}

export function MetabolicDashboard({ plan, perfil, onBack }: MetabolicDashboardProps) {
  const macrosData = [
    { name: "Proteínas", value: plan.macros.protein, color: "#f97316", grams: plan.macros.proteinGrams },
    { name: "Hidratos", value: plan.macros.carbs, color: "#fb923c", grams: plan.macros.carbsGrams },
    { name: "Gorduras", value: plan.macros.fat, color: "#fdba74", grams: plan.macros.fatGrams },
  ]

  const goalLabels = {
    lose_weight: "Emagrecer",
    gain_muscle: "Ganhar Massa",
    maintenance: "Manutenção",
  }

  return (
    <div className="px-4 pt-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Macros</h1>
          <p className="text-sm text-muted-foreground">Seu plano personalizado</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="p-6 bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-0 shadow-lg shadow-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-primary-foreground/70 text-sm mb-1">Meta Diária</p>
              <p className="text-4xl font-bold">{Math.round(plan.macros.calories)}</p>
              <p className="text-sm text-primary-foreground/80 mt-1">calorias</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
              <Flame className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-primary-foreground/10 backdrop-blur-sm">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
            <p className="text-sm text-primary-foreground/90">Objetivo: {goalLabels[perfil.goal]}</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Distribuição de Macronutrientes</h3>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macrosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macrosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.grams}g ({data.value}%)
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                <Beef className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold">{plan.macros.proteinGrams}g</p>
              <p className="text-xs text-muted-foreground">Proteínas</p>
              <Badge variant="outline" className="mt-1 text-xs border-primary/30 text-primary bg-primary/5">
                {plan.macros.protein}%
              </Badge>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold">{plan.macros.carbsGrams}g</p>
              <p className="text-xs text-muted-foreground">Hidratos</p>
              <Badge variant="outline" className="mt-1 text-xs border-primary/30 text-primary bg-primary/5">
                {plan.macros.carbs}%
              </Badge>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                <Droplet className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold">{plan.macros.fatGrams}g</p>
              <p className="text-xs text-muted-foreground">Gorduras</p>
              <Badge variant="outline" className="mt-1 text-xs border-primary/30 text-primary bg-primary/5">
                {plan.macros.fat}%
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Previsão de Jornada NutriVision</h3>
              <p className="text-xs text-muted-foreground">Powered by IA</p>
            </div>
          </div>

          <div className="bg-primary/5 rounded-xl p-4 mb-4 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <p className="text-2xl font-bold">{plan.prediction.weeks} semanas</p>
            </div>
            <p className="text-sm text-muted-foreground">Tempo estimado para atingir seu objetivo</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-pretty leading-relaxed">{plan.prediction.explanation}</p>
            {plan.prediction.macroTips && plan.prediction.macroTips.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-primary uppercase">
                  Dicas para Atingir Seus Macros
                </p>
                {plan.prediction.macroTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm text-pretty">{tip}</p>
                  </div>
                ))}
              </div>
            )}
            <Progress value={15} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">Sua jornada está apenas começando!</p>
          </div>
        </Card>

        <Card className="p-4 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center text-pretty">
            Os valores são estimativas baseadas em fórmulas científicas validadas. Consulte um nutricionista para um
            plano personalizado.
          </p>
        </Card>
      </div>
    </div>
  )
}
