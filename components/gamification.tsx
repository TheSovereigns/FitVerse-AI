"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, Flame, TrendingUp, Zap, Star, Lock, Crown, Target, Activity, ChevronRight, X, Share2, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { useTranslation } from "@/lib/i18n"

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  requirement: number
  type: "scans" | "streak" | "premium"
}

interface UserStats {
  totalScans: number
  currentStreak: number
  longestStreak: number
  totalPoints: number
  badges: string[]
}

const BADGES: Badge[] = [
  { id: "first_scan", name: "Primeiro Scan", description: "Complete seu primeiro scan", icon: "🔬", requirement: 1, type: "scans" },
  { id: "scanner_10", name: "Scanner", description: "Complete 10 scans", icon: "🔍", requirement: 10, type: "scans" },
  { id: "scanner_50", name: "Expert Scanner", description: "Complete 50 scans", icon: "🎯", requirement: 50, type: "scans" },
  { id: "scanner_100", name: "Master Scanner", description: "Complete 100 scans", icon: "🏆", requirement: 100, type: "scans" },
  { id: "scanner_500", name: "Legend Scanner", description: "Complete 500 scans", icon: "👑", requirement: 500, type: "scans" },
  { id: "streak_3", name: "Consistente", description: "3 dias de uso", icon: "🔥", requirement: 3, type: "streak" },
  { id: "streak_7", name: "Semana Builder", description: "7 dias de uso", icon: "⭐", requirement: 7, type: "streak" },
  { id: "streak_30", name: "Mês Master", description: "30 dias de uso", icon: "💎", requirement: 30, type: "streak" },
  { id: "pro_member", name: "Pro Member", description: "Ative o plano Pro", icon: "⚡", requirement: 1, type: "premium" },
  { id: "premium_member", name: "Premium", description: "Ative o plano Premium", icon: "👑", requirement: 1, type: "premium" },
]

const POINTS_PER_SCAN = 10
const POINTS_PER_STREAK = 5
const BONUS_POINTS = {
  10: 50,
  50: 100,
  100: 250,
  500: 500,
  1000: 1000,
}

