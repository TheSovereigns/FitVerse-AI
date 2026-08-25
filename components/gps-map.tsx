"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface GpsPoint {
  lat: number; lng: number; timestamp: number; altitude?: number; speed?: number
}

export default function GpsMap({
  points, ghostPoints, showGhost, isTracking,
}: {
  points: GpsPoint[]; ghostPoints: GpsPoint[]; showGhost: boolean; isTracking: boolean
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const routeLayerRef = useRef<L.LayerGroup | null>(null)
  const ghostLayerRef = useRef<L.LayerGroup | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const fallbackCenter: [number, number] = [-23.5505, -46.6333]

    const map = L.map(mapRef.current, {
      center: fallbackCenter,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map)

    mapInstanceRef.current = map
    routeLayerRef.current = L.layerGroup().addTo(map)
    ghostLayerRef.current = L.layerGroup().addTo(map)
    markerLayerRef.current = L.layerGroup().addTo(map)

    if (points.length === 0 && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 1 })
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }

    const timer = setTimeout(() => map.invalidateSize(), 300)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    map.invalidateSize()

    if (points.length > 0) {
      const last = points[points.length - 1]
      map.flyTo([last.lat, last.lng], 16, { duration: 0.5 })
    }

    routeLayerRef.current?.clearLayers()
    ghostLayerRef.current?.clearLayers()
    markerLayerRef.current?.clearLayers()

    if (showGhost && ghostPoints.length > 1) {
      L.polyline(ghostPoints.map(p => [p.lat, p.lng]), {
        color: "#ffffff", weight: 2, opacity: 0.15, dashArray: "8 8",
      }).addTo(ghostLayerRef.current!)
    }

    if (points.length > 1) {
      L.polyline(points.map(p => [p.lat, p.lng]), {
        color: "rgba(52,211,153,0.25)", weight: 12, opacity: 0.6, lineCap: "round", lineJoin: "round",
      }).addTo(routeLayerRef.current!)
      L.polyline(points.map(p => [p.lat, p.lng]), {
        color: "#34D399", weight: 4, opacity: 1, lineCap: "round", lineJoin: "round",
      }).addTo(routeLayerRef.current!)
    }

    if (points.length > 0) {
      const startIcon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;background:#34D399;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(52,211,153,0.6)"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8],
      })
      L.marker([points[0].lat, points[0].lng], { icon: startIcon })
        .addTo(markerLayerRef.current!)
    }

    if (points.length > 0 && isTracking) {
      const last = points[points.length - 1]
      const currentIcon = L.divIcon({
        className: "",
        html: `<div style="width:24px;height:24px;position:relative"><div style="position:absolute;inset:0;background:rgba(52,211,153,0.3);border-radius:50%;animation:pulse-ring 1.5s infinite"></div><div style="position:absolute;top:6px;left:6px;width:12px;height:12px;background:#34D399;border:2px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(52,211,153,0.8)"></div></div>`,
        iconSize: [24, 24], iconAnchor: [12, 12],
      })
      L.marker([last.lat, last.lng], { icon: currentIcon })
        .addTo(markerLayerRef.current!)
    }

    if (points.length > 0 && !isTracking) {
      const last = points[points.length - 1]
      const endIcon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;background:#EF4444;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(239,68,68,0.6)"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8],
      })
      L.marker([last.lat, last.lng], { icon: endIcon })
        .addTo(markerLayerRef.current!)
    }
  }, [points, ghostPoints, showGhost, isTracking])

  return (
    <div
      ref={mapRef}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    />
  )
}
