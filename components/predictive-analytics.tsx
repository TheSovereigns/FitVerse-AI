"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, Target, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addWeeks } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DataPoint {
  date: string
  value: number
}

interface PredictiveAnalyticsProps {
  data: DataPoint[]
  metric: string
  unit?: string
  target?: number
  targetDate?: Date
  className?: string
}

export function PredictiveAnalytics({
  data,
  metric,
  unit = "",
  target,
  targetDate,
  className,
}: PredictiveAnalyticsProps) {
  const analysis = useMemo(() => {
    if (data.length < 2) return null

    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const values = sorted.map((d) => d.value)

    const n = values.length
    const sumX = values.reduce((acc, _, i) => acc + i, 0)
    const sumY = values.reduce((acc, v) => acc + v, 0)
    const sumXY = values.reduce((acc, v, i) => acc + i * v, 0)
    const sumX2 = values.reduce((acc, _, i) => acc + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    const lastValue = values[n - 1]!
    const predictedNext = slope * n + intercept
    const changePercent = lastValue > 0 ? ((predictedNext - lastValue) / lastValue) * 100 : 0

    const trend = slope > 0.5 ? "up" : slope < -0.5 ? "down" : "stable"

    let weeksToTarget: number | null = null
    if (target && slope !== 0) {
      const diff = target - lastValue
      weeksToTarget = Math.ceil(diff / slope)
      if (weeksToTarget < 0) weeksToTarget = null
    }

    const predictionDate = targetDate || addWeeks(new Date(), weeksToTarget || 4)

    return {
      trend,
      slope,
      lastValue,
      predictedNext: Math.round(predictedNext),
      changePercent: Math.round(changePercent),
      weeksToTarget,
      predictionDate,
    }
  }, [data, target, targetDate])

  if (!analysis) return null

  const trendIcons: Record<string, typeof TrendingUp> = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  }

  const trendColors: Record<string, string> = {
    up: "text-success",
    down: "text-destructive",
    stable: "text-muted-foreground",
  }

  const TrendIcon = trendIcons[analysis.trend] || Minus

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="w-4 h-4 text-brand" />
          Previsão — {metric}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Atual</p>
            <p className="text-lg font-bold">
              {analysis.lastValue}{unit}
            </p>
          </div>
          <div className={cn("flex items-center gap-1", trendColors[analysis.trend])}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {analysis.changePercent > 0 ? "+" : ""}{analysis.changePercent}%
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Previsto</p>
            <p className="text-lg font-bold">
              {analysis.predictedNext}{unit}
            </p>
          </div>
        </div>

        {analysis.weeksToTarget && analysis.weeksToTarget > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-brand-muted/30">
            <Calendar className="w-4 h-4 text-brand" />
            <p className="text-xs text-foreground">
              Meta alcançada em ~{analysis.weeksToTarget} semana{analysis.weeksToTarget > 1 ? "s" : ""} (
              {format(analysis.predictionDate, "dd/MM/yyyy", { locale: ptBR })})
            </p>
          </div>
        )}

        <div className="h-16 flex items-end gap-0.5">
          {data.slice(-14).map((d, i) => {
            const maxVal = Math.max(...data.slice(-14).map((x) => x.value))
            const minVal = Math.min(...data.slice(-14).map((x) => x.value))
            const range = maxVal - minVal || 1
            const height = ((d.value - minVal) / range) * 100
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(height, 8)}%` }}
                transition={{ delay: i * 0.03 }}
                className="flex-1 bg-brand/30 rounded-sm"
              />
            )
          })}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(((analysis.predictedNext - Math.min(...data.slice(-14).map((x) => x.value))) / (Math.max(...data.slice(-14).map((x) => x.value)) - Math.min(...data.slice(-14).map((x) => x.value)) || 1)) * 100, 8)}%` }}
            transition={{ delay: 0.5 }}
            className="flex-1 bg-brand rounded-sm opacity-50 border border-dashed border-brand"
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center">Últimas 2 semanas + previsão</p>
      </CardContent>
    </Card>
  )
}
