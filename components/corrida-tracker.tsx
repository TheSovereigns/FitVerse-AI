"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Line } from "@react-three/drei"
import * as THREE from "three"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play, Pause, Square, Clock, Flame, Route, Navigation, Zap,
  Trophy, PersonStanding, Footprints, Bike, Mountain,
  Eye, Layers, Activity, Globe,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

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

// ─── Activities with neon colors ─────────────────────────────────
const ACTIVITIES: ActivityType[] = [
  { id: "walking", icon: PersonStanding, label: "Andando", labelEn: "Walking", met: 3.5, neon: "#22c55e", glow: "rgba(34,197,94,0.4)", ring: "rgba(34,197,94,0.15)" },
  { id: "running", icon: Footprints, label: "Correndo", labelEn: "Running", met: 8.0, neon: "#f97316", glow: "rgba(249,115,22,0.4)", ring: "rgba(249,115,22,0.15)" },
  { id: "cycling", icon: Bike, label: "Bicicleta", labelEn: "Cycling", met: 6.0, neon: "#06b6d4", glow: "rgba(6,182,212,0.4)", ring: "rgba(6,182,212,0.15)" },
  { id: "hiking", icon: Mountain, label: "Trilha", labelEn: "Hiking", met: 5.0, neon: "#a855f7", glow: "rgba(168,85,247,0.4)", ring: "rgba(168,85,247,0.15)" },
]

