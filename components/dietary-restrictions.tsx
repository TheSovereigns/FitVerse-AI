"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldCheck,
  Plus,
  X,
  Leaf,
  Beef,
  WheatOff,
  MilkOff,
  Heart,
  Activity,
  Flame,
  Droplets,
  Nut,
  Bean,
  Loader2,
  AlertTriangle,
  Check,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

interface DietaryRestrictionsProps {
  onRestrictionsChange?: (restrictions: string[]) => void
}

const RESTRICTIONS = [
  {
    id: "vegetarian",
    label: "Vegetarian",
    description: "No meat or fish",
    icon: Leaf,
    affected: ["meal-planner", "recipes"],
  },
  {
    id: "vegan",
    label: "Vegan",
    description: "No animal products",
    icon: Leaf,
    affected: ["meal-planner", "recipes", "supplements"],
  },
  {
    id: "gluten-free",
    label: "Gluten-Free",
    description: "No wheat, barley, rye",
    icon: WheatOff,
    affected: ["meal-planner", "recipes", "food-scan"],
  },
  {
    id: "lactose-free",
    label: "Lactose-Free",
    description: "No dairy lactose",
    icon: MilkOff,
    affected: ["meal-planner", "recipes", "food-scan"],
  },
  {
    id: "diabetic",
    label: "Diabetic",
    description: "Low sugar, controlled carbs",
    icon: Heart,
    affected: ["meal-planner", "micronutrient-analysis"],
  },
  {
    id: "hypertension",
    label: "Hypertension",
    description: "Low sodium diet",
    icon: Activity,
    affected: ["meal-planner", "recipes"],
  },
  {
    id: "keto",
    label: "Keto",
    description: "High fat, very low carb",
    icon: Flame,
    affected: ["meal-planner", "recipes", "macros"],
  },
  {
    id: "paleo",
    label: "Paleo",
    description: "Whole foods, no processed",
    icon: Beef,
    affected: ["meal-planner", "recipes", "store"],
  },
  {
    id: "halal",
    label: "Halal",
    description: "Islamic dietary laws",
    icon: ShieldCheck,
    affected: ["meal-planner", "recipes"],
  },
  {
    id: "kosher",
    label: "Kosher",
    description: "Jewish dietary laws",
    icon: ShieldCheck,
    affected: ["meal-planner", "recipes"],
  },
  {
    id: "nut-free",
    label: "Nut-Free",
    description: "No tree nuts or peanuts",
    icon: Nut,
    affected: ["meal-planner", "recipes", "food-scan"],
  },
  {
    id: "soy-free",
    label: "Soy-Free",
    description: "No soy products",
    icon: Bean,
    affected: ["meal-planner", "recipes", "food-scan"],
  },
]

const STORAGE_KEY = "fitverse-dietary-restrictions"

export function DietaryRestrictions({ onRestrictionsChange }: DietaryRestrictionsProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [selected, setSelected] = useState<string[]>([])
  const [customAllergies, setCustomAllergies] = useState<string[]>([])
  const [newAllergy, setNewAllergy] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showInfo, setShowInfo] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed.restrictions)) setSelected(parsed.restrictions)
        if (Array.isArray(parsed.customAllergies)) setCustomAllergies(parsed.customAllergies)
      } catch (e) {
        logger.error("[DietaryRestrictions] Failed to parse saved restrictions:", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ restrictions: selected, customAllergies })
    )
  }, [selected, customAllergies])

  const toggleRestriction = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
      onRestrictionsChange?.(next)
      return next
    })
  }

  const addCustomAllergy = () => {
    const trimmed = newAllergy.trim()
    if (trimmed && !customAllergies.includes(trimmed)) {
      setCustomAllergies((prev) => [...prev, trimmed])
      setNewAllergy("")
    }
  }

  const removeCustomAllergy = (allergy: string) => {
    setCustomAllergies((prev) => prev.filter((a) => a !== allergy))
  }

  const saveToProfile = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await supabase
        .from("profiles")
        .update({
          dietary_restrictions: selected,
          custom_allergies: customAllergies,
        })
        .eq("id", user.id)
    } catch (err) {
      console.error("Failed to save dietary restrictions:", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Dietary Restrictions</h2>
            <p className="text-xs text-muted-foreground">Select all that apply to you</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {selected.length} active
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {RESTRICTIONS.map((r) => {
          const isSelected = selected.includes(r.id)
          const Icon = r.icon
          return (
            <motion.button
              key={r.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleRestriction(r.id)}
              className={cn(
                "relative flex flex-col items-start p-3 rounded-xl border text-left transition-colors",
                isSelected
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/30 border-border hover:bg-muted/50"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <Icon className={cn("w-4 h-4 mb-1.5", isSelected ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-medium text-foreground">{r.label}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{r.description}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowInfo(showInfo === r.id ? null : r.id)
                }}
                className="absolute bottom-2 right-2"
              >
                <Info className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {RESTRICTIONS.find((r) => r.id === showInfo)?.label}
                </span>
                <button onClick={() => setShowInfo(null)}>
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                This restriction affects:{" "}
                {RESTRICTIONS.find((r) => r.id === showInfo)?.affected.join(", ")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                The AI will automatically adjust your meal plans, recipes, and food scan
                recommendations to respect this restriction.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Custom Allergies / Intolerances</h3>
        <div className="flex gap-2">
          <Input
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            placeholder="e.g. Shellfish, Eggs, Sesame..."
            onKeyDown={(e) => e.key === "Enter" && addCustomAllergy()}
            className="flex-1 h-9 text-xs bg-muted/30 border-border"
          />
          <Button variant="outline" size="sm" onClick={addCustomAllergy} className="h-9 border-border">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {customAllergies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {customAllergies.map((allergy) => (
              <span
                key={allergy}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-muted border border-border rounded-lg text-foreground"
              >
                {allergy}
                <button onClick={() => removeCustomAllergy(allergy)}>
                  <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="bg-muted/30 border border-border rounded-xl p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Affected Features</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(
                  new Set(
                    RESTRICTIONS.filter((r) => selected.includes(r.id)).flatMap((r) => r.affected)
                  )
                ).map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-[10px] h-5 capitalize">
                    {feature.replace(/-/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {user && (
        <Button
          onClick={saveToProfile}
          disabled={isSaving}
          variant="outline"
          className="w-full border-border"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          {isSaving ? "Saving..." : "Save to Profile"}
        </Button>
      )}
    </div>
  )
}
