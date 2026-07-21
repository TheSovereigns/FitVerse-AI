"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Clock,
  TrendingUp,
  Lock,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"

interface FastingState {
  startTime: number | null
  elapsed: number
  protocol: string
  paused: boolean
  pausedElapsed: number
}

interface FastingEntry {
  date: string
  protocol: string
  duration: number
  completed: boolean
}

interface FastingStats {
  avgDuration: number
  longestFast: number
  currentStreak: number
  totalFasts: number
}

const PROTOCOLS = [
  { id: "16:8", hours: 16, label: "16:8", desc: "16h fast, 8h eating" },
  { id: "18:6", hours: 18, label: "18:6", desc: "18h fast, 6h eating" },
  { id: "20:4", hours: 20, label: "20:4", desc: "20h fast, 4h eating" },
  { id: "24h", hours: 24, label: "24h", desc: "24h extended fast" },
  { id: "36h", hours: 36, label: "36h", desc: "36h extended fast" },
]

const FASTING_STAGES = [
  { id: "fed", name: "Fed State", start: 0, end: 4, color: "bg-green-500", tip: "Digesting and absorbing nutrients. Keep meals balanced." },
  { id: "glycogen", name: "Glycogen Depletion", start: 4, end: 12, color: "bg-yellow-500", tip: "Body burns stored glycogen. You may feel hungry." },
  { id: "fat_burning", name: "Fat Burning", start: 12, end: 18, color: "bg-orange-500", tip: "Body shifts to burning fat for energy. Stay hydrated." },
  { id: "autophagy", name: "Autophagy", start: 18, end: 24, color: "bg-red-500", tip: "Cellular cleanup begins. Focus on electrolytes." },
  { id: "deep_autophagy", name: "Deep Autophagy", start: 24, end: 48, color: "bg-purple-500", tip: "Deep cellular repair. Monitor how you feel closely." },
]

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

function getCurrentStage(elapsedHours: number) {
  const stage = FASTING_STAGES.find((s) => elapsedHours >= s.start && elapsedHours < s.end)
  return stage || FASTING_STAGES[FASTING_STAGES.length - 1]
}

