"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Trophy, Lock, Star, Zap, Target, Heart, Brain, Dumbbell, ScanLine, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  requirement: number
  current: number
  unlocked: boolean
  xpReward: number
  category: "scan" | "workout" | "streak" | "social" | "health"
}

const ALL_ACHIEVEMENTS: Omit<Achievement, "current" | "unlocked">[] = [
  { id: "first-scan", name: "Primeiro Scan", description: "Escanie seu primeiro alimento", icon: <ScanLine className="w-5 h-5" />, requirement: 1, xpReward: 50, category: "scan" },
  { id: "scan-10", name: "Explorador", description: "Escanie 10 alimentos", icon: <ScanLine className="w-5 h-5" />, requirement: 10, xpReward: 100, category: "scan" },
  { id: "scan-50", name: "Mestre dos Scans", description: "Escanie 50 alimentos", icon: <ScanLine className="w-5 h-5" />, requirement: 50, xpReward: 500, category: "scan" },
  { id: "scan-100", name: "Lenda do FitScan", description: "Escanie 100 alimentos", icon: <ScanLine className="w-5 h-5" />, requirement: 100, xpReward: 1000, category: "scan" },
  { id: "workout-1", name: "Primeiro Treino", description: "Complete seu primeiro treino", icon: <Dumbbell className="w-5 h-5" />, requirement: 1, xpReward: 100, category: "workout" },
  { id: "workout-10", name: "Atleta Dedicado", description: "Complete 10 treinos", icon: <Dumbbell className="w-5 h-5" />, requirement: 10, xpReward: 300, category: "workout" },
  { id: "workout-50", name: "Máquina", description: "Complete 50 treinos", icon: <Dumbbell className="w-5 h-5" />, requirement: 50, xpReward: 1000, category: "workout" },
  { id: "streak-3", name: "Iniciante Consistente", description: "3 dias seguidos ativo", icon: <Flame className="w-5 h-5" />, requirement: 3, xpReward: 75, category: "streak" },
  { id: "streak-7", name: "Semana Perfeita", description: "7 dias seguidos ativo", icon: <Flame className="w-5 h-5" />, requirement: 7, xpReward: 200, category: "streak" },
  { id: "streak-30", name: "Lenda da Disciplina", description: "30 dias seguidos ativo", icon: <Flame className="w-5 h-5" />, requirement: 30, xpReward: 1000, category: "streak" },
  { id: "streak-100", name: "Centenário", description: "100 dias seguidos ativo", icon: <Flame className="w-5 h-5" />, requirement: 100, xpReward: 5000, category: "streak" },
  { id: "plan-1", name: "Planejador", description: "Crie seu primeiro plano metabólico", icon: <Target className="w-5 h-5" />, requirement: 1, xpReward: 150, category: "health" },
  { id: "sleep-7", name: "Dorminhoco", description: "Registre 7 noites de sono", icon: <Heart className="w-5 h-5" />, requirement: 7, xpReward: 100, category: "health" },
  { id: "checkin-7", name: "Check-in Semanal", description: "Faça 7 check-ins de saúde", icon: <Heart className="w-5 h-5" />, requirement: 7, xpReward: 150, category: "health" },
  { id: "hydration-7", name: "Hidratado", description: "Atinja a meta de água por 7 dias", icon: <Heart className="w-5 h-5" />, requirement: 7, xpReward: 100, category: "health" },
  { id: "meditation-5", name: "Mente Calma", description: "Complete 5 meditações", icon: <Brain className="w-5 h-5" />, requirement: 5, xpReward: 100, category: "health" },
]

interface AchievementSystemProps {
  stats: {
    totalScans: number
    totalWorkouts: number
    currentStreak: number
    longestStreak: number
  }
}

export function AchievementSystem({ stats }: AchievementSystemProps) {
  const { t } = useTranslation()
  const [unlockedIds, setUnlockedIds] = useLocalStorage<string[]>("fitverse-achievements", [])
  const [showAll, setShowAll] = useState(false)

  const achievements: Achievement[] = ALL_ACHIEVEMENTS.map((a) => {
    let current = 0
    switch (a.category) {
      case "scan": current = stats.totalScans; break
      case "workout": current = stats.totalWorkouts; break
      case "streak": current = stats.longestStreak; break
      default: current = 0
    }
    return {
      ...a,
      current: Math.min(current, a.requirement),
      unlocked: unlockedIds.includes(a.id),
    }
  })

  const newlyUnlocked = achievements.filter((a) => a.unlocked && !unlockedIds.includes(a.id))

  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      setUnlockedIds([...unlockedIds, ...newlyUnlocked.map((a) => a.id)])
    }
  }, [newlyUnlocked, unlockedIds, setUnlockedIds])

  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)
  const displayAchievements = showAll ? achievements : [...unlocked, ...locked].slice(0, 6)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Conquistas</h3>
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs font-medium">{unlocked.length}/{achievements.length}</span>
        </div>
      </div>

      {unlocked.length === 0 && locked.length > 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8 text-muted-foreground" />}
          title="Nenhuma conquista ainda"
          description="Continue usando o FitVerse para desbloquear conquistas!"
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {displayAchievements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className={cn(
                  "relative overflow-hidden transition-all",
                  a.unlocked ? "border-brand/30 bg-brand-muted/30" : "opacity-60"
                )}
              >
                <CardContent className="p-3 text-center">
                  <div className={cn(
                    "w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2",
                    a.unlocked ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {a.unlocked ? a.icon : <Lock className="w-4 h-4" />}
                  </div>
                  <p className="text-[10px] font-medium text-foreground leading-tight">{a.name}</p>
                  {!a.unlocked && (
                    <div className="mt-1.5">
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand/50 rounded-full"
                          style={{ width: `${(a.current / a.requirement) * 100}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {a.current}/{a.requirement}
                      </p>
                    </div>
                  )}
                  {a.unlocked && (
                    <Badge variant="secondary" className="mt-1 text-[9px] px-1.5 py-0">
                      +{a.xpReward} XP
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {achievements.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? "Ver menos" : `Ver todas (${achievements.length})`}
        </button>
      )}
    </div>
  )
}
