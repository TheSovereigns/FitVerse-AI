"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Droplet, Plus, Minus, TrendingUp } from "lucide-react"
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
      if (existing >= 0) {
        data[existing].cups = newCups
      } else {
        data.push({ date: today, cups: newCups })
      }
      const cleaned = data.filter((d) => {
        const diff = Date.now() - new Date(d.date).getTime()
        return diff < 30 * 24 * 60 * 60 * 1000
      })
      localStorage.setItem("hydrationData", JSON.stringify(cleaned))
    } catch {}
  }, [])

  const increment = () => {
    const next = cups + 1
    setCups(next)
    saveCups(next)
    setWeeklyData((prev) => {
      const updated = [...prev]
      updated[updated.length - 1] = next
      return updated
    })
  }

  const decrement = () => {
    if (cups <= 0) return
    const next = cups - 1
    setCups(next)
    saveCups(next)
    setWeeklyData((prev) => {
      const updated = [...prev]
      updated[updated.length - 1] = next
      return updated
    })
  }

  const ml = cups * GLASS_ML
  const goalMl = GOAL_LITERS * 1000
  const progress = Math.min((ml / goalMl) * 100, 100)
  const maxWeek = Math.max(...weeklyData, 1)
  const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[1.5rem] border border-blue-500/14 bg-[#090704]/70 backdrop-blur-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/6 via-transparent to-cyan-500/4" />

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20">
              <Droplet className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">
                {isEnglish ? "Hydration" : "Hidratacao"}
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-orange-100/30">
                {ml}ml / {goalMl}ml
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-blue-400">{(ml / 1000).toFixed(1)}L</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="h-2 bg-blue-950/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-bold text-orange-100/25">0ml</span>
            <span className="text-[9px] font-bold text-blue-400/60">{Math.round(progress)}%</span>
            <span className="text-[9px] font-bold text-orange-100/25">{goalMl}ml</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            onClick={decrement}
            disabled={cups <= 0}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl border border-blue-500/14 bg-blue-500/8 text-blue-400 hover:bg-blue-500/16 disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "h-5 w-3 rounded-sm transition-all",
                  i < cups
                    ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]"
                    : "bg-blue-950/40"
                )}
                animate={i < cups ? { scale: [1, 1.15, 1] } : {}}
                transition={{ delay: i * 0.02 }}
              />
            ))}
          </div>
          <Button
            onClick={increment}
            disabled={cups >= 12}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl border border-blue-500/14 bg-blue-500/8 text-blue-400 hover:bg-blue-500/16 disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-orange-100/30 mb-2">
            {isEnglish ? "This week" : "Esta semana"}
          </p>
          <div className="flex items-end justify-between gap-1 h-12">
            {weeklyData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-blue-950/30 rounded-t-sm relative overflow-hidden flex-1 min-h-[2px]">
                  <motion.div
                    className="absolute bottom-0 w-full rounded-t-sm bg-blue-400/60"
                    initial={{ height: 0 }}
                    animate={{ height: `${(val / maxWeek) * 100}%` }}
                    transition={{ delay: i * 0.05 }}
                  />
                </div>
                <span className="text-[8px] font-bold text-orange-100/25">
                  {dayNames[(new Date().getDay() - 6 + i + 7) % 7]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
