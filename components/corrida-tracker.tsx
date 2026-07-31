"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play, Pause, Square, MapPin, Clock, Flame, Route,
  Footprints, Bike, Mountain, PersonStanding, Timer,
  TrendingUp, ChevronDown, Navigation, Zap, Trophy,
  ArrowUp, ArrowDown, Map, RotateCcw, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { cn } from "@/lib/utils"
import type { Map as LeafletMap, Marker, Polyline } from "leaflet"

interface GpsPoint {
  lat: number
  lng: number
  timestamp: number
  altitude?: number
  speed?: number
}

interface GpsSession {
  id: string
  activityType: string
  points: GpsPoint[]
  duration: number
  distance: number
  calories: number
  avgSpeed: number
  maxSpeed: number
  startedAt: string
  endedAt: string
}

interface ActivityType {
  id: string
  icon: any
  label: string
  labelEn: string
  met: number
  gradient: string
  color: string
  bg: string
}

const ACTIVITIES: ActivityType[] = [
  { id: "walking", icon: PersonStanding, label: "Andando", labelEn: "Walking", met: 3.5, gradient: "from-emerald-500 to-green-400", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { id: "running", icon: Footprints, label: "Correndo", labelEn: "Running", met: 8.0, gradient: "from-orange-500 to-amber-400", color: "text-orange-400", bg: "bg-orange-500/10" },
  { id: "cycling", icon: Bike, label: "Bicicleta", labelEn: "Cycling", met: 6.0, gradient: "from-cyan-500 to-blue-400", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { id: "hiking", icon: Mountain, label: "Trilha", labelEn: "Hiking", met: 5.0, gradient: "from-violet-500 to-purple-400", color: "text-violet-400", bg: "bg-violet-500/10" },
]

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
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

export function CorridaTracker() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const [sessions, setSessions] = useLocalStorage<GpsSession[]>("fitverse-gps-sessions", [])
  const [selectedActivity, setSelectedActivity] = useState<string>("running")
  const [status, setStatus] = useState<"idle" | "tracking" | "paused">("idle")
  const [points, setPoints] = useState<GpsPoint[]>([])
  const [duration, setDuration] = useState(0)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showActivityPicker, setShowActivityPicker] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [showMap, setShowMap] = useState(true)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedDurationRef = useRef(0)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const startMarkerRef = useRef<Marker | null>(null)
  const polylineRef = useRef<Polyline | null>(null)

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

  // Leaflet map init
  useEffect(() => {
    if (mapReady || !mapRef.current || typeof window === "undefined") return
    const init = async () => {
      const L = (await import("leaflet")).default
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      })
      const map = L.map(mapRef.current!, { zoomControl: false, attributionControl: false }).setView([-15.78, -47.93], 14)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map)
      L.control.zoom({ position: "topright" }).addTo(map)
      mapInstanceRef.current = map
      setMapReady(true)
      navigator.geolocation?.getCurrentPosition(
        (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
        () => {},
        { timeout: 10000 }
      )
    }
    init()
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null }
  }, [mapReady])

  // Update map
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || typeof window === "undefined") return
    const update = async () => {
      const L = (await import("leaflet")).default
      const map = mapInstanceRef.current
      if (!map) return
      if (polylineRef.current) map.removeLayer(polylineRef.current)
      if (markerRef.current) map.removeLayer(markerRef.current)
      if (startMarkerRef.current) map.removeLayer(startMarkerRef.current)
      if (points.length === 0) return

      const latLngs = points.map((p) => [p.lat, p.lng] as [number, number])

      // Gradient polyline effect — draw multiple semi-transparent polylines
      polylineRef.current = L.polyline(latLngs, {
        color: "#f97316",
        weight: 5,
        opacity: 0.85,
        smoothFactor: 1,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map)

      // Shadow/glow polyline underneath
      L.polyline(latLngs, { color: "#f97316", weight: 12, opacity: 0.15, smoothFactor: 1 }).addTo(map)

      const startIcon = L.divIcon({
        html: `<div style="width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#16a34a);border:3px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.5)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9], className: "",
      })
      startMarkerRef.current = L.marker(latLngs[0], { icon: startIcon }).addTo(map)

      const curIcon = L.divIcon({
        html: `<div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ef4444);border:3px solid white;box-shadow:0 0 20px rgba(249,115,22,0.6);animation:gpulse 1.5s infinite"></div>
               <style>@keyframes gpulse{0%,100%{transform:scale(1);box-shadow:0 0 20px rgba(249,115,22,0.6)}50%{transform:scale(1.2);box-shadow:0 0 30px rgba(249,115,22,0.8)}}</style>`,
        iconSize: [24, 24], iconAnchor: [12, 12], className: "",
      })
      markerRef.current = L.marker(latLngs[latLngs.length - 1], { icon: curIcon }).addTo(map)

      if (points.length > 1) map.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] })
      else map.setView(latLngs[0], 16)
    }
    update()
  }, [points, mapReady])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) { alert(isEnglish ? "Geolocation not supported" : "Geolocalização não suportada"); return }
    startTimeRef.current = Date.now(); pausedDurationRef.current = 0; setDuration(0); setPoints([])
    timerRef.current = setInterval(() => setDuration(Math.floor((Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000)), 1000)
    const id = navigator.geolocation.watchPosition(
      (pos) => setPoints((p) => [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: Date.now(), altitude: pos.coords.altitude ?? undefined, speed: pos.coords.speed ?? undefined }]),
      (err) => console.error("GPS:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    setWatchId(id); setStatus("tracking")
  }, [isEnglish])

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
      setSessions((prev) => [{ id: Date.now().toString(), activityType: selectedActivity, points, duration, distance, calories, avgSpeed, maxSpeed, startedAt: new Date(points[0].timestamp).toISOString(), endedAt: new Date().toISOString() }, ...prev].slice(0, 50))
    }
    setStatus("idle"); setPoints([]); setDuration(0); setWatchId(null)
  }, [watchId, points, duration, distance, calories, avgSpeed, maxSpeed, selectedActivity, setSessions])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); if (watchId !== null) navigator.geolocation.clearWatch(watchId) }, [watchId])

  const isTracking = status !== "idle"
  const recentSessions = sessions.slice(0, 20)

  return (
    <div className="min-h-screen -mx-4 -mt-4 md:-mx-8 md:-mt-4 lg:-mx-12 lg:-mt-4">
      {/* Hero Map Section */}
      <div className="relative">
        {/* Map */}
        <div className="relative h-[45vh] md:h-[55vh] bg-gray-900 overflow-hidden">
          <div ref={mapRef} className="w-full h-full" style={{ zIndex: 0 }} />

          {/* Gradient overlay at top */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/90 to-transparent z-[400] pointer-events-none" />

          {/* Gradient overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[400] pointer-events-none" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-[500] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg", activity.gradient)}>
                <activity.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground drop-shadow-lg">
                  {isEnglish ? activity.labelEn : activity.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{isEnglish ? "GPS Active" : "GPS Ativo"}</p>
              </div>
            </div>
            {isTracking && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold shadow-lg shadow-red-500/30"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                REC
              </motion.div>
            )}
          </div>

          {/* Floating big timer */}
          {isTracking && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-6 left-0 right-0 z-[500] flex justify-center pointer-events-none"
            >
              <div className="px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                <p className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tight">
                  {fmtDuration(duration)}
                </p>
                <p className="text-[10px] text-white/60 text-center uppercase tracking-widest mt-1">
                  {isEnglish ? "Duration" : "Duração"}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content below map */}
      <div className="space-y-4 px-4 md:px-8 lg:px-12 -mt-8 relative z-10 pb-8">
        {/* Activity Picker */}
        <div className="glass-strong border border-border rounded-2xl overflow-hidden">
          <button onClick={() => setShowActivityPicker(!showActivityPicker)} className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", activity.gradient)}>
                <activity.icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">{isEnglish ? activity.labelEn : activity.label}</p>
                <p className="text-[10px] text-muted-foreground">MET {activity.met} · {isEnglish ? "Tap to change" : "Toque para mudar"}</p>
              </div>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", showActivityPicker && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showActivityPicker && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-4 gap-2 p-4 pt-0">
                  {ACTIVITIES.map((a) => (
                    <button key={a.id} onClick={() => { setSelectedActivity(a.id); setShowActivityPicker(false) }}
                      className={cn("flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200",
                        selectedActivity === a.id ? "border-brand bg-brand/10 shadow-lg shadow-brand/10" : "border-border hover:border-border/80 hover:bg-accent/50"
                      )}>
                      <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", a.gradient)}>
                        <a.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-foreground">{isEnglish ? a.labelEn : a.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Clock, value: fmtDuration(duration), label: isEnglish ? "Time" : "Tempo", color: "text-brand" },
            { icon: Route, value: fmtDist(distance), label: isEnglish ? "Distance" : "Distância", color: "text-cyan-400" },
            { icon: Flame, value: `${calories}`, label: "kcal", color: "text-orange-400" },
            { icon: TrendingUp, value: pace, label: "min/km", color: "text-emerald-400" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="glass-strong border border-border rounded-2xl p-3 text-center">
              <stat.icon className={cn("w-4 h-4 mx-auto mb-1.5", stat.color)} />
              <p className="text-lg font-black text-foreground tabular-nums leading-tight">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Speed Stats Row */}
        {distance > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="glass-strong border border-border rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground tabular-nums">{fmtSpeed(avgSpeed)} <span className="text-xs font-medium text-muted-foreground">km/h</span></p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{isEnglish ? "Avg Speed" : "Vel. Média"}</p>
              </div>
            </div>
            <div className="glass-strong border border-border rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground tabular-nums">{fmtSpeed(maxSpeed)} <span className="text-xs font-medium text-muted-foreground">km/h</span></p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{isEnglish ? "Max Speed" : "Vel. Máx"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Speed Graph */}
        {speedHistory.length > 2 && (
          <div className="glass-strong border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-brand" />
              <p className="text-xs font-semibold text-foreground">{isEnglish ? "Speed Over Time" : "Velocidade ao Longo do Tempo"}</p>
            </div>
            <div className="h-20 flex items-end gap-[2px]">
              {speedHistory.slice(-60).map((spd, i) => {
                const max = Math.max(...speedHistory.slice(-60))
                const h = max > 0 ? (spd / max) * 100 : 0
                return (
                  <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-orange-500 to-amber-400 opacity-80"
                    style={{ height: `${Math.max(h, 4)}%` }} />
                )
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center items-center gap-4 py-4">
          {status === "idle" && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={startTracking}
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-2xl shadow-green-500/40 flex items-center justify-center">
              <Play className="w-8 h-8 ml-1" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 animate-ping opacity-20" />
            </motion.button>
          )}
          {status === "tracking" && (
            <>
              <motion.button whileTap={{ scale: 0.9 }} onClick={pauseTracking}
                className="w-16 h-16 rounded-full glass-strong border border-border flex items-center justify-center hover:bg-accent transition-colors">
                <Pause className="w-6 h-6 text-foreground" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={stopTracking}
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-400 text-white shadow-2xl shadow-red-500/40 flex items-center justify-center">
                <Square className="w-7 h-7" />
              </motion.button>
            </>
          )}
          {status === "paused" && (
            <>
              <motion.button whileTap={{ scale: 0.9 }} onClick={resumeTracking}
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-2xl shadow-green-500/40 flex items-center justify-center">
                <Play className="w-8 h-8 ml-1" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={stopTracking}
                className="w-16 h-16 rounded-full glass-strong border border-red-500/50 flex items-center justify-center hover:bg-red-500/10 transition-colors">
                <Square className="w-5 h-5 text-red-500" />
              </motion.button>
            </>
          )}
        </div>

        {/* History */}
        <div className="glass-strong border border-border rounded-2xl overflow-hidden">
          <button onClick={() => setShowHistory(!showHistory)} className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-brand" />
              <p className="text-sm font-bold text-foreground">{isEnglish ? "Activity History" : "Histórico de Atividades"}</p>
              <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold">{sessions.length}</span>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", showHistory && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-2">
                  {recentSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <Map className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">{isEnglish ? "No activities yet" : "Nenhuma atividade ainda"}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{isEnglish ? "Start your first run!" : "Comece sua primeira corrida!"}</p>
                    </div>
                  ) : (
                    recentSessions.map((s, idx) => {
                      const act = ACTIVITIES.find((a) => a.id === s.activityType) || ACTIVITIES[1]
                      return (
                        <motion.div key={s.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.03 }}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border hover:border-brand/30 transition-all">
                          <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0", act.gradient)}>
                            <act.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-foreground">{isEnglish ? act.labelEn : act.label}</p>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(s.startedAt).toLocaleDateString(isEnglish ? "en-US" : "pt-BR", { day: "2-digit", month: "short" })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {fmtDuration(s.duration)}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Flame className="w-3 h-3" /> {s.calories}kcal
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-black text-foreground tabular-nums">{fmtDist(s.distance)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {s.avgSpeed.toFixed(1)} km/h
                            </p>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
