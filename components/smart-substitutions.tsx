"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeftRight,
  Search,
  Lock,
  Check,
  Loader2,
  Flame,
  Dumbbell,
  Wheat,
  Droplets,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface Substitution {
  id: string
  name: string
  macros: { calories: number; protein: number; carbs: number; fat: number }
  reason: string
  matchScore: number
}

interface SmartSubstitutionsProps {
  isLocked?: boolean
  onUpgrade?: () => void
}

export function SmartSubstitutions({ isLocked = false, onUpgrade }: SmartSubstitutionsProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [substitutions, setSubstitutions] = useState<Substitution[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [originalMacros, setOriginalMacros] = useState<Substitution["macros"] | null>(null)

  const findSubstitutions = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    setSubstitutions([])
    setSelectedId(null)

    try {
      const res = await fetch("/api/food-substitutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: query.trim() }),
      })
      const data = await res.json()
      if (data.substitutions) {
        setSubstitutions(data.substitutions)
        setOriginalMacros(data.originalMacros || null)
      }
    } catch (err) {
      console.error("Failed to find substitutions:", err)
    } finally {
      setIsSearching(false)
    }
  }

  const selectSubstitution = (sub: Substitution) => {
    setSelectedId(sub.id)
  }

  if (isLocked) {
    return (
      <div className="glass-strong border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-brand" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Smart Substitutions</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Upgrade to Pro or Premium to find intelligent food alternatives that match your macros and preferences.
        </p>
        <Button onClick={onUpgrade} className="mt-2">
          Upgrade to Pro
        </Button>
      </div>
    )
  }

  return (
    <div className="glass-strong border border-border rounded-2xl p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
          <ArrowLeftRight className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Smart Substitutions</h2>
          <p className="text-xs text-muted-foreground">Find alternatives that match your macros</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Food you don't have or can't eat..."
          onKeyDown={(e) => e.key === "Enter" && findSubstitutions()}
          className="flex-1 h-10 text-sm bg-muted/30 border-border"
        />
        <Button
          onClick={findSubstitutions}
          disabled={isSearching || !query.trim()}
          className="h-10 px-4"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {substitutions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Substitutes for <span className="font-medium text-foreground">{query}</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSubstitutions([])
                  setOriginalMacros(null)
                  setSelectedId(null)
                }}
                className="h-7 px-2"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {originalMacros && (
              <div className="bg-muted/30 border border-border rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  Original Macros (per 100g)
                </p>
                <div className="flex gap-3 text-xs text-foreground">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-400" />
                    {originalMacros.calories} kcal
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-3 h-3 text-blue-400" />
                    {originalMacros.protein}g
                  </span>
                  <span className="flex items-center gap-1">
                    <Wheat className="w-3 h-3 text-amber-400" />
                    {originalMacros.carbs}g
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-pink-400" />
                    {originalMacros.fat}g
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {substitutions.map((sub, i) => {
                const isSelected = selectedId === sub.id
                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      "border rounded-xl p-3 transition-colors cursor-pointer",
                      isSelected
                        ? "bg-brand/10 border-brand/30"
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    )}
                    onClick={() => selectSubstitution(sub)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{sub.name}</span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{sub.reason}</p>
                      </div>
                      <Badge
                        variant={sub.matchScore >= 90 ? "default" : "secondary"}
                        className="text-[10px] h-5 shrink-0"
                      >
                        {sub.matchScore}% match
                      </Badge>
                    </div>

                    <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-400" />
                        {sub.macros.calories} kcal
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3 h-3 text-blue-400" />
                        {sub.macros.protein}g
                      </span>
                      <span className="flex items-center gap-1">
                        <Wheat className="w-3 h-3 text-amber-400" />
                        {sub.macros.carbs}g
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-pink-400" />
                        {sub.macros.fat}g
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {substitutions.length === 0 && !isSearching && query.trim() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground text-sm"
          >
            No substitutions found. Try a different food.
          </motion.div>
        )}
      </AnimatePresence>

      {substitutions.length === 0 && !isSearching && !query.trim() && (
        <div className="text-center py-6 space-y-2">
          <Sparkles className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <p className="text-xs text-muted-foreground">
            Enter a food item to find smart alternatives
          </p>
        </div>
      )}
    </div>
  )
}
