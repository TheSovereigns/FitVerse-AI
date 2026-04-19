"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { useTranslation } from "@/lib/i18n"

interface DailyData {
  date: string
  newUsers: number
  totalUsers: number
}

interface GrowthChartProps {
  data: DailyData[]
  isLoading?: boolean
}

export function GrowthChart({ data, isLoading = false }: GrowthChartProps) {
  const { locale } = useTranslation()

  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      date: new Date(item.date).toLocaleDateString(locale === "en-US" ? "en-US" : "pt-BR", {
        month: "short",
        day: "numeric",
      }),
    }))
  }, [data, locale])

  if (isLoading) {
    return (
      <div className="glass-strong border border-orange-500/10 rounded-2xl p-6">
        <div className="animate-pulse h-64 bg-white/5 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="glass-strong border border-orange-500/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        {locale === "en-US" ? "User Growth (Last 30 Days)" : "Crescimento de Usuários (Últimos 30 dias)"}
      </h3>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-neutral-500">
            {locale === "en-US" ? "No data available" : "Nenhum dado disponível"}
          </p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTotalUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="date"
                stroke="#737373"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#737373"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f1100",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                labelStyle={{ color: "#a3a3a3" }}
                formatter={(value: number) => [value.toLocaleString(), ""]}
              />
              <Area
                type="monotone"
                dataKey="newUsers"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNewUsers)"
                name={locale === "en-US" ? "New Users" : "Novos Usuários"}
              />
              <Area
                type="monotone"
                dataKey="totalUsers"
                stroke="#fbbf24"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotalUsers)"
                name={locale === "en-US" ? "Total" : "Total"}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-sm text-neutral-400">
            {locale === "en-US" ? "New Users" : "Novos Usuários"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-sm text-neutral-400">
            {locale === "en-US" ? "Total" : "Total"}
          </span>
        </div>
      </div>
    </div>
  )
}