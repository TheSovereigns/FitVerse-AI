"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown, Minus, Calendar, Flame, Dumbbell,
  ScanLine, Wheat, Target, Sparkles, ChevronRight, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWeeklyReport } from "@/hooks/useWeeklyReport"
import { useTranslation } from "@/lib/i18n"

export function WeeklyReport() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { report, aiInsight, isLoading, generateReport } = useWeeklyReport()

  if (isLoading && !report) {
    return (
      <div className="rounded-[1.5rem] border border-white/14 bg-[#090704]/70 p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 rounded-full border-2 border-foreground/40 border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  if (!report) return null

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="h-3 w-3 text-emerald-400" />
    if (value < 0) return <TrendingDown className="h-3 w-3 text-red-400" />
    return <Minus className="h-3 w-3 text-foreground/30" />
  }

  const maxCalories = Math.max(...report.dailyData.map((d) => d.calories), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[1.5rem] border border-white/14 bg-[#090704]/70 backdrop-blur-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/6 via-transparent to-purple-500/4" />

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20">
              <Calendar className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">
                {isEnglish ? "Weekly Report" : "Relatorio Semanal"}
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
                {report.weekLabel}
              </p>
            </div>
          </div>
          <Button
            onClick={generateReport}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/8"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-foreground/50", isLoading && "animate-spin")} />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between mb-1">
              <ScanLine className="h-4 w-4 text-emerald-400" />
              <TrendIcon value={report.scanTrend} />
            </div>
            <p className="text-xl font-black text-foreground">{report.totalScans}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
              {isEnglish ? "Scans" : "Scans"}
              {report.scanTrend !== 0 && (
                <span className={cn("ml-1", report.scanTrend > 0 ? "text-emerald-400" : "text-red-400")}>
                  {report.scanTrend > 0 ? "+" : ""}{report.scanTrend}%
                </span>
              )}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between mb-1">
              <Dumbbell className="h-4 w-4 text-blue-400" />
              <TrendIcon value={report.workoutTrend} />
            </div>
            <p className="text-xl font-black text-foreground">{report.totalWorkouts}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
              {isEnglish ? "Workouts" : "Treinos"}
              {report.workoutTrend !== 0 && (
                <span className={cn("ml-1", report.workoutTrend > 0 ? "text-emerald-400" : "text-red-400")}>
                  {report.workoutTrend > 0 ? "+" : ""}{report.workoutTrend}%
                </span>
              )}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <Target className="h-4 w-4 text-foreground/60 mb-1" />
            <p className="text-xl font-black text-foreground">{report.avgScore}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
              {isEnglish ? "Avg Score" : "Score Medio"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <Flame className="h-4 w-4 text-red-400 mb-1" />
            <p className="text-xl font-black text-foreground">{report.daysActive}/7</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
              {isEnglish ? "Active Days" : "Dias Ativos"}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30 mb-2">
            {isEnglish ? "Calories by Day" : "Calorias por Dia"}
          </p>
          <div className="flex items-end justify-between gap-1 h-20">
            {report.dailyData.map((day, i) => {
              const dayName = new Date(day.date).toLocaleDateString(isEnglish ? "en-US" : "pt-BR", { weekday: "short" })
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-foreground/10 rounded-t-md relative overflow-hidden flex-1 min-h-[4px]">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.calories / maxCalories) * 100}%` }}
                      className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-blue-500/60 to-blue-400/40"
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-foreground/25">{dayName}</span>
                </div>
              )
            })}
          </div>
        </div>

        {aiInsight && (
          <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/70">
                {isEnglish ? "AI Insight" : "Insight da IA"}
              </span>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">{aiInsight}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
