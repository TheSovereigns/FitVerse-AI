"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Trophy, Medal, Crown, ScanLine, Dumbbell, Wheat, Zap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface RankingEntry {
  user_id: string
  user_name: string
  user_avatar: string | null
  scan_count: number
  workout_count: number
  activity_count: number
  total_points: number
}

async function getToken(): Promise<string> {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.includes("sb-") && key.includes("-auth-token")) {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.access_token) return parsed.access_token
      }
    }
  }
  return ""
}

export function ClanRanking({ clanId }: { clanId: string }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<7 | 30>(7)

  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true)
      try {
        const token = await getToken()
        if (!token) return

        const res = await fetch(`/api/clans/${clanId}/activities?limit=200`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()

        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - period)

        const filtered = (data.activities || []).filter((a: any) =>
          new Date(a.created_at) >= cutoff
        )

        const userMap: Record<string, RankingEntry> = {}
        filtered.forEach((activity: any) => {
          const uid = activity.user_id
          if (!userMap[uid]) {
            userMap[uid] = {
              user_id: uid,
              user_name: activity.profiles?.name || "Unknown",
              user_avatar: activity.profiles?.avatar_url,
              scan_count: 0,
              workout_count: 0,
              activity_count: 0,
              total_points: 0,
            }
          }
          const entry = userMap[uid]
          entry.activity_count++
          if (activity.activity_type === "scan") {
            entry.scan_count++
            entry.total_points += 10
          } else if (activity.activity_type === "workout") {
            entry.workout_count++
            entry.total_points += 20
          } else if (activity.activity_type === "diet") {
            entry.total_points += 15
          } else if (activity.activity_type === "streak") {
            entry.total_points += 5
          } else if (activity.activity_type === "badge") {
            entry.total_points += 25
          }
        })

        const sorted = Object.values(userMap).sort((a, b) => b.total_points - a.total_points)
        setRanking(sorted)
      } catch (e) {
        console.error("Error fetching ranking:", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRanking()
  }, [clanId, period])

  const medalIcons = [Crown, Medal, Trophy]
  const medalColors = ["text-foreground", "text-zinc-300", "text-foreground/60"]

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([7, 30] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
              period === p
                ? "bg-foreground/5 text-foreground border border-white/10"
                : "text-foreground/50 border border-transparent"
            )}
          >
            {p === 7 ? (isEnglish ? "7 Days" : "7 Dias") : (isEnglish ? "30 Days" : "30 Dias")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 text-foreground animate-spin" />
        </div>
      ) : ranking.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-8 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-foreground/10" />
          <p className="text-sm font-bold text-foreground/50">
            {isEnglish ? "No activity this period" : "Nenhuma atividade neste periodo"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranking.map((entry, i) => {
            const MedalIcon = medalIcons[i] || Trophy
            const medalColor = medalColors[i] || "text-foreground/50"
            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                  className={cn(
                    "flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-[#090704]/60 p-4 backdrop-blur-xl",
                    i < 3 && "border-white/10"
                  )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/30">
                  {i < 3 ? (
                    <MedalIcon className={cn("h-5 w-5", medalColor)} />
                  ) : (
                    <span className="text-sm font-black text-foreground/50">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-foreground truncate">{entry.user_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400/60">
                      <ScanLine className="h-3 w-3" /> {entry.scan_count}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-blue-400/60">
                      <Dumbbell className="h-3 w-3" /> {entry.workout_count}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-foreground">{entry.total_points}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/50">pts</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
