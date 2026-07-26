"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import {
  Trophy,
  Lock,
  Check,
  Star,
  Zap,
  Dumbbell,
  Award,
  ChevronLeft,
  ChevronRight,
  Gift,
  Crown,
  Sparkles,
  ArrowRight,
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
  rarity: "common" | "rare" | "epic" | "legendary"
}

const XP_PER_TIER = 500

const tiers: TierReward[] = [
  { tier: 1, xpRequired: 500, label: "50 Coins", value: "50", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "common" },
  { tier: 2, xpRequired: 1000, label: "+10% XP", value: "1.1", type: "xp-boost", icon: <Zap className="w-5 h-5" />, rarity: "common" },
  { tier: 3, xpRequired: 1500, label: "100 Coins", value: "100", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "common" },
  { tier: 4, xpRequired: 2000, label: "+1 Treino", value: "1", type: "workout-skip", icon: <Dumbbell className="w-5 h-5" />, rarity: "common" },
  { tier: 5, xpRequired: 2500, label: "10% OFF", value: "PREM10", type: "coupon", icon: <Award className="w-5 h-5" />, rarity: "rare" },
  { tier: 6, xpRequired: 3000, label: "+15% XP", value: "1.15", type: "xp-boost", icon: <Zap className="w-5 h-5" />, rarity: "common" },
  { tier: 7, xpRequired: 3500, label: "200 Coins", value: "200", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "common" },
  { tier: 8, xpRequired: 4000, label: "+2 Treinos", value: "2", type: "workout-skip", icon: <Dumbbell className="w-5 h-5" />, rarity: "rare" },
  { tier: 9, xpRequired: 4500, label: "250 Coins", value: "250", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "common" },
  { tier: 10, xpRequired: 5000, label: "15% OFF", value: "PREM15", type: "coupon", icon: <Award className="w-5 h-5" />, rarity: "epic" },
  { tier: 11, xpRequired: 5500, label: "300 Coins", value: "300", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "common" },
  { tier: 12, xpRequired: 6000, label: "+3 Treinos", value: "3", type: "workout-skip", icon: <Dumbbell className="w-5 h-5" />, rarity: "rare" },
  { tier: 13, xpRequired: 6500, label: "350 Coins", value: "350", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "common" },
  { tier: 14, xpRequired: 7000, label: "+25% XP", value: "1.25", type: "xp-boost", icon: <Zap className="w-5 h-5" />, rarity: "rare" },
  { tier: 15, xpRequired: 7500, label: "20% OFF", value: "PREM20", type: "coupon", icon: <Award className="w-5 h-5" />, rarity: "epic" },
  { tier: 16, xpRequired: 8000, label: "+5 Treinos", value: "5", type: "workout-skip", icon: <Dumbbell className="w-5 h-5" />, rarity: "rare" },
  { tier: 17, xpRequired: 8500, label: "600 Coins", value: "600", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "common" },
  { tier: 18, xpRequired: 9000, label: "+30% XP", value: "1.3", type: "xp-boost", icon: <Zap className="w-5 h-5" />, rarity: "rare" },
  { tier: 19, xpRequired: 9500, label: "700 Coins", value: "700", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "common" },
  { tier: 20, xpRequired: 10000, label: "25% OFF", value: "PREM25", type: "coupon", icon: <Award className="w-5 h-5" />, rarity: "epic" },
  { tier: 21, xpRequired: 10500, label: "800 Coins", value: "800", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "common" },
  { tier: 22, xpRequired: 11000, label: "+35% XP", value: "1.35", type: "xp-boost", icon: <Zap className="w-5 h-5" />, rarity: "rare" },
  { tier: 23, xpRequired: 11500, label: "900 Coins", value: "900", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "common" },
  { tier: 24, xpRequired: 12000, label: "+10 Treinos", value: "10", type: "workout-skip", icon: <Dumbbell className="w-5 h-5" />, rarity: "epic" },
  { tier: 25, xpRequired: 12500, label: "30% OFF", value: "PREM30", type: "coupon", icon: <Award className="w-5 h-5" />, rarity: "legendary" },
  { tier: 26, xpRequired: 13000, label: "+40% XP", value: "1.4", type: "xp-boost", icon: <Zap className="w-5 h-5" />, rarity: "rare" },
  { tier: 27, xpRequired: 13500, label: "1200 Coins", value: "1200", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "common" },
  { tier: 28, xpRequired: 14000, label: "+12 Treinos", value: "12", type: "workout-skip", icon: <Dumbbell className="w-5 h-5" />, rarity: "epic" },
  { tier: 29, xpRequired: 14500, label: "1500 Coins", value: "1500", type: "coins", icon: <Star className="w-5 h-5" />, rarity: "rare" },
  { tier: 30, xpRequired: 15000, label: "7 Dias Premium", value: "7days", type: "premium-trial", icon: <Crown className="w-6 h-6" />, rarity: "legendary" },
]

