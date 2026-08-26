"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { notifications } from "@/lib/notifications"
import { Droplets, Plus, Minus, Target, Pencil, X } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { recordAction } from "@/lib/gamification"

interface HydrationEntry {
  date: string
  amount: number
  goal: number
}

const quickAdd = [
  { amount: 0.25, label: "250ml", icon: "🥛" },
  { amount: 0.5, label: "500ml", icon: "🍶" },
  { amount: 1.0, label: "1L", icon: "💧" },
]

export function HydrationTracker() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [todayEntry, setTodayEntry] = useLocalStorage<HydrationEntry | null>("fitverse-hydration-today", null)
  const [history, setHistory] = useLocalStorage<HydrationEntry[]>("fitverse-hydration-history", [])
  const [savedGoal, setSavedGoal] = useLocalStorage<number>("fitverse-water-goal", 2.5)
  const [goal, setGoal] = useState(savedGoal)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState(savedGoal.toString())

  const today = format(new Date(), "yyyy-MM-dd")

  useEffect(() => {
    setGoal(savedGoal)
  }, [savedGoal])

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
      notifications.success(t("hyd_goal_achieved"))
    }
    if (amount > 0) {
      recordAction("water")
    }
  }

  const saveGoal = () => {
    const parsed = parseFloat(goalInput)
    if (!isNaN(parsed) && parsed > 0 && parsed <= 10) {
      setSavedGoal(parsed)
      setGoal(parsed)
      setEditingGoal(false)
      notifications.success(t("hyd_goal_toast"))
    }
  }

  const averageLast7 = useMemo(() => {
    if (history.length === 0) return "0"
    return (history.slice(0, 7).reduce((acc, h) => acc + h.amount, 0) / Math.min(history.length, 7)).toFixed(1)
  }, [history])

  const streakDays = useMemo(() => {
    return history.filter((h) => h.amount >= h.goal).length
  }, [history])

  const weekData = useMemo(() => {
    const dayLabels = [t("hyd_day_mon"), t("hyd_day_tue"), t("hyd_day_wed"), t("hyd_day_thu"), t("hyd_day_fri"), t("hyd_day_sat"), t("hyd_day_sun")]
    const days: { name: string; amount: number; goal: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = format(d, "yyyy-MM-dd")
      const entry = history.find((h) => h.date === key)
      days.push({
        name: dayLabels[(d.getDay() + 6) % 7]!,
        amount: entry?.amount || 0,
        goal: entry?.goal || goal,
      })
    }
    return days
  }, [history, goal, locale])

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="64"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="64"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={402}
              initial={{ strokeDashoffset: 402 }}
              animate={{ strokeDashoffset: 402 - (percentage / 100) * 402 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-brand"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets className="w-6 h-6 text-brand mb-1" />
            <span className="text-2xl font-bold">{currentAmount.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">{t("hyd_goal_of")} {goal}{t("hyd_liters_short")}</span>
            <span className={cn("text-xs font-semibold text-brand mt-0.5", isGoalMet && "animate-bounce-in")}>{Math.round(percentage)}%</span>
          </div>
        </div>

        <AnimatePresence>
          {isGoalMet && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium"
            >
              <Target className="w-3 h-3" />
              {t("hyd_goal_achieved")}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {quickAdd.map((preset) => (
          <motion.button
            key={preset.amount}
            whileTap={{ scale: 0.95 }}
            onClick={() => addWater(preset.amount)}
            className={cn(
              "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all",
              "bg-brand-muted border-brand/20 hover:bg-brand/10 active:bg-brand/20"
            )}
          >
            <span className="text-xl">{preset.icon}</span>
            <span className="text-sm font-bold text-foreground">{preset.label}</span>
          </motion.button>
        ))}
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
        <Button
          variant="outline"
          size="lg"
          onClick={() => setEditingGoal(true)}
          className="rounded-xl gap-1.5 px-3"
        >
          <Pencil className="w-3 h-3" />
          <span className="text-xs">{t("hyd_edit_goal")}</span>
        </Button>
        <Button
          size="lg"
          onClick={() => addWater(0.25)}
          className="rounded-xl w-12 h-12 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <AnimatePresence>
        {editingGoal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{t("hyd_liters")}:</span>
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.1"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveGoal()}
                className="flex-1 h-11 text-sm bg-muted border border-border rounded-xl px-3 text-foreground"
                autoFocus
              />
              <Button size="sm" onClick={saveGoal} className="h-8 px-3 rounded-lg text-xs">
                {t("hyd_save_goal")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingGoal(false); setGoalInput(goal.toString()) }} className="h-8 w-8 p-0 rounded-lg">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl glass-strong p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("hyd_avg_7d")}</p>
          <p className="text-lg font-bold">{averageLast7}{t("hyd_liters_short")}</p>
        </div>
        <div className="rounded-2xl glass-strong p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("hyd_streak")}</p>
          <p className="text-lg font-bold">{streakDays}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">{t("hyd_weekly_chart")}</p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, "auto"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={25} />
              <Tooltip
                contentStyle={{ background: "hsl(0 0% 6%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}${t("hyd_liters_short")}`, t("hyd_intake")]}
              />
              <Bar dataKey="amount" fill="hsl(var(--brand))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
