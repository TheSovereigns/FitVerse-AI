"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import {
  Trophy, Gift, Lock, Check, Star, Zap, Crown,
  Palette, Clock, Dumbbell, Award, ChevronRight, Sparkles
} from "lucide-react"
import { getGamificationData } from "@/lib/gamification"
import { cn } from "@/lib/utils"

interface BattlePassProps {
  isLocked?: boolean
}

interface TierReward {
  tier: number
  xpRequired: number
  free: { type: string; label: string; value: string; icon: React.ReactNode }
  premium: { type: string; label: string; value: string; icon: React.ReactNode }
}

const XP_PER_TIER = 500

const tiers: TierReward[] = [
  { tier: 1, xpRequired: 500, free: { type: "coins", label: "50 Coins", value: "50", icon: <Star className="w-4 h-4" /> }, premium: { type: "coins", label: "100 Coins", value: "100", icon: <Star className="w-4 h-4 text-yellow-400" /> } },
  { tier: 2, xpRequired: 1000, free: { type: "xp-boost", label: "+10% XP", value: "1.1", icon: <Zap className="w-4 h-4" /> }, premium: { type: "xp-boost", label: "+25% XP", value: "1.25", icon: <Zap className="w-4 h-4 text-yellow-400" /> } },
  { tier: 3, xpRequired: 1500, free: { type: "theme", label: "Ice Theme", value: "theme-ice", icon: <Palette className="w-4 h-4" /> }, premium: { type: "coins", label: "200 Coins", value: "200", icon: <Star className="w-4 h-4 text-yellow-400" /> } },
  { tier: 4, xpRequired: 2000, free: { type: "coins", label: "75 Coins", value: "75", icon: <Star className="w-4 h-4" /> }, premium: { type: "coupon-pro", label: "10% OFF Pro", value: "PRO10", icon: <Crown className="w-4 h-4 text-blue-400" /> } },
  { tier: 5, xpRequired: 2500, free: { type: "workout-skip", label: "1 Extra Workout", value: "1", icon: <Dumbbell className="w-4 h-4" /> }, premium: { type: "coupon-pro", label: "15% OFF Pro", value: "PRO15", icon: <Crown className="w-4 h-4 text-blue-400" /> } },
  { tier: 6, xpRequired: 3000, free: { type: "coins", label: "100 Coins", value: "100", icon: <Star className="w-4 h-4" /> }, premium: { type: "coupon-premium", label: "10% OFF Premium", value: "PREM10", icon: <Award className="w-4 h-4 text-purple-400" /> } },
  { tier: 7, xpRequired: 3500, free: { type: "xp-boost", label: "+15% XP", value: "1.15", icon: <Zap className="w-4 h-4" /> }, premium: { type: "coins", label: "300 Coins", value: "300", icon: <Star className="w-4 h-4 text-yellow-400" /> } },
  { tier: 8, xpRequired: 4000, free: { type: "coins", label: "125 Coins", value: "125", icon: <Star className="w-4 h-4" /> }, premium: { type: "coupon-pro", label: "20% OFF Pro", value: "PRO20", icon: <Crown className="w-4 h-4 text-blue-400" /> } },
  { tier: 9, xpRequired: 4500, free: { type: "theme", label: "Neon Theme", value: "theme-neon", icon: <Palette className="w-4 h-4" /> }, premium: { type: "coupon-premium", label: "15% OFF Premium", value: "PREM15", icon: <Award className="w-4 h-4 text-purple-400" /> } },
  { tier: 10, xpRequired: 5000, free: { type: "coins", label: "200 Coins", value: "200", icon: <Star className="w-4 h-4" /> }, premium: { type: "coupon-premium", label: "20% OFF Premium", value: "PREM20", icon: <Award className="w-4 h-4 text-purple-400" /> } },
  { tier: 11, xpRequired: 5500, free: { type: "workout-skip", label: "2 Extra Workouts", value: "2", icon: <Dumbbell className="w-4 h-4" /> }, premium: { type: "coupon-pro", label: "25% OFF Pro", value: "PRO25", icon: <Crown className="w-4 h-4 text-blue-400" /> } },
  { tier: 12, xpRequired: 6000, free: { type: "xp-boost", label: "+20% XP", value: "1.2", icon: <Zap className="w-4 h-4" /> }, premium: { type: "coins", label: "500 Coins", value: "500", icon: <Star className="w-4 h-4 text-yellow-400" /> } },
  { tier: 13, xpRequired: 6500, free: { type: "coins", label: "150 Coins", value: "150", icon: <Star className="w-4 h-4" /> }, premium: { type: "coupon-premium", label: "25% OFF Premium", value: "PREM25", icon: <Award className="w-4 h-4 text-purple-400" /> } },
  { tier: 14, xpRequired: 7000, free: { type: "theme", label: "Sunset Theme", value: "theme-sunset", icon: <Palette className="w-4 h-4" /> }, premium: { type: "coupon-pro", label: "30% OFF Pro", value: "PRO30", icon: <Crown className="w-4 h-4 text-blue-400" /> } },
  { tier: 15, xpRequired: 7500, free: { type: "coins", label: "250 Coins", value: "250", icon: <Star className="w-4 h-4" /> }, premium: { type: "coupon-premium", label: "30% OFF Premium", value: "PREM30", icon: <Award className="w-4 h-4 text-purple-400" /> } },
  { tier: 16, xpRequired: 8000, free: { type: "workout-skip", label: "3 Extra Workouts", value: "3", icon: <Dumbbell className="w-4 h-4" /> }, premium: { type: "coins", label: "600 Coins", value: "600", icon: <Star className="w-4 h-4 text-yellow-400" /> } },
  { tier: 17, xpRequired: 8500, free: { type: "xp-boost", label: "+25% XP", value: "1.25", icon: <Zap className="w-4 h-4" /> }, premium: { type: "coupon-pro", label: "35% OFF Pro", value: "PRO35", icon: <Crown className="w-4 h-4 text-blue-400" /> } },
  { tier: 18, xpRequired: 9000, free: { type: "coins", label: "300 Coins", value: "300", icon: <Star className="w-4 h-4" /> }, premium: { type: "coupon-premium", label: "35% OFF Premium", value: "PREM35", icon: <Award className="w-4 h-4 text-purple-400" /> } },
  { tier: 19, xpRequired: 9500, free: { type: "theme", label: "Forest Theme", value: "theme-forest", icon: <Palette className="w-4 h-4" /> }, premium: { type: "coupon-pro", label: "40% OFF Pro", value: "PRO40", icon: <Crown className="w-4 h-4 text-blue-400" /> } },
  { tier: 20, xpRequired: 10000, free: { type: "coins", label: "400 Coins", value: "400", icon: <Star className="w-4 h-4" /> }, premium: { type: "coupon-premium", label: "40% OFF Premium", value: "PREM40", icon: <Award className="w-4 h-4 text-purple-400" /> } },
  { tier: 21, xpRequired: 10500, free: { type: "workout-skip", label: "5 Extra Workouts", value: "5", icon: <Dumbbell className="w-4 h-4" /> }, premium: { type: "coins", label: "750 Coins", value: "750", icon: <Star className="w-4 h-4 text-yellow-400" /> } },
  { tier: 22, xpRequired: 11000, free: { type: "xp-boost", label: "+30% XP", value: "1.3", icon: <Zap className="w-4 h-4" /> }, premium: { type: "coupon-premium", label: "45% OFF Premium", value: "PREM45", icon: <Award className="w-4 h-4 text-purple-400" /> } },
  { tier: 23, xpRequired: 11500, free: { type: "coins", label: "500 Coins", value: "500", icon: <Star className="w-4 h-4" /> }, premium: { type: "coupon-pro", label: "45% OFF Pro", value: "PRO45", icon: <Crown className="w-4 h-4 text-blue-400" /> } },
  { tier: 24, xpRequired: 12000, free: { type: "theme", label: "Ocean Theme", value: "theme-ocean", icon: <Palette className="w-4 h-4" /> }, premium: { type: "coupon-premium", label: "50% OFF Premium", value: "PREM50", icon: <Award className="w-4 h-4 text-purple-400" /> } },
  { tier: 25, xpRequired: 12500, free: { type: "coins", label: "600 Coins", value: "600", icon: <Star className="w-4 h-4" /> }, premium: { type: "coupon-pro", label: "50% OFF Pro", value: "PRO50", icon: <Crown className="w-4 h-4 text-blue-400" /> } },
  { tier: 26, xpRequired: 13000, free: { type: "workout-skip", label: "7 Extra Workouts", value: "7", icon: <Dumbbell className="w-4 h-4" /> }, premium: { type: "coins", label: "1000 Coins", value: "1000", icon: <Star className="w-4 h-4 text-yellow-400" /> } },
  { tier: 27, xpRequired: 13500, free: { type: "xp-boost", label: "+35% XP", value: "1.35", icon: <Zap className="w-4 h-4" /> }, premium: { type: "coupon-premium", label: "55% OFF Premium", value: "PREM55", icon: <Award className="w-4 h-4 text-purple-400" /> } },
  { tier: 28, xpRequired: 14000, free: { type: "coins", label: "750 Coins", value: "750", icon: <Star className="w-4 h-4" /> }, premium: { type: "coupon-pro", label: "55% OFF Pro", value: "PRO55", icon: <Crown className="w-4 h-4 text-blue-400" /> } },
  { tier: 29, xpRequired: 14500, free: { type: "theme", label: "Galaxy Theme", value: "theme-galaxy", icon: <Palette className="w-4 h-4" /> }, premium: { type: "coupon-premium", label: "60% OFF Premium", value: "PREM60", icon: <Award className="w-4 h-4 text-purple-400" /> } },
  { tier: 30, xpRequired: 15000, free: { type: "coins", label: "1000 Coins", value: "1000", icon: <Star className="w-4 h-4" /> }, premium: { type: "premium-trial", label: "7 DIAS PREMIUM", value: "7days", icon: <Crown className="w-5 h-5 text-yellow-400" /> } },
]

