"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, ScanLine, Dumbbell, Wheat, Zap, Trophy, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClanFeed } from "@/hooks/useClanFeed"
import { useTranslation } from "@/lib/i18n"

export function ClanFeed({ clanId }: { clanId: string }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { activities, isLoading } = useClanFeed(clanId)

  const activityIcons: Record<string, any> = {
    scan: ScanLine,
    workout: Dumbbell,
    diet: Wheat,
    streak: Zap,
    badge: Trophy,
  }

  const activityColors: Record<string, string> = {
    scan: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
    workout: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
    diet: "from-white/10 to-white/5 border-white/10",
    streak: "from-white/10 to-white/5 border-white/10",
    badge: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
  }

  const activityIconColors: Record<string, string> = {
    scan: "text-emerald-400",
    workout: "text-blue-400",
    diet: "text-foreground/60",
    streak: "text-foreground",
    badge: "text-purple-400",
  }

  const formatActivityText = (activity: any) => {
    const data = activity.activity_data
    const name = activity.profiles?.name || "User"

    switch (activity.activity_type) {
      case "scan":
        return `${name} ${isEnglish ? "scanned" : "escaneou"} ${data.productName || data.product_name || "—"}` 
      case "workout":
        return `${name} ${isEnglish ? "completed a workout" : "completou um treino"}${data.name ? `: ${data.name}` : ""}` 
      case "diet":
        return `${name} ${isEnglish ? "created a diet plan" : "criou um plano de dieta"}${data.name ? `: ${data.name}` : ""}` 
      case "streak":
        return `${name} ${isEnglish ? "reached" : "alcancou"} ${data.streak || data.days} ${isEnglish ? "day streak" : "dias seguidos"}` 
      case "badge":
        return `${name} ${isEnglish ? "earned the badge" : "ganhou a badge"} ${data.badgeName || data.badge_name || "🏅"}` 
      default:
        return `${name} ${isEnglish ? "did something" : "fez algo"}`
    }
  }

  const timeAgo = (dateStr: string) => {
    const now = Date.now()
    const diff = now - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return isEnglish ? "just now" : "agora"
    if (mins < 60) return `${mins}min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-8 text-center">
          <Activity className="mx-auto mb-3 h-10 w-10 text-foreground/15" />
          <p className="text-sm font-bold text-foreground/35">
            {isEnglish ? "No activity yet. Share your first scan!" : "Nenhuma atividade ainda. Compartilhe seu primeiro scan!"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity, i) => {
            const Icon = activityIcons[activity.activity_type] || Activity
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "rounded-[1.25rem] border bg-gradient-to-r p-4 backdrop-blur-xl",
                  activityColors[activity.activity_type] || "from-zinc-500/20 to-zinc-500/5 border-zinc-500/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl bg-black/30",
                    activityIconColors[activity.activity_type] || "text-zinc-400"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground leading-relaxed">
                      {formatActivityText(activity)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="h-3 w-3 text-foreground/25" />
                      <span className="text-[9px] font-bold text-foreground/25">
                        {timeAgo(activity.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
