"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Droplet, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

const GLASS_ML = 250
const GOAL_LITERS = 3

interface HydrationData {
  date: string
  cups: number
}

export function HydrationTracker() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [cups, setCups] = useState(0)
  const [weeklyData, setWeeklyData] = useState<number[]>([])

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    try {
      const saved = localStorage.getItem("hydrationData")
      if (saved) {
        const data: HydrationData[] = JSON.parse(saved)
        const todayData = data.find((d) => d.date === today)
        if (todayData) setCups(todayData.cups)

        const week: number[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = d.toISOString().split("T")[0]
          const found = data.find((x) => x.date === key)
          week.push(found?.cups || 0)
        }
        setWeeklyData(week)
      }
    } catch {}
  }, [])

  const saveCups = useCallback((newCups: number) => {
    const today = new Date().toISOString().split("T")[0]
    try {
      const saved = localStorage.getItem("hydrationData")
      const data: HydrationData[] = saved ? JSON.parse(saved) : []
      const existing = data.findIndex((d) => d.date === today)
      if (existing >= 0) data[existing].cups = newCups
      else data.push({ date: today, cups: newCups })
      const cleaned = data.filter((d) => Date.now() - new Date(d.date).getTime() < 30 * 24 * 60 * 60 * 1000)
      localStorage.setItem("hydrationData", JSON.stringify(cleaned))
    } catch {}
  }, [])

  const increment = () => {
    const next = cups + 1
    setCups(next)
    saveCups(next)
    setWeeklyData((prev) => { const u = [...prev]; u[u.length - 1] = next; return u })
  }

  const decrement = () => {
    if (cups <= 0) return
    const next = cups - 1
    setCups(next)
    saveCups(next)
    setWeeklyData((prev) => { const u = [...prev]; u[u.length - 1] = next; return u })
  }

  const ml = cups * GLASS_ML
  const goalMl = GOAL_LITERS * 1000
  const progress = Math.min((ml / goalMl) * 100, 100)
  const maxWeek = Math.max(...weeklyData, 1)
  const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
            <Droplet className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isEnglish ? "Hydration" : "Hidratacao"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {ml}ml / {goalMl}ml
            </p>
          </div>
        </div>
        <p className="text-xl font-bold text-foreground">{(ml / 1000).toFixed(1)}L</p>
      </div>

      <div className="mb-4">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">0ml</span>
          <span className="text-[10px] font-medium text-blue-500">{Math.round(progress)}%</span>
          <span className="text-[10px] text-muted-foreground">{goalMl}ml</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <Button onClick={decrement} disabled={cups <= 0} variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border">
          <Minus className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={cn("h-4 w-2.5 rounded-sm transition-all", i < cups ? "bg-blue-500" : "bg-muted")} />
          ))}
        </div>
        <Button onClick={increment} disabled={cups >= 12} variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          {isEnglish ? "This week" : "Esta semana"}
        </p>
        <div className="flex items-end justify-between gap-1 h-10">
          {weeklyData.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-muted rounded-t-sm relative overflow-hidden flex-1 min-h-[2px]">
                <motion.div
                  className="absolute bottom-0 w-full rounded-t-sm bg-blue-500/60"
                  initial={{ height: 0 }}
                  animate={{ height: `${(val / maxWeek) * 100}%` }}
                  transition={{ delay: i * 0.04 }}
                />
              </div>
              <span className="text-[8px] text-muted-foreground">
                {dayNames[(new Date().getDay() - 6 + i + 7) % 7]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
