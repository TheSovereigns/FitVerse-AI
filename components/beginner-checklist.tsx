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
    let storeState: any = null
    try {
      const storeRaw = localStorage.getItem("fitverse-app-store")
      if (storeRaw) { const s = JSON.parse(storeRaw); storeState = s.state || s }
    } catch {}

    let workouts: any[] = []
    try {
      const w = localStorage.getItem("nutritrain-workouts")
      if (w) workouts = JSON.parse(w)
    } catch {}

    const hasProfile = !!storeState?.userMetabolicPlan
    const hasScans = (storeState?.scanHistory?.length || 0) > 0 || (storeState?.dailyActivity?.scannedProducts?.length || 0) > 0
    const hasWorkouts = workouts.length > 0

    const defaults: ChecklistItem[] = [
      { id: "profile", icon: Target, label: t("bc_complete_profile"), description: t("bc_complete_profile_desc"), completed: hasProfile },
      { id: "scan", icon: ScanLine, label: t("bc_first_scan"), description: t("bc_first_scan_desc"), completed: hasScans },
      { id: "workout", icon: Dumbbell, label: t("bc_generate_workout"), description: t("bc_generate_workout_desc"), completed: hasWorkouts },
      { id: "diet", icon: Calculator, label: t("bc_create_diet"), description: t("bc_create_diet_desc"), completed: hasProfile },
      { id: "streak", icon: Flame, label: t("bc_3day_streak"), description: t("bc_3day_streak_desc"), completed: (() => { try { return (JSON.parse(localStorage.getItem("streakData") || "{}").currentStreak || 0) >= 3 } catch { return false } })() },
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
            {t("bc_getting_started")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{items.length} {t("bc_completed")}
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