export function FastingTracker({ isLocked = false }: { isLocked?: boolean }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const [state, setState] = useState<FastingState>({
    startTime: null,
    elapsed: 0,
    protocol: "16:8",
    paused: false,
    pausedElapsed: 0,
  })
  const [history, setHistory] = useState<FastingEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showStages, setShowStages] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fastingHistory")
      if (saved) setHistory(JSON.parse(saved))
      const savedState = localStorage.getItem("fastingState")
      if (savedState) {
        const parsed: FastingState = JSON.parse(savedState)
        if (parsed.startTime && !parsed.paused) {
          const now = Date.now()
          parsed.elapsed = Math.floor((now - parsed.startTime) / 1000)
          setState(parsed)
        } else if (parsed.paused) {
          setState(parsed)
        }
      }
    } catch (e) {
      logger.error("[FastingTracker] Failed to parse fastingState:", e)
    }
  }, [])

  useEffect(() => {
    if (state.startTime && !state.paused) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime!) / 1000)
        setState((prev) => ({ ...prev, elapsed }))
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.startTime, state.paused])

  const saveState = useCallback((newState: FastingState) => {
    try {
      localStorage.setItem("fastingState", JSON.stringify(newState))
    } catch (e) {
      logger.error("[FastingTracker] Failed to save fastingState:", e)
    }
  }, [])

  const saveHistory = useCallback((entry: FastingEntry) => {
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 100)
      try {
        localStorage.setItem("fastingHistory", JSON.stringify(updated))
      } catch (e) {
        logger.error("[FastingTracker] Failed to save fastingHistory:", e)
      }
      return updated
    })
  }, [])

  const startFast = () => {
    const newState: FastingState = {
      startTime: Date.now(),
      elapsed: 0,
      protocol: state.protocol,
      paused: false,
      pausedElapsed: 0,
    }
    setState(newState)
    saveState(newState)
  }

  const pauseFast = () => {
    const newState: FastingState = {
      ...state,
      paused: true,
      pausedElapsed: state.elapsed,
      startTime: null,
    }
    setState(newState)
    saveState(newState)
  }

  const resumeFast = () => {
    const newState: FastingState = {
      ...state,
      paused: false,
      startTime: Date.now() - state.pausedElapsed * 1000,
      elapsed: state.pausedElapsed,
    }
    setState(newState)
    saveState(newState)
  }

  const resetFast = () => {
    const elapsedHours = state.elapsed / 3600
    const protocol = PROTOCOLS.find((p) => p.id === state.protocol)
    if (elapsedHours >= 1 && protocol) {
      saveHistory({
        date: new Date().toISOString(),
        protocol: state.protocol,
        duration: Math.round(state.elapsed / 60),
        completed: elapsedHours >= protocol.hours,
      })
    }
    const newState: FastingState = {
      startTime: null,
      elapsed: 0,
      protocol: state.protocol,
      paused: false,
      pausedElapsed: 0,
    }
    setState(newState)
    try {
      localStorage.removeItem("fastingState")
    } catch (e) {
      logger.error("[FastingTracker] Failed to remove fastingState:", e)
    }
  }

  const protocol = PROTOCOLS.find((p) => p.id === state.protocol)!
  const protocolHours = protocol.hours
  const elapsedHours = state.elapsed / 3600
  const remainingHours = Math.max(0, protocolHours - elapsedHours)
  const elapsedMinutes = state.elapsed / 60
  const totalMinutes = protocolHours * 60
  const progress = Math.min((elapsedHours / protocolHours) * 100, 100)
  const isFasting = state.startTime !== null || state.paused
  const currentStage = getCurrentStage(elapsedHours)
  const isCompleted = elapsedHours >= protocolHours

  const stats = useMemo((): FastingStats => {
    const completed = history.filter((h) => h.completed)
    const avgDuration = completed.length > 0
      ? completed.reduce((s, h) => s + h.duration, 0) / completed.length
      : 0
    const longestFast = completed.length > 0
      ? Math.max(...completed.map((h) => h.duration))
      : 0
    let streak = 0
    const today = new Date().toISOString().split("T")[0]!
    let checkDate = new Date()
    for (let i = 0; i < history.length; i++) {
      const entryDate = new Date(history[i]!.date!).toISOString().split("T")[0]!
      const diffDays = Math.floor((checkDate.getTime() - new Date(entryDate).getTime()) / (24 * 60 * 60 * 1000))
      if (diffDays <= 1 && history[i]!.completed) {
        streak++
        checkDate = new Date(entryDate)
      } else if (diffDays > 1) {
        break
      }
    }
    return { avgDuration, longestFast, currentStreak: streak, totalFasts: completed.length }
  }, [history])

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border glass-strong p-5 relative overflow-hidden"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted">
            <Timer className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isEnglish ? "Fasting Tracker" : "Rastreador de Jejum"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isEnglish ? "Pro / Premium feature" : "Recurso Pro / Premium"}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-orange-500/30" />
          <p className="text-sm font-medium text-foreground mb-1">
            {isEnglish ? "Upgrade to unlock" : "Faca upgrade para desbloquear"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isEnglish
              ? "Unlock intermittent fasting tracking with Pro or Premium"
              : "Desbloqueie o rastreamento de jejum intermitente com Pro ou Premium"}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border glass-strong p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted">
            <Timer className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isEnglish ? "Fasting Tracker" : "Rastreador de Jejum"}
            </h3>
            <p className="text-xs text-muted-foreground">{currentStage!.name}</p>
          </div>
        </div>
        {isFasting && (
          <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
          )}>
            {isCompleted ? (isEnglish ? "Complete" : "Completo") : (isEnglish ? "Active" : "Ativo")}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {PROTOCOLS.map((p) => (
          <button
            key={p.id}
            onClick={() => !isFasting && setState((s) => ({ ...s, protocol: p.id }))}
            disabled={isFasting}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
              state.protocol === p.id
                ? "bg-orange-500/10 border-orange-500/30 text-orange-500"
                : "border-border text-muted-foreground hover:text-foreground",
              isFasting && "opacity-50 cursor-not-allowed"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className="relative w-44 h-44">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 176 176">
            <circle cx="88" cy="88" r="80" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
            <motion.circle
              cx="88"
              cy="88"
              r="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className={cn(
                isCompleted ? "text-emerald-500" : isFasting ? "text-orange-500" : "text-muted-foreground"
              )}
              initial={{ strokeDasharray: 2 * Math.PI * 80, strokeDashoffset: 2 * Math.PI * 80 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - progress / 100) }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={state.elapsed}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-foreground"
            >
              {formatTime(state.elapsed)}
            </motion.span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {isEnglish ? "elapsed" : "decorrido"}
            </span>
            {isFasting && remainingHours > 0 && (
              <span className="text-[10px] text-orange-500 mt-1">
                {formatTime(Math.ceil(remainingHours * 3600))} {isEnglish ? "left" : "restante"}
              </span>
            )}
            {isCompleted && (
              <span className="text-[10px] text-emerald-500 mt-1 font-bold">
                {isEnglish ? "Target reached!" : "Meta alcancada!"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", isCompleted ? "bg-emerald-500" : "bg-orange-500")}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">0h</span>
          <span className="text-[10px] font-medium text-orange-500">{Math.round(progress)}%</span>
          <span className="text-[10px] text-muted-foreground">{protocolHours}h</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-4">
        {!isFasting ? (
          <Button onClick={startFast} className="h-10 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm">
            <Play className="h-4 w-4 mr-1.5" />
            {isEnglish ? "Start" : "Iniciar"}
          </Button>
        ) : state.paused ? (
          <>
            <Button onClick={resetFast} variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button onClick={resumeFast} className="h-10 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm">
              <Play className="h-4 w-4 mr-1.5" />
              {isEnglish ? "Resume" : "Retomar"}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={resetFast} variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button onClick={pauseFast} className="h-10 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm">
              <Pause className="h-4 w-4 mr-1.5" />
              {isEnglish ? "Stop" : "Parar"}
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isEnglish ? "Elapsed" : "Decorrido"}</p>
          <p className="text-sm font-bold text-foreground">{Math.round(elapsedMinutes)}m</p>
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isEnglish ? "Remaining" : "Restante"}</p>
          <p className="text-sm font-bold text-foreground">{Math.round(Math.max(0, totalMinutes - elapsedMinutes))}m</p>
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isEnglish ? "Stage" : "Estagio"}</p>
          <p className="text-sm font-bold text-orange-500">{currentStage!.name.split(" ")[0]}</p>
        </div>
      </div>

      <Button
        onClick={() => setShowStages(!showStages)}
        variant="ghost"
        className="w-full h-8 rounded-xl text-xs font-medium text-muted-foreground mb-2"
      >
        <Flame className="h-3 w-3 mr-1.5 text-orange-500" />
        {isEnglish ? "Fasting Stages" : "Estagios do Jejum"}
        {showStages ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
      </Button>

      <AnimatePresence>
        {showStages && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="relative rounded-xl border border-border p-3">
              <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-border" />
              <div className="space-y-3 relative">
                {FASTING_STAGES.map((stage, i) => {
                  const isActive = currentStage!.id === stage.id
                  const isPast = elapsedHours >= stage.end
                  return (
                    <div key={stage.id} className="flex items-start gap-3">
                      <div className={cn("w-3 h-3 rounded-full mt-0.5 z-10 flex-shrink-0", stage.color, isPast && "opacity-40")} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-semibold", isActive ? "text-foreground" : "text-muted-foreground", isPast && "opacity-60")}>
                            {stage.name}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {stage.start}h — {stage.end}h
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded-full bg-orange-500/10 text-[8px] font-bold text-orange-500 uppercase">
                              NOW
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{stage.tip}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="ghost"
            className="w-full h-8 rounded-xl text-xs font-medium text-muted-foreground mb-2"
          >
            <Clock className="h-3 w-3 mr-1.5" />
            {isEnglish ? "History" : "Historico"}
            <span className="ml-1 text-[10px]">({history.length})</span>
            {showHistory ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="rounded-xl border border-border p-2 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase">{isEnglish ? "Avg" : "Media"}</p>
                    <p className="text-sm font-bold text-foreground">{Math.round(stats.avgDuration)}m</p>
                  </div>
                  <div className="rounded-xl border border-border p-2 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase">{isEnglish ? "Longest" : "Maior"}</p>
                    <p className="text-sm font-bold text-foreground">{Math.round(stats.longestFast)}m</p>
                  </div>
                  <div className="rounded-xl border border-border p-2 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase">{isEnglish ? "Streak" : "Sequencia"}</p>
                    <p className="text-sm font-bold text-orange-500">{stats.currentStreak}</p>
                  </div>
                  <div className="rounded-xl border border-border p-2 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase">{isEnglish ? "Total" : "Total"}</p>
                    <p className="text-sm font-bold text-foreground">{stats.totalFasts}</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.slice(0, 20).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-border p-2.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", entry.completed ? "bg-emerald-500" : "bg-orange-500")} />
                        <div>
                          <span className="text-xs font-medium text-foreground">{entry.protocol}</span>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString(isEnglish ? "en-US" : "pt-BR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{entry.duration}m</span>
                        {entry.completed && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[8px] font-bold text-emerald-500">
                            {isEnglish ? "DONE" : "FEITO"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <div className="rounded-xl border border-border p-3">
        <div className="flex items-center gap-2 mb-1">
          <Info className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-xs font-semibold text-foreground">{currentStage!.name}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">{currentStage!.tip}</p>
      </div>
    </motion.div>
  )
}
