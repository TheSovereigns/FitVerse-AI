"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  User,
  TrendingUp,
  Target,
  Sparkles,
  Crown,
  Settings,
  ArrowRight,
  Zap,
  Activity,
  ShieldCheck,
  ChevronRight,
  Pencil,
  Check,
  X,
  LogOut,
} from "lucide-react"
import { ScanHistory } from "@/components/scan-history"
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
  const [localScanHistory, setLocalScanHistory] = useState<ScanHistoryItem[]>(scanHistory)
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("week")
  const [displayName, setDisplayName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || t("profile_default_name")
      setDisplayName(name)
      setEditName(name)
    }
  }, [user])

  useEffect(() => {
    const savedScans = localStorage.getItem("scanHistory")
    const initialScans = savedScans ? JSON.parse(savedScans) : []
    const combinedHistory = [...scanHistory, ...initialScans].reduce((acc, current) => {
      if (!acc.find((item: ScanHistoryItem) => item.id === current.id)) acc.push(current)
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
        .from('profiles')
        .update({ name: editName.trim() })
        .eq('id', user.id)
      
      if (!error) {
        setDisplayName(editName.trim())
      }
    } catch (e) {
      console.error("Error updating name:", e)
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditName(displayName)
    setIsEditing(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const getAverageScore = (period: "week" | "month") => {
    const now = Date.now()
    const periodMs = period === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
    const recentScans = localScanHistory.filter(item => now - new Date(item.scannedAt).getTime() <= periodMs)
    if (recentScans.length === 0) return 0
    return Math.round(recentScans.reduce((acc, item) => acc + item.score, 0) / recentScans.length)
  }

  const averageScore = getAverageScore(selectedPeriod)
  const scoreColor = averageScore >= 70 ? "text-emerald-400" : averageScore >= 40 ? "text-amber-400" : "text-rose-400"

  const getQualityDistribution = () => {
    const now = Date.now()
    const periodMs = selectedPeriod === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
    const recentScans = localScanHistory.filter(item => now - new Date(item.scannedAt).getTime() <= periodMs)
    const healthy = recentScans.filter(item => item.score >= 70).length
    const moderate = recentScans.filter(item => item.score >= 40 && item.score < 70).length
    const poor = recentScans.filter(item => item.score < 40).length
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
      if (daysDiff === streak) { streak++; currentDate = scanDate }
      else if (daysDiff > streak) break
    }
    return streak
  }

  const distribution = getQualityDistribution()
  const streak = getStreak()
  const userSubscription = currentPlan || "free"

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto space-y-6 md:space-y-10 pb-safe-nav animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mt-4 md:mt-8">
        <div className="flex items-center gap-4 md:gap-8">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] glass-strong border-white/20 flex items-center justify-center shadow-xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 mesh-gradient opacity-20" />
            <User className="w-6 h-6 md:w-8 md:h-8 text-primary relative z-10" />
          </motion.div>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  className="h-8 bg-white/10 border-white/20 text-white text-xl font-black rounded-xl max-w-[200px]"
                  autoFocus
                  disabled={isSaving}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="w-8 h-8 text-emerald-400 hover:text-emerald-300"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="w-8 h-8 text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
                  {displayName}
                </h1>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditName(displayName)
                    setIsEditing(true)
                  }}
                  className="w-8 h-8 text-muted-foreground hover:text-primary"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 md:mt-2">
              <Activity className="w-3 h-3 md:w-4 md:h-4 text-emerald-400 animate-pulse" />
               <p className="text-xs md:text-sm font-bold text-muted-foreground opacity-50 uppercase tracking-[0.2em] truncate max-w-[200px] md:max-w-none">
                 {user?.email || ""}
               </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex p-1 glass-strong border-white/10 rounded-full shadow-inner">
            {(["week", "month"] as const).map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                  className={cn(
                  "px-3 md:px-6 py-2.5 md:py-2 min-h-[44px] rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                  selectedPeriod === p ? "mesh-gradient text-white shadow-xl scale-105" : "text-muted-foreground opacity-40 hover:opacity-100"
                )}
              >
                {p === "week" ? t("profile_7cycles") : t("profile_30cycles")}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateToSettings}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl glass-strong border-white/20 hover:bg-white/10 shadow-xl haptic-press"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-4 text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl glass-strong border-white/20 hover:bg-red-500/10 shadow-xl haptic-press text-red-400"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4 md:space-y-8">
        {/* Subscription Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="relative glass-strong border-white/10 rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden group"
        >
          <div className="absolute inset-0 mesh-gradient opacity-10 group-hover:opacity-15 transition-opacity" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8">
            <div className="flex items-center gap-3 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] bg-primary/20 border border-primary/30 flex items-center justify-center shadow-inner">
                <Crown className="w-5 h-5 md:w-8 md:h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl md:text-3xl font-black tracking-tighter text-foreground mb-0.5 md:mb-1">
                  {userSubscription.toUpperCase()}
                </h3>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <ShieldCheck className="w-3 h-3 md:w-4 md:h-3 text-primary" />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                    {userSubscription === "free" ? t("subscription_free_label") : t("subscription_premium_label")}
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => router.push("/subscription")}
              className="w-full md:w-auto h-12 md:h-16 px-6 md:px-10 mesh-gradient text-white font-black text-sm md:text-lg rounded-[1.25rem] md:rounded-[1.5rem] shadow-xl haptic-press flex items-center gap-2"
            >
              {userSubscription === "free" ? t("subscription_upgrade") : t("subscription_manage")}
              <Zap className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 lg:gap-6 xl:gap-8">
          {/* Average Score Ring */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-strong border-white/10 rounded-[1.5rem] md:rounded-[3rem] p-3 md:p-8 shadow-xl flex flex-col items-center justify-center text-center"
          >
            <div className="relative w-14 h-14 md:w-32 md:h-32 mb-2 md:mb-6">
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="44%" className="fill-none stroke-white/5" strokeWidth="8" />
                <motion.circle
                  cx="50%" cy="50%" r="44%"
                  className={cn("fill-none stroke-linecap-round", scoreColor.replace("text-", "stroke-"))}
                  strokeWidth="8"
                  strokeDasharray={200}
                  initial={{ strokeDashoffset: 200 }}
                  animate={{ strokeDashoffset: 200 - (200 * averageScore) / 100 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-lg md:text-5xl font-black tracking-tighter leading-none", scoreColor)}>{averageScore}</span>
              </div>
            </div>
            <h3 className="text-[7px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">{t("profile_avg_score")}</h3>
          </motion.div>

          {/* Streak */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-strong border-white/10 rounded-[1.5rem] md:rounded-[3rem] p-3 md:p-8 shadow-xl flex flex-col items-center justify-center text-center"
          >
            <div className="w-10 h-10 md:w-20 md:h-20 rounded-[1rem] md:rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2 md:mb-6 shadow-inner">
              <TrendingUp className="w-5 h-5 md:w-10 md:h-10" />
            </div>
            <p className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-foreground leading-none mb-1 md:mb-2">{streak}</p>
            <h3 className="text-[7px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">{t("profile_streak")}</h3>
          </motion.div>

          {/* Total Scans */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-strong border-white/10 rounded-[1.5rem] md:rounded-[3rem] p-3 md:p-8 shadow-xl flex flex-col items-center justify-center text-center"
          >
            <div className="w-10 h-10 md:w-20 md:h-20 rounded-[1rem] md:rounded-[2rem] bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2 md:mb-6 shadow-inner">
              <Sparkles className="w-5 h-5 md:w-10 md:h-10" />
            </div>
            <p className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-foreground leading-none mb-1 md:mb-2">{distribution.total}</p>
            <h3 className="text-[7px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">{t("profile_total_scans")}</h3>
          </motion.div>
        </div>

        {/* Scan History */}
        <div className="glass-strong border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.3)] rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 overflow-hidden relative group">
          <div className="absolute inset-0 mesh-gradient opacity-5" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-8">
              <div>
                <h2 className="text-xl md:text-3xl font-black tracking-tighter text-foreground uppercase italic">{t("profile_history_title")}</h2>
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-0.5 md:mt-1">{t("profile_history_sub")}</p>
              </div>
              <Button variant="ghost" className="h-8 md:h-10 rounded-full font-black text-[8px] md:text-[10px] tracking-widest px-3 md:px-5 glass hover:bg-white/10 transition-all border-none">
                {t("profile_export")} <ArrowRight className="w-3 h-3 md:w-4 md:h-3 ml-1" />
              </Button>
            </div>
            <ScanHistory items={localScanHistory} showAll />
          </div>
        </div>
      </div>
    </div>
  )
}
