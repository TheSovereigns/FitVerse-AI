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
        .single()
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
  const scoreStroke = averageScore >= 70 ? "#34d399" : averageScore >= 40 ? "#f59e0b" : "#fb7185"

  const handleSubscriptionClick = () => {
    if (onNavigateToSubscription) {
      onNavigateToSubscription()
      return
    }
    router.push("/subscription")
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-5 pb-safe-nav animate-in fade-in duration-500 md:space-y-7">
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-5rem] h-72 bg-[radial-gradient(circle_at_25%_10%,rgba(255,255,255,0.08),transparent_42%),radial-gradient(circle_at_88%_4%,rgba(255,255,255,0.04),transparent_36%)]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:rounded-[2.5rem] md:p-6"
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_34%,rgba(255,255,255,0.03))]" />

        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex items-start gap-4 md:gap-5">
            <motion.div
              whileHover={{ rotate: 6, scale: 1.03 }}
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/10 text-foreground/60 shadow-xl md:h-20 md:w-20 md:rounded-[1.8rem]"
            >
              <User className="h-7 w-7 md:h-9 md:w-9" />
            </motion.div>

            <div className="min-w-0 flex-1">
              <Badge className="mb-3 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-foreground/50">
                FitVerse Profile
              </Badge>

              {isEditing ? (
                <div className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName()
                      if (e.key === "Escape") handleCancelEdit()
                    }}
                    className="h-12 rounded-2xl border-white/10 bg-black/35 text-xl font-black text-foreground focus-visible:ring-white/20"
                    autoFocus
                    disabled={isSaving}
                  />
                  <div className="flex gap-2">
                    <Button size="icon" onClick={handleSaveName} disabled={isSaving} className="h-12 w-12 rounded-2xl bg-white/10 text-foreground hover:bg-white/20">
                      <Check className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-12 w-12 rounded-2xl border border-white/10 bg-white/8 text-foreground/60 hover:bg-white/16">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-3xl font-black leading-none tracking-tight text-foreground md:text-5xl">
                    {displayName}
                  </h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditName(displayName)
                      setIsEditing(true)
                    }}
                    className="h-9 w-9 shrink-0 rounded-xl border border-white/10 bg-white/8 text-foreground/50 hover:bg-white/16 hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="mt-3 flex min-w-0 items-center gap-2">
                <Activity className="h-4 w-4 shrink-0 text-foreground/50" />
                <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-foreground/50 md:text-sm">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <div className="flex rounded-2xl border border-white/10 bg-black/30 p-1 backdrop-blur-xl">
              {(["week", "month"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  className={cn(
                    "min-h-11 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition",
                    selectedPeriod === period ? "bg-white/10 text-foreground shadow-lg" : "text-foreground/50 hover:text-foreground"
                  )}
                >
                  {period === "week" ? t("profile_7cycles") : t("profile_30cycles")}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateToSettings}
              className="h-12 w-12 rounded-2xl border border-white/10 bg-white/8 text-foreground/60 hover:bg-white/16"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-12 w-12 rounded-2xl border border-red-300/18 bg-red-500/10 text-red-200 hover:bg-red-500/16"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Profile Data Section */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/48 p-5 shadow-xl backdrop-blur-2xl md:rounded-[2.5rem] md:p-6"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
        
        <div className="relative">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-foreground/60">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
                  {t("hp_my_data")}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/50">
                  {t("hp_personal_info")}
                </p>
              </div>
            </div>
            {!isEditingProfile && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleStartEditProfile}
                className="h-10 w-10 rounded-xl border border-white/10 bg-white/8 text-foreground/50 hover:bg-white/16 hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isEditingProfile ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
                  {t("hp_age")}
                </label>
                <Input
                  type="number"
                  value={editProfileData.age}
                  onChange={(e) => setEditProfileData({ ...editProfileData, age: e.target.value })}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-foreground"
                  min={10}
                  max={120}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
                  {t("hp_weight_kg")}
                </label>
                <Input
                  type="number"
                  value={editProfileData.weight}
                  onChange={(e) => setEditProfileData({ ...editProfileData, weight: e.target.value })}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-foreground"
                  min={20}
                  max={300}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
                  {t("hp_height_cm")}
                </label>
                <Input
                  type="number"
                  value={editProfileData.height}
                  onChange={(e) => setEditProfileData({ ...editProfileData, height: e.target.value })}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-foreground"
                  min={100}
                  max={250}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
                  {t("hp_gender")}
                </label>
                <select
                  value={editProfileData.gender}
                  onChange={(e) => setEditProfileData({ ...editProfileData, gender: e.target.value })}
                  className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">{t("hp_select")}</option>
                  <option value="male">{t("hp_male")}</option>
                  <option value="female">{t("hp_female")}</option>
                  <option value="other">{t("hp_other")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
                  {t("hp_goal")}
                </label>
                <select
                  value={editProfileData.fitness_goal}
                  onChange={(e) => setEditProfileData({ ...editProfileData, fitness_goal: e.target.value })}
                  className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
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
                  className="h-12 flex-1 rounded-xl bg-primary text-sm font-black text-white hover:bg-primary/80"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isSavingProfile ? "..." : t("hp_save")}
                </Button>
                <Button
                  onClick={() => setIsEditingProfile(false)}
                  variant="ghost"
                  className="h-12 rounded-xl border border-white/10 bg-white/8 text-foreground/60 hover:bg-white/16"
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
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <item.icon className="h-4 w-4 text-foreground/40" />
                  <p className="mt-2 text-lg font-black text-foreground">{item.value}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40">{item.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div
          whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/48 p-5 shadow-xl backdrop-blur-2xl md:p-6"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
          <div className="relative flex h-full flex-col justify-between gap-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-foreground/60">
                  <Crown className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-foreground/50">
                    {userSubscription === "free" ? t("subscription_free_label") : t("subscription_premium_label")}
                  </p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground">{userSubscription.toUpperCase()}</h2>
                </div>
              </div>
              <ShieldCheck className="h-6 w-6 text-foreground/50" />
            </div>

            <Button
              onClick={handleSubscriptionClick}
              className="h-12 rounded-2xl bg-white/10 text-sm font-black uppercase tracking-[0.16em] text-foreground shadow-[0_14px_34px_rgba(255,255,255,0.08)] hover:bg-white/20"
            >
              {userSubscription === "free" ? t("subscription_upgrade") : t("subscription_manage")}
              <Zap className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Target} label={t("profile_avg_score")} value={averageScore} accent="score">
            <div className="relative mx-auto mt-2 h-16 w-16 md:h-20 md:w-20">
              <svg className="h-full w-full -rotate-90">
                <circle cx="50%" cy="50%" r="42%" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  fill="none"
                  stroke={scoreStroke}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={220}
                  initial={{ strokeDashoffset: 220 }}
                  animate={{ strokeDashoffset: 220 - (220 * averageScore) / 100 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-foreground md:text-2xl">{averageScore}</div>
            </div>
          </StatCard>
          <StatCard icon={TrendingUp} label={t("profile_streak")} value={streak} accent="streak" />
          <StatCard icon={Sparkles} label={t("profile_total_scans")} value={distribution.total} accent="total" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Healthy", value: distribution.healthy, icon: ShieldCheck },
          { label: "Moderate", value: distribution.moderate, icon: Flame },
          { label: "Risk", value: distribution.poor, icon: Activity },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-black/38 p-4 shadow-xl backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between">
              <item.icon className="h-5 w-5 text-foreground/60" />
              <span className="text-2xl font-black text-foreground">{item.value}%</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/50">{item.label}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-white/30" style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/42 p-4 shadow-xl backdrop-blur-2xl md:p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
        <div className="relative">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">{t("profile_history_title")}</h2>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-foreground/50">{t("profile_history_sub")}</p>
            </div>
            <Button variant="ghost" className="h-10 rounded-2xl border border-white/10 bg-white/8 px-4 text-[10px] font-black uppercase tracking-widest text-foreground/60 hover:bg-white/16">
              {t("profile_export")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <ScanHistory items={localScanHistory} showAll />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-black/42 p-4 shadow-xl backdrop-blur-2xl md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-foreground/60">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">{t("summary_title") || "Resumo do Dia"}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/50">FitVerse activity</p>
          </div>
        </div>
        <DailySummary />
      </section>

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
  accent: string
  children?: React.ReactNode
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative min-h-[170px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/42 p-3 text-center shadow-xl backdrop-blur-2xl md:p-4"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-foreground/60">
        <Icon className="h-5 w-5" />
      </div>
      {children || <p className="mt-5 text-4xl font-black leading-none tracking-tight text-foreground md:text-5xl">{value}</p>}
      <p className="mt-3 text-[8px] font-black uppercase tracking-[0.22em] text-foreground/50 md:text-[9px]">{label}</p>
    </motion.div>
  )
}
