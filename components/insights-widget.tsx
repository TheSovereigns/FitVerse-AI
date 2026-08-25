"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { generateDailyInsights, type Insight } from "@/lib/insights-engine"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface InsightsWidgetProps {
  scans: any[]
  plan: any
}

const typeStyles: Record<Insight["type"], { bg: string; border: string; icon: string }> = {
  positive: { bg: "bg-emerald-500/8", border: "border-emerald-500/20", icon: "text-emerald-400" },
  warning: { bg: "bg-amber-500/8", border: "border-amber-500/20", icon: "text-amber-400" },
  info: { bg: "bg-blue-500/8", border: "border-blue-500/20", icon: "text-blue-400" },
  tip: { bg: "bg-purple-500/8", border: "border-purple-500/20", icon: "text-purple-400" },
}

export function InsightsWidget({ scans, plan }: InsightsWidgetProps) {
  const { locale } = useTranslation()
  const insights = useMemo(() => generateDailyInsights(scans, plan, locale), [scans, plan, locale])

  if (insights.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.01 }}
      className="rounded-2xl glass-strong p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-muted">
          <Lightbulb className="h-3.5 w-3.5 text-brand" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">
          {locale === "en-US" ? "Today's Insights" : "Insights de Hoje"}
        </h2>
      </div>

      <div className="space-y-2">
        {insights.map((insight, i) => {
          const styles = typeStyles[insight.type]
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border px-3 py-2.5",
                styles.bg,
                styles.border
              )}
            >
              <span className="text-base mt-0.5 shrink-0">{insight.icon}</span>
              <p className="text-[13px] leading-relaxed text-foreground/80">{insight.text}</p>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}
