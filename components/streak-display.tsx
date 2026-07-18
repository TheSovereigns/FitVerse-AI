"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, TrendingUp, Award, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStreak } from "@/hooks/useStreak"
import { useTranslation } from "@/lib/i18n"

interface StreakDisplayProps {
  compact?: boolean
  onNavigate?: (view: any) => void
}

export function StreakDisplay({ compact = false, onNavigate }: StreakDisplayProps) {
  const { t } = useTranslation()
  const { currentStreak, longestStreak, hasActivityToday, weekActivity } = useStreak()
  const [showDetails, setShowDetails] = useState(false)

  const dayLabels = ["S", "T", "Q", "Q", "S", "S", "D"]

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => onNavigate?.("profile")}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-foreground">{currentStreak}</span>
              <span className="text-xs text-muted-foreground">
                {currentStreak === 1 ? "dia" : "dias"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {hasActivityToday ? "Sequencia ativa" : "Faca seu primeiro hoje"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card"
      >
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">
                {t("streak_title") || "Sequencia"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("streak_subtitle") || "Mantenha o ritmo"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">
                {longestStreak} {t("streak_best") || "recorde"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
                {currentStreak > 0 && (
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                    className="text-foreground"
                    strokeDasharray={`${Math.min(currentStreak / 30, 1) * 264} 264`}
                    transform="rotate(-90 50 50)"
                    initial={{ strokeDasharray: "0 264" }}
                    animate={{ strokeDasharray: `${Math.min(currentStreak / 30, 1) * 264} 264` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                )}
                {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                  const angle = (i * 360) / 7 - 90
                  const rad = (angle * Math.PI) / 180
                  const x = 50 + 35 * Math.cos(rad)
                  const y = 50 + 35 * Math.sin(rad)
                  const isActive = weekActivity[i]?.hasScan || weekActivity[i]?.hasWorkout || weekActivity[i]?.hasDiet
                  return (
                    <circle key={i} cx={x} cy={y} r="3" fill={isActive ? "currentColor" : "currentColor"} className={isActive ? "text-foreground" : "text-border"} opacity={isActive ? 1 : 0.4} />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{currentStreak}</span>
                <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                  {currentStreak === 1 ? "dia" : "dias"}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", hasActivityToday ? "bg-success" : "bg-border")} />
                <span className="text-xs text-muted-foreground">
                  {hasActivityToday
                    ? (t("streak_active_today") || "Atividade registrada hoje")
                    : (t("streak_no_today") || "Nenhuma atividade ainda hoje")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted">
                  <Award className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {longestStreak} {t("streak_record") || "recorde"}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {dayLabels.map((label, i) => {
                  const day = weekActivity[i]
                  const isActive = day?.hasScan || day?.hasWorkout || day?.hasDiet
                  const isToday = day?.date === new Date().toISOString().split("T")[0]
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className={cn("text-[9px] font-medium", isToday ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                      <div className={cn("h-2.5 w-2.5 rounded-full", isActive ? "bg-foreground" : "bg-border", isToday && !isActive && "ring-1 ring-foreground/30")} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">{t("streak_details") || "Detalhes da Sequencia"}</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground text-sm">Sequencia atual</span><span className="font-semibold text-sm">{currentStreak} dias</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground text-sm">Melhor sequencia</span><span className="font-semibold text-sm">{longestStreak} dias</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground text-sm">Pontos ganhos</span><span className="font-semibold text-sm">+{currentStreak * 5} pts</span></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
