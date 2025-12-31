"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, TrendingUp, Target, Zap, ArrowRight } from "lucide-react"
import { MetabolicDashboard } from "./metabolic-dashboard"

export interface BioPerfil {
  age: number
  weight: number
  height: number
  gender: "male" | "female"
  activityLevel: "sedentary" | "moderate" | "active" | "athlete"
  goal: "lose_weight" | "gain_muscle" | "maintenance"
}

export interface MacroTarget {
  calories: number
  protein: number
  carbs: number
  fat: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
}

export interface MetabolicPlan {
  macros: MacroTarget
  prediction: {
    weeks: number
    explanation: string
  }
}

export function MetabolicPlanner() {
  const [showDashboard, setShowDashboard] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [plan, setPlan] = useState<MetabolicPlan | null>(null)
  const [perfil, setPerfil] = useState<BioPerfil>({
    age: 0,
    weight: 0,
    height: 0,
    gender: "male",
    activityLevel: "moderate",
    goal: "maintenance",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/calculate-macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(perfil),
      })

      if (!response.ok) throw new Error("Failed to calculate macros")

      const data = await response.json()
      setPlan(data.plan)
      setShowDashboard(true)
    } catch (error) {
      console.error("Error calculating macros:", error)
      alert("Erro ao calcular macros. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (showDashboard && plan) {
    return <MetabolicDashboard plan={plan} perfil={perfil} onBack={() => setShowDashboard(false)} />
  }

  return (
    <div className="px-4 pt-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-balance text-foreground">Planejamento Metabólico de IA</h1>
        <p className="text-muted-foreground text-pretty">
          Descubra suas necessidades calóricas e alcance seus objetivos com precisão científica
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-5 bg-card border-primary/30 shadow-lg shadow-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shadow-md shadow-primary/30">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Calculadora de Bio-Perfil</h3>
              <p className="text-xs text-muted-foreground">Preencha seus dados básicos</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium">
                  Idade
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={perfil.age || ""}
                  onChange={(e) => setPerfil({ ...perfil, age: Number.parseInt(e.target.value) || 0 })}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">
                  Género
                </Label>
                <Select value={perfil.gender} onValueChange={(v) => setPerfil({ ...perfil, gender: v as any })}>
                  <SelectTrigger id="gender" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium">
                  Peso (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="70"
                  value={perfil.weight || ""}
                  onChange={(e) => setPerfil({ ...perfil, weight: Number.parseFloat(e.target.value) || 0 })}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm font-medium">
                  Altura (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="175"
                  value={perfil.height || ""}
                  onChange={(e) => setPerfil({ ...perfil, height: Number.parseInt(e.target.value) || 0 })}
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity" className="text-sm font-medium">
                Nível de Atividade Física
              </Label>
              <Select
                value={perfil.activityLevel}
                onValueChange={(v) => setPerfil({ ...perfil, activityLevel: v as any })}
              >
                <SelectTrigger id="activity" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentário (pouco ou nenhum exercício)</SelectItem>
                  <SelectItem value="moderate">Moderado (exercício 3-4x/semana)</SelectItem>
                  <SelectItem value="active">Ativo (exercício 5-6x/semana)</SelectItem>
                  <SelectItem value="athlete">Atleta (exercício diário intenso)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-card border-accent/30 shadow-lg shadow-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center shadow-md shadow-accent/30">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Seu Objetivo</h3>
              <p className="text-xs text-muted-foreground">O que deseja alcançar?</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { value: "lose_weight", icon: TrendingUp, label: "Emagrecer", desc: "Défice calórico controlado" },
              { value: "gain_muscle", icon: Zap, label: "Ganhar Massa Muscular", desc: "Superávit + proteína alta" },
              { value: "maintenance", icon: Activity, label: "Manutenção/Longevidade", desc: "Equilíbrio nutricional" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPerfil({ ...perfil, goal: option.value as any })}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  perfil.goal === option.value
                    ? "border-primary bg-primary/10 shadow-md shadow-primary/30"
                    : "border-border bg-secondary hover:border-primary/40"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    perfil.goal === option.value ? "bg-accent/10" : "bg-muted"
                  }`}
                >
                  <option.icon
                    className={`w-5 h-5 ${perfil.goal === option.value ? "text-accent" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.desc}</p>
                </div>
                {perfil.goal === option.value && (
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/80 shadow-lg shadow-primary/40"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Calculando...
            </div>
          ) : (
            <>
              Calcular Meu Plano
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
