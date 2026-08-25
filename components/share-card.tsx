"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, Share2, MessageCircle, Instagram, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface GpsPoint {
  lat: number; lng: number; timestamp: number; altitude?: number; speed?: number
}

interface ShareCardData {
  activityType: string
  activityLabel: string
  points: GpsPoint[]
  duration: number
  distance: number
  calories: number
  avgSpeed: number
  maxSpeed: number
  steps: number
  elevation: number
  pace: string
  startedAt: string
}

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

function fmtDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(2)} km`
}

const ACTIVITY_COLORS: Record<string, string> = {
  walking: "#34D399", running: "#34D399", cycling: "#3B82F6",
  hiking: "#F59E0B", swimming: "#06B6D4", rowing: "#8B5CF6",
  elliptical: "#EC4899", stairs: "#EF4444",
}

function drawRouteOnCanvas(
  ctx: CanvasRenderingContext2D,
  points: GpsPoint[],
  x: number, y: number, w: number, h: number,
  color: string
) {
  if (points.length < 2) return

  const lats = points.map(p => p.lat)
  const lngs = points.map(p => p.lng)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const latRange = maxLat - minLat || 0.001
  const lngRange = maxLng - minLng || 0.001
  const padding = 40

  const toX = (lng: number) => x + padding + ((lng - minLng) / lngRange) * (w - padding * 2)
  const toY = (lat: number) => y + h - padding - ((lat - minLat) / latRange) * (h - padding * 2)

  ctx.save()
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  ctx.beginPath()
  ctx.moveTo(toX(points[0].lng), toY(points[0].lat))
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toX(points[i].lng), toY(points[i].lat))
  }
  ctx.strokeStyle = color + "40"
  ctx.lineWidth = 12
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(toX(points[0].lng), toY(points[0].lat))
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toX(points[i].lng), toY(points[i].lat))
  }
  ctx.strokeStyle = color
  ctx.lineWidth = 5
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(toX(points[0].lng), toY(points[0].lat), 8, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 3
  ctx.stroke()

  const last = points[points.length - 1]
  ctx.beginPath()
  ctx.arc(toX(last.lng), toY(last.lat), 8, 0, Math.PI * 2)
  ctx.fillStyle = "#EF4444"
  ctx.fill()
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.restore()
}

async function generateShareCard(data: ShareCardData): Promise<Blob> {
  const W = 1080, H = 1920
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, "#0a0a0a")
  grad.addColorStop(0.5, "#111111")
  grad.addColorStop(1, "#0a0a0a")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = "rgba(52,211,153,0.03)"
  ctx.fillRect(0, 0, W, H)

  const actColor = ACTIVITY_COLORS[data.activityType] || "#34D399"

  ctx.fillStyle = actColor
  ctx.font = "bold 32px system-ui, -apple-system, sans-serif"
  ctx.fillText(data.activityLabel.toUpperCase(), 60, 120)

  const date = new Date(data.startedAt)
  ctx.fillStyle = "#666666"
  ctx.font = "28px system-ui, -apple-system, sans-serif"
  ctx.fillText(
    date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
    60, 165
  )

  if (data.points.length >= 2) {
    drawRouteOnCanvas(ctx, data.points, 0, 220, W, 900, actColor)
  } else {
    ctx.fillStyle = "#1a1a1a"
    ctx.roundRect(60, 220, W - 120, 900, 24)
    ctx.fill()
    ctx.fillStyle = "#333333"
    ctx.font = "32px system-ui, -apple-system, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("Sem dados de rota", W / 2, 680)
    ctx.textAlign = "left"
  }

  const statsY = 1160
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 96px system-ui, -apple-system, sans-serif"
  const distText = data.distance < 1 ? `${Math.round(data.distance * 1000)}` : data.distance.toFixed(2)
  ctx.fillText(distText, 60, statsY + 90)
  ctx.fillStyle = "#666666"
  ctx.font = "36px system-ui, -apple-system, sans-serif"
  ctx.fillText(data.distance < 1 ? "metros" : "quilômetros", 60, statsY + 135)

  const lineY = statsY + 170
  ctx.strokeStyle = "#222222"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(60, lineY)
  ctx.lineTo(W - 60, lineY)
  ctx.stroke()

  const detailY = lineY + 70
  const colW = (W - 120) / 3

  const drawStat = (x: number, value: string, label: string) => {
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 48px system-ui, -apple-system, sans-serif"
    ctx.fillText(value, x, detailY + 48)
    ctx.fillStyle = "#666666"
    ctx.font = "28px system-ui, -apple-system, sans-serif"
    ctx.fillText(label, x, detailY + 88)
  }

  drawStat(60, fmtDuration(data.duration), "DURAÇÃO")
  drawStat(60 + colW, data.pace, "RITMO")
  drawStat(60 + colW * 2, `${data.calories}`, "KCAL")

  const detail2Y = detailY + 140
  drawStat(60, `${data.avgSpeed.toFixed(1)}`, "VELOCIDADE MÉDIA")
  drawStat(60 + colW, `${data.maxSpeed.toFixed(1)}`, "VELOCIDADE MÁX")
  if (data.steps > 0) {
    drawStat(60 + colW * 2, data.steps.toLocaleString(), "PASSOS")
  } else if (data.elevation > 0) {
    drawStat(60 + colW * 2, `${data.elevation}m`, "ELEVAÇÃO")
  }

  const footerY = H - 180
  ctx.strokeStyle = "#222222"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(60, footerY)
  ctx.lineTo(W - 60, footerY)
  ctx.stroke()

  const iconImg = new Image()
  iconImg.src = "/icon.svg"

  return new Promise((resolve) => {
    iconImg.onload = () => {
      ctx.drawImage(iconImg, 60, footerY + 24, 48, 48)
      ctx.fillStyle = actColor
      ctx.font = "bold 36px system-ui, -apple-system, sans-serif"
      ctx.fillText("VyseFit", 120, footerY + 60)
      ctx.fillStyle = "#444444"
      ctx.font = "28px system-ui, -apple-system, sans-serif"
      ctx.fillText("AI Fitness Coach", 120, footerY + 100)
      canvas.toBlob((blob) => resolve(blob!), "image/png", 1.0)
    }
    iconImg.onerror = () => {
      ctx.fillStyle = actColor
      ctx.font = "bold 36px system-ui, -apple-system, sans-serif"
      ctx.fillText("VyseFit", 60, footerY + 60)
      ctx.fillStyle = "#444444"
      ctx.font = "28px system-ui, -apple-system, sans-serif"
      ctx.fillText("AI Fitness Coach", 60, footerY + 100)
      canvas.toBlob((blob) => resolve(blob!), "image/png", 1.0)
    }
  })
}

export function ShareCard({
  data, onClose, isEnglish,
}: {
  data: ShareCardData; onClose: () => void; isEnglish: boolean
}) {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [generating, setGenerating] = useState(true)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    let cancelled = false
    generateShareCard(data).then((blob) => {
      if (!cancelled) {
        setImageBlob(blob)
        setImageUrl(URL.createObjectURL(blob))
        setGenerating(false)
      }
    })
    return () => { cancelled = true; if (imageUrl) URL.revokeObjectURL(imageUrl) }
  }, [])

  const handleDownload = useCallback(() => {
    if (!imageBlob) return
    const url = URL.createObjectURL(imageBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fitverse-${data.activityType}-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }, [imageBlob, data])

  const handleShare = useCallback(async () => {
    if (!imageBlob) return
    const file = new File([imageBlob], `fitverse-${data.activityType}.png`, { type: "image/png" })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `${data.activityLabel} - VyseFit` })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } catch {}
    } else {
      handleDownload()
    }
  }, [imageBlob, data, handleDownload])

  const handleWhatsApp = useCallback(() => {
    if (!imageBlob) return
    handleDownload()
    window.open(`https://wa.me/?text=${encodeURIComponent(`${data.activityLabel} - ${fmtDist(data.distance)} em ${fmtDuration(data.duration)} 🔥`)}`, "_blank")
  }, [imageBlob, data, handleDownload])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-md mx-4 flex flex-col items-center">

        <div className="flex items-center justify-between w-full mb-4">
          <h3 className="text-lg font-bold text-white">
            {isEnglish ? "Share Activity" : "Compartilhar Atividade"}
          </h3>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {generating ? (
          <div className="w-full aspect-[9/16] rounded-3xl bg-white/5 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-white/60">{isEnglish ? "Generating image..." : "Gerando imagem..."}</p>
            </div>
          </div>
        ) : imageUrl ? (
          <>
            <div className="w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Share Card" className="w-full h-auto" />
            </div>

            <div className="flex items-center gap-3 mt-5 w-full">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleDownload}
                className={cn(
                  "flex-1 h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                  shared
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/10 text-white border border-white/10 hover:bg-white/15"
                )}>
                {shared ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                {shared ? (isEnglish ? "Saved!" : "Salvo!") : (isEnglish ? "Save Image" : "Salvar")}
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }} onClick={handleShare}
                className="flex-1 h-12 rounded-2xl bg-brand text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand/90 transition-colors shadow-lg shadow-brand/25">
                <Share2 className="w-4 h-4" />
                {isEnglish ? "Share" : "Compartilhar"}
              </motion.button>
            </div>

            <div className="flex items-center gap-3 mt-3 w-full">
              <button onClick={handleWhatsApp}
                className="flex-1 h-11 rounded-xl bg-[#25D366]/15 text-[#25D366] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#25D366]/25 transition-colors border border-[#25D366]/20">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button onClick={handleDownload}
                className="flex-1 h-11 rounded-xl bg-[#E4405F]/15 text-[#E4405F] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#E4405F]/25 transition-colors border border-[#E4405F]/20">
                <Instagram className="w-4 h-4" />
                Instagram
              </button>
            </div>
          </>
        ) : null}
      </motion.div>
    </motion.div>
  )
}
