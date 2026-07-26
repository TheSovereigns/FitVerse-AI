"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import {
  Trophy,
  Target,
  Droplets,
  Dumbbell,
  ScanLine,
  ChevronRight,
  Medal,
  Crown,
  Flame,
  Star,
  TrendingUp,
  Clock,
  Zap,
  Shield,
  Award,
  Users,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getGamificationData } from "@/lib/gamification"

interface SeasonProgress {
  seasonId: string
  startDate: string
  completedChallenges: number[]
  totalXp: number
}

interface SeasonHistoryEntry {
  seasonId: string
  name: string
  completed: boolean
  xpEarned: number
  badge?: string
}

const currentSeason = {
  id: "s3",
  name: "Summer Shred",
  description: "30-day summer fitness challenge",
  totalDays: 30,
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

function getLeaderboard(userXp: number) {
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
    rank: i + 1,
    name: p.name,
    xp: Math.max(0, Math.floor(userXp * (2.0 - i * 0.25))),
    emoji: p.emoji,
    level: p.level,
    isUser: false,
  }))

  entries.push({
    rank: 0,
    name: "Você",
    xp: userXp,
    emoji: "💪",
    level: Math.floor(userXp / 500) + 1,
    isUser: true,
  })

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
      if (stored) {
        setProgress(JSON.parse(stored))
      } else {
        const initial: SeasonProgress = {
          seasonId: currentSeason.id,
          startDate: new Date().toISOString(),
          completedChallenges: [],
          totalXp: 0,
        }
        setProgress(initial)
        localStorage.setItem("season_progress", JSON.stringify(initial))
      }
    } catch (e) {
      logger.error("[SeasonSystem] Failed to parse/setItem season_progress:", e)
    }
  }, [])

  const daysElapsed = progress
    ? Math.min(
        Math.floor(
          (Date.now() - new Date(progress.startDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1,
        currentSeason.totalDays
      )
    : 1

  const daysRemaining = currentSeason.totalDays - daysElapsed
  const progressPercent = Math.round((daysElapsed / currentSeason.totalDays) * 100)

  const currentChallenge =
    currentSeason.challenges.reduce((best, c) => (c.day <= daysElapsed ? c : best), currentSeason.challenges[0])

  const gamData = getGamificationData()
  const leaderboard = getLeaderboard(gamData.xp)
  const userRank = leaderboard.find((e) => e.isUser)?.rank || leaderboard.length

  const todayTasks = [
    {
      label: `${currentChallenge!.workouts} Workout${currentChallenge!.workouts > 1 ? "s" : ""}`,
      icon: Dumbbell,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: `${currentChallenge!.scans} Food Scan${currentChallenge!.scans > 1 ? "s" : ""}`,
      icon: ScanLine,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: `${currentChallenge!.water}L Water`,
      icon: Droplets,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  ]

  return (
    <div className="relative mx-auto w-full max-w-2xl space-y-4 pb-safe-nav">
      {/* Season Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand/20 via-brand/5 to-transparent p-5"
      >
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-purple-500/10 blur-xl" />

        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/20">
              <Trophy className="h-4 w-4 text-brand" />
            </div>
            <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-bold text-brand">
              {isEnglish ? "SEASON 3" : "TEMPORADA 3"}
            </span>
          </div>

          <h1 className="text-xl font-bold text-foreground">{currentSeason.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{currentSeason.description}</p>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                {isEnglish ? `${daysRemaining}d left` : `${daysRemaining}d restantes`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs font-medium text-foreground">
                {daysElapsed}/{currentSeason.totalDays} {isEnglish ? "days" : "dias"}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-border/50">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* User Rank Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-brand/30 bg-brand/5 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/20 text-lg font-bold text-brand">
            #{userRank}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {isEnglish ? "Your Rank" : "Sua Posicao"}
            </p>
            <p className="text-xs text-muted-foreground">
              {gamData.xp.toLocaleString()} XP {isEnglish ? "earned" : "ganho"}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-1">
            <TrendingUp className="h-3 w-3 text-brand" />
            <span className="text-xs font-bold text-brand">
              {isEnglish ? `Top ${Math.round((userRank / leaderboard.length) * 100)}%` : `Top ${Math.round((userRank / leaderboard.length) * 100)}%`}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1"
      >
        {([
          { id: "leaderboard" as const, icon: Users, label: isEnglish ? "Leaderboard" : "Ranking" },
          { id: "challenges" as const, icon: Target, label: isEnglish ? "Challenges" : "Desafios" },
          { id: "rewards" as const, icon: Award, label: isEnglish ? "Rewards" : "Recompensas" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-all",
              activeTab === tab.id
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2"
          >
            {/* Top 3 Podium */}
            <div className="flex items-end justify-center gap-3 px-4 pt-4 pb-2">
              {leaderboard.slice(0, 3).map((entry, i) => {
                const heights = ["h-20", "h-28", "h-24"]
                const medals = ["🥇", "🥈", "🥉"]
                const gradients = [
                  "from-yellow-500/20 to-yellow-600/5",
                  "from-gray-300/20 to-gray-400/5",
                  "from-orange-600/20 to-orange-700/5",
                ]
                return (
                  <div key={entry.rank} className="flex flex-col items-center">
                    <span className="text-2xl mb-1">{entry.emoji}</span>
                    <span className="text-[10px] font-medium text-foreground mb-1 truncate max-w-[60px]">
                      {entry.name}
                    </span>
                    <div
                      className={cn(
                        "w-16 rounded-t-xl bg-gradient-to-b flex flex-col items-center justify-end pb-2",
                        heights[i],
                        gradients[i],
                        "border border-border/50"
                      )}
                    >
                      <span className="text-lg font-bold text-foreground">{medals[i]}</span>
                      <span className="text-[9px] text-muted-foreground">{entry.xp} XP</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Full Rankings */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {leaderboard.map((entry, i) => (
                <motion.div
                  key={entry.name + entry.rank}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors",
                    entry.isUser
                      ? "bg-brand/10 border-brand/20"
                      : "hover:bg-muted/30"
                  )}
                >
                  <span
                    className={cn(
                      "w-7 text-center text-sm font-bold",
                      entry.rank <= 3 ? "text-brand" : "text-muted-foreground"
                    )}
                  >
                    {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                  </span>
                  <span className="text-lg">{entry.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", entry.isUser ? "text-brand" : "text-foreground")}>
                      {entry.name}
                      {entry.isUser && (
                        <span className="ml-1.5 text-[9px] font-bold text-brand bg-brand/15 px-1.5 py-0.5 rounded-full">
                          VOCÊ
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Lv. {entry.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{entry.xp.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {/* Today's Tasks */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-semibold text-foreground">
                  {isEnglish ? "Today's Challenges" : "Desafios de Hoje"}
                </h3>
                <span className="ml-auto rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                  {isEnglish ? `Day ${daysElapsed}` : `Dia ${daysElapsed}`}
                </span>
              </div>
              <div className="space-y-2">
                {todayTasks.map((task, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", task.bg)}>
                      <task.icon className={cn("h-4 w-4", task.color)} />
                    </div>
                    <span className="flex-1 text-sm text-foreground">{task.label}</span>
                    <div className="h-5 w-5 rounded-lg border-2 border-border" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Season Challenges Timeline */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {isEnglish ? "Challenge Roadmap" : "Roteiro de Desafios"}
              </h3>
              <div className="space-y-1">
                {currentSeason.challenges.map((ch, i) => {
                  const isCompleted = progress?.completedChallenges.includes(ch.day)
                  const isCurrent = ch.day <= daysElapsed && (i === currentSeason.challenges.length - 1 || currentSeason.challenges[i + 1].day > daysElapsed)
                  return (
                    <div key={ch.day} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                            isCompleted
                              ? "bg-green-500/20 border-green-500 text-green-400"
                              : isCurrent
                                ? "bg-brand/20 border-brand text-brand"
                                : "bg-muted/30 border-border text-muted-foreground"
                          )}
                        >
                          {isCompleted ? "✓" : ch.day}
                        </div>
                        {i < currentSeason.challenges.length - 1 && (
                          <div className={cn("w-0.5 h-6", isCompleted ? "bg-green-500/50" : "bg-border")} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-xs font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                          {isEnglish ? `Day ${ch.day}` : `Dia ${ch.day}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {ch.workouts}W · {ch.scans}S · {ch.water}L
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Rewards Tab */}
        {activeTab === "rewards" && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {currentSeason.rewards.map((reward, i) => {
              const isUnlocked = daysElapsed >= reward.day
              const RewardIcon = reward.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-4 transition-all",
                    isUnlocked
                      ? "border-brand/30 bg-gradient-to-r from-brand/10 to-purple-500/5"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-xl",
                        isUnlocked ? "bg-brand/20" : "bg-muted/30"
                      )}
                    >
                      <RewardIcon
                        className={cn(
                          "h-6 w-6",
                          isUnlocked ? "text-brand" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">{reward.badge}</h4>
                        {isUnlocked && (
                          <span className="rounded-full bg-green-500/15 px-1.5 py-0.5 text-[9px] font-bold text-green-400">
                            {isEnglish ? "UNLOCKED" : "DESBLOQUEADO"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isEnglish ? `Day ${reward.day}` : `Dia ${reward.day}`} · {reward.xp} XP
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        isUnlocked ? "bg-brand/10 text-brand" : "bg-muted/30 text-muted-foreground"
                      )}
                    >
                      {isUnlocked ? <Star className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* Past Seasons */}
            <div className="mt-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
              >
                <span className="font-medium">{isEnglish ? "Past Seasons" : "Temporadas Anteriores"}</span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", showHistory && "rotate-180")}
                />
              </button>
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-2">
                      {seasonHistory.length === 0 ? (
                        <p className="p-3 text-center text-xs text-muted-foreground">
                          {isEnglish ? "No past seasons yet" : "Nenhuma temporada anterior ainda"}
                        </p>
                      ) : (
                        seasonHistory.map((s) => (
                          <div key={s.seasonId} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{s.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {s.badge} · {s.xpEarned} XP
                              </p>
                            </div>
                            {s.completed && (
                              <Medal className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                        ))
                      )}
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
