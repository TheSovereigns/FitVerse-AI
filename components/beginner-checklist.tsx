"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, ScanLine, Dumbbell, Calculator, Users, Target, Flame } from "lucide-react"
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
    const saved = localStorage.getItem("beginnerChecklist")
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-black text-foreground">
              {isEnglish ? "Getting Started" : "Comecando"}
            </h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
              {completedCount}/{items.length} {isEnglish ? "completed" : "completos"}
            </p>
          </div>
          <span className="text-lg font-black text-foreground">{Math.round(progress)}%</span>
        </div>

        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-gradient-to-r from-white/30 to-white/10 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="space-y-2">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 transition-all",
                  item.completed
                    ? "bg-emerald-500/5 border border-emerald-500/15"
                    : "bg-black/20 border border-white/10"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  item.completed
                    ? "bg-emerald-500/15"
                    : "bg-white/10"
                )}>
                  {item.completed ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Icon className="h-4 w-4 text-foreground/50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-black",
                    item.completed ? "text-emerald-400/70 line-through" : "text-foreground"
                  )}>
                    {item.label}
                  </p>
                  <p className="text-[9px] font-bold text-foreground/30">{item.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
