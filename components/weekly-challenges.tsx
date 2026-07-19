"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress-bar"
import { notifications } from "@/lib/notifications"
import { Target, Check, Clock, Flame, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeeklyChallenge {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  target: number
  current: number
  xpReward: number
  completed: boolean
  type: "scans" | "workouts" | "water" | "sleep" | "streak"
}

const CHALLENGE_TEMPLATES = [
  { name: "Scanner Pro", description: "Escanie 15 alimentos esta semana", icon: <Target className="w-5 h-5" />, target: 15, xpReward: 300, type: "scans" as const },
  { name: "Guerreiro", description: "Complete 5 treinos esta semana", icon: <Flame className="w-5 h-5" />, target: 5, xpReward: 500, type: "workouts" as const },
  { name: "Hidratação Total", description: "Beba 2L de água por 5 dias", icon: <Zap className="w-5 h-5" />, target: 5, xpReward: 200, type: "water" as const },
  { name: "Mestre do Sono", description: "Durma 7+ horas por 5 noites", icon: <Clock className="w-5 h-5" />, target: 5, xpReward: 250, type: "sleep" as const },
  { name: "Streak Master", description: "Mantenha streak de 7 dias", icon: <Flame className="w-5 h-5" />, target: 7, xpReward: 400, type: "streak" as const },
]

interface WeeklyChallengesProps {
  stats: {
    scansThisWeek: number
    workoutsThisWeek: number
    waterDaysThisWeek: number
    sleepDaysThisWeek: number
    currentStreak: number
  }
}

export function WeeklyChallenges({ stats }: WeeklyChallengesProps) {
  const { t } = useTranslation()
  const [completedIds, setCompletedIds] = useLocalStorage<string[]>("fitverse-weekly-completed", [])
  const [weekStart, setWeekStart] = useLocalStorage<string>("fitverse-week-start", "")
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([])

  const currentWeekStart = getWeekStart()

  useEffect(() => {
    if (weekStart !== currentWeekStart) {
      setCompletedIds([])
      setWeekStart(currentWeekStart)
    }
  }, [currentWeekStart, weekStart, setCompletedIds, setWeekStart])

  useEffect(() => {
    const saved = localStorage.getItem("fitverse-weekly-challenges")
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as WeeklyChallenge[]
        const isSameWeek = parsed[0]?.id.startsWith(currentWeekStart)
        if (isSameWeek) {
          setChallenges(updateChallenges(parsed, stats, completedIds))
          return
        }
      } catch {}
    }

    const newChallenges = CHALLENGE_TEMPLATES.map((t, i) => ({
      ...t,
      id: `${currentWeekStart}-${i}`,
      current: 0,
      completed: false,
    }))
    setChallenges(updateChallenges(newChallenges, stats, completedIds))
  }, [currentWeekStart, stats, completedIds])

  useEffect(() => {
    if (challenges.length > 0) {
      localStorage.setItem("fitverse-weekly-challenges", JSON.stringify(challenges))
    }
  }, [challenges])

  const newlyCompleted = challenges.filter(
    (c) => c.completed && !completedIds.includes(c.id)
  )

  useEffect(() => {
    if (newlyCompleted.length > 0) {
      setCompletedIds([...completedIds, ...newlyCompleted.map((c) => c.id)])
      newlyCompleted.forEach((c) => {
        notifications.success(`${c.name} concluído!`, {
          description: `+${c.xpReward} XP`,
        })
      })
    }
  }, [newlyCompleted, completedIds, setCompletedIds])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Desafios da Semana</h3>
        <Badge variant="secondary" className="text-[10px]">
          {challenges.filter((c) => c.completed).length}/{challenges.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {challenges.map((challenge, i) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={cn("transition-all", challenge.completed && "border-success/30 bg-success/5")}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    challenge.completed ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {challenge.completed ? <Check className="w-4 h-4" /> : challenge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{challenge.name}</p>
                      <Badge variant="outline" className="text-[9px] shrink-0">+{challenge.xpReward} XP</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{challenge.description}</p>
                    {!challenge.completed && (
                      <div className="mt-2">
                        <ProgressBar
                          value={challenge.current}
                          max={challenge.target}
                          variant={challenge.current >= challenge.target ? "success" : "default"}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {challenge.current}/{challenge.target}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split("T")[0]!
}

function updateChallenges(
  challenges: WeeklyChallenge[],
  stats: WeeklyChallengesProps["stats"],
  completedIds: string[]
): WeeklyChallenge[] {
  return challenges.map((c) => {
    let current = 0
    switch (c.type) {
      case "scans": current = stats.scansThisWeek; break
      case "workouts": current = stats.workoutsThisWeek; break
      case "water": current = stats.waterDaysThisWeek; break
      case "sleep": current = stats.sleepDaysThisWeek; break
      case "streak": current = stats.currentStreak; break
    }
    const completed = current >= c.target || completedIds.includes(c.id)
    return { ...c, current: Math.min(current, c.target), completed }
  })
}
