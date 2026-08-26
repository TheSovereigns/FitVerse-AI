"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Lightbulb, TrendingUp, AlertTriangle, Info } from "lucide-react"
import { generatePostScanInsight, type Insight } from "@/lib/insights-engine"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface PostScanInsightsProps {
  scan: any
  todayScans: any[]
  plan: any
}

const typeStyles: Record<Insight["type"], { bg: string; border: string; iconBg: string; iconColor: string; Icon: React.ElementType }> = {
  positive: { bg: "bg-emerald-500/8", border: "border-emerald-500/20", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", Icon: TrendingUp },
  warning: { bg: "bg-amber-500/8", border: "border-amber-500/20", iconBg: "bg-amber-500/15", iconColor: "text-amber-400", Icon: AlertTriangle },
  info: { bg: "bg-blue-500/8", border: "border-blue-500/20", iconBg: "bg-blue-500/15", iconColor: "text-blue-400", Icon: Info },
  tip: { bg: "bg-purple-500/8", border: "border-purple-500/20", iconBg: "bg-purple-500/15", iconColor: "text-purple-400", Icon: Lightbulb },
}

export function PostScanInsights({ scan, todayScans, plan }: PostScanInsightsProps) {
  const { locale } = useTranslation()
  const insights = useMemo(
    () => generatePostScanInsight(scan, todayScans, plan, locale),
    [scan, todayScans, plan, locale]
  )

  if (insights.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border border-border glass-subtle p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white">
          {locale === "en-US" ? "Insights" : "Insights"}
        </h3>
      </div>

      <div className="space-y-2">
        {insights.map((insight, i) => {
          const styles = typeStyles[insight.type]
          const Icon = styles.Icon
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border px-3 py-2.5",
                styles.bg,
                styles.border
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", styles.iconBg)}>
                <Icon className={cn("w-4 h-4", styles.iconColor)} />
              </div>
              <p className="text-[12px] leading-relaxed text-white/70 flex-1">{insight.text}</p>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
