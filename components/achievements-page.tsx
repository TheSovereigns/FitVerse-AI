"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ScanLine, Dumbbell, Flame, Heart, Trophy, Star, Lock } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface AchievementDef {
  id: string
  nameKey: string
  descKey: string
  icon: React.ReactNode
  category: "scan" | "workout" | "streak" | "health"
  requirement: number
  xp: number
  statKey: string
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-scan", nameKey: "ach.firstScan.name", descKey: "ach.firstScan.desc", icon: <ScanLine className="w-5 h-5" />, category: "scan", requirement: 1, xp: 50, statKey: "scans" },
  { id: "scan-10", nameKey: "ach.scan10.name", descKey: "ach.scan10.desc", icon: <ScanLine className="w-5 h-5" />, category: "scan", requirement: 10, xp: 100, statKey: "scans" },
  { id: "scan-50", nameKey: "ach.scan50.name", descKey: "ach.scan50.desc", icon: <ScanLine className="w-5 h-5" />, category: "scan", requirement: 50, xp: 500, statKey: "scans" },
  { id: "scan-100", nameKey: "ach.scan100.name", descKey: "ach.scan100.desc", icon: <ScanLine className="w-5 h-5" />, category: "scan", requirement: 100, xp: 1000, statKey: "scans" },
  { id: "workout-1", nameKey: "ach.workout1.name", descKey: "ach.workout1.desc", icon: <Dumbbell className="w-5 h-5" />, category: "workout", requirement: 1, xp: 100, statKey: "workouts" },
  { id: "workout-10", nameKey: "ach.workout10.name", descKey: "ach.workout10.desc", icon: <Dumbbell className="w-5 h-5" />, category: "workout", requirement: 10, xp: 300, statKey: "workouts" },
  { id: "workout-50", nameKey: "ach.workout50.name", descKey: "ach.workout50.desc", icon: <Dumbbell className="w-5 h-5" />, category: "workout", requirement: 50, xp: 1000, statKey: "workouts" },
  { id: "streak-3", nameKey: "ach.streak3.name", descKey: "ach.streak3.desc", icon: <Flame className="w-5 h-5" />, category: "streak", requirement: 3, xp: 75, statKey: "streak" },
  { id: "streak-7", nameKey: "ach.streak7.name", descKey: "ach.streak7.desc", icon: <Flame className="w-5 h-5" />, category: "streak", requirement: 7, xp: 200, statKey: "streak" },
  { id: "streak-30", nameKey: "ach.streak30.name", descKey: "ach.streak30.desc", icon: <Flame className="w-5 h-5" />, category: "streak", requirement: 30, xp: 1000, statKey: "streak" },
  { id: "streak-100", nameKey: "ach.streak100.name", descKey: "ach.streak100.desc", icon: <Flame className="w-5 h-5" />, category: "streak", requirement: 100, xp: 5000, statKey: "streak" },
  { id: "hydration-7", nameKey: "ach.hydration7.name", descKey: "ach.hydration7.desc", icon: <Heart className="w-5 h-5" />, category: "health", requirement: 7, xp: 100, statKey: "hydrationDays" },
]

const CATEGORY_ORDER = ["scan", "workout", "streak", "health"] as const

export function AchievementsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fitverse-gamification-stats")
      if (raw) setStats(JSON.parse(raw))
      const rawUnlocked = localStorage.getItem("fitverse-achievements")
      if (rawUnlocked) setUnlocked(new Set(JSON.parse(rawUnlocked)))
    } catch {}
  }, [])

  const totalXP = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).reduce((sum, a) => sum + a.xp, 0)
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length

  return (
    <div className="glass-strong border border-border rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-bold">{t("achievements")}</h2>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" />
            {totalXP.toLocaleString()} XP
          </span>
          <span>{unlockedCount}/{ACHIEVEMENTS.length}</span>
        </div>
      </div>

      <div className="space-y-6">
        {CATEGORY_ORDER.map((cat) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === cat)
          const catLabel = t(`category.${cat}`)
          return (
            <div key={cat} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{catLabel}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((ach) => {
                  const current = Math.min(stats[ach.statKey] ?? 0, ach.requirement)
                  const pct = Math.min((current / ach.requirement) * 100, 100)
                  const done = unlocked.has(ach.id)
                  return (
                    <motion.div
                      key={ach.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "border rounded-xl p-4 space-y-2 transition-colors",
                        done
                          ? "border-green-500/40 bg-green-500/10"
                          : "border-border bg-white/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          done ? "bg-green-500/20 text-green-400" : "bg-white/10 text-muted-foreground"
                        )}>
                          {done ? ach.icon : <Lock className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">{t(ach.nameKey)}</span>
                            <span className="text-xs text-yellow-400 shrink-0 ml-2">+{ach.xp} XP</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{t(ach.descKey)}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{current}/{ach.requirement}</span>
                          <span>{Math.round(pct)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full", done ? "bg-green-500" : "bg-primary")}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
