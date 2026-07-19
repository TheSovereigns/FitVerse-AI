"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Dumbbell,
  CircleDot,
  Grip,
  Anchor,
  Weight,
  CableCar,
  Timer,
  Target,
  PersonStanding,
  Ban,
  Check,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"

interface EquipmentOption {
  id: string
  name: string
  icon: any
  description: string
  exercises: string[]
}

interface EquipmentSelectorProps {
  onSelectionChange?: (selected: string[]) => void
  initialSelection?: string[]
}

const EQUIPMENT: EquipmentOption[] = [
  {
    id: "none",
    name: "None",
    icon: Ban,
    description: "Bodyweight only",
    exercises: [
      "Push-ups",
      "Squats",
      "Lunges",
      "Plank",
      "Burpees",
      "Mountain Climbers",
    ],
  },
  {
    id: "dumbbells",
    name: "Dumbbells",
    icon: Dumbbell,
    description: "Free weight versatility",
    exercises: [
      "Dumbbell Press",
      "Goblet Squat",
      "Bent Over Row",
      "Shoulder Press",
      "Bicep Curls",
      "Tricep Kickbacks",
    ],
  },
  {
    id: "barbell",
    name: "Barbell",
    icon: CircleDot,
    description: "Heavy compound lifts",
    exercises: [
      "Back Squat",
      "Bench Press",
      "Deadlift",
      "Overhead Press",
      "Barbell Row",
      "Power Clean",
    ],
  },
  {
    id: "bands",
    name: "Resistance Bands",
    icon: Grip,
    description: "Portable resistance",
    exercises: [
      "Band Pull-aparts",
      "Banded Squats",
      "Face Pulls",
      "Band Rows",
      "Lateral Walks",
      "Bicep Curls",
    ],
  },
  {
    id: "pullup-bar",
    name: "Pull-up Bar",
    icon: Anchor,
    description: "Upper body essentials",
    exercises: [
      "Pull-ups",
      "Chin-ups",
      "Hanging Leg Raises",
      "Dead Hangs",
      "Australian Pull-ups",
      "Typewriter Pull-ups",
    ],
  },
  {
    id: "kettlebell",
    name: "Kettlebell",
    icon: Weight,
    description: "Dynamic strength",
    exercises: [
      "Kettlebell Swing",
      "Turkish Get-up",
      "Goblet Squat",
      "Snatch",
      "Clean & Press",
      "Windmill",
    ],
  },
  {
    id: "machines",
    name: "Machines",
    icon: Timer,
    description: "Guided movement",
    exercises: [
      "Leg Press",
      "Lat Pulldown",
      "Chest Press Machine",
      "Leg Extension",
      "Leg Curl",
      "Cable Fly",
    ],
  },
  {
    id: "cable",
    name: "Cable",
    icon: CableCar,
    description: "Constant tension",
    exercises: [
      "Cable Row",
      "Tricep Pushdown",
      "Face Pull",
      "Cable Crunch",
      "Woodchop",
      "Lateral Raise",
    ],
  },
  {
    id: "trx",
    name: "TRX",
    icon: PersonStanding,
    description: "Suspension training",
    exercises: [
      "TRX Row",
      "TRX Push-up",
      "TRX Squat",
      "TRX Pike",
      "TRX Lunge",
      "TRX Fallout",
    ],
  },
  {
    id: "medball",
    name: "Medicine Ball",
    icon: Target,
    description: "Power & coordination",
    exercises: [
      "Med Ball Slam",
      "Wall Throw",
      "Russian Twist",
      "Squat Throw",
      "Chest Pass",
      "Overhead Throw",
    ],
  },
]

const STORAGE_KEY = "fitverse-equipment-selection"

export function EquipmentSelector({
  onSelectionChange,
  initialSelection = [],
}: EquipmentSelectorProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [selected, setSelected] = useState<string[]>(initialSelection)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSelected(parsed)
        onSelectionChange?.(parsed)
      }
    } catch (e) {
      logger.error("[EquipmentSelector] Failed to parse saved equipment:", e)
    }
  }, [])

  const toggle = useCallback(
    (id: string) => {
      setSelected((prev) => {
        const next = prev.includes(id)
          ? prev.filter((s) => s !== id)
          : [...prev, id]
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch (e) {
          logger.error("[EquipmentSelector] Failed to save equipment:", e)
        }
        onSelectionChange?.(next)
        return next
      })
    },
    [onSelectionChange]
  )

  const getAvailableExercises = () => {
    if (selected.length === 0) return EQUIPMENT[0]!.exercises
    const exercises: string[] = []
    selected.forEach((id) => {
      const eq = EQUIPMENT.find((e) => e.id === id)
      if (eq) exercises.push(...eq.exercises)
    })
    return [...new Set(exercises)]
  }

  const availableExercises = getAvailableExercises()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Dumbbell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isEnglish ? "Equipment" : "Equipamento"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {selected.length === 0
                ? (isEnglish ? "No equipment selected" : "Nenhum equipamento selecionado")
                : `${selected.length} ${isEnglish ? "selected" : "selecionados"}`}
            </p>
          </div>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-5">
        {EQUIPMENT.map((eq) => {
          const Icon = eq.icon
          const isSelected = selected.includes(eq.id)

          return (
            <motion.button
              key={eq.id}
              onClick={() => toggle(eq.id)}
              whileTap={{ scale: 0.95 }}
              className={`relative p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5">
                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                </div>
              )}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted mb-2">
                <Icon
                  className={`h-4 w-4 ${
                    isSelected ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <p
                className={`text-xs font-medium ${
                  isSelected ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {eq.name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {eq.description}
              </p>
            </motion.button>
          )
        })}
      </div>

      {/* Available Exercises */}
      <div className="pt-4 border-t border-border">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {isEnglish ? "Available Exercises" : "Exercicios Disponiveis"} ({availableExercises.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {availableExercises.slice(0, 12).map((exercise) => (
            <span
              key={exercise}
              className="px-2 py-1 rounded-lg bg-muted text-[11px] text-muted-foreground"
            >
              {exercise}
            </span>
          ))}
          {availableExercises.length > 12 && (
            <span className="px-2 py-1 rounded-lg bg-muted text-[11px] text-primary">
              +{availableExercises.length - 12} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
