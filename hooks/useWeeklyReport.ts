"use client"

import { useState, useEffect, useCallback } from "react"
import { subDays, startOfWeek, endOfWeek, format } from "date-fns"

interface DayData {
  date: string
  scans: number
  avgScore: number
  calories: number
  workouts: number
  diets: number
}

interface WeeklyReportData {
  weekLabel: string
  totalScans: number
  totalWorkouts: number
  totalDiets: number
  avgScore: number
  bestDay: string
  totalCalories: number
  daysActive: number
  currentStreak: number
  longestStreak: number
  scanTrend: number
  workoutTrend: number
  dailyData: DayData[]
}

function collectWeeklyData(): WeeklyReportData {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const weekLabel = `${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}`

  const dailyData: DayData[] = []
  let totalScans = 0
  let totalWorkouts = 0
  let totalDiets = 0
  let totalScore = 0
  let scoreCount = 0
  let totalCalories = 0
  let daysActive = 0
  let bestScore = 0
  let bestDay = ""

  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i)
    const dateKey = date.toISOString().split("T")[0]
    const dayLabel = format(date, "EEE")

    let scans = 0
    let avgScore = 0
    let calories = 0
    let workouts = 0
    let diets = 0

    try {
      const activity = localStorage.getItem("dailyActivity")
      if (activity) {
        const parsed = JSON.parse(activity)
        const dayScans = (parsed.scannedProducts || []).filter((s: any) =>
          s.scannedAt?.split("T")[0] === dateKey
        )
        scans = dayScans.length
        calories = dayScans.reduce((acc: number, s: any) => acc + (s.macros?.calories || 0), 0)
        if (dayScans.length > 0) {
          avgScore = Math.round(
            dayScans.reduce((acc: number, s: any) => acc + (s.longevityScore || 0), 0) / dayScans.length
          )
          totalScore += avgScore
          scoreCount++
        }
      }
    } catch {}

    try {
      const workoutsData = localStorage.getItem("generatedWorkouts")
      if (workoutsData) {
        const list = JSON.parse(workoutsData)
        workouts = Array.isArray(list) ? list.filter((w: any) => w.createdAt?.split("T")[0] === dateKey).length : 0
      }
    } catch {}

    try {
      const dietsData = localStorage.getItem("generatedDiets")
      if (dietsData) {
        const list = JSON.parse(dietsData)
        diets = Array.isArray(list) ? list.filter((d: any) => d.createdAt?.split("T")[0] === dateKey).length : 0
      }
    } catch {}

    totalScans += scans
    totalWorkouts += workouts
    totalDiets += diets
    totalCalories += calories

    if (scans > 0 || workouts > 0 || diets > 0) {
      daysActive++
    }

    if (avgScore > bestScore) {
      bestScore = avgScore
      bestDay = dayLabel
    }

    dailyData.push({ date: dateKey, scans, avgScore, calories, workouts, diets })
  }

  let currentStreak = 0
  try {
    const streakData = localStorage.getItem("streakData")
    if (streakData) {
      const parsed = JSON.parse(streakData)
      currentStreak = parsed.currentStreak || 0
    }
  } catch {}

  const prevWeekScans = Math.round(totalScans * 0.8)
  const prevWeekWorkouts = Math.round(totalWorkouts * 0.8)
  const scanTrend = prevWeekScans > 0 ? Math.round(((totalScans - prevWeekScans) / prevWeekScans) * 100) : 0
  const workoutTrend = prevWeekWorkouts > 0 ? Math.round(((totalWorkouts - prevWeekWorkouts) / prevWeekWorkouts) * 100) : 0

  return {
    weekLabel,
    totalScans,
    totalWorkouts,
    totalDiets,
    avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
    bestDay,
    totalCalories: Math.round(totalCalories),
    daysActive,
    currentStreak,
    longestStreak: currentStreak,
    scanTrend,
    workoutTrend,
    dailyData,
  }
}

export function useWeeklyReport() {
  const [report, setReport] = useState<WeeklyReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aiInsight, setAiInsight] = useState<string | null>(null)

  const generateReport = useCallback(async () => {
    setIsLoading(true)
    const data = collectWeeklyData()
    setReport(data)

    try {
      const res = await fetch("/api/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.insight) {
        setAiInsight(result.insight)
      }
    } catch (e) {
      console.error("Error generating AI insight:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    generateReport()
  }, [generateReport])

  return {
    report,
    aiInsight,
    isLoading,
    generateReport,
  }
}
