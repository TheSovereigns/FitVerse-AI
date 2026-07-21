"use client"

import { useState, useEffect, useRef } from "react"
import { X, Check, Clock, Flame, Trophy, ChevronRight, Save, Search, Minus, Plus, Zap, Target, Timer } from "lucide-react"
import { toast } from "sonner"

interface ActiveWorkoutSessionProps {
  workout: any
  onClose: () => void
  onComplete: (data: any) => void
}

import { useTranslation } from "@/lib/i18n"
import { EXERCISE_TRANSLATIONS } from "@/lib/exercise-translations"

export function ActiveWorkoutSession({ workout, onClose, onComplete }: ActiveWorkoutSessionProps) {
  const { t, locale } = useTranslation()
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({})
  const [isResting, setIsResting] = useState(false)
  const [restTimer, setRestTimer] = useState(60)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [rpeValues, setRpeValues] = useState<Record<string, number>>({})
  const [isFinished, setIsFinished] = useState(false)
  const [repCount, setRepCount] = useState<Record<string, number[]>>({})

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null)

  const getSearchTerm = () => {
    const name = currentExercise.name.toLowerCase().trim()
    if (locale === "en-US") {
      for (const [pt, en] of Object.entries(EXERCISE_TRANSLATIONS)) {
        if (name.includes(pt)) return en
      }
      return name
    }
    return name + t("em_search_suffix")
  }

  useEffect(() => {
    const saved = localStorage.getItem(`workout_progress_${workout.name}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.workoutName === workout.name) {
          setCurrentExerciseIndex(data.currentExerciseIndex)
          setCompletedSets(data.completedSets)
          setElapsedTime(data.elapsedTime)
          setRpeValues(data.rpeValues)
          if (data.repCount) setRepCount(data.repCount)
        }
      } catch (e) {
        console.error(t("aw_error_progress"), e)
      }
    }
  }, [workout.name])

  useEffect(() => {
    if (!isFinished) {
      localStorage.setItem(`workout_progress_${workout.name}`, JSON.stringify({
        workoutName: workout.name,
        currentExerciseIndex,
        completedSets,
        elapsedTime,
        rpeValues,
        repCount,
      }))
    } else {
      localStorage.removeItem(`workout_progress_${workout.name}`)
    }
  }, [currentExerciseIndex, completedSets, elapsedTime, rpeValues, isFinished, workout.name, repCount])

  useEffect(() => {
    if (!isFinished) {
      workoutTimerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current)
    }
  }, [isFinished])

  useEffect(() => {
    if (isResting && restTimer > 0) {
      timerRef.current = setInterval(() => {
        setRestTimer(prev => prev - 1)
      }, 1000)
    } else if (restTimer === 0) {
      setIsResting(false)
      setRestTimer(60)
      toast.success(t("aw_rest_done"))
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isResting, restTimer, t])

  const currentExercise = workout.exercises[currentExerciseIndex]
  const totalExercises = workout.exercises.length
  const exerciseSets = parseInt(currentExercise.sets) || 3
  const currentExerciseSets = completedSets[currentExercise.name] || new Array(exerciseSets).fill(false)
  const isExerciseComplete = currentExerciseSets.every(Boolean)
  const completedCount = currentExerciseSets.filter(Boolean).length

  const getRepCount = (setIndex: number) => {
    const reps = repCount[currentExercise.name] || []
    return reps[setIndex] ?? (parseInt(currentExercise.reps) || 10)
  }

  const updateRepCount = (setIndex: number, delta: number) => {
    const key = currentExercise.name
    const current = repCount[key] || new Array(exerciseSets).fill(parseInt(currentExercise.reps) || 10)
    const newVal = Math.max(0, Math.min(30, (current[setIndex] ?? (parseInt(currentExercise.reps) || 10)) + delta))
    const updated = [...current]
    updated[setIndex] = newVal
    setRepCount({ ...repCount, [key]: updated })
  }

  const handleSetComplete = (setIndex: number) => {
    if (currentExerciseSets[setIndex]) return
    const newSets = [...currentExerciseSets]
    newSets[setIndex] = true
    setCompletedSets({ ...completedSets, [currentExercise.name]: newSets })
    setIsResting(true)
    setRestTimer(60)
  }

  const handleNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      setIsResting(false)
      setRestTimer(60)
    } else {
      finishWorkout()
    }
  }

  const finishWorkout = () => {
    setIsFinished(true)
    if (workoutTimerRef.current) clearInterval(workoutTimerRef.current)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isFinished) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#09090B", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 380, width: "100%", display: "flex", flexDirection: "column", gap: 32, textAlign: "center" }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <Trophy style={{ width: 48, height: 48, color: "#10B981" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#FAFAFA", marginBottom: 8 }}>{t("aw_finished_title")}</h2>
            <p style={{ fontSize: 14, color: "#71717A" }}>{t("aw_finished_sub")} {workout.name}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, textAlign: "center" }}>
              <Clock style={{ width: 24, height: 24, color: "#3B82F6", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 28, fontWeight: 900, color: "#FAFAFA" }}>{formatTime(elapsedTime)}</div>
              <div style={{ fontSize: 11, color: "#71717A", textTransform: "uppercase", marginTop: 4, letterSpacing: "0.1em" }}>{t("aw_total_time")}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, textAlign: "center" }}>
              <Flame style={{ width: 24, height: 24, color: "#EF4444", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 28, fontWeight: 900, color: "#FAFAFA" }}>{t("aw_kcal_estimate")}</div>
              <div style={{ fontSize: 11, color: "#71717A", textTransform: "uppercase", marginTop: 4, letterSpacing: "0.1em" }}>{t("aw_kcal_est")}</div>
            </div>
          </div>
          <button
            onClick={() => onComplete({ elapsedTime, rpeValues })}
            style={{ width: "100%", height: 56, borderRadius: 16, border: "none", background: "#10B981", color: "#FFFFFF", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Save style={{ width: 20, height: 20 }} />
            {t("aw_save_log")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "#09090B" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", background: "#18181B", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button onClick={onClose} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", flexShrink: 0, color: "rgba(255,255,255,0.6)" }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#FAFAFA", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{workout.name}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <Clock style={{ width: 12, height: 12, color: "#10B981" }} />
                <span style={{ fontSize: 12, color: "#10B981", fontFamily: "monospace", fontWeight: 700 }}>{formatTime(elapsedTime)}</span>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{currentExerciseIndex + 1}/{totalExercises}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <Target style={{ width: 12, height: 12, color: "#10B981" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#10B981" }}>{currentExerciseIndex + 1}/{totalExercises}</span>
          </div>
        </div>
        {/* Progress bars */}
        <div style={{ display: "flex", gap: 4 }}>
          {workout.exercises.map((_: any, idx: number) => {
            const exName = workout.exercises[idx].name
            const exCompleted = completedSets[exName]?.every(Boolean) ?? false
            const isCurrent = idx === currentExerciseIndex
            return (
              <div
                key={idx}
                style={{
                  height: 3,
                  borderRadius: 2,
                  flex: exCompleted ? 1 : isCurrent ? 2 : 1,
                  background: exCompleted ? "#10B981" : isCurrent ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)",
                  transition: "all 0.5s ease",
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 180px" }}>
        {/* Exercise Title */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#FAFAFA", margin: 0, lineHeight: 1.2 }}>{currentExercise.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>{parseInt(currentExercise.sets) || 3} Séries</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>{currentExercise.reps} Reps</span>
          </div>
        </div>

        {/* Stats Widget */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
          {/* Sets */}
          <div style={{ borderRadius: 16, padding: 14, background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Zap style={{ width: 14, height: 14, color: "#10B981" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.08em" }}>Séries</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#FAFAFA" }}>{completedCount}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>/{exerciseSets}</span></span>
          </div>
          {/* RPE */}
          <div style={{ borderRadius: 16, padding: 14, background: "rgba(249,115,22,0.10)", border: "1px solid rgba(249,115,22,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Flame style={{ width: 14, height: 14, color: "#F97316" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#F97316", textTransform: "uppercase", letterSpacing: "0.08em" }}>RPE</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#FAFAFA" }}>{rpeValues[currentExercise.name] || "—"}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>/10</span></span>
          </div>
          {/* Rest */}
          <div style={{ borderRadius: 16, padding: 14, background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Timer style={{ width: 14, height: 14, color: "#3B82F6" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.08em" }}>Descanso</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#FAFAFA" }}>60<span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>s</span></span>
          </div>
        </div>

        {/* Sets List */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 4px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Séries</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{completedCount}/{exerciseSets}</span>
          </div>
          {currentExerciseSets.map((isCompleted: boolean, idx: number) => (
            <div
              key={idx}
              style={{
                padding: 14,
                borderRadius: 16,
                marginBottom: 8,
                border: isCompleted ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.07)",
                background: isCompleted ? "rgba(16,185,129,0.08)" : "#18181B",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Set Number / Check Button */}
                <button
                  onClick={() => handleSetComplete(idx)}
                  disabled={isCompleted}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: "none",
                    cursor: isCompleted ? "default" : "pointer",
                    background: isCompleted ? "#10B981" : "rgba(255,255,255,0.06)",
                    color: isCompleted ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.3s ease",
                    boxShadow: isCompleted ? "0 4px 16px rgba(16,185,129,0.3)" : "none",
                  }}
                >
                  {isCompleted ? (
                    <Check style={{ width: 22, height: 22, strokeWidth: 3 }} />
                  ) : (
                    <span style={{ fontSize: 16, fontWeight: 900 }}>{idx + 1}</span>
                  )}
                </button>

                {/* Set Info + Rep Counter */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isCompleted ? "#10B981" : "#FAFAFA" }}>Série {idx + 1}</div>
                    <div style={{ fontSize: 11, color: isCompleted ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.35)", marginTop: 2 }}>
                      {isCompleted ? "Concluída" : `${currentExercise.reps} reps`}
                    </div>
                  </div>

                  {!isCompleted ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateRepCount(idx, -1) }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.5)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Minus style={{ width: 14, height: 14 }} />
                      </button>
                      <span style={{ width: 36, textAlign: "center", fontWeight: 900, color: "#FAFAFA", fontSize: 17, fontVariantNumeric: "tabular-nums" }}>
                        {getRepCount(idx)}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateRepCount(idx, 1) }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.5)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const newSets = [...currentExerciseSets]
                        newSets[idx] = false
                        setCompletedSets({ ...completedSets, [currentExercise.name]: newSets })
                      }}
                      style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(16,185,129,0.12)", color: "#10B981", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}
                    >
                      {t("aw_undo") || "Desfazer"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Button */}
        <button
          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(getSearchTerm())}`, '_blank')}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "transparent",
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Search style={{ width: 16, height: 16 }} />
          {t("aw_search_google")}
        </button>
      </div>

      {/* Rest Timer Overlay */}
      {isResting && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.94)", backdropFilter: "blur(24px)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Descanso</span>

            {/* Big Timer Ring */}
            <div style={{ position: "relative", width: 200, height: 200 }}>
              <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle
                  cx="100" cy="100" r="90" fill="none" strokeWidth="6"
                  stroke="#10B981"
                  strokeDasharray={2 * Math.PI * 90}
                  strokeDashoffset={2 * Math.PI * 90 * (1 - restTimer / 60)}
                  style={{ transition: "stroke-dashoffset 1s linear", strokeLinecap: "round" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 72, fontWeight: 900, color: "#FAFAFA", fontFamily: "monospace", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {restTimer}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginTop: 4, letterSpacing: "0.1em", fontWeight: 600 }}>segundos</span>
              </div>
            </div>

            {/* Next Exercise Preview */}
            {currentExerciseIndex < totalExercises - 1 && (
              <div style={{ padding: "12px 20px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center", maxWidth: 280 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Próximo</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA", marginTop: 4, margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {workout.exercises[currentExerciseIndex + 1].name}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 280 }}>
              <button
                onClick={() => setRestTimer(prev => prev + 10)}
                style={{ flex: 1, height: 48, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#FAFAFA", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                +10s
              </button>
              <button
                onClick={() => setIsResting(false)}
                style={{ flex: 1, height: 48, borderRadius: 14, border: "none", background: "#10B981", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}
              >
                Pular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar — RPE + Next */}
      {isExerciseComplete && !isResting && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, padding: "16px 16px calc(16px + env(safe-area-inset-bottom, 0px))", background: "#18181B", borderTop: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
          <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* RPE Slider */}
            <div style={{ padding: 16, borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "#0F0F12" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>RPE</span>
                <span style={{ fontWeight: 900, fontVariantNumeric: "tabular-nums", color: "#10B981", fontSize: 18 }}>
                  {rpeValues[currentExercise.name] || 5}<span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>/10</span>
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={rpeValues[currentExercise.name] || 5}
                onChange={(e) => setRpeValues({...rpeValues, [currentExercise.name]: parseInt(e.target.value)})}
                style={{ width: "100%", height: 8, borderRadius: 4, accentColor: "#10B981" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Fácil</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Máximo</span>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextExercise}
              style={{ width: "100%", height: 56, borderRadius: 16, border: "none", background: "#10B981", color: "#FFFFFF", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 24px rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
            >
              {currentExerciseIndex < totalExercises - 1 ? (
                <>Próximo exercício <ChevronRight style={{ width: 20, height: 20 }} /></>
              ) : (
                <>Finalizar <Trophy style={{ width: 20, height: 20 }} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
