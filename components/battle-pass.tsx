"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import {
  Trophy, Lock, Check, Star, Zap, Dumbbell, Award,
  ChevronLeft, ChevronRight, Gift, Crown, Sparkles,
  ArrowRight, Flame, Shield, Target, Droplets, X, ScanLine,
} from "lucide-react"
import { getGamificationData } from "@/lib/gamification"
import { cn } from "@/lib/utils"

interface BattlePassProps { isLocked?: boolean }

interface TierReward {
  tier: number; xpRequired: number; label: string; value: string
  type: string; icon: React.ReactNode; rarity: "common" | "rare" | "epic" | "legendary"
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

const rarityConfig = {
  common:  { border: "border-gray-400/25", bg: "bg-gray-400/8", text: "text-gray-300", glow: "", accent: "#9CA3AF" },
  rare:    { border: "border-blue-400/30", bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]", accent: "#3B82F6" },
  epic:    { border: "border-purple-400/30", bg: "bg-purple-500/10", text: "text-purple-400", glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]", accent: "#A855F7" },
  legendary: { border: "border-yellow-400/30", bg: "bg-yellow-500/10", text: "text-yellow-400", glow: "shadow-[0_0_25px_rgba(234,179,8,0.2)]", accent: "#EAB308" },
}

interface Coupon { id: string; code: string; date: string; used: boolean }

function CouponsList() {
  const { t } = useTranslation()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  useEffect(() => {
    try { const s = localStorage.getItem("fitverse-coupons"); if (s) setCoupons(JSON.parse(s)) } catch {}
  }, [])
  const markUsed = (id: string) => {
    const u = coupons.map(c => c.id === id ? { ...c, used: true } : c)
    setCoupons(u); localStorage.setItem("fitverse-coupons", JSON.stringify(u))
  }
  const active = coupons.filter(c => !c.used)
  const used = coupons.filter(c => c.used)
  if (active.length === 0 && used.length === 0)
    return <p className="text-xs text-muted-foreground text-center py-6">{t("bp_no_coupons")}</p>
  return (
    <div className="space-y-2">
      {active.map(c => (
        <div key={c.id} className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15"><Award className="h-4 w-4 text-purple-400" /></div>
            <div><p className="text-sm font-bold text-foreground font-mono">{c.code}</p><p className="text-[10px] text-muted-foreground">{t("bp_premium_discount")}</p></div>
          </div>
          <button onClick={() => markUsed(c.id)} className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 transition-colors">{t("bp_claim")}</button>
        </div>
      ))}
      {used.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">{t("bp_used")} ({used.length})</summary>
          <div className="mt-2 space-y-1">{used.map(c => (
            <div key={c.id} className="flex items-center gap-2 rounded-lg bg-muted/20 p-2 opacity-50"><Check className="h-3 w-3 text-green-500" /><span className="text-xs text-muted-foreground line-through">{c.code}</span></div>
          ))}</div>
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
  const [showCoupons, setShowCoupons] = useState(false)

  useEffect(() => {
    try {
      const data = getGamificationData(); setTotalXp(data.xp)
      const s = localStorage.getItem("fitverse-battlepass-claimed"); if (s) setClaimedRewards(JSON.parse(s))
    } catch (e) { logger.error("[BattlePass] Failed to load:", e) }
  }, [])

  const currentTier = Math.floor(totalXp / XP_PER_TIER)
  const xpInCurrentTier = totalXp % XP_PER_TIER
  const progress = (xpInCurrentTier / XP_PER_TIER) * 100

  const claimReward = (tierNum: number) => {
    if (claimedRewards.includes(tierNum)) return
    const tier = tiers.find(t => t.tier === tierNum)
    if (!tier || tierNum > currentTier) return
    applyReward(tier.type, tier.value)
    const updated = [...claimedRewards, tierNum]; setClaimedRewards(updated)
    localStorage.setItem("fitverse-battlepass-claimed", JSON.stringify(updated))
  }

  const applyReward = (type: string, value: string) => {
    switch (type) {
      case "coins": { const c = parseInt(localStorage.getItem("fitverse-coins") || "0") + parseInt(value); localStorage.setItem("fitverse-coins", c.toString()); break }
      case "xp-boost": localStorage.setItem("fitverse-xp-boost", value); break
      case "workout-skip": { const e = parseInt(localStorage.getItem("fitverse-extra-workouts") || "0") + parseInt(value); localStorage.setItem("fitverse-extra-workouts", e.toString()); break }
      case "coupon": { const cs = JSON.parse(localStorage.getItem("fitverse-coupons") || "[]"); cs.push({ id: `coupon-${Date.now()}`, code: value, date: new Date().toISOString(), used: false }); localStorage.setItem("fitverse-coupons", JSON.stringify(cs)); break }
      case "premium-trial": { const d = new Date(); d.setDate(d.getDate() + 7); localStorage.setItem("fitverse-trial-end", d.toISOString()); break }
    }
  }

  const scrollTo = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === "left" ? -170 : 170, behavior: "smooth" })
  }

