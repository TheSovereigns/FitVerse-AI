"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, ScanLine, Dumbbell, Wheat, Zap, Trophy, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClanFeed } from "@/hooks/useClanFeed"
import { useTranslation } from "@/lib/i18n"

export function ClanFeed({ clanId }: { clanId: string }) {
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { activities, isLoading } = useClanFeed(clanId)

  const activityIcons: Record<string, any> = { scan: ScanLine, workout: Dumbbell, diet: Wheat, streak: Zap, badge: Trophy }
  const activityIconColors: Record<string, string> = {
    scan: "text-brand", workout: "text-blue-400", diet: "text-white/40", streak: "text-yellow-400", badge: "text-purple-400",
  }

  const formatActivityText = (activity: any) => {
    const data = activity.activity_data; const name = activity.profiles?.name || "User"
    switch (activity.activity_type) {
      case "scan": return `${name} ${isEnglish ? "scanned" : "escaneou"} ${data.productName || data.product_name || "—"}`
      case "workout": return `${name} ${isEnglish ? "completed a workout" : "completou um treino"}${data.name ? `: ${data.name}` : ""}`
      case "diet": return `${name} ${isEnglish ? "created a diet plan" : "criou um plano de dieta"}${data.name ? `: ${data.name}` : ""}`
      case "streak": return `${name} ${isEnglish ? "reached" : "alcancou"} ${data.streak || data.days} ${isEnglish ? "day streak" : "dias seguidos"}`
      case "badge": return `${name} ${isEnglish ? "earned the badge" : "ganhou a badge"} ${data.badgeName || data.badge_name || "badge"}`
      default: return `${name} ${isEnglish ? "did something" : "fez algo"}`
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return isEnglish ? "just now" : "agora"
    if (mins < 60) return `${mins}min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
  }

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-8 text-center">
          <Activity className="mx-auto mb-3 h-10 w-10 text-white/10" />
          <p className="text-sm font-bold text-white/30">
            {isEnglish ? "No activity yet. Share your first scan!" : "Nenhuma atividade ainda. Compartilhe seu primeiro scan!"}
          </p>
        </div>
      ) : (
        activities.map((activity, i) => {
          const Icon = activityIcons[activity.activity_type] || Activity
          return (
            <motion.div key={activity.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#0a0a0a] p-4">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 shrink-0",
                activityIconColors[activity.activity_type] || "text-white/40")}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white/70 leading-relaxed">{formatActivityText(activity)}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="h-3 w-3 text-white/15" />
                  <span className="text-[9px] font-bold text-white/15">{timeAgo(activity.created_at)}</span>
                </div>
              </div>
            </motion.div>
          )
        })
      )}
    </div>
  )
}
