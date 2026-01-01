"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, TrendingUp, Target, Zap, ArrowRight, Loader2 } from "lucide-react"
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
    macroTips?: string[]
  }
}

interface MetabolicPlannerProps {
  onPlanCreated: (plan: MetabolicPlan) => void;
}

export function MetabolicPlanner({ onPlanCreated }: MetabolicPlannerProps) {
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
    setPlan(null) // Limpa o plano anterior
    
    try {
      const response = await fetch('/api/generate-metabolic-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha na geração do plano metabólico pela IA');
      }

      const generatedPlan: MetabolicPlan = await response.json();

      setPlan(generatedPlan)
      onPlanCreated(generatedPlan)
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
    <div className="px-4 pt-8 pb-24 text-foreground bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-4xl font-black mb-2 text-balance tracking-tighter uppercase italic">
          Planejamento <span className="text-primary">Metabólico</span>
        </h1>
        <p className="text-muted-foreground text-pretty font-medium text-sm">
          Descubra suas necessidades calóricas e alcance seus objetivos com precisão científica
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative bg-card border border-border rounded-[2rem] p-6 overflow-hidden border-b-[6px] border-b-primary shadow-2xl">
        {/* Cantoneiras Iluminadas (4 cantos) */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-xl opacity-80" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-xl opacity-80" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-xl opacity-80" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-xl opacity-80" />
        
        {/* Glow de Fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-[0.03] blur-[80px] pointer-events-none" />

        {/* Efeito de Escaneamento (Loading) */}
        {isLoading && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-scan-effect" />}

        <div className="space-y-8 relative z-10">
          {/* Seção 1: Bio-Perfil */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_0_20px_rgba(255,140,0,0.3)]">
                <Activity className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-black text-xl uppercase tracking-tight text-foreground">Bio-Perfil</h3>
                <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Dados Corporais</p>
              </div>
            </div>

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
                  onChange={(e) => setPerfil({ ...perfil, age: parseInt(e.target.value) || 0 })} // Use parseInt for age
                  className="h-12 px-4 bg-muted/50 border border-input focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground rounded-xl transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium text-muted-foreground">
                  Género
                </Label>
                <Select value={perfil.gender} onValueChange={(v) => setPerfil({ ...perfil, gender: v as any })}>
                  <SelectTrigger id="gender" className="h-12 px-4 bg-muted/50 border border-input focus:border-primary focus:ring-1 focus:ring-primary text-foreground rounded-xl transition-all">
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
                  onChange={(e) => setPerfil({ ...perfil, weight: parseFloat(e.target.value) || 0 })} // Use parseFloat for weight
                  className="h-12 px-4 bg-muted/50 border border-input focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground rounded-xl transition-all"
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
                  onChange={(e) => setPerfil({ ...perfil, height: parseInt(e.target.value) || 0 })} // Use parseInt for height
                  className="h-12 px-4 bg-muted/50 border border-input focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground rounded-xl transition-all"
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
                <SelectTrigger id="activity" className="h-12 px-4 bg-muted/50 border border-input focus:border-primary focus:ring-1 focus:ring-primary text-foreground rounded-xl transition-all">
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

          {/* Seção 2: Objetivo */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_0_20px_rgba(255,140,0,0.3)]">
                <Target className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-black text-xl uppercase tracking-tight text-foreground">Objetivo</h3>
                <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Definição de Meta</p>
              </div>
            </div>

            <div className="space-y-3">
            {[
              { value: "lose_weight", icon: TrendingUp, label: "Emagrecer", desc: "Défice calórico controlado" },
              { value: "gain_muscle", icon: Zap, label: "Ganhar Massa Muscular", desc: "Superávit + proteína alta" },
              { value: "maintenance", icon: Activity, label: "Manutenção/Longevidade", desc: "Equilíbrio nutricional" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPerfil({ ...perfil, goal: option.value as any })}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 group ${
                  perfil.goal === option.value
                    ? "border-primary bg-primary/10 shadow-[inset_0_0_20px_rgba(255,140,0,0.1)]"
                    : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    perfil.goal === option.value ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(255,140,0,0.4)]" : "bg-muted text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <option.icon
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-bold tracking-tight ${perfil.goal === option.value ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{option.label}</p>
                  <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">{option.desc}</p>
                </div>
                {perfil.goal === option.value && (
                  <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_10px_rgba(255,140,0,0.5)]" />
                )}
              </button>
            ))}
          </div>
          </div>

          <Button
            type="submit"
            className="w-full h-16 bg-primary hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(255,140,0,0.4)] text-primary-foreground font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 group mt-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                PROCESSANDO...
              </div>
            ) : (
              <>
                GERAR PROTOCOLO METABÓLICO
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
