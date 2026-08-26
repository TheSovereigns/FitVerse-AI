"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play, Pause, Square, Clock, Flame, Route, Navigation,
  Trophy, PersonStanding, Footprints, Bike, Mountain, Waves, Ship,
  RotateCcw, ArrowUp, TrendingUp, Heart, Gauge,
  Eye, Layers, Activity, Globe, Award, X, Share, ChevronLeft,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

const MapView = dynamic(() => import("./gps-map").then(m => m.default), { ssr: false })
const ShareCard = dynamic(() => import("./share-card").then(m => m.ShareCard), { ssr: false })

interface GpsPoint {
  lat: number; lng: number; timestamp: number; altitude?: number; speed?: number
}

interface GpsSession {
  id: string; activityType: string; points: GpsPoint[]
  duration: number; distance: number; calories: number
  avgSpeed: number; maxSpeed: number
  steps: number; elevation: number; maxElevation: number
  startedAt: string; endedAt: string
}

interface ActivityType {
  id: string; icon: any; label: string; labelEn: string
  met: number; stepLength: number
}

const ACTIVITIES: ActivityType[] = [
  { id: "walking", icon: PersonStanding, label: "Caminhada", labelEn: "Walking", met: 3.5, stepLength: 0.762 },
  { id: "running", icon: Footprints, label: "Corrida", labelEn: "Running", met: 8.0, stepLength: 1.0 },
  { id: "cycling", icon: Bike, label: "Bicicleta", labelEn: "Cycling", met: 6.0, stepLength: 0 },
  { id: "hiking", icon: Mountain, label: "Trilha", labelEn: "Hiking", met: 5.0, stepLength: 0.85 },
  { id: "swimming", icon: Waves, label: "Natação", labelEn: "Swimming", met: 7.0, stepLength: 0 },
  { id: "rowing", icon: Ship, label: "Remo", labelEn: "Rowing", met: 6.5, stepLength: 0 },
  { id: "elliptical", icon: RotateCcw, label: "Elíptico", labelEn: "Elliptical", met: 5.5, stepLength: 0.7 },
  { id: "stairs", icon: ArrowUp, label: "Escada", labelEn: "Stairs", met: 8.5, stepLength: 0.3 },
]

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function calculateCalories(met: number, weightKg: number, hours: number) {
  return Math.round(met * weightKg * hours)
}

function calculateSteps(distanceKm: number, stepLength: number): number {
  if (stepLength === 0) return 0
  return Math.round((distanceKm * 1000) / stepLength)
}

function calculateElevation(points: GpsPoint[]): { total: number; max: number } {
  let total = 0, max = -Infinity
  for (let i = 1; i < points.length; i++) {
    const alt = points[i].altitude
    const prevAlt = points[i - 1].altitude
    if (alt != null && prevAlt != null) {
      const diff = alt - prevAlt
      if (diff > 0) total += diff
      if (alt > max) max = alt
    }
  }
  return { total: Math.round(total), max: max === -Infinity ? 0 : Math.round(max) }
}

function estimateHeartRate(met: number, intensity: number): number {
  return Math.round(60 + (met * 8) + (intensity * 20))
}

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

function fmtDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(2)} km`
}

function fmtPace(distance: number, duration: number) {
  if (distance === 0) return "0:00"
  const minPerKm = (duration / 60) / distance
  return `${Math.floor(minPerKm)}:${String(Math.round((minPerKm % 1) * 60)).padStart(2, "0")}`
}

export function CorridaTracker({ onBack }: { onBack?: () => void }) {
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const [sessions, setSessions] = useLocalStorage<GpsSession[]>("fitverse-orbit-sessions", [])
  const [selectedActivity, setSelectedActivity] = useState("running")
  const [status, setStatus] = useState<"idle" | "tracking" | "paused">("idle")
  const [points, setPoints] = useState<GpsPoint[]>([])
  const [duration, setDuration] = useState(0)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showActivityPicker, setShowActivityPicker] = useState(false)
  const [showGhost, setShowGhost] = useState(false)
  const [replaySession, setReplaySession] = useState<GpsSession | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [lastSessionData, setLastSessionData] = useState<GpsSession | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedDurationRef = useRef(0)

  const activity = useMemo(() => ACTIVITIES.find((a) => a.id === selectedActivity) || ACTIVITIES[1], [selectedActivity])

  const distance = useMemo(() => {
    let d = 0
    for (let i = 1; i < points.length; i++) d += haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
    return d
  }, [points])

  const calories = useMemo(() => calculateCalories(activity.met, 70, duration / 3600), [activity.met, duration])
  const steps = useMemo(() => calculateSteps(distance, activity.stepLength), [distance, activity.stepLength])
  const elevation = useMemo(() => calculateElevation(points), [points])
  const avgSpeed = useMemo(() => duration === 0 ? 0 : (distance / duration) * 3600, [distance, duration])
  const currentSpeed = useMemo(() => {
    if (points.length < 2) return 0
    const last = points[points.length - 1], prev = points[points.length - 2]
    const d = haversineDistance(prev.lat, prev.lng, last.lat, last.lng)
    const dt = (last.timestamp - prev.timestamp) / 1000
    return dt > 0 ? (d / dt) * 3600 : 0
  }, [points])
  const maxSpeed = useMemo(() => {
    let max = 0
    for (let i = 1; i < points.length; i++) {
      const d = haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
      const dt = (points[i].timestamp - points[i - 1].timestamp) / 1000
      if (dt > 0) max = Math.max(max, (d / dt) * 3600)
    }
    return max
  }, [points])

  const pace = useMemo(() => fmtPace(distance, duration), [distance, duration])

  const heartRate = useMemo(() => {
    const intensity = Math.min(currentSpeed / (activity.id === "running" ? 15 : activity.id === "cycling" ? 35 : 8), 1)
    return estimateHeartRate(activity.met, intensity)
  }, [currentSpeed, activity])

  const isTracking = status !== "idle"

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return
    startTimeRef.current = Date.now(); pausedDurationRef.current = 0; setDuration(0); setPoints([])
    timerRef.current = setInterval(() => setDuration(Math.floor((Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000)), 1000)
    const id = navigator.geolocation.watchPosition(
      (pos) => setPoints((p) => [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: Date.now(), altitude: pos.coords.altitude ?? undefined, speed: pos.coords.speed ?? undefined }]),
      () => {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    setWatchId(id); setStatus("tracking")
  }, [])

  const pauseTracking = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    pausedDurationRef.current += Date.now() - startTimeRef.current - pausedDurationRef.current
    setStatus("paused")
  }, [watchId])

  const resumeTracking = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current
    timerRef.current = setInterval(() => setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000)
    const id = navigator.geolocation.watchPosition(
      (pos) => setPoints((p) => [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: Date.now(), altitude: pos.coords.altitude ?? undefined, speed: pos.coords.speed ?? undefined }]),
      () => {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    setWatchId(id); setStatus("tracking")
  }, [])

  const stopTracking = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    if (points.length > 0 && duration > 5) {
      const session: GpsSession = {
        id: Date.now().toString(), activityType: selectedActivity, points, duration, distance, calories,
        avgSpeed, maxSpeed, steps, elevation: elevation.total, maxElevation: elevation.max,
        startedAt: new Date(points[0].timestamp).toISOString(), endedAt: new Date().toISOString(),
      }
      setSessions((prev) => [session, ...prev].slice(0, 50))
      setLastSessionData(session)
      setShowSummary(true)
    }
    setStatus("idle"); setPoints([]); setDuration(0); setWatchId(null)
  }, [watchId, points, duration, distance, calories, avgSpeed, maxSpeed, steps, elevation, selectedActivity, setSessions])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); if (watchId !== null) navigator.geolocation.clearWatch(watchId) }, [watchId])

  const lastSession = sessions[0]
  const displayPoints = replaySession?.points || points
  const displayGhost = showGhost && !!lastSession && !replaySession ? lastSession.points : []

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Full-screen Map */}
      <div className="absolute inset-0 z-0">
        <MapView points={displayPoints} ghostPoints={displayGhost} showGhost={showGhost && !replaySession} isTracking={isTracking} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 15%, transparent 60%, rgba(0,0,0,0.85) 100%)",
        }} />
      </div>

      {/* HUD */}
      <div className="relative z-10 min-h-screen flex flex-col pointer-events-none">
        {/* Top Bar */}
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {onBack && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
                  className="h-10 w-10 bg-black/60 backdrop-blur-xl border border-border rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors pointer-events-auto">
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
              )}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-black/60 backdrop-blur-xl rounded-2xl px-4 py-3 border border-border">
              <div className="w-9 h-9 rounded-xl bg-brand/15 flex items-center justify-center">
                <activity.icon className="w-4.5 h-4.5 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">{isEnglish ? activity.labelEn : activity.label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isTracking && <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-brand" />}
                  <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium">
                    {status === "idle" ? (isEnglish ? "Ready" : "Pronto") : status === "tracking" ? (isEnglish ? "Live" : "Ao Vivo") : (isEnglish ? "Paused" : "Pausado")}
                  </span>
                </div>
              </div>
            </motion.div>
            </div>

            <div className="flex flex-col gap-2">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowActivityPicker(true)}
                className="w-10 h-10 bg-black/60 backdrop-blur-xl border border-border rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                <Layers className="w-4 h-4" />
              </motion.button>
              {lastSession && !isTracking && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowHistory(true)}
                  className="w-10 h-10 bg-black/60 backdrop-blur-xl border border-border rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                  <Trophy className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <AnimatePresence mode="wait">
            {isTracking && (
              <motion.div key="timer" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="text-center">
                <p className="font-black text-white tabular-nums tracking-tight" style={{ fontSize: "clamp(3rem, 10vw, 5rem)", textShadow: "0 0 40px rgba(0,0,0,0.5)" }}>
                  {fmtDuration(duration)}
                </p>
                <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] mt-3 font-medium">{isEnglish ? "Duration" : "Duração"}</p>
                {currentSpeed > 0 && (
                  <div className="mt-5 inline-flex items-center gap-2.5 bg-black/50 backdrop-blur-xl rounded-full px-5 py-2.5 border border-border">
                    <Gauge className="w-4 h-4 text-brand" />
                    <span className="text-xl font-bold text-white tabular-nums">{currentSpeed.toFixed(1)}</span>
                    <span className="text-xs text-white/40">km/h</span>
                  </div>
                )}
              </motion.div>
            )}
            {!isTracking && displayPoints.length === 0 && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-white/5 border border-border flex items-center justify-center">
                  <activity.icon className="w-10 h-10 text-white/20" />
                </div>
                <p className="text-base font-semibold text-white/80">{isEnglish ? "Tap to start" : "Toque para iniciar"}</p>
                <p className="text-xs text-white/30 mt-1.5">{isEnglish ? activity.labelEn : activity.label}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Panel */}
        <div className="pointer-events-auto pb-6 px-4">
          {/* Stats */}
          {(isTracking || displayPoints.length > 0) && (
            <div className="mb-4 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Clock, value: fmtDuration(duration), label: isEnglish ? "Time" : "Tempo" },
                  { icon: Route, value: fmtDist(distance), label: isEnglish ? "Dist" : "Distância" },
                  { icon: Flame, value: `${calories}`, label: "kcal" },
                ].map((s, i) => (
                  <div key={i} className="bg-black/50 backdrop-blur-xl border border-border rounded-2xl p-3 text-center">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-white/5 flex items-center justify-center mb-2">
                      <s.icon className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <p className="text-base font-bold text-white tabular-nums leading-none">{s.value}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1.5 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x opacity-80 pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
                {[
                  { icon: Navigation, value: pace, label: "min/km" },
                  { icon: Footprints, value: steps > 0 ? steps.toLocaleString() : "—", label: isEnglish ? "Steps" : "Passos" },
                ].map((s, i) => (
                  <div key={i} className="min-w-[120px] flex-1 snap-center bg-black/50 backdrop-blur-xl border border-border rounded-2xl p-3 text-center">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-white/5 flex items-center justify-center mb-2">
                      <s.icon className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <p className="text-base font-bold text-white tabular-nums leading-none">{s.value}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1.5 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center items-center gap-4">
            {status === "idle" && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={startTracking}
                className="h-16 w-16 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/30 hover:bg-brand/90 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                <Play className="w-6 h-6 text-white ml-1" fill="white" />
              </motion.button>
            )}
            {status === "tracking" && (
              <>
                <motion.button whileTap={{ scale: 0.95 }} onClick={pauseTracking}
                  className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-border flex items-center justify-center text-white/70 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                  <Pause className="w-5 h-5" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={stopTracking}
                  className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors">
                  <Square className="w-5 h-5 text-white" fill="white" />
                </motion.button>
              </>
            )}
            {status === "paused" && (
              <>
                <motion.button whileTap={{ scale: 0.95 }} onClick={stopTracking}
                  className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-border flex items-center justify-center text-white/70 hover:text-white transition-colors">
                  <Square className="w-4 h-4" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={resumeTracking}
                  className="h-16 w-16 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/30 hover:bg-brand/90 transition-colors">
                  <Play className="w-6 h-6 text-white ml-1" fill="white" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Session Summary */}
      <AnimatePresence>
        {showSummary && lastSessionData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSummary(false)} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-sm mx-4 bg-background border border-border rounded-3xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand/10 flex items-center justify-center">
                <Award className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                {isEnglish ? "Session Complete!" : "Treino Completo!"}
              </h3>
              <p className="text-sm text-white/40 mb-6">
                {isEnglish ? "Great workout!" : "Ótimo treino!"}
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-lg font-bold text-white tabular-nums">{fmtDist(lastSessionData.distance)}</p>
                  <p className="text-[10px] text-white/30 mt-1">{isEnglish ? "Distance" : "Distância"}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-lg font-bold text-white tabular-nums">{fmtDuration(lastSessionData.duration)}</p>
                  <p className="text-[10px] text-white/30 mt-1">{isEnglish ? "Duration" : "Tempo"}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-lg font-bold text-white tabular-nums">{lastSessionData.calories}</p>
                  <p className="text-[10px] text-white/30 mt-1">kcal</p>
                </div>
              </div>

              {lastSessionData.steps > 0 && (
                <div className="flex items-center justify-center gap-2 mb-5 text-white/40">
                  <Footprints className="w-4 h-4" />
                  <span className="text-sm">{lastSessionData.steps.toLocaleString()} {isEnglish ? "steps" : "passos"}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setShowSummary(false); setShowShare(true) }}
                  className="flex-1 h-12 rounded-xl bg-brand text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand/90 transition-colors shadow-lg shadow-brand/25">
                  <Share className="w-4 h-4" />
                  {isEnglish ? "Share" : "Compartilhar"}
                </button>
                <button onClick={() => setShowSummary(false)}
                  className="h-12 px-5 rounded-xl bg-white/5 text-white/60 font-semibold text-sm border border-border hover:bg-white/10 transition-colors">
                  {isEnglish ? "Done" : "Fechar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Card Modal */}
      <AnimatePresence>
        {showShare && lastSessionData && (
          <ShareCard
            data={{
              activityType: lastSessionData.activityType,
              activityLabel: isEnglish
                ? (ACTIVITIES.find(a => a.id === lastSessionData.activityType)?.labelEn || "Activity")
                : (ACTIVITIES.find(a => a.id === lastSessionData.activityType)?.label || "Atividade"),
              points: lastSessionData.points,
              duration: lastSessionData.duration,
              distance: lastSessionData.distance,
              calories: lastSessionData.calories,
              avgSpeed: lastSessionData.avgSpeed,
              maxSpeed: lastSessionData.maxSpeed,
              steps: lastSessionData.steps,
              elevation: lastSessionData.elevation,
              pace: fmtPace(lastSessionData.distance, lastSessionData.duration),
              startedAt: lastSessionData.startedAt,
            }}
            onClose={() => setShowShare(false)}
            isEnglish={isEnglish}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showActivityPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowActivityPicker(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg mx-4 rounded-t-3xl md:rounded-3xl bg-background border border-border p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{isEnglish ? "Choose Activity" : "Escolher Atividade"}</h3>
                  <p className="text-xs text-white/40 mt-1">{isEnglish ? "Select your cardio workout" : "Selecione seu treino"}</p>
                </div>
                <button onClick={() => setShowActivityPicker(false)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ACTIVITIES.map((a) => (
                  <motion.button key={a.id} whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedActivity(a.id); setShowActivityPicker(false) }}
                    className={cn(
                      "p-4 rounded-2xl border text-center transition-all",
                      selectedActivity === a.id ? "border-brand bg-brand/10" : "border-border bg-muted/30 hover:bg-muted/50"
                    )}>
                    <div className={cn("w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3",
                      selectedActivity === a.id ? "bg-brand/15" : "bg-white/5")}>
                      <a.icon className={cn("w-6 h-6", selectedActivity === a.id ? "text-brand" : "text-white/30")} />
                    </div>
                    <p className="text-sm font-semibold text-white">{isEnglish ? a.labelEn : a.label}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg mx-4 rounded-t-3xl md:rounded-3xl bg-background border border-border p-6 max-h-[75vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-5 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-white">{isEnglish ? "History" : "Histórico"}</h3>
                  <p className="text-xs text-white/40 mt-1">{sessions.length} {isEnglish ? "sessions" : "sessões"}</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
                {sessions.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-white/40">{isEnglish ? "No sessions yet" : "Nenhuma sessão ainda"}</p>
                  </div>
                ) : sessions.map((s) => {
                  const act = ACTIVITIES.find((a) => a.id === s.activityType) || ACTIVITIES[1]
                  return (
                    <div key={s.id}
                      onClick={() => { setReplaySession(s); setShowHistory(false) }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border hover:bg-muted/50 transition-all cursor-pointer">
                      <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                        <act.icon className="w-5 h-5 text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{isEnglish ? act.labelEn : act.label}</p>
                          <span className="text-[10px] text-white/30 px-2 py-0.5 rounded-full bg-white/5">
                            {new Date(s.startedAt).toLocaleDateString(isEnglish ? "en-US" : "pt-BR", { day: "2-digit", month: "short" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-white/30 flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtDuration(s.duration)}</span>
                          <span className="text-[10px] text-white/30 flex items-center gap-1"><Flame className="w-3 h-3" /> {s.calories}kcal</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white tabular-nums">{fmtDist(s.distance)}</p>
                        <p className="text-[10px] text-white/30">{s.avgSpeed.toFixed(1)} km/h</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replay bar */}
      <AnimatePresence>
        {replaySession && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-black/60 backdrop-blur-xl border border-border rounded-full px-5 py-2.5 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-brand" />
                <span className="text-xs font-semibold text-white">{isEnglish ? "Replay" : "Replay"}</span>
              </div>
              <button onClick={() => setReplaySession(null)}
                className="text-xs text-white/40 hover:text-white transition-colors">
                {isEnglish ? "Close" : "Fechar"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
