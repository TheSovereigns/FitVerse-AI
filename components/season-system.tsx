"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import {
  Trophy, Target, Droplets, Dumbbell, ScanLine,
  Medal, Crown, Flame, Star, TrendingUp, Clock,
  Zap, Shield, Award, Users, ChevronDown, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getGamificationData } from "@/lib/gamification"

interface SeasonProgress {
  seasonId: string; startDate: string; completedChallenges: number[]; totalXp: number
}

interface SeasonHistoryEntry {
  seasonId: string; name: string; completed: boolean; xpEarned: number; badge?: string
}

const currentSeason = {
  id: "s3", name: "Summer Shred", description: "30-day summer fitness challenge", totalDays: 30,
  challenges: [
    { day: 1, workouts: 1, scans: 2, water: 2 },
    { day: 5, workouts: 1, scans: 3, water: 2 },
    { day: 10, workouts: 2, scans: 3, water: 3 },
    { day: 15, workouts: 2, scans: 4, water: 3 },
    { day: 20, workouts: 2, scans: 5, water: 3 },
    { day: 25, workouts: 3, scans: 5, water: 4 },
    { day: 30, workouts: 3, scans: 5, water: 4 },
  ],
  rewards: [
    { day: 10, badge: "Early Bird", xp: 100, icon: Shield },
    { day: 20, badge: "Champion", xp: 250, icon: Award },
    { day: 30, badge: "Legend", xp: 500, icon: Crown },
  ],
}

function getLeaderboard(userXp: number, t: (k: string) => string) {
  const players = [
    { name: "FitQueen", emoji: "👑", level: 42 },
    { name: "GymRat99", emoji: "🐀", level: 38 },
    { name: "YogaMaster", emoji: "🧘", level: 35 },
    { name: "CardioKing", emoji: "🏃", level: 31 },
    { name: "IronWill", emoji: "💪", level: 28 },
    { name: "BeastMode", emoji: "🔥", level: 25 },
    { name: "SweatPro", emoji: "💧", level: 22 },
  ]
  const entries = players.map((p, i) => ({
    rank: i + 1, name: p.name, xp: Math.max(0, Math.floor(userXp * (2.0 - i * 0.25))),
    emoji: p.emoji, level: p.level, isUser: false,
  }))
  entries.push({ rank: 0, name: t("lb_you"), xp: userXp, emoji: "💪", level: Math.floor(userXp / 500) + 1, isUser: true })
  entries.sort((a, b) => b.xp - a.xp)
  return entries.map((e, i) => ({ ...e, rank: i + 1 }))
}

const seasonHistory: SeasonHistoryEntry[] = []

