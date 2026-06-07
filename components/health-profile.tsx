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
} from "lucide-react"
import { ScanHistory } from "@/components/scan-history"
import { DailySummary } from "@/components/daily-summary"
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
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { plan: currentPlan } = usePlanLimits()
  const router = useRouter()
  const [localScanHistory, setLocalScanHistory] = useState<ScanHistoryItem[]>(scanHistory)
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("week")
  const [displayName, setDisplayName] = useState("")
  const [editName, setEditName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-5rem] h-72 bg-[radial-gradient(circle_at_25%_10%,rgba(255,149,0,0.22),transparent_42%),radial-gradient(circle_at_88%_4%,rgba(251,191,36,0.12),transparent_36%)]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-orange-300/22 bg-black/50 p-4 shadow-[inset_0_1px_0_rgba(251,146,60,0.16),0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:rounded-[2.5rem] md:p-6"
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-300 via-orange-500 to-orange-900" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/55 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(251,146,60,0.12),transparent_34%,rgba(245,158,11,0.08))]" />

        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex items-start gap-4 md:gap-5">
            <motion.div
              whileHover={{ rotate: 6, scale: 1.03 }}
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] border border-orange-300/18 bg-orange-500/10 text-amber-100 shadow-xl md:h-20 md:w-20 md:rounded-[1.8rem]"
            >
              <User className="h-7 w-7 md:h-9 md:w-9" />
            </motion.div>

            <div className="min-w-0 flex-1">
              <Badge className="mb-3 rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-orange-100">
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
                    className="h-12 rounded-2xl border-orange-300/18 bg-black/35 text-xl font-black text-orange-50 focus-visible:ring-orange-400"
                    autoFocus
                    disabled={isSaving}
                  />
                  <div className="flex gap-2">
                    <Button size="icon" onClick={handleSaveName} disabled={isSaving} className="h-12 w-12 rounded-2xl bg-orange-500 text-black hover:bg-amber-300">
                      <Check className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-12 w-12 rounded-2xl border border-orange-300/14 bg-orange-500/8 text-orange-100 hover:bg-orange-500/16">
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
                    className="h-9 w-9 shrink-0 rounded-xl border border-orange-300/14 bg-orange-500/8 text-orange-100/70 hover:bg-orange-500/16 hover:text-orange-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="mt-3 flex min-w-0 items-center gap-2">
                <Activity className="h-4 w-4 shrink-0 text-orange-300" />
                <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-orange-50/45 md:text-sm">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <div className="flex rounded-2xl border border-orange-300/14 bg-black/30 p-1 backdrop-blur-xl">
              {(["week", "month"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  className={cn(
                    "min-h-11 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition",
                    selectedPeriod === period ? "bg-orange-500 text-black shadow-lg" : "text-orange-50/45 hover:text-orange-50"
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
              className="h-12 w-12 rounded-2xl border border-orange-300/14 bg-orange-500/8 text-orange-100 hover:bg-orange-500/16"
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

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div
          whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-[2rem] border border-orange-300/22 bg-black/48 p-5 shadow-xl backdrop-blur-2xl md:p-6"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-300 via-orange-500 to-amber-600" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/12 via-transparent to-amber-300/8" />
          <div className="relative flex h-full flex-col justify-between gap-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-300/18 bg-orange-500/10 text-amber-100">
                  <Crown className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-orange-100/45">
                    {userSubscription === "free" ? t("subscription_free_label") : t("subscription_premium_label")}
                  </p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-orange-50">{userSubscription.toUpperCase()}</h2>
                </div>
              </div>
              <ShieldCheck className="h-6 w-6 text-orange-300" />
            </div>

            <Button
              onClick={handleSubscriptionClick}
              className="h-12 rounded-2xl bg-orange-500 text-sm font-black uppercase tracking-[0.16em] text-black shadow-[0_14px_34px_rgba(255,149,0,0.24)] hover:bg-amber-300"
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
                <circle cx="50%" cy="50%" r="42%" fill="none" stroke="rgba(251,146,60,0.12)" strokeWidth="8" />
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
              <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-orange-50 md:text-2xl">{averageScore}</div>
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
          <div key={item.label} className="rounded-[1.5rem] border border-orange-300/14 bg-black/38 p-4 shadow-xl backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between">
              <item.icon className="h-5 w-5 text-amber-200" />
              <span className="text-2xl font-black text-orange-50">{item.value}%</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-100/42">{item.label}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-950/60">
              <div className="h-full rounded-full bg-orange-400" style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-orange-300/16 bg-black/42 p-4 shadow-xl backdrop-blur-2xl md:p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent" />
        <div className="relative">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">{t("profile_history_title")}</h2>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-100/38">{t("profile_history_sub")}</p>
            </div>
            <Button variant="ghost" className="h-10 rounded-2xl border border-orange-300/14 bg-orange-500/8 px-4 text-[10px] font-black uppercase tracking-widest text-orange-100 hover:bg-orange-500/16">
              {t("profile_export")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <ScanHistory items={localScanHistory} showAll />
        </div>
      </section>

      <section className="rounded-[2rem] border border-orange-300/16 bg-black/42 p-4 shadow-xl backdrop-blur-2xl md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-300/14 bg-orange-500/10 text-amber-100">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">{t("summary_title") || "Resumo do Dia"}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-100/38">FitVerse activity</p>
          </div>
        </div>
        <DailySummary />
      </section>
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
      className="relative min-h-[170px] overflow-hidden rounded-[1.5rem] border border-orange-300/16 bg-black/42 p-3 text-center shadow-xl backdrop-blur-2xl md:p-4"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-orange-400/90" />
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-300/14 bg-orange-500/10 text-amber-100">
        <Icon className="h-5 w-5" />
      </div>
      {children || <p className="mt-5 text-4xl font-black leading-none tracking-tight text-orange-50 md:text-5xl">{value}</p>}
      <p className="mt-3 text-[8px] font-black uppercase tracking-[0.22em] text-orange-100/40 md:text-[9px]">{label}</p>
    </motion.div>
  )
}