export function Gamification() {
  const { t } = useTranslation()
  const { plan } = usePlanLimits()
  const isPremium = plan === "pro" || plan === "premium"
  const isPro = plan === "pro"
  const isPremiumPlan = plan === "premium"
  
  const [showBadges, setShowBadges] = useState(false)
  const [newBadge, setNewBadge] = useState<Badge | null>(null)

  const userStats = useMemo((): UserStats => {
    const saved = localStorage.getItem("userStats")
    if (saved) {
      return JSON.parse(saved)
    }
    return {
      totalScans: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      badges: [],
    }
  }, [])

  const unlockedBadges = useMemo(() => {
    return BADGES.filter(badge => userStats.badges.includes(badge.id))
  }, [userStats.badges])

  const nextBadge = useMemo(() => {
    const scanBadges = BADGES.filter(b => b.type === "scans" && !userStats.badges.includes(b.id))
    if (scanBadges.length === 0) return null
    return scanBadges.reduce((prev, curr) => 
      curr.requirement < prev.requirement ? curr : prev
    )
  }, [userStats.badges])

  const progressToNextBadge = useMemo(() => {
    if (!nextBadge) return 100
    const progress = (userStats.totalScans / nextBadge.requirement) * 100
    return Math.min(progress, 100)
  }, [userStats.totalScans, nextBadge])

  const calculatePoints = (scans: number, streak: number, planType: string) => {
    let points = scans * POINTS_PER_SCAN
    points += streak * POINTS_PER_STREAK
    
    if (planType === "pro") points += 100
    if (planType === "premium") points += 250
    
    Object.entries(BONUS_POINTS).forEach(([key, bonus]) => {
      if (scans >= parseInt(key)) {
        points += bonus
      }
    })
    
    return points
  }

  useEffect(() => {
    if (isPro && !userStats.badges.includes("pro_member")) {
      const updated = {
        ...userStats,
        badges: [...userStats.badges, "pro_member"],
      }
      localStorage.setItem("userStats", JSON.stringify(updated))
      const badge = BADGES.find(b => b.id === "pro_member")
      if (badge) setNewBadge(badge)
    }
    if (isPremiumPlan && !userStats.badges.includes("premium_member")) {
      const updated = {
        ...userStats.badges.includes("pro_member") ? userStats : { ...userStats, badges: [...userStats.badges, "pro_member"] },
        badges: [...(userStats.badges.includes("pro_member") ? userStats.badges : [...userStats.badges, "pro_member"]), "premium_member"],
      }
      localStorage.setItem("userStats", JSON.stringify(updated))
      const badge = BADGES.find(b => b.id === "premium_member")
      if (badge) setNewBadge(badge)
    }
  }, [plan])

  useEffect(() => {
    if (newBadge) {
      const timer = setTimeout(() => setNewBadge(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [newBadge])

  const shareAchievement = (badge: Badge) => {
    const text = `🏅 Acabei de ganhar a badge "${badge.name}" no FitVerse AI! ${badge.description}`
    if (navigator.share) {
      navigator.share({ text })
    } else {
      navigator.clipboard.writeText(text)
      alert("Copiado para a área de transferência!")
    }
  }

  return (
    <>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-strong border-white/20 rounded-3xl p-4 md:p-6 cursor-pointer"
        onClick={() => setShowBadges(true)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-lg">{userStats.totalPoints}</p>
              <p className="text-[10px] font-bold opacity-40 uppercase">{t("gam_points") || "pontos"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-black">{userStats.currentStreak}</span>
            <span className="text-xs opacity-40">{t("gam_days") || "dias"}</span>
          </div>
        </div>

        {nextBadge && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="opacity-60">{nextBadge.name}</span>
              <span className="opacity-60">{userStats.totalScans}/{nextBadge.requirement}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextBadge}%` }}
                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 mt-3 opacity-40">
          <span className="text-xs">{t("gam_view_badges") || "Ver badges"}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </motion.div>

      {/* Badges Modal */}
      <AnimatePresence>
        {showBadges && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBadges(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong border-white/20 rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black">{t("gam_badges") || "Badges"}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowBadges(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-primary">{userStats.totalScans}</p>
                  <p className="text-xs opacity-40">{t("gam_total_scans") || "Scans"}</p>
                </div>
                <div className="glass border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-orange-500">{userStats.longestStreak}</p>
                  <p className="text-xs opacity-40">{t("gam_best_streak") || "Melhor série"}</p>
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-3 gap-3">
                {BADGES.map((badge) => {
                  const unlocked = userStats.badges.includes(badge.id)
                  const isLocked = badge.type === "premium" && !isPremium
                  
                  return (
                    <motion.button
                      key={badge.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => unlocked && shareAchievement(badge)}
                      className={cn(
                        "relative rounded-2xl p-4 flex flex-col items-center gap-2 transition-all",
                        unlocked 
                          ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30" 
                          : "bg-white/5 border border-white/10 opacity-40",
                        isLocked && "grayscale"
                      )}
                    >
                      <span className="text-3xl">{badge.icon}</span>
                      <p className="text-xs font-bold text-center">{badge.name}</p>
                      {unlocked && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Award className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {isLocked && (
                        <Lock className="absolute top-2 right-2 w-4 h-4 opacity-40" />
                      )}
                    </motion.button>
                  )
                })}
              </div>

              <p className="text-xs text-center opacity-40 mt-4">
                {t("gam_unlock_more") || "Desbloqueie mais badges escaneando alimentos!"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Badge Popup */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 glass-strong border-amber-500/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <span className="text-3xl">{newBadge.icon}</span>
            <div>
              <p className="font-black text-amber-500">{t("gam_badge_unlocked") || "Badge解锁!"}</p>
              <p className="text-sm font-bold">{newBadge.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
