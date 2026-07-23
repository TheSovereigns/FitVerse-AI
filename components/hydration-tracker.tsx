"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { notifications } from "@/lib/notifications"
import { Droplets, Plus, Minus, Target, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { recordAction } from "@/lib/gamification"

interface HydrationEntry {
  date: string
  amount: number
  goal: number
}

export function HydrationTracker() {
  const { t } = useTranslation()
  const [todayEntry, setTodayEntry] = useLocalStorage<HydrationEntry | null>("fitverse-hydration-today", null)
  const [history, setHistory] = useLocalStorage<HydrationEntry[]>("fitverse-hydration-history", [])
  const [goal, setGoal] = useState(2.5)

  const today = format(new Date(), "yyyy-MM-dd")

  useEffect(() => {
    if (todayEntry && todayEntry.date !== today) {
      setHistory([todayEntry, ...history.slice(0, 29)])
      setTodayEntry({ date: today, amount: 0, goal })
    }
  }, [today, todayEntry, history, goal, setHistory, setTodayEntry])

  useEffect(() => {
    if (!todayEntry) {
      setTodayEntry({ date: today, amount: 0, goal })
    }
  }, [today, todayEntry, goal, setTodayEntry])

  const currentAmount = todayEntry?.amount || 0
  const percentage = Math.min((currentAmount / goal) * 100, 100)
  const isGoalMet = currentAmount >= goal

  const addWater = (amount: number) => {
    const newAmount = Math.max(0, currentAmount + amount)
    setTodayEntry({ date: today, amount: newAmount, goal })
    if (newAmount >= goal && !isGoalMet) {
      notifications.success("Meta de hidratação atingida!")
    }
    if (amount > 0) {
      const result = recordAction("water")
      if (result.bossVictory) {
        notifications.success("Boss defeated!")
      }
    }
  }

  const quickAdd = [0.25, 0.5, 1.0]

  const averageLast7 = history.length > 0
    ? (history.slice(0, 7).reduce((acc, h) => acc + h.amount, 0) / Math.min(history.length, 7)).toFixed(1)
    : "0"

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={440}
              initial={{ strokeDashoffset: 440 }}
              animate={{ strokeDashoffset: 440 - (percentage / 100) * 440 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-brand"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets className="w-6 h-6 text-brand mb-1" />
            <span className="text-2xl font-bold">{currentAmount.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">de {goal}L</span>
          </div>
        </div>

        {isGoalMet && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium"
          >
            <Target className="w-3 h-3" />
            Meta atingida!
          </motion.div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => addWater(-0.25)}
          disabled={currentAmount <= 0}
          className="rounded-xl w-12 h-12 p-0"
        >
          <Minus className="w-4 h-4" />
        </Button>
        {quickAdd.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="lg"
            onClick={() => addWater(amount)}
            className="rounded-xl"
          >
            +{amount}L
          </Button>
        ))}
        <Button
          size="lg"
          onClick={() => addWater(0.25)}
          className="rounded-xl w-12 h-12 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Média 7 dias</p>
            <p className="text-lg font-bold">{averageLast7}L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Dias seguidos</p>
            <p className="text-lg font-bold">
              {history.filter((h) => h.amount >= h.goal).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">Últimos 7 dias</p>
        <div className="flex items-end gap-1 h-16">
          {Array.from({ length: 7 }).map((_, i) => {
            const dayIndex = 6 - i
            const entry = history[dayIndex]
            const height = entry ? (entry.amount / goal) * 100 : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-muted rounded-sm overflow-hidden" style={{ height: "100%" }}>
                  <motion.div
                    className={cn("w-full rounded-sm", entry && entry.amount >= entry.goal ? "bg-brand" : "bg-muted-foreground/30")}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(height, 100)}%` }}
                    transition={{ delay: i * 0.05 }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">
                  {format(new Date(Date.now() - dayIndex * 86400000), "EEE")}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