const rarityColors = {
  common: { border: "border-gray-500/30", bg: "bg-gray-500/10", text: "text-gray-400", glow: "" },
  rare: { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-blue-500/10" },
  epic: { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-400", glow: "shadow-purple-500/10" },
  legendary: { border: "border-yellow-500/30", bg: "bg-yellow-500/10", text: "text-yellow-400", glow: "shadow-yellow-500/10" },
}

interface Coupon {
  id: string
  code: string
  date: string
  used: boolean
}

function CouponsList() {
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [coupons, setCoupons] = useState<Coupon[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fitverse-coupons")
      if (stored) setCoupons(JSON.parse(stored))
    } catch {}
  }, [])

  const markUsed = (id: string) => {
    const updated = coupons.map(c => c.id === id ? { ...c, used: true } : c)
    setCoupons(updated)
    localStorage.setItem("fitverse-coupons", JSON.stringify(updated))
  }

  const activeCoupons = coupons.filter(c => !c.used)
  const usedCoupons = coupons.filter(c => c.used)

  if (activeCoupons.length === 0 && usedCoupons.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        {isEnglish ? "No coupons yet. Reach tier 5+ to earn discount coupons!" : "Nenhum cupom ainda. Atinga o nivel 5+ para ganhar cupons de desconto!"}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {activeCoupons.map((coupon) => (
        <div key={coupon.id} className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15">
              <Award className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{coupon.code}</p>
              <p className="text-[10px] text-muted-foreground">{isEnglish ? "Premium discount" : "Desconto Premium"}</p>
            </div>
          </div>
          <button
            onClick={() => markUsed(coupon.id)}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand/90"
          >
            {isEnglish ? "Use" : "Usar"}
          </button>
        </div>
      ))}
      {usedCoupons.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            {isEnglish ? `Used (${usedCoupons.length})` : `Usados (${usedCoupons.length})`}
          </summary>
          <div className="mt-2 space-y-1">
            {usedCoupons.map((coupon) => (
              <div key={coupon.id} className="flex items-center gap-2 rounded-lg bg-muted/20 p-2 opacity-50">
                <Check className="h-3 w-3 text-green-500" />
                <span className="text-xs text-muted-foreground line-through">{coupon.code}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

export function BattlePass({ isLocked = false }: BattlePassProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [totalXp, setTotalXp] = useState(0)
  const [claimedRewards, setClaimedRewards] = useState<number[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedTier, setSelectedTier] = useState<TierReward | null>(null)

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
      case "coins": {
        const coins = parseInt(localStorage.getItem("fitverse-coins") || "0") + parseInt(value)
        localStorage.setItem("fitverse-coins", coins.toString())
        break
      }
      case "xp-boost":
        localStorage.setItem("fitverse-xp-boost", value)
        break
      case "workout-skip": {
        const extra = parseInt(localStorage.getItem("fitverse-extra-workouts") || "0") + parseInt(value)
        localStorage.setItem("fitverse-extra-workouts", extra.toString())
        break
      }
      case "coupon": {
        const coupons = JSON.parse(localStorage.getItem("fitverse-coupons") || "[]")
        coupons.push({ id: `coupon-${Date.now()}`, code: value, date: new Date().toISOString(), used: false })
        localStorage.setItem("fitverse-coupons", JSON.stringify(coupons))
        break
      }
      case "premium-trial": {
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 7)
        localStorage.setItem("fitverse-trial-end", trialEnd.toISOString())
        break
      }
    }
  }

  const scrollTo = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = dir === "left" ? -160 : 160
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" })
  }

  if (isLocked) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border p-6">
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium text-foreground">Pro Feature</p>
            <p className="text-sm text-muted-foreground">{isEnglish ? "Unlock Battle Pass" : "Desbloqueie o Passe de Batalha"}</p>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          <h2 className="text-lg font-semibold text-foreground">{isEnglish ? "Battle Pass" : "Passe de Batalha"}</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl space-y-4 pb-safe-nav">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-purple-500/20 via-brand/5 to-transparent p-5"
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-brand/10 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
              <Trophy className="h-4 w-4 text-purple-400" />
            </div>
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400">
              BATTLE PASS
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-foreground">{currentTier}</span>
                <span className="text-sm text-muted-foreground">/ 30</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalXp.toLocaleString()} XP {isEnglish ? "total" : "total"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {xpInCurrentTier}/{XP_PER_TIER} XP
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isEnglish ? "to next tier" : "para proximo nivel"}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-3 overflow-hidden rounded-full bg-border/50">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-brand"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Horizontal Tier Track */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative"
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-sm font-semibold text-foreground">{isEnglish ? "Rewards Track" : "Trilha de Recompensas"}</h3>
          <div className="flex gap-1">
            <button
              onClick={() => scrollTo("left")}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => scrollTo("right")}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        >
          {tiers.map((tier) => {
            const unlocked = tier.tier <= currentTier
            const claimed = claimedRewards.includes(tier.tier)
            const available = unlocked && !claimed
            const colors = rarityColors[tier.rarity]
            const isMilestone = tier.tier % 10 === 0 || tier.tier === 30

            return (
              <motion.button
                key={tier.tier}
                onClick={() => setSelectedTier(selectedTier?.tier === tier.tier ? null : tier)}
                className={cn(
                  "relative flex shrink-0 flex-col items-center rounded-xl border-2 p-2 transition-all",
                  "w-[100px] min-h-[130px]",
                  unlocked
                    ? cn(colors.border, colors.bg, selectedTier?.tier === tier.tier && "ring-2 ring-brand/50")
                    : "border-border/30 bg-muted/20 opacity-50",
                  isMilestone && unlocked && "min-h-[145px]"
                )}
                style={{ scrollSnapAlign: "center" }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Tier Number */}
                <div
                  className={cn(
                    "mb-1 flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black",
                    unlocked ? cn(colors.bg, colors.text) : "bg-muted text-muted-foreground"
                  )}
                >
                  {tier.tier}
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    "mb-1 flex h-10 w-10 items-center justify-center rounded-xl",
                    unlocked ? colors.bg : "bg-muted/30"
                  )}
                >
                  <span className={cn(unlocked ? colors.text : "text-muted-foreground")}>
                    {tier.icon}
                  </span>
                </div>

                {/* Label */}
                <p className={cn(
                  "text-center text-[9px] font-semibold leading-tight",
                  unlocked ? "text-foreground" : "text-muted-foreground"
                )}>
                  {tier.label}
                </p>

                {/* Status indicator */}
                <div className="mt-auto pt-1">
                  {claimed ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
                      <Check className="h-3 w-3 text-green-400" />
                    </div>
                  ) : available ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/20"
                    >
                      <Gift className="h-3 w-3 text-brand" />
                    </motion.div>
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted/30">
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Milestone glow */}
                {isMilestone && unlocked && (
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-yellow-500/20 to-transparent pointer-events-none" />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Selected Tier Detail */}
      <AnimatePresence>
        {selectedTier && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-xl",
                    rarityColors[selectedTier.rarity].bg
                  )}
                >
                  <span className={rarityColors[selectedTier.rarity].text}>
                    {selectedTier.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{selectedTier.label}</h4>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                        rarityColors[selectedTier.rarity].bg,
                        rarityColors[selectedTier.rarity].text
                      )}
                    >
                      {selectedTier.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isEnglish ? "Tier" : "Nivel"} {selectedTier.tier} · {selectedTier.xpRequired.toLocaleString()} XP
                  </p>
                </div>
                {selectedTier.tier <= currentTier && !claimedRewards.includes(selectedTier.tier) && (
                  <button
                    onClick={() => {
                      claimReward(selectedTier.tier)
                      setSelectedTier(null)
                    }}
                    className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand/90"
                  >
                    <span className="flex items-center gap-1">
                      {isEnglish ? "Claim" : "Resgatar"}
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </button>
                )}
                {claimedRewards.includes(selectedTier.tier) && (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
                    <Check className="h-3 w-3" />
                    {isEnglish ? "Claimed" : "Resgatado"}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Coupons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15">
            <Award className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{isEnglish ? "My Coupons" : "Meus Cupons"}</h3>
        </div>
        <CouponsList />
      </motion.div>

      {/* How to earn XP */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{isEnglish ? "How to Earn XP" : "Como Ganhar XP"}</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: "ScanLine", label: isEnglish ? "Scan Food" : "Escanear", xp: isEnglish ? "+10 XP" : "+10 XP" },
            { icon: "Dumbbell", label: isEnglish ? "Workout" : "Treino", xp: isEnglish ? "+25 XP" : "+25 XP" },
            { icon: "Droplets", label: isEnglish ? "Track Water" : "Agua", xp: isEnglish ? "+5 XP" : "+5 XP" },
            { icon: "Target", label: isEnglish ? "Build Habits" : "Habitos", xp: isEnglish ? "+15 XP" : "+15 XP" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/30 p-2.5">
              <span className="text-[10px] font-bold text-brand">{item.xp}</span>
              <span className="text-xs text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
