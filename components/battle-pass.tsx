"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import {
  Trophy, Lock, Check, Star, Zap,
  Dumbbell, Award, Shield
} from "lucide-react"
import { getGamificationData } from "@/lib/gamification"
import { cn } from "@/lib/utils"

interface BattlePassProps {
  isLocked?: boolean
}

interface TierReward {
  tier: number
  xpRequired: number
  label: string
  value: string
  type: string
  icon: React.ReactNode
}

const XP_PER_TIER = 500

const tiers: TierReward[] = [
  { tier: 1, xpRequired: 500, label: "50 Coins", value: "50", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 2, xpRequired: 1000, label: "+10% XP Boost", value: "1.1", type: "xp-boost", icon: <Zap className="w-4 h-4 text-blue-400" /> },
  { tier: 3, xpRequired: 1500, label: "100 Coins", value: "100", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 4, xpRequired: 2000, label: "1 Extra Workout", value: "1", type: "workout-skip", icon: <Dumbbell className="w-4 h-4 text-green-400" /> },
  { tier: 5, xpRequired: 2500, label: "150 Coins", value: "150", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 6, xpRequired: 3000, label: "+15% XP Boost", value: "1.15", type: "xp-boost", icon: <Zap className="w-4 h-4 text-blue-400" /> },
  { tier: 7, xpRequired: 3500, label: "200 Coins", value: "200", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 8, xpRequired: 4000, label: "2 Extra Workouts", value: "2", type: "workout-skip", icon: <Dumbbell className="w-4 h-4 text-green-400" /> },
  { tier: 9, xpRequired: 4500, label: "250 Coins", value: "250", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 10, xpRequired: 5000, label: "+20% XP Boost", value: "1.2", type: "xp-boost", icon: <Zap className="w-4 h-4 text-blue-400" /> },
  { tier: 11, xpRequired: 5500, label: "300 Coins", value: "300", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 12, xpRequired: 6000, label: "3 Extra Workouts", value: "3", type: "workout-skip", icon: <Dumbbell className="w-4 h-4 text-green-400" /> },
  { tier: 13, xpRequired: 6500, label: "350 Coins", value: "350", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 14, xpRequired: 7000, label: "+25% XP Boost", value: "1.25", type: "xp-boost", icon: <Zap className="w-4 h-4 text-blue-400" /> },
  { tier: 15, xpRequired: 7500, label: "500 Coins", value: "500", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 16, xpRequired: 8000, label: "5 Extra Workouts", value: "5", type: "workout-skip", icon: <Dumbbell className="w-4 h-4 text-green-400" /> },
  { tier: 17, xpRequired: 8500, label: "600 Coins", value: "600", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 18, xpRequired: 9000, label: "+30% XP Boost", value: "1.3", type: "xp-boost", icon: <Zap className="w-4 h-4 text-blue-400" /> },
  { tier: 19, xpRequired: 9500, label: "700 Coins", value: "700", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 20, xpRequired: 10000, label: "7 Extra Workouts", value: "7", type: "workout-skip", icon: <Dumbbell className="w-4 h-4 text-green-400" /> },
  { tier: 21, xpRequired: 10500, label: "800 Coins", value: "800", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 22, xpRequired: 11000, label: "+35% XP Boost", value: "1.35", type: "xp-boost", icon: <Zap className="w-4 h-4 text-blue-400" /> },
  { tier: 23, xpRequired: 11500, label: "900 Coins", value: "900", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 24, xpRequired: 12000, label: "10 Extra Workouts", value: "10", type: "workout-skip", icon: <Dumbbell className="w-4 h-4 text-green-400" /> },
  { tier: 25, xpRequired: 12500, label: "1000 Coins", value: "1000", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 26, xpRequired: 13000, label: "+40% XP Boost", value: "1.4", type: "xp-boost", icon: <Zap className="w-4 h-4 text-blue-400" /> },
  { tier: 27, xpRequired: 13500, label: "1200 Coins", value: "1200", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 28, xpRequired: 14000, label: "12 Extra Workouts", value: "12", type: "workout-skip", icon: <Dumbbell className="w-4 h-4 text-green-400" /> },
  { tier: 29, xpRequired: 14500, label: "1500 Coins", value: "1500", type: "coins", icon: <Star className="w-4 h-4 text-yellow-400" /> },
  { tier: 30, xpRequired: 15000, label: "7 Dias Premium Gratis", value: "7days", type: "premium-trial", icon: <Award className="w-5 h-5 text-yellow-400" /> },
]

