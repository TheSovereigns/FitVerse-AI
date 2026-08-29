"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { logger } from "@/lib/logger"

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  activeDays: string[]
}

interface DayActivity {
  date: string
  hasScan: boolean
  hasWorkout: boolean
  hasDiet: boolean
}

function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0]!
}

function getTodayKey(): string {
  return getDateKey(new Date())
}

function getDayOffset(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return getDateKey(d)
}

function loadStreakData(): StreakData {
  try {
    const saved = localStorage.getItem("streakData")
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    logger.error("[useStreak] Failed to parse streakData:", e)
  }
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    activeDays: [],
  }
}

function saveStreakData(data: StreakData) {
  localStorage.setItem("streakData", JSON.stringify(data))
}

function collectActiveDays(): Set<string> {
  const activeDays = new Set<string>()

  // Read from Zustand store (fitverse-app-store)
  try {
    const storeRaw = localStorage.getItem("fitverse-app-store")
    if (storeRaw) {
      const store = JSON.parse(storeRaw)
      const state = store.state || store

      // Daily activity scanned products
      if (state.dailyActivity?.scannedProducts) {
        state.dailyActivity.scannedProducts.forEach((p: any) => {
          if (p.scannedAt) activeDays.add(p.scannedAt.split("T")[0])
        })
      }

      // Scan history
      if (Array.isArray(state.scanHistory)) {
        state.scanHistory.forEach((s: any) => {
          if (s.scannedAt) activeDays.add(s.scannedAt.split("T")[0])
        })
      }
    }
  } catch (e) {
    logger.error("[useStreak] Failed to parse fitverse-app-store:", e)
  }

  // Read workouts from nutritrain-workouts
  try {
    const workouts = localStorage.getItem("nutritrain-workouts")
    if (workouts) {
      const list = JSON.parse(workouts)
      if (Array.isArray(list)) {
        list.forEach((w: any) => {
          if (w.createdAt) activeDays.add(w.createdAt.split("T")[0])
        })
      }
    }
  } catch (e) {
    logger.error("[useStreak] Failed to parse nutritrain-workouts:", e)
  }

  return activeDays
}

function calculateStreak(activeDays: Set<string>): { currentStreak: number; longestStreak: number } {
  const sorted = Array.from(activeDays).sort().reverse()
  if (sorted.length === 0) return { currentStreak: 0, longestStreak: 0 }

  const today = getTodayKey()
  const yesterday = getDayOffset(-1)

  let currentStreak = 0

  if (sorted.includes(today)) {
    let checkDate = new Date(today)
    while (activeDays.has(getDateKey(checkDate))) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  } else if (sorted.includes(yesterday)) {
    let checkDate = new Date(yesterday)
    while (activeDays.has(getDateKey(checkDate))) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  let longestStreak = 0
  let tempStreak = 0
  const allDates = Array.from(activeDays).sort()

  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      tempStreak = 1
    } else {
      const prev = new Date(allDates[i - 1]!)
      const curr = new Date(allDates[i]!)
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        tempStreak++
      } else {
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)
  }

  return { currentStreak, longestStreak }
}

export function useStreak() {
  const [streakData, setStreakData] = useState<StreakData>(loadStreakData)
  const [hasActivityToday, setHasActivityToday] = useState(false)

  const recalculate = useCallback(() => {
    const activeDays = collectActiveDays()
    const { currentStreak, longestStreak } = calculateStreak(activeDays)
    const today = getTodayKey()

    const updated: StreakData = {
      currentStreak,
      longestStreak,
      lastActiveDate: currentStreak > 0 ? today : streakData.lastActiveDate,
      activeDays: Array.from(activeDays).sort(),
    }

    saveStreakData(updated)
    setStreakData(updated)
    setHasActivityToday(activeDays.has(today))
  }, [])

  useEffect(() => {
    recalculate()

    const onVisible = () => {
      if (document.visibilityState === 'visible') recalculate()
    }
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === 'fitverse-app-store' ||
        e.key === 'nutritrain-workouts' ||
        e.key === 'streakData' ||
        e.key === null
      ) {
        recalculate()
      }
    }

    const interval = setInterval(() => {
      if (document.hidden) return
      recalculate()
    }, 60000)

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('storage', onStorage)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('storage', onStorage)
    }
  }, [recalculate])

  const weekActivity: DayActivity[] = useMemo(() => {
    const days: DayActivity[] = []

    // Parse store once outside the loop
    let storeState: any = null
    try {
      const storeRaw = localStorage.getItem("fitverse-app-store")
      if (storeRaw) {
        const store = JSON.parse(storeRaw)
        storeState = store.state || store
      }
    } catch (e) { /* ignore */ }

    let workoutList: any[] = []
    try {
      const workouts = localStorage.getItem("nutritrain-workouts")
      if (workouts) workoutList = JSON.parse(workouts)
    } catch (e) { /* ignore */ }

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateKey = getDateKey(d)
      let hasScan = false
      let hasWorkout = false

      if (storeState?.dailyActivity?.scannedProducts) {
        hasScan = storeState.dailyActivity.scannedProducts.some((p: any) => p.scannedAt?.split("T")[0] === dateKey)
      }
      if (!hasScan && Array.isArray(storeState?.scanHistory)) {
        hasScan = storeState.scanHistory.some((s: any) => s.scannedAt?.split("T")[0] === dateKey)
      }

      hasWorkout = Array.isArray(workoutList) && workoutList.some((w: any) => w.createdAt?.split("T")[0] === dateKey)

      days.push({ date: dateKey, hasScan, hasWorkout, hasDiet: false })
    }

    return days
  }, [streakData])

  return {
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    hasActivityToday,
    weekActivity,
    recalculate,
  }
}
