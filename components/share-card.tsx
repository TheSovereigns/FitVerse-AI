"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Share2, X, Download, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { useStreak } from "@/hooks/useStreak"

interface ShareCardProps {
  type: "achievement" | "streak" | "score" | "workout"
  data?: {
    badgeName?: string
    badgeIcon?: string
    score?: number
    productName?: string
    workoutName?: string
  }
}

export function ShareCard({ type, data }: ShareCardProps) {
  const { locale } = useTranslation()
  const { plan } = usePlanLimits()
  const { currentStreak } = useStreak()
  const isEnglish = locale === "en-US"
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  const getContent = () => {
    switch (type) {
      case "achievement":
        return {
          title: isEnglish ? "Achievement Unlocked!" : "Conquista Desbloqueada!",
          subtitle: `${data?.badgeIcon || "🏅"} ${data?.badgeName || "New Badge"}`,
          color: "#F59E0B",
        }
      case "streak":
        return {
          title: isEnglish ? `${currentStreak} Day Streak!` : `${currentStreak} Dias Seguidos!`,
          subtitle: isEnglish ? "Keep going!" : "Continue assim!",
          color: "#EF4444",
        }
      case "score":
        return {
          title: isEnglish ? `Score: ${data?.score}/100` : `Pontuacao: ${data?.score}/100`,
          subtitle: data?.productName || "Product Analysis",
          color: data?.score && data.score >= 70 ? "#22C55E" : "#F59E0B",
        }
      case "workout":
        return {
          title: isEnglish ? "Workout Complete!" : "Treino Completo!",
          subtitle: data?.workoutName || "Today's Training",
          color: "#8B5CF6",
        }
      default:
        return {
          title: "FitVerse AI",
          subtitle: isEnglish ? "Your fitness journey" : "Sua jornada fitness",
          color: "#F97316",
        }
    }
  }

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    setGenerating(true)

    try {
      canvas.width = 1080
      canvas.height = 1080

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "#0d0705")
      gradient.addColorStop(0.5, "#1a0f00")
      gradient.addColorStop(1, "#0d0705")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Accent circle
      const content = getContent()
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2 - 80, 180, 0, Math.PI * 2)
      ctx.fillStyle = content.color + "20"
      ctx.fill()
      ctx.strokeStyle = content.color
      ctx.lineWidth = 3
      ctx.stroke()

      // Title
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 56px -apple-system, BlinkMacSystemFont, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(content.title, canvas.width / 2, canvas.height / 2 - 60)

      // Subtitle
      ctx.fillStyle = "#FFFFFF99"
      ctx.font = "36px -apple-system, BlinkMacSystemFont, sans-serif"
      ctx.fillText(content.subtitle, canvas.width / 2, canvas.height / 2 + 10)

      // Brand
      ctx.fillStyle = "#F97316"
      ctx.font = "bold 42px -apple-system, BlinkMacSystemFont, sans-serif"
      ctx.fillText("FitVerse AI", canvas.width / 2, canvas.height / 2 + 200)

      // Tagline
      ctx.fillStyle = "#FFFFFF66"
      ctx.font = "28px -apple-system, BlinkMacSystemFont, sans-serif"
      ctx.fillText(
        isEnglish ? "Your AI Fitness Companion" : "Seu Companheiro Fitness IA",
        canvas.width / 2,
        canvas.height / 2 + 260
      )

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          setGenerating(false)
          resolve(blob)
        }, "image/png")
      })
    } catch {
      setGenerating(false)
      return null
    }
  }, [type, data, currentStreak, isEnglish])

  const handleShare = async () => {
    const blob = await generateImage()
    if (!blob) return

    if (navigator.share) {
      const file = new File([blob], "fitverse-share.png", { type: "image/png" })
      try {
        await navigator.share({
          title: "FitVerse AI",
          files: [file],
        })
      } catch {}
    } else {
      setShowPreview(true)
    }
  }

  const handleDownload = async () => {
    const blob = await generateImage()
    if (!blob) return

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fitverse-share.png"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    const text = `Check out FitVerse AI! ${isEnglish ? "Your AI-powered fitness companion" : "Seu companheiro fitness com IA"} 💪`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button
        onClick={handleShare}
        variant="ghost"
        size="sm"
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        {isEnglish ? "Share" : "Compartilhar"}
      </Button>

      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-3xl p-6 max-w-sm w-full space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">
                  {isEnglish ? "Share your progress" : "Compartilhe seu progresso"}
                </h3>
                <button onClick={() => setShowPreview(false)} className="p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-square rounded-2xl bg-muted overflow-hidden flex items-center justify-center">
                {generating ? (
                  <div className="text-sm text-muted-foreground">
                    {isEnglish ? "Generating..." : "Gerando..."}
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-4">
                    <div className="text-6xl">{data?.badgeIcon || "💪"}</div>
                    <div className="font-bold text-xl">{getContent().title}</div>
                    <div className="text-muted-foreground">{getContent().subtitle}</div>
                    <div className="text-primary font-bold text-lg">FitVerse AI</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="outline" className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  {isEnglish ? "Download" : "Baixar"}
                </Button>
                <Button onClick={handleCopy} variant="outline" className="flex-1 gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? (isEnglish ? "Copied!" : "Copiado!") : (isEnglish ? "Copy text" : "Copiar texto")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
