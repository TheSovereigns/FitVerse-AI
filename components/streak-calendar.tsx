"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Flame, Trophy, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { useTranslation } from "@/lib/i18n"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isAfter,
  startOfDay,
} from "date-fns"
import { ptBR, enUS } from "date-fns/locale"

const LEVEL_THRESHOLDS = { light: 1, medium: 3, heavy: 5, full: 8 } as const

function getLevel(count: number): "none" | "light" | "medium" | "heavy" | "full" {
  if (count === 0) return "none"
  if (count < LEVEL_THRESHOLDS.medium) return "light"
  if (count < LEVEL_THRESHOLDS.heavy) return "medium"
  if (count < LEVEL_THRESHOLDS.full) return "heavy"
  return "full"
}

const LEVEL_CLASSES: Record<string, string> = {
  none: "bg-muted/30 border-border/30",
  light: "bg-muted border-border/50",
  medium: "bg-primary/20 border-primary/30",
  heavy: "bg-primary/50 border-primary/60",
  full: "bg-primary border-primary",
}

export function StreakCalendar() {
  const { t, locale } = useTranslation()
  const today = useMemo(() => startOfDay(new Date()), [])
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  const stats = useMemo(() => {
    try {
      const raw = localStorage.getItem("fitverse-gamification-stats")
      if (!raw) return null
      return JSON.parse(raw) as {
        currentStreak: number
        longestStreak: number
        lastActiveDate: string | null
      }
    } catch (e) {
      logger.error("[StreakCalendar] Failed to read stats", e)
      return null
    }
  }, [])

  const activityMap = useMemo(() => {
    const map = new Map<string, number>()
    try {
      const raw = localStorage.getItem("fitverse-scan-history")
      if (!raw) return map
      const items = JSON.parse(raw) as Array<{ scannedAt?: string }>
      for (const item of items) {
        if (!item.scannedAt) continue
        const key = item.scannedAt.split("T")[0]
        map.set(key, (map.get(key) ?? 0) + 1)
      }
    } catch (e) {
      logger.error("[StreakCalendar] Failed to read scan history", e)
    }

    try {
      const raw = localStorage.getItem("fitverse-gamification-stats")
      if (!raw) return map
      const parsed = JSON.parse(raw)
      if (parsed.lastActiveDate) {
        const key = (parsed.lastActiveDate as string).split("T")[0]
        map.set(key, (map.get(key) ?? 0) + 1)
      }
    } catch {
      // ignore
    }

    return map
  }, [])

  const totalActiveDays = useMemo(() => activityMap.size, [activityMap])

  const months = useMemo(() => {
    const now = new Date()
    const result: { label: string; days: { date: Date; key: string; count: number; level: string }[] }[] = []

    for (let m = 2; m >= 0; m--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)

      const clampedStart = isAfter(monthStart, now) ? now : monthStart
      const clampedEnd = isAfter(monthEnd, now) ? now : monthEnd

      const days = eachDayOfInterval({ start: clampedStart, end: clampedEnd }).map((d) => {
        const key = format(d, "yyyy-MM-dd")
        const count = activityMap.get(key) ?? 0
        return { date: d, key, count, level: getLevel(count) }
      })

      result.push({
        label: format(monthDate, "MMM", { locale: locale === "pt-BR" ? ptBR : enUS }),
        days,
      })
    }
    return result
  }, [activityMap, today, locale])

  const currentStreak = stats?.currentStreak ?? 0
  const longestStreak = stats?.longestStreak ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-strong border border-border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {t("streak_calendar_title") || "Calendário de Sequência"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t("streak_calendar_subtitle") || "Últimos 3 meses"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[LEVEL_THRESHOLDS.light, LEVEL_THRESHOLDS.medium, LEVEL_THRESHOLDS.heavy, LEVEL_THRESHOLDS.full].map((thresh, i) => (
            <div
              key={thresh}
              className={cn("h-2.5 w-2.5 rounded-sm border", LEVEL_CLASSES[getLevel(thresh)])}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {months.map((month) => (
          <div key={month.label} className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 pl-0.5">
              {month.label}
            </span>
            <div className="grid grid-cols-1 gap-1">
              {month.days.map((day) => (
                <motion.div
                  key={day.key}
                  className={cn(
                    "relative h-3.5 rounded-sm border cursor-default transition-colors",
                    LEVEL_CLASSES[day.level]
                  )}
                  onHoverStart={() => setHoveredDay(day.key)}
                  onHoverEnd={() => setHoveredDay(null)}
                  whileHover={{ scale: 1.15, zIndex: 10 }}
                >
                  {hoveredDay === day.key && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover border border-border px-2 py-1 text-[10px] font-medium text-foreground shadow-lg z-20 pointer-events-none"
                    >
                      {format(day.date, "dd MMM", { locale: locale === "pt-BR" ? ptBR : enUS })}
                      {day.count > 0 && (
                        <span className="ml-1 text-primary">· {day.count}</span>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-orange-500" />
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-foreground">{currentStreak}</span>
            <span className="text-[10px] text-muted-foreground">
              {currentStreak === 1
                ? (t("streak_calendar_day") || "dia")
                : (t("streak_calendar_days") || "dias")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-foreground">{longestStreak}</span>
            <span className="text-[10px] text-muted-foreground">
              {t("streak_calendar_best") || "recorde"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-foreground">{totalActiveDays}</span>
            <span className="text-[10px] text-muted-foreground">
              {t("streak_calendar_active") || "ativos"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