export function BattlePass({ isLocked = false }: BattlePassProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [totalXp, setTotalXp] = useState(0)
  const [claimedRewards, setClaimedRewards] = useState<number[]>([])

  useEffect(() => {
    try {
      const data = getGamificationData()
      setTotalXp(data.xp)
      const stored = localStorage.getItem("fitverse-battlepass-claimed")
      if (stored) setClaimedRewards(JSON.parse(stored))
    } catch (e) {
      logger.error("[BattlePass] Failed to load:", e)
    }
  }, [])

  const currentTier = Math.floor(totalXp / XP_PER_TIER)
  const xpInCurrentTier = totalXp % XP_PER_TIER
  const progress = (xpInCurrentTier / XP_PER_TIER) * 100

  const claimReward = (tierNum: number) => {
    if (claimedRewards.includes(tierNum)) return
    const tier = tiers.find(t => t.tier === tierNum)
    if (!tier || tierNum > currentTier) return

    applyReward(tier.type, tier.value)
    const updated = [...claimedRewards, tierNum]
    setClaimedRewards(updated)
    localStorage.setItem("fitverse-battlepass-claimed", JSON.stringify(updated))
  }

  const applyReward = (type: string, value: string) => {
    switch (type) {
      case "coins":
        const coins = parseInt(localStorage.getItem("fitverse-coins") || "0") + parseInt(value)
        localStorage.setItem("fitverse-coins", coins.toString())
        break
      case "xp-boost":
        localStorage.setItem("fitverse-xp-boost", value)
        break
      case "workout-skip":
        const extra = parseInt(localStorage.getItem("fitverse-extra-workouts") || "0") + parseInt(value)
        localStorage.setItem("fitverse-extra-workouts", extra.toString())
        break
      case "premium-trial":
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 7)
        localStorage.setItem("fitverse-trial-end", trialEnd.toISOString())
        break
    }
  }

  if (isLocked) {
    return (
      <div className="glass-strong border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-foreground font-medium">Pro Feature</p>
            <p className="text-sm text-muted-foreground">{isEnglish ? "Unlock Battle Pass" : "Desbloqueie o Passe de Batalha"}</p>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          <h2 className="text-lg font-semibold text-foreground mb-4">{isEnglish ? "Battle Pass" : "Passe de Batalha"}</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-strong border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-brand" />
        <h2 className="text-lg font-semibold text-foreground">{isEnglish ? "Battle Pass" : "Passe de Batalha"}</h2>
      </div>

      {/* Progress header */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <span className="text-lg font-bold text-brand">{currentTier}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{isEnglish ? "Current Tier" : "Nivel Atual"}</p>
              <p className="text-xs text-muted-foreground">{totalXp.toLocaleString()} XP {isEnglish ? "total" : "total"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{xpInCurrentTier}/{XP_PER_TIER} XP</p>
            <p className="text-xs text-muted-foreground">{isEnglish ? "to next tier" : "para proximo nivel"}</p>
          </div>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Tiers list */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {[...tiers].reverse().map((tier) => {
          const unlocked = tier.tier <= currentTier
          const claimed = claimedRewards.includes(tier.tier)
          const available = unlocked && !claimed

          return (
            <motion.div
              key={tier.tier}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (30 - tier.tier) * 0.02 }}
              className={cn(
                "rounded-xl border p-3 transition-all",
                unlocked ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  tier.tier === 30 ? "bg-gradient-to-br from-yellow-500 to-orange-500" :
                  tier.tier % 5 === 0 ? "bg-brand/20" : "bg-muted"
                )}>
                  {tier.tier === 30 ? (
                    <Award className="w-5 h-5 text-white" />
                  ) : (
                    <span className={cn("text-sm font-bold", tier.tier % 5 === 0 ? "text-brand" : "text-muted-foreground")}>{tier.tier}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {tier.icon}
                    <p className="text-sm font-medium text-foreground">{tier.label}</p>
                  </div>
                </div>

                <button
                  onClick={() => claimReward(tier.tier)}
                  disabled={!available}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                    claimed ? "bg-green-500/10 text-green-500 border border-green-500/30" :
                    available ? "bg-brand text-white hover:bg-brand/90" :
                    "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {claimed ? <Check className="w-3 h-3 inline mr-1" /> : null}
                  {claimed ? (isEnglish ? "Claimed" : "Resgatado") :
                   available ? (isEnglish ? "Claim" : "Resgatar") :
                   `${tier.tier > currentTier ? (isEnglish ? "Locked" : "Bloqueado") : ""}`}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* How it works */}
      <div className="mt-4 p-3 rounded-xl border border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          {isEnglish
            ? "Earn XP by scanning food, completing workouts, tracking water, and building habits"
            : "Ganhe XP escaneando alimentos, completando treinos, registrando agua e construindo habitos"}
        </p>
      </div>
    </div>
  )
}
