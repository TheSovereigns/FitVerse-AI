"use client"

import { logger } from "./logger"

const STORAGE_KEYS = {
  stats: "fitverse-gamification-stats",
  bossState: "fitverse-boss-state",
  achievements: "fitverse-achievements",
  xp: "fitverse-xp",
  coins: "fitverse-coins",
} as const

export interface GamificationStats {
  totalScans: number
  totalWorkouts: number
  totalWater: number
  totalHabits: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
}

export interface BossState {
  currentBossIndex: number
  bossHp: number
  battleStarted: boolean
  battleHistory: Array<{
    bossName: string
    date: string
    won: boolean
    damageDealt: number
  }>
}

const BOSS_CONFIG = [
  { name: "Sedentary Slime", maxHp: 500, xpReward: 200 },
  { name: "Junk Food Dragon", maxHp: 800, xpReward: 350 },
  { name: "Stress Phantom", maxHp: 1200, xpReward: 500 },
]

const TASK_DAMAGE: Record<string, number> = {
  scan: 25,
  workout: 50,
  water: 15,
  habit: 20,
}

const ACHIEVEMENTS = [
  { id: "first-scan", category: "scan", requirement: 1, xpReward: 50 },
  { id: "scan-10", category: "scan", requirement: 10, xpReward: 100 },
  { id: "scan-50", category: "scan", requirement: 50, xpReward: 500 },
  { id: "scan-100", category: "scan", requirement: 100, xpReward: 1000 },
  { id: "workout-1", category: "workout", requirement: 1, xpReward: 100 },
  { id: "workout-10", category: "workout", requirement: 10, xpReward: 300 },
  { id: "workout-50", category: "workout", requirement: 50, xpReward: 1000 },
  { id: "streak-3", category: "streak", requirement: 3, xpReward: 75 },
  { id: "streak-7", category: "streak", requirement: 7, xpReward: 200 },
  { id: "streak-30", category: "streak", requirement: 30, xpReward: 1000 },
  { id: "streak-100", category: "streak", requirement: 100, xpReward: 5000 },
  { id: "hydration-7", category: "health", requirement: 7, xpReward: 100 },
]

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    logger.error("[Gamification] Failed to save:", e)
  }
}

function getStats(): GamificationStats {
  return safeGet(STORAGE_KEYS.stats, {
    totalScans: 0,
    totalWorkouts: 0,
    totalWater: 0,
    totalHabits: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
  })
}

function getBossState(): BossState {
  return safeGet(STORAGE_KEYS.bossState, {
    currentBossIndex: 0,
    bossHp: BOSS_CONFIG[0].maxHp,
    battleStarted: false,
    battleHistory: [],
  })
}

function getXp(): number {
  return safeGet(STORAGE_KEYS.xp, 0)
}

function getCoins(): number {
  return safeGet(STORAGE_KEYS.coins, 0)
}

function updateStreak(stats: GamificationStats): GamificationStats {
  const today = new Date().toISOString().split("T")[0]
  if (stats.lastActiveDate === today) return stats

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  const newStreak = stats.lastActiveDate === yesterday ? stats.currentStreak + 1 : 1

  return {
    ...stats,
    currentStreak: newStreak,
    longestStreak: Math.max(stats.longestStreak, newStreak),
    lastActiveDate: today,
  }
}

function checkAchievements(stats: GamificationStats): string[] {
  const unlocked = safeGet<string[]>(STORAGE_KEYS.achievements, [])
  const newUnlocks: string[] = []

  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) continue

    let current = 0
    if (ach.category === "scan") current = stats.totalScans
    else if (ach.category === "workout") current = stats.totalWorkouts
    else if (ach.category === "streak") current = stats.longestStreak
    else if (ach.category === "health") current = stats.totalWater

    if (current >= ach.requirement) {
      newUnlocks.push(ach.id)
    }
  }

  if (newUnlocks.length > 0) {
    safeSet(STORAGE_KEYS.achievements, [...unlocked, ...newUnlocks])
  }

  return newUnlocks
}

function dealBossDamage(type: string): { victory: boolean; xpEarned: number } {
  const state = getBossState()
  if (!state.battleStarted || state.bossHp <= 0) return { victory: false, xpEarned: 0 }

  const damage = TASK_DAMAGE[type] || 0
  const newHp = Math.max(0, state.bossHp - damage)
  const boss = BOSS_CONFIG[state.currentBossIndex]

  const newState: BossState = {
    ...state,
    bossHp: newHp,
  }

  if (newHp <= 0) {
    newState.battleHistory = [
      ...state.battleHistory,
      { bossName: boss.name, date: new Date().toISOString(), won: true, damageDealt: boss.maxHp },
    ]
    safeSet(STORAGE_KEYS.bossState, newState)

    const xp = getXp() + boss.xpReward
    safeSet(STORAGE_KEYS.xp, xp)

    return { victory: true, xpEarned: boss.xpReward }
  }

  safeSet(STORAGE_KEYS.bossState, newState)
  return { victory: false, xpEarned: 0 }
}

export interface GamificationResult {
  stats: GamificationStats
  newAchievements: string[]
  bossVictory: boolean
  bossXpEarned: number
  totalXp: number
  totalCoins: number
}

export function recordAction(type: "scan" | "workout" | "water" | "habit"): GamificationResult {
  let stats = getStats()
  stats = updateStreak(stats)

  if (type === "scan") stats.totalScans++
  else if (type === "workout") stats.totalWorkouts++
  else if (type === "water") stats.totalWater++
  else if (type === "habit") stats.totalHabits++

  safeSet(STORAGE_KEYS.stats, stats)

  const newAchievements = checkAchievements(stats)
  const achXp = newAchievements.reduce((sum, id) => {
    const ach = ACHIEVEMENTS.find(a => a.id === id)
    return sum + (ach?.xpReward || 0)
  }, 0)

  const { victory, xpEarned: bossXp } = dealBossDamage(type)

  const baseXp = type === "scan" ? 10 : type === "workout" ? 25 : type === "water" ? 5 : 10
  const totalNewXp = baseXp + achXp + bossXp
  const totalXp = getXp() + totalNewXp
  safeSet(STORAGE_KEYS.xp, totalXp)

  const coinReward = type === "scan" ? 5 : type === "workout" ? 15 : type === "water" ? 3 : 5
  const totalCoins = getCoins() + coinReward
  safeSet(STORAGE_KEYS.coins, totalCoins)

  return {
    stats,
    newAchievements,
    bossVictory: victory,
    bossXpEarned: bossXp,
    totalXp,
    totalCoins,
  }
}

export function advanceBoss(): void {
  const state = getBossState()
  const nextIndex = (state.currentBossIndex + 1) % BOSS_CONFIG.length
  safeSet(STORAGE_KEYS.bossState, {
    ...state,
    currentBossIndex: nextIndex,
    bossHp: BOSS_CONFIG[nextIndex].maxHp,
    battleStarted: false,
  })
}

export function startBossBattle(): void {
  const state = getBossState()
  safeSet(STORAGE_KEYS.bossState, {
    ...state,
    bossHp: BOSS_CONFIG[state.currentBossIndex].maxHp,
    battleStarted: true,
  })
}

export function getGamificationData() {
  return {
    stats: getStats(),
    bossState: getBossState(),
    xp: getXp(),
    coins: getCoins(),
    unlockedAchievements: safeGet<string[]>(STORAGE_KEYS.achievements, []),
  }
}