  const getLocalizedLabel = (label: string): string => {
    if (!isEnglish) return label
    if (label === "+1 Treino") return "+1 Workout"
    if (label === "+2 Treinos") return "+2 Workouts"
    if (label === "+3 Treinos") return "+3 Workouts"
    if (label === "+5 Treinos") return "+5 Workouts"
    if (label === "+10 Treinos") return "+10 Workouts"
    if (label === "+12 Treinos") return "+12 Workouts"
    if (label === "7 Dias Premium") return "7 Days Premium"
    return label
  }

  if (isLocked) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-border p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/60 to-muted/30 backdrop-blur-md flex items-center justify-center z-10">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50"><Lock className="h-8 w-8 text-muted-foreground" /></div>
            <p className="font-bold text-foreground text-lg">{t("bp_pro_feature")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("bp_unlock_battle_pass")}</p>
          </div>
        </div>
        <div className="h-40 opacity-20" />
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl space-y-4 pb-safe-nav">
      {/* ═══ EPIC HEADER ═══ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-purple-500/20"
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/15 via-indigo-500/8 to-brand/10" />
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/15 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute right-1/4 top-0 h-20 w-20 rounded-full bg-yellow-500/8 blur-2xl" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/25 to-brand/15">
                <Trophy className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{t("bp_battle_pass")}</span>
                <p className="text-[10px] text-muted-foreground">{totalXp.toLocaleString()} XP {t("bp_total_xp")}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black bg-gradient-to-r from-purple-400 to-brand bg-clip-text text-transparent">{currentTier}</span>
                <span className="text-sm text-muted-foreground font-medium">/ 30</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{t("bp_to_next_level")}</p>
            </div>
          </div>

          {/* XP Progress bar */}
          <div className="relative">
            <div className="h-3.5 overflow-hidden rounded-full bg-black/30 border border-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-brand relative"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </motion.div>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">{xpInCurrentTier} / {XP_PER_TIER} XP</span>
              <span className="text-[10px] font-semibold text-purple-400">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ HORIZONTAL GAME TRACK ═══ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative rounded-3xl border border-border bg-card/50 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">{t("bp_rewards_track")}</h3>
          <div className="flex gap-1.5">
            <button onClick={() => scrollTo("left")} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => scrollTo("right")} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tier track with connecting line */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-border/50 z-0" />

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-3 pt-2 px-1 scrollbar-hide relative z-10"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {tiers.map((tier) => {
              const unlocked = tier.tier <= currentTier
              const claimed = claimedRewards.includes(tier.tier)
              const available = unlocked && !claimed
              const colors = rarityConfig[tier.rarity]
              const isMilestone = tier.tier % 5 === 0
              const isLast = tier.tier === 30

              return (
                <motion.button key={tier.tier}
                  onClick={() => setSelectedTier(selectedTier?.tier === tier.tier ? null : tier)}
                  className={cn(
                    "relative flex shrink-0 flex-col items-center rounded-2xl border-2 p-2.5 transition-all",
                    "w-[88px] min-h-[140px]",
                    unlocked
                      ? cn(colors.border, colors.bg, colors.glow, selectedTier?.tier === tier.tier && "ring-2 ring-brand/60 scale-105")
                      : "border-border/30 bg-muted/10 opacity-40",
                    isLast && "w-[96px] min-h-[155px]"
                  )}
                  style={{ scrollSnapAlign: "center" }}
                  whileHover={{ scale: unlocked ? 1.06 : 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Tier badge */}
                  <div className={cn(
                    "mb-2 flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black",
                    unlocked ? cn(colors.bg, colors.text) : "bg-muted/40 text-muted-foreground"
                  )}>
                    {tier.tier}
                  </div>

                  {/* Reward icon */}
                  <div className={cn(
                    "mb-2 flex h-12 w-12 items-center justify-center rounded-xl relative",
                    unlocked ? colors.bg : "bg-muted/20"
                  )}>
                    <span className={cn(unlocked ? colors.text : "text-muted-foreground")}>{tier.icon}</span>
                    {isMilestone && unlocked && (
                      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-b from-yellow-400/20 to-transparent pointer-events-none" />
                    )}
                  </div>

                  {/* Label */}
                  <p className={cn(
                    "text-center text-[9px] font-semibold leading-tight min-h-[24px] flex items-center",
                    unlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {getLocalizedLabel(tier.label)}
                  </p>

                  {/* Status */}
                  <div className="mt-auto pt-1.5">
                    {claimed ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
                        <Check className="h-3 w-3 text-green-400" />
                      </div>
                    ) : available ? (
                      <motion.div animate={{ scale: [1, 1.2, 1], boxShadow: ["0 0 0 0 rgba(168,85,247,0)", "0 0 0 6px rgba(168,85,247,0.15)", "0 0 0 0 rgba(168,85,247,0)"] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-brand/30 border border-brand/40"
                      >
                        <Gift className="h-3 w-3 text-brand" />
                      </motion.div>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/20">
                        <Lock className="h-3 w-3 text-muted-foreground/60" />
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* ═══ TIER DETAIL SHEET ═══ */}
      <AnimatePresence>
        {selectedTier && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-start gap-4">
              <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl shrink-0", rarityConfig[selectedTier.rarity].bg)}>
                <span className={cn(rarityConfig[selectedTier.rarity].text)}>{selectedTier.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-bold text-foreground">{getLocalizedLabel(selectedTier.label)}</h4>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", rarityConfig[selectedTier.rarity].bg, rarityConfig[selectedTier.rarity].text)}>
                    {t(`bp_rarity_${selectedTier.rarity}`)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("bp_current_level")} {selectedTier.tier} · {selectedTier.xpRequired.toLocaleString()} XP
                </p>
              </div>
              <button onClick={() => setSelectedTier(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              {selectedTier.tier <= currentTier && !claimedRewards.includes(selectedTier.tier) && (
                <button onClick={() => { claimReward(selectedTier.tier); setSelectedTier(null) }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all active:scale-[0.98]"
                >
                  {t("bp_claim")} <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {claimedRewards.includes(selectedTier.tier) && (
                <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 py-3 text-sm font-semibold text-green-400">
                  <Check className="h-4 w-4" /> {t("bp_claimed")}
                </div>
              )}
              {selectedTier.tier > currentTier && (
                <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-muted/30 py-3 text-sm font-medium text-muted-foreground">
                  <Lock className="h-4 w-4" /> {t("bp_locked")}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HOW TO EARN XP ═══ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card/50 p-5"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15"><Sparkles className="h-4 w-4 text-brand" /></div>
          <h3 className="text-sm font-bold text-foreground">{t("bp_how_to_earn")}</h3>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: ScanLine, label: t("bp_scan_food"), xp: "+10", color: "text-green-400", bg: "bg-green-500/10" },
            { icon: Dumbbell, label: t("bp_workout"), xp: "+25", color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: Droplets, label: t("bp_track_water"), xp: "+5", color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { icon: Target, label: t("bp_build_habits"), xp: "+15", color: "text-orange-400", bg: "bg-orange-500/10" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-muted/20 p-3 border border-border/50">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", item.bg)}>
                <item.icon className={cn("h-4 w-4", item.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
                <p className={cn("text-[10px] font-bold", item.color)}>{item.xp} XP</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ COUPONS ═══ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card/50 overflow-hidden"
      >
        <button onClick={() => setShowCoupons(!showCoupons)}
          className="flex w-full items-center gap-2.5 p-5 text-left hover:bg-muted/20 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15"><Award className="h-4 w-4 text-purple-400" /></div>
          <span className="flex-1 text-sm font-bold text-foreground">{t("bp_my_coupons")}</span>
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", showCoupons && "rotate-90")} />
        </button>
        <AnimatePresence>
          {showCoupons && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-5 pb-5"><CouponsList /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
