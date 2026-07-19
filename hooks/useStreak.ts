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

  try {
    const dailyActivity = localStorage.getItem("dailyActivity")
    if (dailyActivity) {
      const activity = JSON.parse(dailyActivity)
      if (activity.scannedProducts) {
        activity.scannedProducts.forEach((p: any) => {
          if (p.scannedAt) activeDays.add(p.scannedAt.split("T")[0])
        })
      }
    }
  } catch (e) {
    logger.error("[useStreak] Failed to parse dailyActivity:", e)
  }

  try {
    const workouts = localStorage.getItem("generatedWorkouts")
    if (workouts) {
      const list = JSON.parse(workouts)
      if (Array.isArray(list)) {
        list.forEach((w: any) => {
          if (w.createdAt) activeDays.add(w.createdAt.split("T")[0])
        })
      }
    }
  } catch (e) {
    logger.error("[useStreak] Failed to parse generatedWorkouts:", e)
  }

  try {
    const diets = localStorage.getItem("generatedDiets")
    if (diets) {
      const list = JSON.parse(diets)
      if (Array.isArray(list)) {
        list.forEach((d: any) => {
          if (d.createdAt) activeDays.add(d.createdAt.split("T")[0])
        })
      }
    }
  } catch (e) {
    logger.error("[useStreak] Failed to parse generatedDiets:", e)
  }

  try {
    const scanHistory = localStorage.getItem("scanHistory")
    if (scanHistory) {
      const history = JSON.parse(scanHistory)
      if (Array.isArray(history)) {
        history.forEach((s: any) => {
          if (s.scannedAt) activeDays.add(s.scannedAt.split("T")[0])
        })
      }
    }
  } catch (e) {
    logger.error("[useStreak] Failed to parse scanHistory:", e)
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

    const interval = setInterval(recalculate, 5000)
    return () => clearInterval(interval)
  }, [recalculate])

  const weekActivity: DayActivity[] = useMemo(() => {
    const activeDays = collectActiveDays()
    const days: DayActivity[] = []
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateKey = getDateKey(d)
      const dayActivity = localStorage.getItem("dailyActivity")
      let hasScan = false
      let hasWorkout = false
      let hasDiet = false

      if (dayActivity) {
        const activity = JSON.parse(dayActivity)
        if (activity.scannedProducts) {
          hasScan = activity.scannedProducts.some((p: any) => p.scannedAt?.split("T")[0] === dateKey)
        }
      }

      try {
        const workouts = localStorage.getItem("generatedWorkouts")
        if (workouts) {
          const list = JSON.parse(workouts)
          hasWorkout = Array.isArray(list) && list.some((w: any) => w.createdAt?.split("T")[0] === dateKey)
        }
      } catch (e) {
        logger.error("[useStreak] Failed to parse workouts for week:", e)
      }

      try {
        const diets = localStorage.getItem("generatedDiets")
        if (diets) {
          const list = JSON.parse(diets)
          hasDiet = Array.isArray(list) && list.some((d: any) => d.createdAt?.split("T")[0] === dateKey)
        }
      } catch (e) {
        logger.error("[useStreak] Failed to parse diets for week:", e)
      }

      days.push({
        date: dateKey,
        hasScan,
        hasWorkout,
        hasDiet,
      })
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
