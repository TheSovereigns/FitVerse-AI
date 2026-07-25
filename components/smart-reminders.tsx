"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Bell, Droplets, Moon, Dumbbell, Heart, CheckCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { addHours, addMinutes, setHours, setMinutes, isBefore, format } from "date-fns"

interface ReminderSettings {
  water: boolean
  sleep: boolean
  checkin: boolean
  workout: boolean
  motivation: boolean
}

interface SleepEntry {
  bedtime: string
}

const MOTIVATIONAL_PHRASES_PT = [
  "Cada gota conta. Você está mais perto da sua meta!",
  "Seu corpo é capaz. Acredite no processo.",
  "Disciplina é a ponte entre seus objetivos e realizações.",
  "Hoje é um ótimo dia para ser melhor do que ontem.",
  "Pequenos passos todos os dias levam a grandes resultados.",
  "Você não para até ser grande. E depois, você continua.",
  "A dor que você sente hoje é a força que você sentirá amanhã.",
  "Não espere motivação. Crie o hábito.",
]

const MOTIVATIONAL_PHRASES_EN = [
  "Every drop counts. You're closer to your goal!",
  "Your body is capable. Trust the process.",
  "Discipline is the bridge between goals and accomplishments.",
  "Today is a great day to be better than yesterday.",
  "Small steps every day lead to big results.",
  "You don't stop when you're great. You keep going.",
  "The pain you feel today is the strength you feel tomorrow.",
  "Don't wait for motivation. Build the habit.",
]

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function getNextWaterTime(): Date {
  const now = new Date()
  const hour = now.getHours()
  const lastWaterReminder = safeGet<number>("fitverse-last-water-reminder", 0)
  const lastDate = new Date(lastWaterReminder)

  if (lastWaterReminder && lastDate.toDateString() === now.toDateString()) {
    const next = addHours(lastDate, 2)
    if (isBefore(now, next)) return next
  }

  const nextHour = Math.max(hour + 1, 7)
  if (nextHour > 21) {
    const tomorrow = addDays(now, 1)
    return setMinutes(setHours(tomorrow, 7), 0)
  }
  return setMinutes(setHours(now, nextHour), 0)
}

function getNextSleepTime(): Date {
  const now = new Date()
  const entries = safeGet<SleepEntry[]>("sleepTrackerData", [])
  let avgBedtimeHour = 23
  let avgBedtimeMinute = 0

  if (entries.length > 0) {
    let totalMinutes = 0
    entries.forEach((e) => {
      const [h, m] = e.bedtime.split(":").map(Number)
      totalMinutes += (h ?? 23) * 60 + (m ?? 0)
    })
    const avgMinutes = Math.round(totalMinutes / entries.length)
    avgBedtimeHour = Math.floor(avgMinutes / 60) % 24
    avgBedtimeMinute = avgMinutes % 60
  }

  const todayAtBedtime = setMinutes(setHours(now, avgBedtimeHour), avgBedtimeMinute)
  const thirtyMinBefore = addMinutes(todayAtBedtime, -30)

  if (isBefore(now, thirtyMinBefore)) return thirtyMinBefore

  const tomorrow = addDays(now, 1)
  return setMinutes(setHours(tomorrow, avgBedtimeHour), avgBedtimeMinute) 
}

function getNextCheckinTime(): Date {
  const now = new Date()
  const today = format(now, "yyyy-MM-dd")
  const checkedToday = safeGet<boolean>(`fitverse-checkin-${today}`, false)
  if (!checkedToday) return setMinutes(setHours(now, 9), 0)
  const tomorrow = addDays(now, 1)
  return setMinutes(setHours(tomorrow, 9), 0)
}

function getNextWorkoutTime(): Date {
  const now = new Date()
  const workouts = safeGet<string[]>("generatedWorkouts", [])
  if (workouts.length === 0) return addDays(now, 7)
  return setMinutes(setHours(now, 17), 0)
}