export function BattlePass({ isLocked = false }: BattlePassProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [totalXp, setTotalXp] = useState(0)
  const [claimedRewards, setClaimedRewards] = useState<string[]>([])
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    try {
      const data = getGamificationData()
      setTotalXp(data.xp)
      const stored = localStorage.getItem("fitverse-battlepass-claimed")
      if (stored) setClaimedRewards(JSON.parse(stored))
      setIsPremium(localStorage.getItem("fitverse-plan") === "premium")
    } catch (e) {
      logger.error("[BattlePass] Failed to load:", e)
    }
  }, [])

  const currentTier = Math.floor(totalXp / XP_PER_TIER)
  const xpInCurrentTier = totalXp % XP_PER_TIER
  const progress = (xpInCurrentTier / XP_PER_TIER) * 100

  const claimReward = (tierNum: number, type: "free" | "premium") => {
    const key = `tier-${tierNum}-${type}`
    if (claimedRewards.includes(key)) return

    const tier = tiers.find(t => t.tier === tierNum)
    if (!tier) return
    if (tierNum > currentTier) return

    const reward = type === "free" ? tier.free : tier.premium
    applyReward(reward)
    const updated = [...claimedRewards, key]
    setClaimedRewards(updated)
    localStorage.setItem("fitverse-battlepass-claimed", JSON.stringify(updated))
  }

  const applyReward = (reward: { type: string; value: string }) => {
    switch (reward.type) {
      case "coins":
        const coins = parseInt(localStorage.getItem("fitverse-coins") || "0") + parseInt(reward.value)
        localStorage.setItem("fitverse-coins", coins.toString())
        break
      case "theme":
        localStorage.setItem("fitverse-accent", reward.value)
        break
      case "xp-boost":
        localStorage.setItem("fitverse-xp-boost", reward.value)
        break
      case "workout-skip":
        const extra = parseInt(localStorage.getItem("fitverse-extra-workouts") || "0") + parseInt(reward.value)
        localStorage.setItem("fitverse-extra-workouts", extra.toString())
        break
      case "coupon-pro":
      case "coupon-premium":
        const coupons = JSON.parse(localStorage.getItem("fitverse-coupons") || "[]")
        coupons.push({ code: reward.value, type: reward.type, date: new Date().toISOString() })
        localStorage.setItem("fitverse-coupons", JSON.stringify(coupons))
        break
      case "premium-trial":
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 7)
        localStorage.setItem("fitverse-trial-end", trialEnd.toISOString())
        break
    }
  }

  const isClaimed = (tierNum: number, type: "free" | "premium") => {
    return claimedRewards.includes(`tier-${tierNum}-${type}`)
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
          const freeClaimed = isClaimed(tier.tier, "free")
          const premiumClaimed = isClaimed(tier.tier, "premium")
          const freeAvailable = unlocked && !freeClaimed
          const premiumAvailable = unlocked && !premiumClaimed

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
                    <Crown className="w-5 h-5 text-white" />
                  ) : (
                    <span className={cn("text-sm font-bold", tier.tier % 5 === 0 ? "text-brand" : "text-muted-foreground")}>{tier.tier}</span>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-2 gap-2">
                  {/* Free reward */}
                  <button
                    onClick={() => claimReward(tier.tier, "free")}
                    disabled={!freeAvailable}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border text-left transition-all",
                      freeClaimed ? "border-green-500/30 bg-green-500/5" :
                      freeAvailable ? "border-border hover:border-brand/50 hover:bg-muted/50 cursor-pointer" :
                      "border-border/50 bg-muted/20"
                    )}
                  >
                    <div className="shrink-0">{tier.free.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{tier.free.label}</p>
                      {freeClaimed && <Check className="w-3 h-3 text-green-500" />}
                    </div>
                  </button>

                  {/* Premium reward */}
                  <button
                    onClick={() => claimReward(tier.tier, "premium")}
                    disabled={!premiumAvailable}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border text-left transition-all relative overflow-hidden",
                      premiumClaimed ? "border-green-500/30 bg-green-500/5" :
                      premiumAvailable ? "border-brand/30 hover:border-brand/50 hover:bg-brand/5 cursor-pointer" :
                      "border-border/50 bg-muted/20"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-purple-500/5 pointer-events-none" />
                    <div className="shrink-0 relative z-10">{tier.premium.icon}</div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <p className="text-xs font-medium text-foreground truncate">{tier.premium.label}</p>
                      {premiumClaimed && <Check className="w-3 h-3 text-green-500" />}
                    </div>
                    {!isPremium && !premiumClaimed && (
                      <Crown className="w-3 h-3 text-brand shrink-0 relative z-10" />
                    )}
                  </button>
                </div>
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