// ─── GPS Helpers ─────────────────────────────────────────────────
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

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// ─── 3D Globe Scene ──────────────────────────────────────────────
function GlobeScene({
  points, activity, status, duration, showGhost, ghostPoints,
}: {
  points: GpsPoint[]; activity: ActivityType; status: string; duration: number
  showGhost: boolean; ghostPoints: GpsPoint[]
}) {
  const globeRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const routeRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const runnerRef = useRef<THREE.Mesh>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const RADIUS = 2
  const NEON_COLOR = new THREE.Color(activity.neon)

  // Convert points to 3D positions
  const routePositions = useMemo(() => {
    return points.map((p) => latLngToVector3(p.lat, p.lng, RADIUS + 0.01))
  }, [points])

  const ghostPositions = useMemo(() => {
    return ghostPoints.map((p) => latLngToVector3(p.lat, p.lng, RADIUS + 0.008))
  }, [ghostPoints])

  // Particle system along route
  const particleData = useMemo(() => {
    const count = Math.min(points.length * 3, 500)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const idx = Math.floor((i / count) * points.length)
      const pos = routePositions[idx] || routePositions[0]
      if (!pos) continue
      positions[i * 3] = pos.x + (Math.random() - 0.5) * 0.05
      positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.05
      positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.05
      colors[i * 3] = NEON_COLOR.r
      colors[i * 3 + 1] = NEON_COLOR.g
      colors[i * 3 + 2] = NEON_COLOR.b
      sizes[i] = Math.random() * 3 + 1
    }
    return { positions, colors, sizes }
  }, [points, routePositions, NEON_COLOR])

  // Globe wireframe geometry
  const wireframeGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(RADIUS, 48, 48)
    return geo
  }, [])

  // Grid lines for globe
  const gridLines = useMemo(() => {
    const lines: THREE.Vector3[][] = []
    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: THREE.Vector3[] = []
      for (let lng = -180; lng <= 180; lng += 5) {
        pts.push(latLngToVector3(lat, lng, RADIUS + 0.002))
      }
      lines.push(pts)
    }
    // Longitude lines
    for (let lng = -180; lng < 180; lng += 30) {
      const pts: THREE.Vector3[] = []
      for (let lat = -80; lat <= 80; lat += 5) {
        pts.push(latLngToVector3(lat, lng, RADIUS + 0.002))
      }
      lines.push(pts)
    }
    return lines
  }, [])

  // Animate runner position along route
  const runnerPos = useMemo(() => {
    if (routePositions.length === 0) return new THREE.Vector3(0, 0, RADIUS + 0.02)
    return routePositions[routePositions.length - 1].clone().normalize().multiplyScalar(RADIUS + 0.02)
  }, [routePositions])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Slow auto-rotate
    if (globeRef.current && status === "idle") {
      globeRef.current.rotation.y += 0.001
    }

    // Pulse runner marker
    if (runnerRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.3
      runnerRef.current.scale.set(scale, scale, scale)
    }

    // Animate particles floating
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position
      if (positions) {
        for (let i = 0; i < positions.count; i++) {
          const y = positions.getY(i)
          positions.setY(i, y + Math.sin(t * 2 + i * 0.1) * 0.0002)
        }
        positions.needsUpdate = true
      }
    }
  })

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 })
    }
    window.addEventListener("mousemove", handleMouse)
    return () => window.removeEventListener("mousemove", handleMouse)
  }, [])

  return (
    <>
      {/* Ambient + directional light */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />
      <pointLight position={[-5, -3, -5]} intensity={0.2} color={activity.neon} />

      {/* Globe sphere - solid dark base */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshStandardMaterial color="#0a0a1a" transparent opacity={0.95} />
      </mesh>

      {/* Glow atmosphere */}
      <mesh ref={glowRef} scale={1.02}>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshBasicMaterial color={activity.neon} transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>

      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[RADIUS + 0.001, 32, 32]} />
        <meshBasicMaterial color={activity.neon} wireframe transparent opacity={0.06} />
      </mesh>

      {/* Grid lines */}
      {gridLines.map((line, i) => (
        <Line
          key={i}
          points={line}
          color={activity.neon}
          lineWidth={0.5}
          transparent
          opacity={0.08}
        />
      ))}

      {/* Route trail - main neon line */}
      {routePositions.length > 1 && (
        <Line
          points={routePositions}
          color={activity.neon}
          lineWidth={4}
          transparent
          opacity={0.9}
        />
      )}

      {/* Route glow trail */}
      {routePositions.length > 1 && (
        <Line
          points={routePositions}
          color={activity.neon}
          lineWidth={12}
          transparent
          opacity={0.15}
        />
      )}

      {/* Ghost runner route */}
      {showGhost && ghostPositions.length > 1 && (
        <>
          <Line points={ghostPositions} color="#ffffff" lineWidth={2} transparent opacity={0.2} dashed dashSize={0.02} gapSize={0.02} />
          <Line points={ghostPositions} color="#ffffff" lineWidth={6} transparent opacity={0.05} />
        </>
      )}

      {/* Particles along route */}
      {points.length > 2 && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[particleData.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[particleData.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.015} vertexColors transparent opacity={0.6} sizeAttenuation />
        </points>
      )}

      {/* Runner marker - pulsing orb */}
      {points.length > 0 && (
        <mesh ref={runnerRef} position={runnerPos}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color={activity.neon} transparent opacity={0.9} />
        </mesh>
      )}

      {/* Start marker */}
      {routePositions.length > 1 && (
        <mesh position={routePositions[0]}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        autoRotate={status === "idle"}
        autoRotateSpeed={0.3}
      />
    </>
  )
}

// ─── HUD Stat Panel ──────────────────────────────────────────────
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

// ─── Circular Progress ───────────────────────────────────────────
function CircularProgress({
  value, max, size = 48, strokeWidth = 3, color, children,
}: {
  value: number; max: number; size?: number; strokeWidth?: number; color: string; children: React.ReactNode
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(value / max, 1)
  const offset = circumference - progress * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// ─── Activity Picker ─────────────────────────────────────────────
function ActivityPicker({
  selected, onSelect, onClose, isEnglish,
}: {
  selected: string; onSelect: (id: string) => void; onClose: () => void; isEnglish: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative z-10 w-full max-w-md mx-4 glass-strong border border-white/[0.08] rounded-3xl p-6"
      >
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
            <button
              key={a.id}
              onClick={() => { onSelect(a.id); onClose() }}
              className={cn(
                "relative group p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden",
                selected === a.id
                  ? "border-opacity-100"
                  : "border-white/[0.06] hover:border-white/[0.12]"
              )}
              style={{
                borderColor: selected === a.id ? a.neon : undefined,
                background: selected === a.id ? a.ring : "rgba(255,255,255,0.02)",
              }}
            >
              {selected === a.id && (
                <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 30% 30%, ${a.neon}, transparent 70%)` }} />
              )}
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `linear-gradient(135deg, ${a.neon}20, ${a.neon}08)` }}
                >
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative z-10 w-full max-w-lg mx-4 glass-strong border border-white/[0.08] rounded-3xl p-6 max-h-[70vh] overflow-hidden flex flex-col"
      >
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
                <motion.div
                  key={s.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.1] transition-all group"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${act.neon}25, ${act.neon}10)` }}
                  >
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
                    <button
                      onClick={() => onReplay(s)}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                    >
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

// ─── Speed Graph (neon style) ────────────────────────────────────
function NeonSpeedGraph({ speeds, color }: { speeds: number[]; color: string }) {
  if (speeds.length < 3) return null
  const recent = speeds.slice(-60)
  const max = Math.max(...recent, 1)
  const h = 48
  const w = 200

  const pathD = recent.map((spd, i) => {
    const x = (i / (recent.length - 1)) * w
    const y = h - (spd / max) * h
    return `${i === 0 ? "M" : "L"} ${x} ${y}`
  }).join(" ")

  const fillD = pathD + ` L ${w} ${h} L 0 ${h} Z`

  return (
    <div className="relative h-12 w-full overflow-hidden rounded-xl">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={fillD} fill="url(#speedGrad)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" filter="url(#glow)" opacity="0.8" />
      </svg>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
function CorridaTrackerInner() {
  const { t, locale } = useTranslation()
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

  // Stats
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

  // GPS Tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return
    startTimeRef.current = Date.now(); pausedDurationRef.current = 0; setDuration(0); setPoints([])
    timerRef.current = setInterval(() => setDuration(Math.floor((Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000)), 1000)
    const id = navigator.geolocation.watchPosition(
      (pos) => setPoints((p) => [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: Date.now(), altitude: pos.coords.altitude ?? undefined, speed: pos.coords.speed ?? undefined }]),
      (err) => console.error("GPS:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
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
      (err) => console.error("GPS:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
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

  return (
    <div className="min-h-screen -mx-4 -mt-4 md:-mx-8 md:-mt-4 lg:-mx-12 lg:-mt-4 relative overflow-hidden bg-[#050510]">
      {/* Full-screen 3D Globe */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <GlobeScene
            points={replaySession?.points || points}
            activity={activity}
            status={replaySession ? "replay" : status}
            duration={replaySession?.duration || duration}
            showGhost={showGhost && !!lastSession && !replaySession}
            ghostPoints={lastSession?.points || []}
          />
        </Canvas>

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(5,5,16,0.8) 100%)`,
        }} />

        {/* Top ambient glow */}
        <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 50% -20%, ${activity.neon}15, transparent 70%)`,
        }} />
      </div>

      {/* ── HUD Layer ── */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between pointer-events-none p-4 md:p-6">

        {/* Top bar */}
        <div className="flex items-start justify-between pointer-events-auto">
          {/* Activity badge */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="glass-strong border border-white/[0.08] rounded-2xl p-3 flex items-center gap-3 backdrop-blur-2xl"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${activity.neon}30, ${activity.neon}10)` }}
            >
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

          {/* Right controls */}
          <div className="flex flex-col gap-2">
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowActivityPicker(true)}
              className="w-10 h-10 glass-strong border border-white/[0.08] rounded-xl flex items-center justify-center backdrop-blur-2xl hover:bg-white/[0.05]"
            >
              <Layers className="w-4 h-4 text-white/60" />
            </motion.button>
            {lastSession && !isTracking && (
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowGhost(!showGhost)}
                className={cn(
                  "w-10 h-10 glass-strong border rounded-xl flex items-center justify-center backdrop-blur-2xl transition-colors",
                  showGhost ? "border-white/20 bg-white/[0.08]" : "border-white/[0.08] hover:bg-white/[0.05]"
                )}
              >
                <Eye className="w-4 h-4 text-white/60" />
              </motion.button>
            )}
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowHistory(true)}
              className="w-10 h-10 glass-strong border border-white/[0.08] rounded-xl flex items-center justify-center backdrop-blur-2xl hover:bg-white/[0.05]"
            >
              <Trophy className="w-4 h-4 text-white/60" />
            </motion.button>
          </div>
        </div>

        {/* Center - Big timer when tracking */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence>
            {isTracking && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 blur-3xl opacity-30" style={{ background: activity.neon }} />
                  <p className="relative text-6xl md:text-8xl font-black text-white tabular-nums" style={{ textShadow: `0 0 40px ${activity.neon}, 0 0 80px ${activity.neon}50` }}>
                    {fmtDuration(duration)}
                  </p>
                </div>
                <p className="text-xs text-white/30 uppercase tracking-[0.3em] mt-2">{isEnglish ? "Duration" : "Duração"}</p>
              </motion.div>
            )}
            {!isTracking && points.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <Globe className="w-16 h-16 mx-auto mb-4" style={{ color: activity.neon, opacity: 0.3 }} />
                <p className="text-sm text-white/20">{isEnglish ? "Tap to start orbit" : "Toque para iniciar órbita"}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom section */}
        <div className="space-y-4 pointer-events-auto">
          {/* Stats row */}
          {(isTracking || points.length > 0) && (
            <div className="grid grid-cols-4 gap-2">
              <HudStat icon={Clock} value={fmtDuration(duration)} label={isEnglish ? "Time" : "Tempo"} color={activity.neon} delay={0} />
              <HudStat icon={Route} value={fmtDist(distance)} label={isEnglish ? "Dist" : "Dist"} color="#06b6d4" delay={0.05} />
              <HudStat icon={Flame} value={`${calories}`} label="kcal" color="#f97316" delay={0.1} />
              <HudStat icon={Navigation} value={pace} label="min/km" color="#22c55e" delay={0.15} />
            </div>
          )}

          {/* Speed graph + extras */}
          {(isTracking || points.length > 0) && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-strong border border-white/[0.08] rounded-2xl p-4 backdrop-blur-2xl"
            >
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
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={startTracking}
                className="relative group"
              >
                <div className="absolute inset-0 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" style={{ background: activity.neon }} />
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${activity.neon}, ${activity.neon}cc)`, boxShadow: `0 0 40px ${activity.neon}50, 0 0 80px ${activity.neon}30` }}
                >
                  <Play className="w-8 h-8 ml-1" />
                </div>
              </motion.button>
            )}

            {status === "tracking" && (
              <>
                <motion.button whileTap={{ scale: 0.9 }} onClick={pauseTracking} className="w-16 h-16 glass-strong border border-white/[0.12] rounded-full flex items-center justify-center backdrop-blur-2xl hover:bg-white/[0.05]">
                  <Pause className="w-6 h-6 text-white" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={stopTracking} className="relative group">
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ background: "#ef4444" }} />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center text-white shadow-2xl" style={{ boxShadow: "0 0 40px rgba(239,68,68,0.4)" }}>
                    <Square className="w-7 h-7" />
                  </div>
                </motion.button>
              </>
            )}

            {status === "paused" && (
              <>
                <motion.button whileTap={{ scale: 0.9 }} onClick={resumeTracking} className="relative group">
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" style={{ background: activity.neon }} />
                  <div
                    className="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl"
                    style={{ background: `linear-gradient(135deg, ${activity.neon}, ${activity.neon}cc)`, boxShadow: `0 0 40px ${activity.neon}50` }}
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={stopTracking} className="w-16 h-16 glass-strong border border-red-500/30 rounded-full flex items-center justify-center backdrop-blur-2xl hover:bg-red-500/10">
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
          <HistoryPanel
            sessions={sessions}
            isEnglish={isEnglish}
            onClose={() => setShowHistory(false)}
            onReplay={(s) => { setReplaySession(s); setShowHistory(false) }}
          />
        )}
      </AnimatePresence>

      {/* Replay overlay */}
      <AnimatePresence>
        {replaySession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass-strong border border-white/[0.12] rounded-2xl px-5 py-3 flex items-center gap-4 backdrop-blur-2xl">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" style={{ color: activity.neon }} />
                <span className="text-sm font-bold text-white">{isEnglish ? "Replaying Session" : "Replay da Sessão"}</span>
              </div>
              <button
                onClick={() => setReplaySession(null)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
              >
                {isEnglish ? "Close" : "Fechar"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ghost mode indicator */}
      <AnimatePresence>
        {showGhost && lastSession && !replaySession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass-strong border border-white/[0.08] rounded-full px-4 py-2 flex items-center gap-2 backdrop-blur-2xl">
              <Eye className="w-3.5 h-3.5 text-white/50" />
              <span className="text-[11px] text-white/50">{isEnglish ? "Ghost Mode — Previous Route" : "Modo Fantasma — Rota Anterior"}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Dynamic import (no SSR for Three.js)
const CorridaTracker = dynamic(() => Promise.resolve(CorridaTrackerInner), { ssr: false, loading: () => (
  <div className="min-h-screen -mx-4 -mt-4 md:-mx-8 md:-mt-4 lg:-mx-12 lg:-mt-4 bg-[#050510] flex items-center justify-center">
    <div className="text-center">
      <Globe className="w-12 h-12 mx-auto mb-4 text-white/10 animate-spin" style={{ animationDuration: "3s" }} />
      <p className="text-xs text-white/20 uppercase tracking-[0.2em]">Loading Orbit...</p>
    </div>
  </div>
) })

export { CorridaTracker }
