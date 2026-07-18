"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, TrendingUp, Award, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStreak } from "@/hooks/useStreak"
import { useTranslation } from "@/lib/i18n"

interface StreakDisplayProps {
  compact?: boolean
  onNavigate?: (view: string) => void
}

export function StreakDisplay({ compact = false, onNavigate }: StreakDisplayProps) {
  const { t } = useTranslation()
  const { currentStreak, longestStreak, hasActivityToday, weekActivity } = useStreak()
  const [showDetails, setShowDetails] = useState(false)
  const [prevStreak, setPrevStreak] = useState(currentStreak)
  const [animateBoost, setAnimateBoost] = useState(false)

  useEffect(() => {
    if (currentStreak > prevStreak && prevStreak > 0) {
      setAnimateBoost(true)
      setTimeout(() => setAnimateBoost(false), 1500)
    }
    setPrevStreak(currentStreak)
  }, [currentStreak])

  const intensityLevel = currentStreak >= 30 ? 4 : currentStreak >= 14 ? 3 : currentStreak >= 7 ? 2 : currentStreak >= 3 ? 1 : 0
  const intensityColors = [
    "from-zinc-600 to-zinc-700",
    "from-zinc-500 to-zinc-600",
    "from-zinc-500 to-zinc-400",
    "from-zinc-400 to-zinc-300",
    "from-zinc-300 to-white",
  ]
  const intensityGlows = [
    "shadow-none",
    "shadow-[0_0_20px_rgba(255,255,255,0.1)]",
    "shadow-[0_0_30px_rgba(255,255,255,0.12)]",
    "shadow-[0_0_40px_rgba(255,255,255,0.15)]",
    "shadow-[0_0_50px_rgba(255,255,255,0.18)]",
  ]

  const dayLabels = ["S", "T", "Q", "Q", "S", "S", "D"]

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/40 p-4 backdrop-blur-2xl cursor-pointer",
          "shadow-[0_18px_54px_rgba(0,0,0,0.26)]",
          animateBoost && intensityGlows[intensityLevel]
        )}
        onClick={() => onNavigate?.("profile")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/3" />
        <div className="relative flex items-center gap-3">
          <div className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br",
            intensityColors[intensityLevel]
          )}>
            <Zap className="h-5 w-5 text-white" />
            {currentStreak > 0 && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-white/20"
                animate={animateBoost ? { scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] } : {}}
                transition={{ duration: 1.5, repeat: animateBoost ? Infinity : 0 }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-foreground">{currentStreak}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                {currentStreak === 1 ? "dia" : "dias"}
              </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
              {hasActivityToday ? "Sequencia ativa" : "Faca seu primeiro hoje"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl",
          "shadow-[0_18px_54px_rgba(0,0,0,0.26)]"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/3" />

        <div className="relative p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black tracking-tight text-foreground md:text-lg">
                {t("streak_title") || "Sequencia"}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
                {t("streak_subtitle") || "Mantenha o ritmo"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-foreground/50">
              <TrendingUp className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {longestStreak} {t("streak_best") || "recorde"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-2xl">
                <defs>
                  <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#e5e5e5" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />

                {currentStreak > 0 && (
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="url(#streakGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(currentStreak / 30, 1) * 327} 327`}
                    transform="rotate(-90 60 60)"
                    filter="url(#glow)"
                    initial={{ strokeDasharray: "0 327" }}
                    animate={{ strokeDasharray: `${Math.min(currentStreak / 30, 1) * 327} 327` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                )}

                {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                  const angle = (i * 360) / 7 - 90
                  const rad = (angle * Math.PI) / 180
                  const x = 60 + 42 * Math.cos(rad)
                  const y = 60 + 42 * Math.sin(rad)
                  const isActive = weekActivity[i]?.hasScan || weekActivity[i]?.hasWorkout || weekActivity[i]?.hasDiet
                  return (
                    <motion.circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={isActive ? "#ffffff" : "rgba(255,255,255,0.08)"}
                      initial={false}
                      animate={isActive ? { scale: [1, 1.3, 1], opacity: 1 } : { scale: 1, opacity: 0.4 }}
                      transition={{ duration: 0.4 }}
                    />
                  )
                })}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className={cn(
                    "text-4xl font-black tracking-tight text-foreground md:text-5xl",
                    animateBoost && "text-white"
                  )}
                  key={currentStreak}
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {currentStreak}
                </motion.span>
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground/50">
                  {currentStreak === 1 ? "dia" : "dias"}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  hasActivityToday ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                )} />
                <span className="text-xs font-bold text-foreground/60">
                  {hasActivityToday
                    ? (t("streak_active_today") || "Atividade registrada hoje")
                    : (t("streak_no_today") || "Nenhuma atividade ainda hoje")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/8">
                  <Award className="h-3 w-3 text-foreground/80" />
                </div>
                <span className="text-xs font-bold text-foreground/50">
                  {longestStreak} {t("streak_record") || "recorde"}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {dayLabels.map((label, i) => {
                  const day = weekActivity[i]
                  const isActive = day?.hasScan || day?.hasWorkout || day?.hasDiet
                  const isToday = day?.date === new Date().toISOString().split("T")[0]
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className={cn(
                        "text-[8px] font-black uppercase",
                        isToday ? "text-foreground" : "text-foreground/30"
                      )}>
                        {label}
                      </span>
                      <motion.div
                        className={cn(
                          "h-3 w-3 rounded-full border",
                          isActive
                            ? "bg-foreground border-white/30"
                            : "bg-white/5 border-white/8",
                          isToday && !isActive && "border-foreground/30 animate-pulse"
                        )}
                        animate={isActive ? { scale: [0.8, 1.1, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {intensityLevel > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2"
            >
              <Zap className="h-3.5 w-3.5 text-foreground/80" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">
                {intensityLevel === 1 && "Sequencia iniciada"}
                {intensityLevel === 2 && "Uma semana consistente"}
                {intensityLevel === 3 && "Duas semanas forte"}
                {intensityLevel === 4 && "Um mes completo"}
              </span>
              <span className="ml-auto text-[10px] font-black text-foreground/40">
                +{currentStreak * 5} pts
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/60 border border-white/10 rounded-3xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black mb-4">{t("streak_details") || "Detalhes da Sequencia"}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground/50">Sequencia atual</span>
                  <span className="font-black text-foreground">{currentStreak} dias</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/50">Melhor sequencia</span>
                  <span className="font-black text-foreground/80">{longestStreak} dias</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/50">Pontos ganhos</span>
                  <span className="font-black text-foreground">+{currentStreak * 5} pts</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
