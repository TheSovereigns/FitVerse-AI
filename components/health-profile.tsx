"use client"

import { useEffect, useState } from "react"
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
  Flame,
  LogOut,
  Pencil,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  X,
  Zap,
  Scale,
  Ruler,
  Calendar,
  Heart,
  Dumbbell,
  TrendingDown,
  Minus,
} from "lucide-react"
import { ScanHistory } from "@/components/scan-history"
import { DailySummary } from "@/components/daily-summary"
import { WeeklyReport } from "@/components/weekly-report"
import { BodyEvolution } from "@/components/body-evolution"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/hooks/useAuth"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { supabase } from "@/lib/supabase"

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
}

export function HealthProfile({ scanHistory, onNavigateToSettings, onNavigateToSubscription }: HealthProfileProps) {
  const { t, locale } = useTranslation()
  const { user, signOut } = useAuth()
  const { plan: currentPlan } = usePlanLimits()
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

  const handleSaveName = async () => {
    if (!editName.trim() || !user) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: editName.trim() })
        .eq("id", user.id)

      if (!error) {
        setDisplayName(editName.trim())
      }
    } catch (error) {
      console.error("Error updating name:", error)
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditName(displayName)
    setIsEditing(false)
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSavingProfile(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          age: parseInt(editProfileData.age) || null,
          weight: parseFloat(editProfileData.weight) || null,
          height: parseFloat(editProfileData.height) || null,
          gender: editProfileData.gender || null,
          fitness_goal: editProfileData.fitness_goal || null,
        })
        .eq("id", user.id)

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

  const handleStartEditProfile = () => {
    setEditProfileData({
      age: profileData.age?.toString() || "",
      weight: profileData.weight?.toString() || "",
      height: profileData.height?.toString() || "",
      gender: profileData.gender || "",
      fitness_goal: profileData.fitness_goal || "",
    })
    setIsEditingProfile(true)
  }

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
  const scoreStroke = averageScore >= 70 ? "#34D399" : averageScore >= 40 ? "#FFD60A" : "#FF453A"

  const handleSubscriptionClick = () => {
    if (onNavigateToSubscription) {
      onNavigateToSubscription()
      return
    }
    router.push("/subscription")
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl space-y-5 pb-safe-nav md:space-y-6">
      {/* Profile Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-strong p-5 md:p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand/10 text-brand shadow-xl md:h-20 md:w-20"
            >
              <User className="h-7 w-7 md:h-8 md:w-8" />
            </motion.div>

            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex max-w-sm flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName()
                      if (e.key === "Escape") handleCancelEdit()
                    }}
                    className="h-11 rounded-xl border-border bg-muted/50 text-lg font-bold text-foreground focus-visible:ring-brand"
                    autoFocus
                    disabled={isSaving}
                  />
                  <div className="flex gap-2">
                    <Button size="icon" onClick={handleSaveName} disabled={isSaving} className="h-11 w-11 rounded-xl bg-brand text-white hover:bg-brand/90">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-11 w-11 rounded-xl border border-border text-muted-foreground hover:bg-muted">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-2xl font-bold text-foreground md:text-3xl">
                    {displayName}
                  </h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditName(displayName)
                      setIsEditing(true)
                    }}
                    className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateToSettings}
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-10 w-10 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Profile Data */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl glass-strong p-5 md:p-6"
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
            <Button
              size="icon"
              variant="ghost"
              onClick={handleStartEditProfile}
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {isEditingProfile ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground">{t("hp_age")}</label>
              <Input
                type="number"
                value={editProfileData.age}
                onChange={(e) => setEditProfileData({ ...editProfileData, age: e.target.value })}
                className="h-10 rounded-xl border-border bg-muted/50 text-sm"
                min={10}
                max={120}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground">{t("hp_weight_kg")}</label>
              <Input
                type="number"
                value={editProfileData.weight}
                onChange={(e) => setEditProfileData({ ...editProfileData, weight: e.target.value })}
                className="h-10 rounded-xl border-border bg-muted/50 text-sm"
                min={20}
                max={300}
                step={0.1}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground">{t("hp_height_cm")}</label>
              <Input
                type="number"
                value={editProfileData.height}
                onChange={(e) => setEditProfileData({ ...editProfileData, height: e.target.value })}
                className="h-10 rounded-xl border-border bg-muted/50 text-sm"
                min={100}
                max={250}
                step={0.1}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground">{t("hp_gender")}</label>
              <select
                value={editProfileData.gender}
                onChange={(e) => setEditProfileData({ ...editProfileData, gender: e.target.value })}
                className="flex h-10 w-full rounded-xl border border-border bg-muted/50 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="">{t("hp_select")}</option>
                <option value="male">{t("hp_male")}</option>
                <option value="female">{t("hp_female")}</option>
                <option value="other">{t("hp_other")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground">{t("hp_goal")}</label>
              <select
                value={editProfileData.fitness_goal}
                onChange={(e) => setEditProfileData({ ...editProfileData, fitness_goal: e.target.value })}
                className="flex h-10 w-full rounded-xl border border-border bg-muted/50 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="">{t("hp_select")}</option>
                <option value="lose_weight">{t("hp_lose_weight")}</option>
                <option value="gain_muscle">{t("hp_gain_muscle")}</option>
                <option value="maintain">{t("hp_maintain")}</option>
                <option value="improve_health">{t("hp_improve_health")}</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="h-10 flex-1 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand/90"
              >
                <Check className="h-4 w-4 mr-2" />
                {isSavingProfile ? "..." : t("hp_save")}
              </Button>
              <Button
                onClick={() => setIsEditingProfile(false)}
                variant="ghost"
                className="h-10 rounded-xl border border-border text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { icon: Calendar, label: t("hp_age"), value: profileData.age ? `${profileData.age} ${t("hp_years")}` : "—" },
              { icon: Scale, label: t("hp_weight"), value: profileData.weight ? `${profileData.weight} kg` : "—" },
              { icon: Ruler, label: t("hp_height"), value: profileData.height ? `${profileData.height} cm` : "—" },
              { icon: User, label: t("hp_gender"), value: getGenderLabel(profileData.gender) || "—" },
              { icon: Target, label: t("hp_goal"), value: getGoalLabel(profileData.fitness_goal) || "—" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-muted/30 p-3">
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="mt-2 text-sm font-bold text-foreground">{item.value}</p>
                <p className="text-[9px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Stats Row */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]"
      >
        {/* Subscription Card */}
        <div className="rounded-2xl glass-strong p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">
                  {userSubscription === "free" ? t("subscription_free_label") : t("subscription_premium_label")}
                </p>
                <h2 className="text-xl font-bold text-foreground">{userSubscription.toUpperCase()}</h2>
              </div>
            </div>
          </div>
          <Button
            onClick={handleSubscriptionClick}
            className="mt-4 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand/90"
          >
            {userSubscription === "free" ? t("subscription_upgrade") : t("subscription_manage")}
            <Zap className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Target} label={t("profile_avg_score")} value={averageScore}>
            <div className="relative mx-auto mt-2 h-14 w-14 md:h-16 md:w-16">
              <svg className="h-full w-full -rotate-90">
                <circle cx="50%" cy="50%" r="42%" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={220}
                  initial={{ strokeDashoffset: 220 }}
                  animate={{ strokeDashoffset: 220 - (220 * averageScore) / 100 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className={averageScore >= 70 ? "text-brand" : averageScore >= 40 ? "text-warning" : "text-destructive"}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">{averageScore}</div>
            </div>
          </StatCard>
          <StatCard icon={TrendingUp} label={t("profile_streak")} value={streak} />
          <StatCard icon={Sparkles} label={t("profile_total_scans")} value={distribution.total} />
        </div>
      </motion.section>

      {/* Quality Distribution */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: "Healthy", value: distribution.healthy, color: "bg-brand" },
          { label: "Moderate", value: distribution.moderate, color: "bg-warning" },
          { label: "Risk", value: distribution.poor, color: "bg-destructive" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl glass-strong p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-foreground">{item.value}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">{item.label}</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </motion.section>

      {/* Scan History */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl glass-strong p-5 md:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("profile_history_title")}</h2>
            <p className="text-[10px] text-muted-foreground">{t("profile_history_sub")}</p>
          </div>
          <Button variant="ghost" className="h-9 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground">
            {t("profile_export")}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <ScanHistory items={localScanHistory} showAll />
      </motion.section>

      {/* Daily Summary */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl glass-strong p-5 md:p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("summary_title") || "Resumo do Dia"}</h3>
            <p className="text-[10px] text-muted-foreground">FitVerse activity</p>
          </div>
        </div>
        <DailySummary />
      </motion.section>

      <BodyEvolution />
      <WeeklyReport />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType
  label: string
  value: number
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-[150px] flex-col items-center justify-center rounded-xl glass-strong p-3 text-center">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </div>
      {children || <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>}
      <p className="mt-2 text-[9px] text-muted-foreground">{label}</p>
    </div>
  )
}