export function SeasonSystem() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [progress, setProgress] = useState<SeasonProgress | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<"leaderboard" | "challenges" | "rewards">("leaderboard")

  useEffect(() => {
    try {
      const stored = localStorage.getItem("season_progress")
      if (stored) { setProgress(JSON.parse(stored)) }
      else {
        const initial: SeasonProgress = { seasonId: currentSeason.id, startDate: new Date().toISOString(), completedChallenges: [], totalXp: 0 }
        setProgress(initial); localStorage.setItem("season_progress", JSON.stringify(initial))
      }
    } catch (e) { logger.error("[SeasonSystem] Failed:", e) }
  }, [])

  const daysElapsed = progress
    ? Math.min(Math.floor((Date.now() - new Date(progress.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1, currentSeason.totalDays) : 1
  const daysRemaining = currentSeason.totalDays - daysElapsed
  const progressPercent = Math.round((daysElapsed / currentSeason.totalDays) * 100)
  const currentChallenge = currentSeason.challenges.reduce((best, c) => (c.day <= daysElapsed ? c : best), currentSeason.challenges[0])
  const gamData = getGamificationData()
  const leaderboard = getLeaderboard(gamData.xp, t)
  const userRank = leaderboard.find((e) => e.isUser)?.rank || leaderboard.length

  const todayTasks = [
    { label: `${currentChallenge!.workouts} ${currentChallenge!.workouts > 1 ? t("lb_workouts") : t("lb_workout")}`, icon: Dumbbell, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: `${currentChallenge!.scans} ${currentChallenge!.scans > 1 ? t("lb_food_scans") : t("lb_food_scan")}`, icon: ScanLine, color: "text-green-400", bg: "bg-green-500/10" },
    { label: `${currentChallenge!.water}L ${isEnglish ? "Water" : "Água"}`, icon: Droplets, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ]

  return (
    <div className="relative mx-auto w-full max-w-2xl space-y-4 pb-safe-nav">
      {/* ═══ EPIC SEASON HEADER ═══ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-brand/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand/15 via-emerald-500/8 to-cyan-500/10" />
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-24 w-24 rounded-full bg-yellow-500/8 blur-2xl" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand/25 to-emerald-500/15">
                <Trophy className="h-5 w-5 text-brand" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand">{t("lb_season_3")}</span>
                <p className="text-sm font-bold text-foreground">{t("ls_season_name")}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-lg font-black text-foreground">{daysElapsed}</span>
                <span className="text-xs text-muted-foreground">/ {currentSeason.totalDays}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{daysRemaining} {t("lb_days_left")}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-3">{t("ls_season_desc")}</p>

          {/* Progress bar */}
          <div className="relative">
            <div className="h-3 overflow-hidden rounded-full bg-black/30 border border-white/5">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-brand via-emerald-400 to-cyan-400 relative"
                animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </motion.div>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">{t("lb_day")} 1</span>
              <span className="text-[10px] font-bold text-brand">{progressPercent}%</span>
              <span className="text-[10px] text-muted-foreground">{t("lb_day")} {currentSeason.totalDays}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ USER RANK CARD ═══ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl border border-brand/25 bg-gradient-to-r from-brand/8 to-transparent p-4"
      >
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-emerald-500/10 border border-brand/20">
              <span className="text-xl font-black text-brand">#{userRank}</span>
            </div>
            {userRank <= 3 && (
              <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px]">
                {userRank === 1 ? "🥇" : userRank === 2 ? "🥈" : "🥉"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{t("lb_your_rank")}</p>
            <p className="text-xs text-muted-foreground">{gamData.xp.toLocaleString()} {t("ls_xp")} {t("lb_earned")}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1.5 border border-brand/20">
            <TrendingUp className="h-3.5 w-3.5 text-brand" />
            <span className="text-xs font-bold text-brand">Top {Math.round((userRank / leaderboard.length) * 100)}%</span>
          </div>
        </div>
      </motion.div>

      {/* ═══ TABS ═══ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-1 rounded-2xl border border-border bg-muted/20 p-1"
      >
        {([
          { id: "leaderboard" as const, icon: Users, label: t("lb_leaderboard") },
          { id: "challenges" as const, icon: Target, label: t("lb_challenges") },
          { id: "rewards" as const, icon: Award, label: t("lb_rewards") },
        ]).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all",
              activeTab === tab.id ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />{tab.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ═══ LEADERBOARD TAB ═══ */}
        {activeTab === "leaderboard" && (
          <motion.div key="lb" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* ═══ PODIUM ═══ */}
            <div className="relative flex items-end justify-center gap-4 px-6 pt-6 pb-0">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 via-transparent to-transparent pointer-events-none" />

              {leaderboard.slice(0, 3).map((entry, i) => {
                const heights = ["h-24", "h-32", "h-28"]
                const widths = ["w-[90px]", "w-[100px]", "w-[90px]"]
                const medals = ["🥇", "🥈", "🥉"]
                const gradients = [
                  "from-yellow-500/20 via-amber-500/10 to-yellow-600/5",
                  "from-gray-300/15 via-slate-400/8 to-gray-400/5",
                  "from-orange-600/15 via-amber-600/8 to-orange-700/5",
                ]
                const borders = ["border-yellow-500/30", "border-gray-400/25", "border-orange-600/25"]
                const reorders = ["order-2", "order-1", "order-3"]
                return (
                  <div key={entry.rank} className={cn("flex flex-col items-center relative z-10", reorders[i])}>
                    {/* Avatar */}
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1, type: "spring" }}
                      className="mb-2"
                    >
                      <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl text-2xl border-2 bg-background/80 backdrop-blur-sm", borders[i])}>
                        {entry.emoji}
                      </div>
                    </motion.div>
                    <span className="text-[10px] font-bold text-foreground mb-1.5 truncate max-w-[70px]">{entry.name}</span>
                    {/* Podium pillar */}
                    <div className={cn(
                      "rounded-t-2xl bg-gradient-to-b flex flex-col items-center justify-end pb-3 border-t-2 relative overflow-hidden",
                      widths[i], heights[i], gradients[i], borders[i]
                    )}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                      <span className="relative text-2xl font-black mb-0.5">{medals[i]}</span>
                      <span className="relative text-[10px] font-bold text-muted-foreground">{entry.xp.toLocaleString()} {t("ls_xp")}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ═══ FULL RANKINGS ═══ */}
            <div className="rounded-2xl border border-border bg-card/50 overflow-hidden">
              {leaderboard.map((entry, i) => (
                <motion.div key={entry.name + entry.rank}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.03 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 border-b border-border/50 last:border-0 transition-colors",
                    entry.isUser ? "bg-gradient-to-r from-brand/10 to-brand/5 border-brand/20" : "hover:bg-muted/20"
                  )}
                >
                  {/* Rank */}
                  <span className={cn(
                    "w-8 text-center text-sm font-black",
                    entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-gray-300" : entry.rank === 3 ? "text-orange-400" : "text-muted-foreground"
                  )}>
                    {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                  </span>
                  {/* Avatar */}
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-lg border",
                    entry.isUser ? "bg-brand/10 border-brand/20" : "bg-muted/30 border-border/50"
                  )}>
                    {entry.emoji}
                  </div>
                  {/* Name & Level */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold truncate", entry.isUser ? "text-brand" : "text-foreground")}>
                      {entry.name}
                      {entry.isUser && (
                        <span className="ml-1.5 inline-flex items-center text-[8px] font-black text-brand bg-brand/15 px-1.5 py-0.5 rounded-full align-middle">
                          {t("lb_you")}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Lv. {entry.level}</p>
                  </div>
                  {/* XP */}
                  <div className="text-right">
                    <p className="text-sm font-black text-foreground">{entry.xp.toLocaleString()}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">{t("ls_xp")}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ CHALLENGES TAB ═══ */}
        {activeTab === "challenges" && (
          <motion.div key="ch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Today's Tasks */}
            <div className="rounded-2xl border border-border bg-card/50 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15"><Sparkles className="h-4 w-4 text-brand" /></div>
                <h3 className="text-sm font-bold text-foreground flex-1">{t("lb_todays_challenges")}</h3>
                <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-black text-brand border border-brand/20">
                  {t("lb_day")} {daysElapsed}
                </span>
              </div>
              <div className="space-y-2.5">
                {todayTasks.map((task, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl border border-border/50 p-3.5 bg-muted/10"
                  >
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", task.bg)}>
                      <task.icon className={cn("h-5 w-5", task.color)} />
                    </div>
                    <span className="flex-1 text-sm font-semibold text-foreground">{task.label}</span>
                    <div className="h-6 w-6 rounded-lg border-2 border-border/60 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-sm bg-transparent" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Roadmap Timeline */}
            <div className="rounded-2xl border border-border bg-card/50 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15"><Target className="h-4 w-4 text-emerald-400" /></div>
                <h3 className="text-sm font-bold text-foreground">{t("lb_challenge_roadmap")}</h3>
              </div>
              <div className="space-y-0">
                {currentSeason.challenges.map((ch, i) => {
                  const isCompleted = progress?.completedChallenges.includes(ch.day)
                  const isCurrent = ch.day <= daysElapsed && (i === currentSeason.challenges.length - 1 || currentSeason.challenges[i + 1].day > daysElapsed)
                  return (
                    <div key={ch.day} className="flex gap-3">
                      {/* Timeline column */}
                      <div className="flex flex-col items-center w-10">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
                          className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center text-xs font-black border-2 relative z-10 shrink-0",
                            isCompleted ? "bg-green-500/20 border-green-500 text-green-400"
                              : isCurrent ? "bg-brand/20 border-brand text-brand shadow-[0_0_12px_rgba(52,211,153,0.2)]"
                              : "bg-muted/20 border-border text-muted-foreground"
                          )}
                        >
                          {isCompleted ? "✓" : ch.day}
                        </motion.div>
                        {i < currentSeason.challenges.length - 1 && (
                          <div className={cn("w-0.5 flex-1 min-h-[20px]", isCompleted ? "bg-green-500/40" : "bg-border/50")} />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-semibold", isCurrent ? "text-foreground" : isCompleted ? "text-green-400" : "text-muted-foreground")}>
                            {t("lb_day")} {ch.day}
                          </p>
                          {isCurrent && <span className="text-[9px] font-bold text-brand bg-brand/15 px-1.5 py-0.5 rounded-full">{isEnglish ? "NOW" : "AGORA"}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                            <Dumbbell className="h-3 w-3" /> {ch.workouts}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                            <ScanLine className="h-3 w-3" /> {ch.scans}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                            <Droplets className="h-3 w-3" /> {ch.water}L
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ REWARDS TAB ═══ */}
        {activeTab === "rewards" && (
          <motion.div key="rw" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {currentSeason.rewards.map((reward, i) => {
              const isUnlocked = daysElapsed >= reward.day
              const RewardIcon = reward.icon
              const progressToReward = Math.min(100, Math.round((daysElapsed / reward.day) * 100))
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-5 transition-all",
                    isUnlocked
                      ? "border-brand/30 bg-gradient-to-r from-brand/10 via-emerald-500/5 to-transparent shadow-[0_0_20px_rgba(52,211,153,0.08)]"
                      : "border-border bg-card/50"
                  )}
                >
                  {isUnlocked && <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/10 blur-2xl pointer-events-none" />}
                  <div className="relative flex items-center gap-4">
                    <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl shrink-0 border", isUnlocked ? "bg-brand/15 border-brand/20" : "bg-muted/20 border-border/50")}>
                      <RewardIcon className={cn("h-7 w-7", isUnlocked ? "text-brand" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-foreground">
                          {reward.badge === "Early Bird" ? t("ls_badge_early_bird") : reward.badge === "Legend" ? t("ls_badge_legend") : reward.badge === "Champion" ? t("ls_badge_champion") : reward.badge}
                        </h4>
                        {isUnlocked && (
                          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-black text-green-400 border border-green-500/20">
                            {t("lb_unlocked")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{t("lb_day")} {reward.day} · {reward.xp} {t("ls_xp")}</p>
                      {/* Progress to reward */}
                      {!isUnlocked && (
                        <div className="mt-2">
                          <div className="h-1.5 overflow-hidden rounded-full bg-border/50">
                            <div className="h-full rounded-full bg-brand/50" style={{ width: `${progressToReward}%` }} />
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{progressToReward}% {isEnglish ? "complete" : "completo"}</p>
                        </div>
                      )}
                    </div>
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl shrink-0", isUnlocked ? "bg-brand/10 text-brand" : "bg-muted/20 text-muted-foreground")}>
                      {isUnlocked ? <Star className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* Past Seasons */}
            <div className="rounded-2xl border border-border bg-card/50 overflow-hidden">
              <button onClick={() => setShowHistory(!showHistory)}
                className="flex w-full items-center gap-2.5 p-4 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30"><Clock className="h-4 w-4 text-muted-foreground" /></div>
                <span className="flex-1 text-sm font-semibold text-foreground">{t("lb_past_seasons")}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showHistory && "rotate-180")} />
              </button>
              <AnimatePresence>
                {showHistory && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-2">
                      {seasonHistory.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground py-4">{t("lb_no_past_seasons")}</p>
                      ) : seasonHistory.map((s) => (
                        <div key={s.seasonId} className="flex items-center gap-3 rounded-xl border border-border bg-muted/10 p-3">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1"><p className="text-sm font-medium text-foreground">{s.name}</p><p className="text-[10px] text-muted-foreground">{s.badge} · {s.xpEarned} {t("ls_xp")}</p></div>
                          {s.completed && <Medal className="h-4 w-4 text-yellow-400" />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Lock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
