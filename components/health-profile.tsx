"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Activity,
  ArrowRight,
  Check,
  Crown,
  Download,
  Flame,
  LogOut,
  Pencil,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  User,
  X,
  Zap,
  Scale,
  Ruler,
  Calendar,
  Heart,
  Dumbbell,
  Minus,
  Trophy,
  ScanLine,
  ChevronRight,
  Lock,
} from "lucide-react"
import { ScanHistory } from "@/components/scan-history"
import { DailySummary } from "@/components/daily-summary"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/hooks/useAuth"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { supabase } from "@/lib/supabase"
import { PLAN_LIMITS, type Plan } from "@/lib/plan-limits"

interface ScanHistoryItem {
  id: string
  name: string
  score: number
  image: string
  scannedAt: string
}

interface HealthProfileProps {
  scanHistory: ScanHistoryItem[]
  onNavigateToSettings: () => void
  onNavigateToSubscription?: () => void
  onNavigate?: (view: string) => void
}

export function HealthProfile({ scanHistory, onNavigateToSettings, onNavigateToSubscription, onNavigate }: HealthProfileProps) {
  const { t, locale } = useTranslation()
  const { user, signOut } = useAuth()
  const { plan: currentPlan, limits } = usePlanLimits()
  const router = useRouter()
  const [localScanHistory, setLocalScanHistory] = useState<ScanHistoryItem[]>(scanHistory)
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("week")
  const [displayName, setDisplayName] = useState("")
  const [editName, setEditName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [profileData, setProfileData] = useState({
    age: null as number | null,
    weight: null as number | null,
    height: null as number | null,
    gender: null as string | null,
    fitness_goal: null as string | null,
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editProfileData, setEditProfileData] = useState({
    age: "",
    weight: "",
    height: "",
    gender: "",
    fitness_goal: "",
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [gamStats, setGamStats] = useState({ currentStreak: 0, longestStreak: 0 })
  const [totalXp, setTotalXp] = useState(0)
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [latestWeight, setLatestWeight] = useState<number | null>(null)
  const [isOnboardingSkipped, setIsOnboardingSkipped] = useState(false)

  useEffect(() => {
    if (!user) return
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || t("profile_default_name")
    setDisplayName(name)
    setEditName(name)
  }, [user, t])

  useEffect(() => {
    const savedScans = localStorage.getItem("scanHistory")
    const initialScans = savedScans ? JSON.parse(savedScans) : []
    const combinedHistory = [...scanHistory, ...initialScans].reduce((acc: ScanHistoryItem[], current: ScanHistoryItem) => {
      if (!acc.find((item) => item.id === current.id)) acc.push(current)
      return acc
    }, [])
    setLocalScanHistory(combinedHistory)
    localStorage.setItem("scanHistory", JSON.stringify(combinedHistory))
  }, [scanHistory])

  useEffect(() => {
    if (!user) return
    const loadProfileData = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("age, weight, height, gender, fitness_goal")
        .eq("id", user.id)
        .maybeSingle()
      if (data) {
        setProfileData({
          age: data.age,
          weight: data.weight,
          height: data.height,
          gender: data.gender,
          fitness_goal: data.fitness_goal,
        })
      }
    }
    loadProfileData()
  }, [user])

  useEffect(() => {
    try {
      const rawStats = localStorage.getItem("fitverse-gamification-stats")
      if (rawStats) {
        const parsed = JSON.parse(rawStats)
        setGamStats({ currentStreak: parsed.currentStreak || 0, longestStreak: parsed.longestStreak || 0 })
      }
      const rawXp = localStorage.getItem("fitverse-xp")
      if (rawXp) setTotalXp(Number(JSON.parse(rawXp)) || 0)
      const rawAch = localStorage.getItem("fitverse-achievements")
      if (rawAch) setUnlockedAchievements(JSON.parse(rawAch))
      const rawMeasurements = localStorage.getItem("fitverse-body-measurements")
      if (rawMeasurements) {
        const measurements = JSON.parse(rawMeasurements)
        if (measurements.length > 0 && measurements[0].weight) {
          setLatestWeight(measurements[0].weight)
        }
      }
      if (localStorage.getItem("onboarding_skipped") === "true") {
        setIsOnboardingSkipped(true)
      }
    } catch {}
  }, [])

  const handleSaveName = async () => {
    if (!editName.trim() || !user) return
    setIsSaving(true)
    try {
      const { error } = await supabase.from("profiles").update({ name: editName.trim() }).eq("id", user.id)
      if (!error) setDisplayName(editName.trim())
    } catch (error) {
      console.error("Error updating name:", error)
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSavingProfile(true)
    try {
      const { error } = await supabase.from("profiles").update({
        age: parseInt(editProfileData.age) || null,
        weight: parseFloat(editProfileData.weight) || null,
        height: parseFloat(editProfileData.height) || null,
        gender: editProfileData.gender || null,
        fitness_goal: editProfileData.fitness_goal || null,
      }).eq("id", user.id)
      if (!error) {
        setProfileData({
          age: parseInt(editProfileData.age) || null,
          weight: parseFloat(editProfileData.weight) || null,
          height: parseFloat(editProfileData.height) || null,
          gender: editProfileData.gender || null,
          fitness_goal: editProfileData.fitness_goal || null,
        })
        setIsEditingProfile(false)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleExportHistory = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      user: displayName,
      plan: currentPlan,
      scanHistory: localScanHistory,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vysefit-scan-history-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [localScanHistory, displayName, currentPlan])

  const getGoalLabel = (goal: string | null) => {
    if (!goal) return ""
    const isEng = locale === "en-US"
    const labels: Record<string, { pt: string; en: string }> = {
      lose_weight: { pt: "Perder Peso", en: "Lose Weight" },
      gain_muscle: { pt: "Ganhar Massa", en: "Gain Muscle" },
      maintain: { pt: "Manter", en: "Maintain" },
      improve_health: { pt: "Melhorar Saude", en: "Improve Health" },
    }
    return labels[goal]?.[isEng ? "en" : "pt"] || goal
  }

  const getGenderLabel = (g: string | null) => {
    if (!g) return ""
    const isEng = locale === "en-US"
    const labels: Record<string, { pt: string; en: string }> = {
      male: { pt: "Masculino", en: "Male" },
      female: { pt: "Feminino", en: "Female" },
      other: { pt: "Outro", en: "Other" },
    }
    return labels[g]?.[isEng ? "en" : "pt"] || g
  }

  const getAverageScore = (period: "week" | "month") => {
    const now = Date.now()
    const periodMs = period === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
    const recentScans = localScanHistory.filter((item) => now - new Date(item.scannedAt).getTime() <= periodMs)
    if (recentScans.length === 0) return 0
    return Math.round(recentScans.reduce((acc, item) => acc + item.score, 0) / recentScans.length)
  }

  const getQualityDistribution = () => {
    const now = Date.now()
    const periodMs = selectedPeriod === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
    const recentScans = localScanHistory.filter((item) => now - new Date(item.scannedAt).getTime() <= periodMs)
    const healthy = recentScans.filter((item) => item.score >= 70).length
    const moderate = recentScans.filter((item) => item.score >= 40 && item.score < 70).length
    const poor = recentScans.filter((item) => item.score < 40).length
    const total = recentScans.length
    return {
      healthy: total > 0 ? Math.round((healthy / total) * 100) : 0,
      moderate: total > 0 ? Math.round((moderate / total) * 100) : 0,
      poor: total > 0 ? Math.round((poor / total) * 100) : 0,
      total,
    }
  }

  const getStreak = () => {
    const sortedScans = [...localScanHistory].sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    for (const scan of sortedScans) {
      const scanDate = new Date(scan.scannedAt)
      scanDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor((currentDate.getTime() - scanDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff === streak) {
        streak += 1
        currentDate = scanDate
      } else if (daysDiff > streak) {
        break
      }
    }
    return streak
  }

  const averageScore = getAverageScore(selectedPeriod)
  const distribution = getQualityDistribution()
  const streak = getStreak()
  const userSubscription = currentPlan || "free"

  const bmiWeight = latestWeight || profileData.weight
  const bmiHeight = profileData.height
  const bmi = bmiWeight && bmiHeight && bmiHeight > 0 ? Math.round((bmiWeight / ((bmiHeight / 100) ** 2)) * 10) / 10 : null
  const bmiCategory = bmi ? (bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : bmi < 30 ? "overweight" : "obese") : null

  const userLevel = Math.floor(totalXp / 500) + 1
  const xpInLevel = totalXp % 500
  const xpProgress = (xpInLevel / 500) * 100

  const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
    "first-scan": <ScanLine className="h-3.5 w-3.5" />,
    "scan-10": <ScanLine className="h-3.5 w-3.5" />,
    "scan-50": <ScanLine className="h-3.5 w-3.5" />,
    "scan-100": <ScanLine className="h-3.5 w-3.5" />,
    "workout-1": <Dumbbell className="h-3.5 w-3.5" />,
    "workout-10": <Dumbbell className="h-3.5 w-3.5" />,
    "workout-50": <Dumbbell className="h-3.5 w-3.5" />,
    "streak-3": <Flame className="h-3.5 w-3.5" />,
    "streak-7": <Flame className="h-3.5 w-3.5" />,
    "streak-30": <Flame className="h-3.5 w-3.5" />,
    "streak-100": <Flame className="h-3.5 w-3.5" />,
    "hydration-7": <Heart className="h-3.5 w-3.5" />,
  }

  const planStyles: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    free: { bg: "bg-muted/60", text: "text-muted-foreground", border: "border-border", glow: "" },
    pro: { bg: "bg-brand/10", text: "text-brand", border: "border-brand/20", glow: "shadow-brand/10" },
    premium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-amber-500/10" },
  }
  const pStyle = planStyles[userSubscription] || planStyles.free

  const handleSubscriptionClick = () => {
    if (onNavigateToSubscription) { onNavigateToSubscription(); return }
    router.push("/subscription")
  }

  const limitedFeatures = userSubscription === "free"
    ? [
        { label: locale === "en-US" ? "Sleep tracker" : "Rastreamento de sono", locked: true },
        { label: locale === "en-US" ? "Stress tracker" : "Rastreamento de estresse", locked: true },
        { label: locale === "en-US" ? "Meal planner" : "Plano alimentar", locked: true },
        { label: locale === "en-US" ? "50 scans/day" : "50 scans/dia", locked: true },
      ]
    : userSubscription === "pro"
    ? [
        { label: locale === "en-US" ? "Supplements AI" : "Suplementos IA", locked: true },
        { label: locale === "en-US" ? "Biological age" : "Idade biologica", locked: true },
        { label: locale === "en-US" ? "Unlimited scans" : "Scans ilimitados", locked: true },
        { label: locale === "en-US" ? "Priority support" : "Suporte prioritario", locked: true },
      ]
    : []

  return (
    <div className="relative mx-auto w-full max-w-2xl space-y-4 pb-safe-nav md:space-y-5">
      {isOnboardingSkipped && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">{t("onboard_incomplete_title")}</p>
            <p className="text-xs text-muted-foreground">{t("onboard_incomplete_desc")}</p>
          </div>
          <Button
            onClick={() => {
              localStorage.removeItem("onboarding_skipped")
              localStorage.removeItem("onboarding_completed")
              setIsOnboardingSkipped(false)
              // trigger onboarding again by reloading step
              window.location.reload()
            }}
            className="h-9 shrink-0 rounded-xl bg-amber-500 text-black hover:bg-amber-500/90 text-xs font-semibold px-4"
          >
            {t("onboard_complete_now")}
          </Button>
        </motion.div>
      )}

      {/* ═══════ PROFILE HEADER ═══════ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl glass-strong"
      >
        {/* Top gradient accent */}
        <div className={cn(
          "absolute inset-x-0 top-0 h-1",
          userSubscription === "premium" ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
          : userSubscription === "pro" ? "bg-gradient-to-r from-emerald-400 via-brand to-emerald-400"
          : "bg-gradient-to-r from-muted via-border to-muted"
        )} />

        <div className="p-5 md:p-6 pt-6">
          {/* Top row: Avatar + Name + Actions */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              className={cn(
                "relative flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-xl md:h-20 md:w-20",
                userSubscription === "premium"
                  ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10 ring-2 ring-amber-500/30"
                  : userSubscription === "pro"
                  ? "bg-gradient-to-br from-brand/20 to-emerald-600/10 ring-2 ring-brand/30"
                  : "bg-gradient-to-br from-muted/80 to-muted/40 ring-1 ring-border"
              )}
            >
              <User className="h-8 w-8 md:h-9 md:w-9 text-foreground/70" />
              {userSubscription !== "free" && (
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card",
                  userSubscription === "premium" ? "bg-amber-500" : "bg-brand"
                )}>
                  {userSubscription === "premium" ? <Crown className="h-2.5 w-2.5 text-black" /> : <Zap className="h-2.5 w-2.5 text-white" />}
                </div>
              )}
            </motion.div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex max-w-sm flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName()
                      if (e.key === "Escape") { setEditName(displayName); setIsEditing(false) }
                    }}
                    className="h-11 rounded-xl border-border bg-muted/50 text-lg font-bold text-foreground focus-visible:ring-brand"
                    autoFocus
                    disabled={isSaving}
                  />
                  <div className="flex gap-2">
                    <Button size="icon" onClick={handleSaveName} disabled={isSaving} className="h-11 w-11 rounded-xl bg-brand text-white hover:bg-brand/90">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditName(displayName); setIsEditing(false) }} className="h-11 w-11 rounded-xl border border-border text-muted-foreground hover:bg-muted">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <h1 className="truncate text-2xl font-bold text-foreground md:text-3xl">{displayName}</h1>
                    <button
                      onClick={() => { setEditName(displayName); setIsEditing(true) }}
                      className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{user?.email || ""}</span>
                  </div>
                </>
              )}

              {/* Streak + Level inline */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {gamStats.currentStreak > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1">
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-xs font-bold text-orange-400">{gamStats.currentStreak}</span>
                    <span className="text-[10px] text-orange-400/70">{locale === "en-US" ? "days" : "dias"}</span>
                  </div>
                )}
                {totalXp > 0 && (
                  <div className="flex items-center gap-2 rounded-full bg-purple-500/10 px-2.5 py-1">
                    <Zap className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-xs font-bold text-purple-400">{locale === "en-US" ? "Lvl" : "Nvl"} {userLevel}</span>
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-purple-500/20">
                      <motion.div
                        className="h-full rounded-full bg-purple-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] text-purple-400/60">{xpInLevel}/500</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onNavigateToSettings} className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} className="h-10 w-10 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Achievements row */}
          {unlockedAchievements.length > 0 && (
            <div className="mt-4 flex items-center gap-1.5">
              {unlockedAchievements.slice(0, 8).map((achId) => (
                <motion.div
                  key={achId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  title={achId}
                >
                  {ACHIEVEMENT_ICONS[achId] || <Trophy className="h-3.5 w-3.5" />}
                </motion.div>
              ))}
              {unlockedAchievements.length > 8 && (
                <span className="text-[10px] text-muted-foreground font-medium">+{unlockedAchievements.length - 8}</span>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* ═══════ QUICK STATS ROW ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        {/* Score ring */}
        <div className="rounded-2xl glass-strong p-4 flex flex-col items-center">
          <div className="relative h-16 w-16 md:h-20 md:w-20">
            <svg className="h-full w-full -rotate-90">
              <circle cx="50%" cy="50%" r="42%" fill="none" stroke="currentColor" strokeWidth="5" className="text-border" />
              <motion.circle
                cx="50%" cy="50%" r="42%" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={220}
                initial={{ strokeDashoffset: 220 }}
                animate={{ strokeDashoffset: 220 - (220 * averageScore) / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={averageScore >= 70 ? "text-brand" : averageScore >= 40 ? "text-amber-400" : "text-red-400"}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl md:text-2xl font-bold text-foreground text-score">{averageScore || "–"}</span>
              <span className="text-[10px] text-muted-foreground">{locale === "en-US" ? "avg" : "media"}</span>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground font-medium">{t("profile_avg_score")}</p>
        </div>

        {/* Streak */}
        <div className="rounded-2xl glass-strong p-4 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
            <Flame className="h-5 w-5 text-orange-400 animate-fire-glow" />
          </div>
          <span className="mt-2 text-xl md:text-2xl font-bold text-foreground text-score">{streak}</span>
          <p className="text-[10px] text-muted-foreground font-medium">{t("profile_streak")}</p>
        </div>

        {/* Total scans */}
        <div className="rounded-2xl glass-strong p-4 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
            <ScanLine className="h-5 w-5 text-brand" />
          </div>
          <span className="mt-2 text-xl md:text-2xl font-bold text-foreground text-score">{distribution.total}</span>
          <p className="text-[10px] text-muted-foreground font-medium">{t("profile_total_scans")}</p>
        </div>
      </motion.div>

      {/* ═══════ QUALITY DISTRIBUTION ═══════ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl glass-strong p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">{locale === "en-US" ? "Quality Distribution" : "Distribuicao de Qualidade"}</h3>
          <div className="flex gap-1">
            {(["week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all",
                  selectedPeriod === p ? "bg-brand/15 text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {p === "week" ? (locale === "en-US" ? "7D" : "7D") : (locale === "en-US" ? "30D" : "30D")}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: locale === "en-US" ? "Healthy" : "Saudavel", value: distribution.healthy, color: "bg-brand", icon: ShieldCheck, textColor: "text-brand" },
            { label: locale === "en-US" ? "Moderate" : "Moderado", value: distribution.moderate, color: "bg-amber-400", icon: Minus, textColor: "text-amber-400" },
            { label: locale === "en-US" ? "Poor" : "Ruim", value: distribution.poor, color: "bg-red-400", icon: TrendingDown, textColor: "text-red-400" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", `bg-${item.color.split("-")[1]}-500/10`)}>
                <item.icon className={cn("h-4 w-4", item.textColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={cn("text-xs font-bold", item.textColor)}>{item.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className={cn("h-full rounded-full", item.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ═══════ SUBSCRIPTION CARD ═══════ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn("rounded-2xl border p-5", pStyle.border, pStyle.bg, pStyle.glow && `shadow-lg ${pStyle.glow}`)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", pStyle.bg)}>
              {userSubscription === "premium" ? <Crown className={cn("h-5 w-5", pStyle.text)} /> :
               userSubscription === "pro" ? <Zap className={cn("h-5 w-5", pStyle.text)} /> :
               <ShieldCheck className={cn("h-5 w-5", pStyle.text)} />}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {locale === "en-US" ? "Current Plan" : "Plano Atual"}
              </p>
              <h3 className={cn("text-xl font-bold", pStyle.text)}>
                {userSubscription === "free" ? "FREE" : userSubscription === "pro" ? "PRO" : "PREMIUM"}
              </h3>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px] font-semibold", pStyle.border, pStyle.text)}>
            {locale === "en-US" ? "Active" : "Ativo"}
          </Badge>
        </div>

        {/* Limits preview */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: locale === "en-US" ? "Scans" : "Scans", value: limits.scansPerDay === "unlimited" ? "∞" : `${limits.scansPerDay}`, sub: locale === "en-US" ? "/day" : "/dia" },
            { label: locale === "en-US" ? "Workouts" : "Treinos", value: limits.workoutsPerMonth === "unlimited" ? "∞" : `${limits.workoutsPerMonth}`, sub: locale === "en-US" ? "/month" : "/mes" },
            { label: locale === "en-US" ? "History" : "Historico", value: limits.historyDays === 365 ? "∞" : `${limits.historyDays}`, sub: locale === "en-US" ? "days" : "dias" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-background/50 p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.label} <span className="opacity-60">{item.sub}</span></p>
            </div>
          ))}
        </div>

        {limitedFeatures.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
              {locale === "en-US" ? "Upgrade to unlock" : "Atualize para desbloquear"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {limitedFeatures.map((f) => (
                <div key={f.label} className="flex items-center gap-1 rounded-full bg-background/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                  <Lock className="h-2.5 w-2.5" />
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleSubscriptionClick}
          className={cn(
            "h-11 w-full rounded-xl text-sm font-semibold",
            userSubscription === "free"
              ? "bg-brand text-white hover:bg-brand/90"
              : userSubscription === "pro"
              ? "bg-amber-500 text-black hover:bg-amber-500/90"
              : "bg-muted/30 text-foreground hover:bg-muted/30 border border-border"
          )}
        >
          {userSubscription === "free"
            ? (locale === "en-US" ? "Upgrade Plan" : "Fazer Upgrade")
            : (locale === "en-US" ? "Manage Subscription" : "Gerenciar Assinatura")
          }
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.section>

      {/* ═══════ PROFILE DATA ═══════ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl glass-strong p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("hp_my_data")}</h3>
              <p className="text-[10px] text-muted-foreground">{t("hp_personal_info")}</p>
            </div>
          </div>
          {!isEditingProfile && (
            <Button size="icon" variant="ghost" onClick={() => {
              setEditProfileData({
                age: profileData.age?.toString() || "",
                weight: profileData.weight?.toString() || "",
                height: profileData.height?.toString() || "",
                gender: profileData.gender || "",
                fitness_goal: profileData.fitness_goal || "",
              })
              setIsEditingProfile(true)
            }} className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {isEditingProfile ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground">{t("hp_age")}</label>
              <Input type="number" value={editProfileData.age} onChange={(e) => setEditProfileData({ ...editProfileData, age: e.target.value })} className="h-10 rounded-xl border-border bg-muted/50 text-sm" min={10} max={120} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground">{t("hp_weight_kg")}</label>
              <Input type="number" value={editProfileData.weight} onChange={(e) => setEditProfileData({ ...editProfileData, weight: e.target.value })} className="h-10 rounded-xl border-border bg-muted/50 text-sm" min={20} max={300} step={0.1} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground">{t("hp_height_cm")}</label>
              <Input type="number" value={editProfileData.height} onChange={(e) => setEditProfileData({ ...editProfileData, height: e.target.value })} className="h-10 rounded-xl border-border bg-muted/50 text-sm" min={100} max={250} step={0.1} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground">{t("hp_gender")}</label>
              <select value={editProfileData.gender} onChange={(e) => setEditProfileData({ ...editProfileData, gender: e.target.value })} className="flex h-10 w-full rounded-xl border border-border bg-muted/50 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/50">
                <option value="">{t("hp_select")}</option>
                <option value="male">{t("hp_male")}</option>
                <option value="female">{t("hp_female")}</option>
                <option value="other">{t("hp_other")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground">{t("hp_goal")}</label>
              <select value={editProfileData.fitness_goal} onChange={(e) => setEditProfileData({ ...editProfileData, fitness_goal: e.target.value })} className="flex h-10 w-full rounded-xl border border-border bg-muted/50 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/50">
                <option value="">{t("hp_select")}</option>
                <option value="lose_weight">{t("hp_lose_weight")}</option>
                <option value="gain_muscle">{t("hp_gain_muscle")}</option>
                <option value="maintain">{t("hp_maintain")}</option>
                <option value="improve_health">{t("hp_improve_health")}</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="h-10 flex-1 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand/90">
                <Check className="h-4 w-4 mr-2" />
                {isSavingProfile ? "..." : t("hp_save")}
              </Button>
              <Button onClick={() => setIsEditingProfile(false)} variant="ghost" className="h-10 rounded-xl border border-border text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
              {[
                { icon: Calendar, label: t("hp_age"), value: profileData.age ? `${profileData.age} ${t("hp_years")}` : "–" },
                { icon: Scale, label: t("hp_weight"), value: profileData.weight ? `${profileData.weight} kg` : "–" },
                { icon: Ruler, label: t("hp_height"), value: profileData.height ? `${profileData.height} cm` : "–" },
                { icon: User, label: t("hp_gender"), value: getGenderLabel(profileData.gender) || "–" },
                { icon: Target, label: t("hp_goal"), value: getGoalLabel(profileData.fitness_goal) || "–" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-muted/30 p-3 text-center">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                  <p className="mt-1.5 text-sm font-bold text-foreground">{item.value}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            {bmi !== null && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{t("hp_bmi")}</span>
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    bmiCategory === "normal" ? "bg-green-500/15 text-green-400" : bmiCategory === "underweight" ? "bg-blue-500/15 text-blue-400" : bmiCategory === "overweight" ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"
                  )}>
                    {bmiCategory === "underweight" ? t("hp_bmi_underweight") : bmiCategory === "normal" ? t("hp_bmi_normal") : bmiCategory === "overweight" ? t("hp_bmi_overweight") : t("hp_bmi_obese")}
                  </span>
                </div>
                <p className="mt-1 text-xl font-bold text-foreground">{bmi}</p>
              </motion.div>
            )}
          </>
        )}
      </motion.section>

      {/* ═══════ SCAN HISTORY ═══════ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl glass-strong p-5 md:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("profile_history_title")}</h2>
            <p className="text-[10px] text-muted-foreground">{t("profile_history_sub")}</p>
          </div>
          <Button variant="ghost" onClick={handleExportHistory} className="h-9 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground">
            <Download className="mr-1 h-3 w-3" />
            {t("profile_export")}
          </Button>
        </div>
        <ScanHistory items={localScanHistory} showAll />
      </motion.section>

      {/* ═══════ DAILY SUMMARY ═══════ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="rounded-2xl glass-strong p-5 md:p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("summary_title") || "Resumo do Dia"}</h3>
            <p className="text-[10px] text-muted-foreground">{t("common_fitverse_activity")}</p>
          </div>
        </div>
        <DailySummary />
      </motion.section>
    </div>
  )
}