function getNextMotivationTime(): Date {
  const now = new Date()
  return setMinutes(setHours(addDays(now, 1), 8), 0)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatNextTime(date: Date, isEnglish: boolean): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMin = Math.max(0, Math.round(diffMs / 60000))

  if (diffMin < 60) {
    return isEnglish ? `in ${diffMin}m` : `em ${diffMin}m`
  }

  const diffH = Math.floor(diffMin / 60)
  const remainM = diffMin % 60

  if (diffH < 24) {
    return isEnglish
      ? `in ${diffH}h ${remainM}m`
      : `em ${diffH}h ${remainM}m`
  }

  const diffD = Math.floor(diffH / 24)
  return isEnglish ? `in ${diffD}d` : `em ${diffD}d`
}

export function SmartReminders() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const [settings, setSettings] = useLocalStorage<ReminderSettings>("fitverse-reminder-settings", {
    water: true,
    sleep: true,
    checkin: true,
    workout: true,
    motivation: true,
  })

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const nextTimes = useMemo(() => ({
    water: getNextWaterTime(),
    sleep: getNextSleepTime(),
    checkin: getNextCheckinTime(),
    workout: getNextWorkoutTime(),
    motivation: getNextMotivationTime(),
  }), [now])

  const toggleReminder = (key: keyof ReminderSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const motivationalPhrase = useMemo(() => {
    const phrases = isEnglish ? MOTIVATIONAL_PHRASES_EN : MOTIVATIONAL_PHRASES_PT
    const index = Math.floor(Math.random() * phrases.length)
    return phrases[index]
  }, [isEnglish, now])

  const reminders = [
    {
      key: "water" as const,
      icon: Droplets,
      title: t("sr_water"),
      desc: t("sr_water_desc"),
      color: "text-cyan-400",
      next: nextTimes.water,
      active: settings.water,
    },
    {
      key: "sleep" as const,
      icon: Moon,
      title: t("sr_sleep"),
      desc: t("sr_sleep_desc"),
      color: "text-indigo-400",
      next: nextTimes.sleep,
      active: settings.sleep,
    },
    {
      key: "checkin" as const,
      icon: CheckCircle,
      title: t("sr_checkin"),
      desc: t("sr_checkin_desc"),
      color: "text-green-400",
      next: nextTimes.checkin,
      active: settings.checkin,
    },
    {
      key: "workout" as const,
      icon: Dumbbell,
      title: t("sr_workout"),
      desc: t("sr_workout_desc"),
      color: "text-orange-400",
      next: nextTimes.workout,
      active: settings.workout,
    },
    {
      key: "motivation" as const,
      icon: Heart,
      title: t("sr_motivation"),
      desc: t("sr_motivation_desc"),
      color: "text-pink-400",
      next: nextTimes.motivation,
      active: settings.motivation,
    },
  ]

  return (
    <div className="glass-strong border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-5 h-5 text-brand" />
        <h2 className="text-lg font-semibold text-foreground">{t("sr_title")}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">{t("sr_subtitle")}</p>

      <div className="space-y-3">
        {reminders.map((r, i) => {
          const Icon = r.icon
          return (
            <motion.div
              key={r.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                r.active
                  ? "bg-background/50 border-border"
                  : "bg-background/20 border-border/50 opacity-60"
              )}
            >
              <div className={cn("shrink-0", r.color)}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{r.title}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{r.desc}</p>
                {r.active && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("sr_next")} {formatNextTime(r.next, isEnglish)}
                  </p>
                )}
              </div>

              <Switch
                checked={r.active}
                onCheckedChange={() => toggleReminder(r.key)}
                aria-label={r.title}
              />
            </motion.div>
          )
        })}
      </div>

      {settings.motivation && (
        <motion.div
          key={motivationalPhrase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 rounded-xl bg-brand/10 border border-brand/20"
        >
          <p className="text-sm text-brand font-medium text-center italic">
            &ldquo;{motivationalPhrase}&rdquo;
          </p>
        </motion.div>
      )}
    </div>
  )
}
