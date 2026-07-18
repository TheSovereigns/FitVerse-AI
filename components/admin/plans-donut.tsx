"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface PlansDonutProps {
  freeCount: number
  premiumCount: number
  isLoading?: boolean
}

const COLORS = {
  premium: "#f59e0b",
  free: "#52525b",
}

export function PlansDonut({ freeCount, premiumCount, isLoading = false }: PlansDonutProps) {
  const { locale } = useTranslation()

  const data = useMemo(() => {
    const total = freeCount + premiumCount
    return [
      { name: "Premium", value: premiumCount, percentage: total > 0 ? ((premiumCount / total) * 100).toFixed(1) : "0" },
      { name: "Free", value: freeCount, percentage: total > 0 ? ((freeCount / total) * 100).toFixed(1) : "0" },
    ]
  }, [freeCount, premiumCount])

  const total = freeCount + premiumCount
  const conversionRate = total > 0 ? ((premiumCount / total) * 100).toFixed(1) : "0"

  if (isLoading) {
    return (
      <div className="glass-strong border border-orange-500/10 rounded-2xl p-6">
        <div className="animate-pulse h-64 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-4 border-white/5" />
        </div>
      </div>
    )
  }

  return (
    <div className="glass-strong border border-orange-500/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        {locale === "en-US" ? "Free vs Premium" : "Free vs Premium"}
      </h3>

      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              <Cell fill={COLORS.premium} />
              <Cell fill={COLORS.free} />
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f1100",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number, name: string) => [value, name]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{conversionRate}%</p>
            <p className="text-xs text-neutral-400">
              {locale === "en-US" ? "Conversion" : "Conversão"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <span className="text-sm text-neutral-400">
            Premium: {premiumCount.toLocaleString(locale === "en-US" ? "en-US" : "pt-BR")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neutral-600" />
          <span className="text-sm text-neutral-400">
            Free: {freeCount.toLocaleString(locale === "en-US" ? "en-US" : "pt-BR")}
          </span>
        </div>
      </div>
    </div>
  )
}