"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Pill, Lock, Sparkles, Check, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

interface Supplement {
  name: string
  dosage: string
  timing: string
  reason: string
  priority: "essential" | "optional"
  taken: boolean
}

interface UserProfile {
  goals: string
  dietaryRestrictions: string
  age: number
  gender: string
}

export function SupplementRecommender({
  isLocked = false,
  userGoals = "",
  dietaryRestrictions = "",
  age = 25,
  gender = "male",
}: {
  isLocked?: boolean
  userGoals?: string
  dietaryRestrictions?: string
  age?: number
  gender?: string
}) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [takenStorage, setTakenStorage] = useState<Record<string, boolean>>({})

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/recommend-supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: userGoals,
          dietaryRestrictions,
          age,
          gender,
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      const raw: Supplement[] = data.supplements || data.recommendations || []
      setSupplements(raw.map((s: Supplement) => ({ ...s, taken: false })))
    } catch (err: any) {
      setError(isEnglish ? "Failed to generate recommendations" : "Falha ao gerar recomendacoes")
    } finally {
      setLoading(false)
    }
  }, [userGoals, dietaryRestrictions, age, gender, isEnglish])

  const toggleTaken = (name: string) => {
    setSupplements((prev) =>
      prev.map((s) => (s.name === name ? { ...s, taken: !s.taken } : s))
    )
    setTakenStorage((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border glass-strong p-5"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted">
            <Pill className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{isEnglish ? "Supplement Advisor" : "Assessor de Suplementos"}</h3>
            <p className="text-xs text-muted-foreground">{isEnglish ? "AI-powered recommendations" : "Recomendacoes por IA"}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Lock className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">{isEnglish ? "Premium Feature" : "Recurso Premium"}</p>
          <p className="text-xs text-muted-foreground">{isEnglish ? "Upgrade to Premium for AI supplement recommendations" : "Atualize para Premium para recomendacoes de suplementos IA"}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border glass-strong p-5"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted">
          <Pill className="h-4 w-4 text-brand" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{isEnglish ? "Supplement Advisor" : "Assessor de Suplementos"}</h3>
          <p className="text-xs text-muted-foreground">{isEnglish ? "Personalized for your goals" : "Personalizado para seus objetivos"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-[10px]">
        <div className="p-2 rounded-xl bg-brand-muted">
          <p className="text-muted-foreground">{isEnglish ? "Goals" : "Objetivos"}</p>
          <p className="text-foreground font-medium truncate">{userGoals || (isEnglish ? "Not set" : "Nao definido")}</p>
        </div>
        <div className="p-2 rounded-xl bg-brand-muted">
          <p className="text-muted-foreground">{isEnglish ? "Diet" : "Dieta"}</p>
          <p className="text-foreground font-medium truncate">{dietaryRestrictions || (isEnglish ? "None" : "Nenhuma")}</p>
        </div>
        <div className="p-2 rounded-xl bg-brand-muted">
          <p className="text-muted-foreground">{isEnglish ? "Age" : "Idade"}</p>
          <p className="text-foreground font-medium">{age} {isEnglish ? "yrs" : "anos"}</p>
        </div>
        <div className="p-2 rounded-xl bg-brand-muted">
          <p className="text-muted-foreground">{isEnglish ? "Gender" : "Genero"}</p>
          <p className="text-foreground font-medium capitalize">{gender}</p>
        </div>
      </div>

      {supplements.length === 0 && !loading && (
        <Button onClick={handleGenerate} className="w-full h-9 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {isEnglish ? "Generate Recommendations" : "Gerar Recomendacoes"}
        </Button>
      )}

      {loading && (
        <div className="flex flex-col items-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mb-3"
          >
            <Sparkles className="h-6 w-6 text-amber-500" />
          </motion.div>
          <p className="text-xs text-muted-foreground">{isEnglish ? "Analyzing your profile..." : "Analisando seu perfil..."}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 mb-4">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {supplements.length > 0 && !loading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {isEnglish ? "Recommendations" : "Recomendacoes"}
            </p>
            <Button onClick={handleGenerate} variant="ghost" size="sm" className="h-6 text-[10px]">
              {isEnglish ? "Refresh" : "Atualizar"}
            </Button>
          </div>
          {supplements.map((sup, i) => (
            <motion.div
              key={sup.name}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "p-3 rounded-xl border transition-all",
                sup.taken ? "border-green-500/30 bg-green-500/5" : "border-border bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleTaken(sup.name)} className="p-0.5">
                    <div className={cn(
                      "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                      sup.taken ? "bg-green-500 border-green-500" : "border-border"
                    )}>
                      {sup.taken && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                  <div>
                    <p className={cn("text-xs font-semibold", sup.taken ? "text-green-500 line-through" : "text-foreground")}>{sup.name}</p>
                    <p className="text-[10px] text-muted-foreground">{sup.dosage}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-[9px] font-medium px-1.5 py-0.5 rounded-md",
                  sup.priority === "essential" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
                )}>
                  {sup.priority === "essential"
                    ? (isEnglish ? "Essential" : "Essencial")
                    : (isEnglish ? "Optional" : "Opcional")
                  }
                </span>
              </div>
              <div className="flex items-center gap-3 ml-7">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{sup.timing}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{sup.reason}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
