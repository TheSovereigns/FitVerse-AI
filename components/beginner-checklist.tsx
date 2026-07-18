"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, ScanLine, Dumbbell, Calculator, Target, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface ChecklistItem {
  id: string
  icon: any
  label: string
  description: string
  completed: boolean
}

export function BeginnerChecklist() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [items, setItems] = useState<ChecklistItem[]>([])

  useEffect(() => {
    const defaults: ChecklistItem[] = [
      { id: "profile", icon: Target, label: isEnglish ? "Complete Profile" : "Completar Perfil", description: isEnglish ? "Set your goals and body info" : "Defina seus objetivos e dados corporais", completed: !!localStorage.getItem("userMetabolicPlan") },
      { id: "scan", icon: ScanLine, label: isEnglish ? "First Scan" : "Primeiro Scan", description: isEnglish ? "Scan your first food product" : "Escaneie seu primeiro alimento", completed: !!localStorage.getItem("scanHistory") && JSON.parse(localStorage.getItem("scanHistory") || "[]").length > 0 },
      { id: "workout", icon: Dumbbell, label: isEnglish ? "Generate Workout" : "Gerar Treino", description: isEnglish ? "Create your first workout plan" : "Crie seu primeiro plano de treino", completed: !!localStorage.getItem("generatedWorkouts") && JSON.parse(localStorage.getItem("generatedWorkouts") || "[]").length > 0 },
      { id: "diet", icon: Calculator, label: isEnglish ? "Create Diet Plan" : "Criar Plano de Dieta", description: isEnglish ? "Set up your metabolic plan" : "Configure seu plano metabolico", completed: !!localStorage.getItem("userMetabolicPlan") },
      { id: "streak", icon: Flame, label: isEnglish ? "3-Day Streak" : "Sequencia de 3 Dias", description: isEnglish ? "Stay active for 3 consecutive days" : "Fique ativo por 3 dias consecutivos", completed: (() => { try { return (JSON.parse(localStorage.getItem("streakData") || "{}").currentStreak || 0) >= 3 } catch { return false } })() },
    ]
    setItems(defaults)
  }, [])

  const completedCount = items.filter((i) => i.completed).length
  const progress = (completedCount / items.length) * 100

  if (completedCount === items.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {isEnglish ? "Getting Started" : "Comecando"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{items.length} {isEnglish ? "completed" : "completos"}
          </p>
        </div>
        <span className="text-lg font-bold text-foreground">{Math.round(progress)}%</span>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-xl p-3 transition-colors",
              item.completed ? "bg-muted/50" : "bg-muted/30"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
              item.completed ? "bg-primary/10" : "bg-muted"
            )}>
              {item.completed ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <item.icon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", item.completed ? "text-muted-foreground line-through" : "text-foreground")}>{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
