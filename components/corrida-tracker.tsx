"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play, Pause, Square, Clock, Flame, Route, Navigation, Zap,
  Trophy, PersonStanding, Footprints, Bike, Mountain,
  Eye, Layers, Activity, Globe,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────
interface GpsPoint {
  lat: number; lng: number; timestamp: number; altitude?: number; speed?: number
}

interface GpsSession {
  id: string; activityType: string; points: GpsPoint[]
  duration: number; distance: number; calories: number
  avgSpeed: number; maxSpeed: number
  startedAt: string; endedAt: string
}

interface ActivityType {
  id: string; icon: any; label: string; labelEn: string
  met: number; neon: string; glow: string; ring: string
}

const ACTIVITIES: ActivityType[] = [
  { id: "walking", icon: PersonStanding, label: "Andando", labelEn: "Walking", met: 3.5, neon: "#22c55e", glow: "rgba(34,197,94,0.4)", ring: "rgba(34,197,94,0.15)" },
  { id: "running", icon: Footprints, label: "Correndo", labelEn: "Running", met: 8.0, neon: "#f97316", glow: "rgba(249,115,22,0.4)", ring: "rgba(249,115,22,0.15)" },
  { id: "cycling", icon: Bike, label: "Bicicleta", labelEn: "Cycling", met: 6.0, neon: "#06b6d4", glow: "rgba(6,182,212,0.4)", ring: "rgba(6,182,212,0.15)" },
  { id: "hiking", icon: Mountain, label: "Trilha", labelEn: "Hiking", met: 5.0, neon: "#a855f7", glow: "rgba(168,85,247,0.4)", ring: "rgba(168,85,247,0.15)" },
]

// ─── Helpers ─────────────────────────────────────────────────────
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

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

function fmtDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(2)} km`
}

function fmtSpeed(kmh: number) {
  return `${kmh.toFixed(1)}`
}

function latLngToXY(lat: number, lng: number, w: number, h: number): [number, number] {
  const x = ((lng + 180) / 360) * w
  const y = ((90 - lat) / 180) * h
  return [x, y]
}

// ─── 3D Globe Canvas ─────────────────────────────────────────────
function GlobeCanvas({
  points, activity, ghostPoints, showGhost,
}: {
  points: GpsPoint[]; activity: ActivityType; ghostPoints: GpsPoint[]; showGhost: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const rotRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener("resize", resize)

    const NEON = activity.neon
    const w = () => canvas.getBoundingClientRect().width
    const h = () => canvas.getBoundingClientRect().height

    const drawGlobe = (rot: number) => {
      const cw = w(), ch = h()
      ctx.clearRect(0, 0, cw, ch)

      const cx = cw / 2, cy = ch / 2
      const r = Math.min(cw, ch) * 0.35

      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.5)
      glow.addColorStop(0, `${NEON}15`)
      glow.addColorStop(1, "transparent")
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, cw, ch)

      // Globe sphere
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r)
      grad.addColorStop(0, "#1a1a2e")
      grad.addColorStop(0.7, "#0f0f1a")
      grad.addColorStop(1, "#050510")
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Neon ring
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = `${NEON}30`
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Grid lines
      ctx.strokeStyle = `${NEON}10`
      ctx.lineWidth = 0.5
      for (let i = -60; i <= 60; i += 30) {
        ctx.beginPath()
        const offsetY = (i / 90) * r * 0.8
        const halfW = Math.sqrt(Math.max(0, r * r - offsetY * offsetY))
        ctx.ellipse(cx, cy + offsetY, halfW, halfW * 0.15, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      for (let i = 0; i < 360; i += 30) {
        const angle = ((i + rot) * Math.PI) / 180
        ctx.beginPath()
        ctx.ellipse(cx, cy, Math.abs(Math.cos(angle)) * r, r, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw route
      if (points.length > 1) {
        // Ghost trail
        if (showGhost && ghostPoints.length > 1) {
          ctx.beginPath()
          ghostPoints.forEach((p, i) => {
            const [px, py] = latLngToXY(p.lat, p.lng, 360, 180)
            const x = cx + ((px - 180) / 180) * r * Math.cos(rot * Math.PI / 180)
            const y = cy + ((90 - py) / 90) * r * 0.5
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
          })
          ctx.strokeStyle = "rgba(255,255,255,0.12)"
          ctx.lineWidth = 2
          ctx.setLineDash([4, 4])
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Glow trail
        ctx.beginPath()
        points.forEach((p, i) => {
          const [px, py] = latLngToXY(p.lat, p.lng, 360, 180)
          const x = cx + ((px - 180) / 180) * r * Math.cos(rot * Math.PI / 180)
          const y = cy + ((90 - py) / 90) * r * 0.5
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        })
        ctx.strokeStyle = `${NEON}30`
        ctx.lineWidth = 10
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.stroke()

        // Main trail
        ctx.beginPath()
        points.forEach((p, i) => {
          const [px, py] = latLngToXY(p.lat, p.lng, 360, 180)
          const x = cx + ((px - 180) / 180) * r * Math.cos(rot * Math.PI / 180)
          const y = cy + ((90 - py) / 90) * r * 0.5
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        })
        ctx.strokeStyle = NEON
        ctx.lineWidth = 3
        ctx.stroke()

        // Start marker
        const [sx, sy] = latLngToXY(points[0].lat, points[0].lng, 360, 180)
        const smx = cx + ((sx - 180) / 180) * r * Math.cos(rot * Math.PI / 180)
        const smy = cy + ((90 - sy) / 90) * r * 0.5
        ctx.beginPath()
        ctx.arc(smx, smy, 5, 0, Math.PI * 2)
        ctx.fillStyle = "#22c55e"
        ctx.fill()
        ctx.strokeStyle = "#fff"
        ctx.lineWidth = 2
        ctx.stroke()

        // Current marker with pulse
        const last = points[points.length - 1]
        const [lx, ly] = latLngToXY(last.lat, last.lng, 360, 180)
        const lmx = cx + ((lx - 180) / 180) * r * Math.cos(rot * Math.PI / 180)
        const lmy = cy + ((90 - ly) / 90) * r * 0.5

        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(lmx, lmy, 12 * pulse, 0, Math.PI * 2)
        ctx.fillStyle = `${NEON}30`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(lmx, lmy, 6, 0, Math.PI * 2)
        ctx.fillStyle = NEON
        ctx.fill()
        ctx.strokeStyle = "#fff"
        ctx.lineWidth = 2
        ctx.stroke()

        // Particles
        const t = Date.now() / 1000
        for (let i = 0; i < Math.min(points.length, 30); i++) {
          const idx = Math.floor((i / 30) * points.length)
          const p = points[idx]
          const [ppx, ppy] = latLngToXY(p.lat, p.lng, 360, 180)
          const ppx2 = cx + ((ppx - 180) / 180) * r * Math.cos(rot * Math.PI / 180)
          const ppy2 = cy + ((90 - ppy) / 90) * r * 0.5
          const ox = Math.sin(t * 2 + i * 0.5) * 8
          const oy = Math.cos(t * 1.5 + i * 0.7) * 8
          const alpha = (Math.sin(t * 3 + i) + 1) / 2 * 0.6
          ctx.beginPath()
          ctx.arc(ppx2 + ox, ppy2 + oy, 2, 0, Math.PI * 2)
          ctx.fillStyle = `${NEON}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`
          ctx.fill()
        }
      }

      // Stars background
      for (let i = 0; i < 40; i++) {
        const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * cw
        const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * ch
        const alpha = Math.sin(Date.now() / 2000 + i) * 0.3 + 0.3
        ctx.beginPath()
        ctx.arc(sx, sy, 0.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      }
    }

    const animate = () => {
      if (points.length === 0) rotRef.current += 0.15
      drawGlobe(rotRef.current)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [points, activity, ghostPoints, showGhost])

  return <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: "auto" }} />
}

// ─── Speed Graph ─────────────────────────────────────────────────
function NeonSpeedGraph({ speeds, color }: { speeds: number[]; color: string }) {
  if (speeds.length < 3) return null
  const recent = speeds.slice(-60)
  const max = Math.max(...recent, 1)

  return (
    <div className="h-12 flex items-end gap-[2px]">
      {recent.map((spd, i) => {
        const h = (spd / max) * 100
        return (
          <div key={i} className="flex-1 rounded-t-sm opacity-80 transition-all"
            style={{ height: `${Math.max(h, 4)}%`, background: `linear-gradient(to top, ${color}, ${color}80)` }} />
        )
      })}
    </div>
  )
}

// ─── HUD Stat ────────────────────────────────────────────────────
function HudStat({
  icon: Icon, value, label, color, delay = 0,
}: {
  icon: any; value: string; label: string; color: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      className="relative"
    >
      <div className="absolute inset-0 rounded-2xl opacity-20 blur-xl" style={{ background: color }} />
      <div className="relative glass-strong border border-white/[0.08] rounded-2xl p-3 backdrop-blur-2xl">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-[9px] uppercase tracking-[0.15em] text-white/40 font-medium">{label}</span>
        </div>
        <p className="text-xl font-black text-white tabular-nums leading-none" style={{ textShadow: `0 0 20px ${color}` }}>
          {value}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Activity Picker ─────────────────────────────────────────────
function ActivityPicker({
  selected, onSelect, onClose, isEnglish,
}: {
  selected: string; onSelect: (id: string) => void; onClose: () => void; isEnglish: boolean
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative z-10 w-full max-w-md mx-4 glass-strong border border-white/[0.08] rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">{isEnglish ? "Choose Activity" : "Escolher Atividade"}</h3>
            <p className="text-xs text-white/40">{isEnglish ? "Select your workout type" : "Selecione o tipo de treino"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
            <Zap className="w-4 h-4 text-white/60" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ACTIVITIES.map((a) => (
            <button key={a.id} onClick={() => { onSelect(a.id); onClose() }}
              className={cn("relative group p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden",
                selected === a.id ? "border-opacity-100" : "border-white/[0.06] hover:border-white/[0.12]"
              )}
              style={{ borderColor: selected === a.id ? a.neon : undefined, background: selected === a.id ? a.ring : "rgba(255,255,255,0.02)" }}>
              {selected === a.id && (
                <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 30% 30%, ${a.neon}, transparent 70%)` }} />
              )}
              <div className="relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `linear-gradient(135deg, ${a.neon}20, ${a.neon}08)` }}>
                  <a.icon className="w-6 h-6" style={{ color: a.neon }} />
                </div>
                <p className="text-sm font-bold text-white">{isEnglish ? a.labelEn : a.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5">MET {a.met}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── History Panel ───────────────────────────────────────────────
function HistoryPanel({
  sessions, isEnglish, onClose, onReplay,
}: {
  sessions: GpsSession[]; isEnglish: boolean; onClose: () => void; onReplay: (s: GpsSession) => void
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative z-10 w-full max-w-lg mx-4 glass-strong border border-white/[0.08] rounded-3xl p-6 max-h-[70vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">{isEnglish ? "Orbit History" : "Histórico Orbit"}</h3>
            <p className="text-xs text-white/40">{sessions.length} {isEnglish ? "sessions" : "sessões"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
            <Zap className="w-4 h-4 text-white/60" />
          </button>
        </div>
        <div className="space-y-2 overflow-y-auto overflow-x-hidden pr-1 flex-1 min-h-0">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">{isEnglish ? "No sessions yet" : "Nenhuma sessão ainda"}</p>
            </div>
          ) : (
            sessions.map((s, idx) => {
              const act = ACTIVITIES.find((a) => a.id === s.activityType) || ACTIVITIES[1]
              return (
                <motion.div key={s.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.1] transition-all group">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${act.neon}25, ${act.neon}10)` }}>
                    <act.icon className="w-5 h-5" style={{ color: act.neon }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{isEnglish ? act.labelEn : act.label}</p>
                      <span className="text-[10px] text-white/30">
                        {new Date(s.startedAt).toLocaleDateString(isEnglish ? "en-US" : "pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtDuration(s.duration)}</span>
                      <span className="text-[10px] text-white/40 flex items-center gap-1"><Flame className="w-3 h-3" /> {s.calories}kcal</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <p className="text-lg font-black text-white tabular-nums">{fmtDist(s.distance)}</p>
                      <p className="text-[10px] text-white/30">{s.avgSpeed.toFixed(1)} km/h</p>
                    </div>
                    <button onClick={() => onReplay(s)}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10">
                      <Eye className="w-3.5 h-3.5 text-white/60" />
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
export function CorridaTracker() {
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
  const avgSpeed = useMemo(() => duration === 0 ? 0 : (distance / duration) * 3600, [distance, duration])
  const maxSpeed = useMemo(() => {
    let max = 0
    for (let i = 1; i < points.length; i++) {
      const d = haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
      const dt = (points[i].timestamp - points[i - 1].timestamp) / 1000
      if (dt > 0) max = Math.max(max, (d / dt) * 3600)
    }
    return max
  }, [points])

  const pace = useMemo(() => {
    if (distance === 0) return "0:00"
    const minPerKm = (duration / 60) / distance
    return `${Math.floor(minPerKm)}:${String(Math.round((minPerKm % 1) * 60)).padStart(2, "0")}`
  }, [distance, duration])

  const speedHistory = useMemo(() => {
    const speeds: number[] = []
    for (let i = 1; i < points.length; i++) {
      const d = haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
      const dt = (points[i].timestamp - points[i - 1].timestamp) / 1000
      speeds.push(dt > 0 ? (d / dt) * 3600 : 0)
    }
    return speeds
  }, [points])

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
      setSessions((prev) => [{
        id: Date.now().toString(), activityType: selectedActivity, points, duration, distance, calories,
        avgSpeed, maxSpeed, startedAt: new Date(points[0].timestamp).toISOString(), endedAt: new Date().toISOString(),
      }, ...prev].slice(0, 50))
    }
    setStatus("idle"); setPoints([]); setDuration(0); setWatchId(null)
  }, [watchId, points, duration, distance, calories, avgSpeed, maxSpeed, selectedActivity, setSessions])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); if (watchId !== null) navigator.geolocation.clearWatch(watchId) }, [watchId])

  const lastSession = sessions[0]
  const displayPoints = replaySession?.points || points
  const displayGhost = showGhost && !!lastSession && !replaySession ? lastSession.points : []

  return (
    <div className="min-h-screen -mx-4 -mt-4 md:-mx-8 md:-mt-4 lg:-mx-12 lg:-mt-4 relative overflow-hidden bg-[#050510]">
      {/* Full-screen Globe Canvas */}
      <div className="absolute inset-0">
        <GlobeCanvas points={displayPoints} activity={activity} ghostPoints={displayGhost} showGhost={showGhost && !replaySession} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(5,5,16,0.8) 100%)`,
        }} />
        <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 50% -20%, ${activity.neon}15, transparent 70%)`,
        }} />
      </div>

      {/* HUD */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between pointer-events-none p-4 md:p-6">
        {/* Top bar */}
        <div className="flex items-start justify-between pointer-events-auto">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="glass-strong border border-white/[0.08] rounded-2xl p-3 flex items-center gap-3 backdrop-blur-2xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${activity.neon}30, ${activity.neon}10)` }}>
              <activity.icon className="w-5 h-5" style={{ color: activity.neon }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{isEnglish ? activity.labelEn : activity.label}</p>
              <div className="flex items-center gap-1.5">
                {isTracking && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: activity.neon }} />}
                <span className="text-[10px] text-white/40">
                  {status === "idle" ? (isEnglish ? "Ready" : "Pronto") : status === "tracking" ? (isEnglish ? "Live" : "Ao Vivo") : (isEnglish ? "Paused" : "Pausado")}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-2">
            <motion.button initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setShowActivityPicker(true)}
              className="w-10 h-10 glass-strong border border-white/[0.08] rounded-xl flex items-center justify-center backdrop-blur-2xl hover:bg-white/[0.05]">
              <Layers className="w-4 h-4 text-white/60" />
            </motion.button>
            {lastSession && !isTracking && (
              <motion.button initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                whileTap={{ scale: 0.9 }} onClick={() => setShowGhost(!showGhost)}
                className={cn("w-10 h-10 glass-strong border rounded-xl flex items-center justify-center backdrop-blur-2xl transition-colors",
                  showGhost ? "border-white/20 bg-white/[0.08]" : "border-white/[0.08] hover:bg-white/[0.05]")}>
                <Eye className="w-4 h-4 text-white/60" />
              </motion.button>
            )}
            <motion.button initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}
              whileTap={{ scale: 0.9 }} onClick={() => setShowHistory(true)}
              className="w-10 h-10 glass-strong border border-white/[0.08] rounded-xl flex items-center justify-center backdrop-blur-2xl hover:bg-white/[0.05]">
              <Trophy className="w-4 h-4 text-white/60" />
            </motion.button>
          </div>
        </div>

        {/* Center timer */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence>
            {isTracking && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 blur-3xl opacity-30" style={{ background: activity.neon }} />
                  <p className="relative text-6xl md:text-8xl font-black text-white tabular-nums"
                    style={{ textShadow: `0 0 40px ${activity.neon}, 0 0 80px ${activity.neon}50` }}>
                    {fmtDuration(duration)}
                  </p>
                </div>
                <p className="text-xs text-white/30 uppercase tracking-[0.3em] mt-2">{isEnglish ? "Duration" : "Duração"}</p>
              </motion.div>
            )}
            {!isTracking && displayPoints.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <Globe className="w-16 h-16 mx-auto mb-4" style={{ color: activity.neon, opacity: 0.3 }} />
                <p className="text-sm text-white/20">{isEnglish ? "Tap to start orbit" : "Toque para iniciar órbita"}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom */}
        <div className="space-y-4 pointer-events-auto">
          {(isTracking || displayPoints.length > 0) && (
            <div className="grid grid-cols-4 gap-2">
              <HudStat icon={Clock} value={fmtDuration(duration)} label={isEnglish ? "Time" : "Tempo"} color={activity.neon} delay={0} />
              <HudStat icon={Route} value={fmtDist(distance)} label={isEnglish ? "Dist" : "Dist"} color="#06b6d4" delay={0.05} />
              <HudStat icon={Flame} value={`${calories}`} label="kcal" color="#f97316" delay={0.1} />
              <HudStat icon={Navigation} value={pace} label="min/km" color="#22c55e" delay={0.15} />
            </div>
          )}

          {(isTracking || displayPoints.length > 0) && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="glass-strong border border-white/[0.08] rounded-2xl p-4 backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" style={{ color: activity.neon }} />
                  <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">{isEnglish ? "Speed Profile" : "Perfil de Velocidade"}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-white tabular-nums">{avgSpeed.toFixed(1)} <span className="text-[9px] text-white/30">km/h</span></p>
                    <p className="text-[9px] text-white/20">{isEnglish ? "Avg" : "Média"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white tabular-nums">{maxSpeed.toFixed(1)} <span className="text-[9px] text-white/30">km/h</span></p>
                    <p className="text-[9px] text-white/20">{isEnglish ? "Max" : "Máx"}</p>
                  </div>
                </div>
              </div>
              <NeonSpeedGraph speeds={speedHistory} color={activity.neon} />
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex justify-center items-center gap-5 py-4">
            {status === "idle" && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={startTracking} className="relative group">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" style={{ background: activity.neon }} />
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${activity.neon}, ${activity.neon}cc)`, boxShadow: `0 0 40px ${activity.neon}50, 0 0 80px ${activity.neon}30` }}>
                  <Play className="w-8 h-8 ml-1" />
                </div>
              </motion.button>
            )}
            {status === "tracking" && (
              <>
                <motion.button whileTap={{ scale: 0.9 }} onClick={pauseTracking}
                  className="w-16 h-16 glass-strong border border-white/[0.12] rounded-full flex items-center justify-center backdrop-blur-2xl hover:bg-white/[0.05]">
                  <Pause className="w-6 h-6 text-white" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={stopTracking} className="relative group">
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ background: "#ef4444" }} />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center text-white shadow-2xl"
                    style={{ boxShadow: "0 0 40px rgba(239,68,68,0.4)" }}>
                    <Square className="w-7 h-7" />
                  </div>
                </motion.button>
              </>
            )}
            {status === "paused" && (
              <>
                <motion.button whileTap={{ scale: 0.9 }} onClick={resumeTracking} className="relative group">
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" style={{ background: activity.neon }} />
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl"
                    style={{ background: `linear-gradient(135deg, ${activity.neon}, ${activity.neon}cc)`, boxShadow: `0 0 40px ${activity.neon}50` }}>
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={stopTracking}
                  className="w-16 h-16 glass-strong border border-red-500/30 rounded-full flex items-center justify-center backdrop-blur-2xl hover:bg-red-500/10">
                  <Square className="w-5 h-5 text-red-400" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showActivityPicker && (
          <ActivityPicker selected={selectedActivity} onSelect={setSelectedActivity} onClose={() => setShowActivityPicker(false)} isEnglish={isEnglish} />
        )}
        {showHistory && (
          <HistoryPanel sessions={sessions} isEnglish={isEnglish} onClose={() => setShowHistory(false)}
            onReplay={(s) => { setReplaySession(s); setShowHistory(false) }} />
        )}
      </AnimatePresence>

      {/* Replay bar */}
      <AnimatePresence>
        {replaySession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="glass-strong border border-white/[0.12] rounded-2xl px-5 py-3 flex items-center gap-4 backdrop-blur-2xl">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" style={{ color: activity.neon }} />
                <span className="text-sm font-bold text-white">{isEnglish ? "Replaying" : "Replay"}</span>
              </div>
              <button onClick={() => setReplaySession(null)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors">
                {isEnglish ? "Close" : "Fechar"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ghost indicator */}
      <AnimatePresence>
        {showGhost && lastSession && !replaySession && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="glass-strong border border-white/[0.08] rounded-full px-4 py-2 flex items-center gap-2 backdrop-blur-2xl">
              <Eye className="w-3.5 h-3.5 text-white/50" />
              <span className="text-[11px] text-white/50">{isEnglish ? "Ghost Mode" : "Modo Fantasma"}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
