"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play, Pause, Square, MapPin, Clock, Flame, Route,
  Footprints, Bike, Mountain, PersonStanding, Timer,
  TrendingUp, ChevronDown, Navigation,
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
  color: string
}

const ACTIVITIES: ActivityType[] = [
  { id: "walking", icon: PersonStanding, label: "Andando", labelEn: "Walking", met: 3.5, color: "text-green-400" },
  { id: "running", icon: Footprints, label: "Correndo", labelEn: "Running", met: 8.0, color: "text-orange-400" },
  { id: "cycling", icon: Bike, label: "Bicicleta", labelEn: "Cycling", met: 6.0, color: "text-cyan-400" },
  { id: "hiking", icon: Mountain, label: "Caminhada", labelEn: "Hiking", met: 5.0, color: "text-emerald-400" },
]

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function calculateCalories(met: number, weightKg: number, durationHours: number): number {
  return Math.round(met * weightKg * durationHours)
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(2)}km`
}

function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(1)}km/h`
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
    for (let i = 1; i < points.length; i++) {
      d += haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
    }
    return d
  }, [points])

  const calories = useMemo(() => {
    const weight = 70
    const durationHours = duration / 3600
    return calculateCalories(activity.met, weight, durationHours)
  }, [activity.met, duration])

  const avgSpeed = useMemo(() => {
    if (duration === 0) return 0
    return (distance / duration) * 3600
  }, [distance, duration])

  const maxSpeed = useMemo(() => {
    let max = 0
    for (let i = 1; i < points.length; i++) {
      const d = haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
      const dt = (points[i].timestamp - points[i - 1].timestamp) / 1000
      if (dt > 0) {
        const spd = (d / dt) * 3600
        if (spd > max) max = spd
      }
    }
    return max
  }, [points])

  const pace = useMemo(() => {
    if (distance === 0) return "0:00"
    const minPerKm = (duration / 60) / distance
    const m = Math.floor(minPerKm)
    const s = Math.round((minPerKm - m) * 60)
    return `${m}:${String(s).padStart(2, "0")}`
  }, [distance, duration])

  // Initialize Leaflet map
  useEffect(() => {
    if (mapReady || !mapRef.current || typeof window === "undefined") return

    const initMap = async () => {
      const L = (await import("leaflet")).default

      // Fix default marker icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      })

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView([-15.78, -47.93], 14)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: "topright" }).addTo(map)

      mapInstanceRef.current = map
      setMapReady(true)

      // Try to get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 15)
          },
          () => {},
          { timeout: 10000 }
        )
      }
    }

    initMap()

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [mapReady])

  // Update map when points change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || typeof window === "undefined") return

    const updateMap = async () => {
      const L = (await import("leaflet")).default
      const map = mapInstanceRef.current
      if (!map) return

      // Remove old polyline
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current)
      }

      // Remove old markers
      if (markerRef.current) map.removeLayer(markerRef.current)
      if (startMarkerRef.current) map.removeLayer(startMarkerRef.current)

      if (points.length === 0) return

      // Draw polyline
      const latLngs = points.map((p) => [p.lat, p.lng] as [number, number])
      polylineRef.current = L.polyline(latLngs, {
        color: "#f97316",
        weight: 4,
        opacity: 0.9,
        smoothFactor: 1,
      }).addTo(map)

      // Start marker (green)
      const startIcon = L.divIcon({
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        className: "",
      })
      startMarkerRef.current = L.marker(latLngs[0], { icon: startIcon }).addTo(map)

      // Current position marker (red pulse)
      const currentIcon = L.divIcon({
        html: `<div style="width:20px;height:20px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 12px rgba(239,68,68,0.6);animation:pulse 1.5s infinite"></div>
               <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:0.7}}</style>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: "",
      })
      markerRef.current = L.marker(latLngs[latLngs.length - 1], { icon: currentIcon }).addTo(map)

      // Fit bounds
      if (points.length > 1) {
        map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] })
      } else {
        map.setView(latLngs[0], 16)
      }
    }

    updateMap()
  }, [points, mapReady])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      alert(isEnglish ? "Geolocation not supported" : "Geolocalização não suportada")
      return
    }

    startTimeRef.current = Date.now()
    pausedDurationRef.current = 0
    setDuration(0)
    setPoints([])

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000)
      setDuration(elapsed)
    }, 1000)

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GpsPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
          altitude: pos.coords.altitude ?? undefined,
          speed: pos.coords.speed ?? undefined,
        }
        setPoints((prev) => [...prev, point])
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    setWatchId(id)
    setStatus("tracking")
  }, [isEnglish])

  const pauseTracking = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    pausedDurationRef.current += Date.now() - startTimeRef.current - pausedDurationRef.current
    setStatus("paused")
  }, [watchId])

  const resumeTracking = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setDuration(elapsed)
    }, 1000)

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GpsPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
          altitude: pos.coords.altitude ?? undefined,
          speed: pos.coords.speed ?? undefined,
        }
        setPoints((prev) => [...prev, point])
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    setWatchId(id)
    setStatus("tracking")
  }, [])

  const stopTracking = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)

    if (points.length > 0 && duration > 5) {
      const session: GpsSession = {
        id: Date.now().toString(),
        activityType: selectedActivity,
        points,
        duration,
        distance,
        calories,
        avgSpeed,
        maxSpeed,
        startedAt: new Date(points[0].timestamp).toISOString(),
        endedAt: new Date().toISOString(),
      }
      setSessions((prev) => [session, ...prev].slice(0, 50))
    }

    setStatus("idle")
    setPoints([])
    setDuration(0)
    setWatchId(null)
  }, [watchId, points, duration, distance, calories, avgSpeed, maxSpeed, selectedActivity, setSessions])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    }
  }, [watchId])

  const recentSessions = sessions.slice(0, 10)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Footprints className="w-5 h-5 text-brand" />
        <h2 className="text-lg font-semibold text-foreground">
          {isEnglish ? "Run Tracker" : "Corrida"}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {isEnglish ? "Track your runs with real-time GPS map" : "Rastreie suas corridas com mapa GPS em tempo real"}
      </p>

      {/* Activity Selector */}
      <div className="glass-strong border border-border rounded-2xl p-4">
        <button
          onClick={() => setShowActivityPicker(!showActivityPicker)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-background/50", activity.color)}>
              <activity.icon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">
                {isEnglish ? activity.labelEn : activity.label}
              </p>
              <p className="text-xs text-muted-foreground">MET {activity.met}</p>
            </div>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showActivityPicker && "rotate-180")} />
        </button>

        <AnimatePresence>
          {showActivityPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
                {ACTIVITIES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedActivity(a.id); setShowActivityPicker(false) }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
                      selectedActivity === a.id
                        ? "border-brand bg-brand/10"
                        : "border-border bg-background/50 hover:bg-accent"
                    )}
                  >
                    <a.icon className={cn("w-4 h-4", a.color)} />
                    <span className="text-sm font-medium text-foreground">
                      {isEnglish ? a.labelEn : a.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map */}
      <div className="glass-strong border border-border rounded-2xl overflow-hidden">
        <div
          ref={mapRef}
          className="w-full h-[300px] md:h-[400px] bg-muted"
          style={{ zIndex: 0 }}
        />
        {status === "tracking" && (
          <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            REC
          </div>
        )}
      </div>

      {/* Live Stats */}
      <div className="glass-strong border border-border rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-xl bg-background/50">
            <Clock className="w-4 h-4 text-brand mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground tabular-nums">{formatDuration(duration)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {isEnglish ? "Duration" : "Duração"}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background/50">
            <Route className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground tabular-nums">{formatDistance(distance)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {isEnglish ? "Distance" : "Distância"}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background/50">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground tabular-nums">{calories}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">kcal</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background/50">
            <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground tabular-nums">{pace}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">min/km</p>
          </div>
        </div>

        {distance > 0 && (
          <div className="flex justify-around mt-3 pt-3 border-t border-border">
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{formatSpeed(avgSpeed)}</p>
              <p className="text-[10px] text-muted-foreground">
                {isEnglish ? "Avg Speed" : "Vel. Média"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{formatSpeed(maxSpeed)}</p>
              <p className="text-[10px] text-muted-foreground">
                {isEnglish ? "Max Speed" : "Vel. Máx"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {status === "idle" && (
          <Button
            onClick={startTracking}
            className="h-16 w-16 rounded-2xl bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
          >
            <Play className="w-7 h-7 ml-0.5" />
          </Button>
        )}
        {status === "tracking" && (
          <>
            <Button
              onClick={pauseTracking}
              variant="outline"
              className="h-14 w-14 rounded-2xl border-border"
            >
              <Pause className="w-6 h-6" />
            </Button>
            <Button
              onClick={stopTracking}
              className="h-16 w-16 rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
            >
              <Square className="w-6 h-6" />
            </Button>
          </>
        )}
        {status === "paused" && (
          <>
            <Button
              onClick={resumeTracking}
              className="h-16 w-16 rounded-2xl bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
            >
              <Play className="w-7 h-7 ml-0.5" />
            </Button>
            <Button
              onClick={stopTracking}
              variant="outline"
              className="h-14 w-14 rounded-2xl border-red-500 text-red-500 hover:bg-red-500/10"
            >
              <Square className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {/* History */}
      <div className="glass-strong border border-border rounded-2xl p-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-brand" />
            <p className="text-sm font-medium text-foreground">
              {isEnglish ? "Recent Sessions" : "Sessões Recentes"}
            </p>
            <span className="text-xs text-muted-foreground">({sessions.length})</span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showHistory && "rotate-180")} />
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                {recentSessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {isEnglish ? "No sessions yet" : "Nenhuma sessão ainda"}
                  </p>
                ) : (
                  recentSessions.map((s) => {
                    const act = ACTIVITIES.find((a) => a.id === s.activityType) || ACTIVITIES[1]
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-background/50", act.color)}>
                          <act.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {isEnglish ? act.labelEn : act.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(s.startedAt).toLocaleDateString(isEnglish ? "en-US" : "pt-BR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">{formatDistance(s.distance)}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDuration(s.duration)} · {s.calories}kcal</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
