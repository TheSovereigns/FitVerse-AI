"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { User, TrendingUp, Target, Calendar, Award, Sparkles, Clock, Crown } from "lucide-react"
import { ScanHistory } from "@/components/scan-history"

interface ScanHistoryItem {
  id: string
  name: string
  score: number
  image: string
  scannedAt: string
}

interface HealthProfileProps {
  scanHistory: ScanHistoryItem[]
}

export function HealthProfile({ scanHistory }: HealthProfileProps) {
  const [localScanHistory, setLocalScanHistory] = useState<ScanHistoryItem[]>(scanHistory)
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("week")
  const router = useRouter()

  // Carrega o histórico do localStorage ao iniciar e atualiza se novos scans chegarem
  useEffect(() => {
    const savedScans = localStorage.getItem("scanHistory")
    const initialScans = savedScans ? JSON.parse(savedScans) : []
    
    // Combina o histórico salvo com qualquer novo scan vindo das props
    const combinedHistory = [...scanHistory, ...initialScans].reduce((acc, current) => {
      if (!acc.find((item: ScanHistoryItem) => item.id === current.id)) {
        acc.push(current)
      }
      return acc
    }, [])

    setLocalScanHistory(combinedHistory)
    localStorage.setItem("scanHistory", JSON.stringify(combinedHistory))
  }, [scanHistory])

  // Calculate weekly average score
  const getAverageScore = (period: "week" | "month") => {
    const now = Date.now()
    const periodMs = period === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000

    const recentScans = localScanHistory.filter((item) => {
      const scanTime = new Date(item.scannedAt).getTime()
      return now - scanTime <= periodMs
    })

    if (recentScans.length === 0) return 0

    const sum = recentScans.reduce((acc, item) => acc + item.score, 0)
    return Math.round(sum / recentScans.length)
  }

  const averageScore = getAverageScore(selectedPeriod)
  const scoreColor = averageScore >= 70 ? "text-green-500" : averageScore >= 40 ? "text-yellow-500" : "text-red-500"
  const scoreBg = averageScore >= 70 ? "bg-green-500/10" : averageScore >= 40 ? "bg-yellow-500/10" : "bg-red-500/10"

  // Calculate quality distribution
  const getQualityDistribution = () => {
    const now = Date.now()
    const periodMs = selectedPeriod === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000

    const recentScans = localScanHistory.filter((item) => {
      const scanTime = new Date(item.scannedAt).getTime()
      return now - scanTime <= periodMs
    })

    const healthy = recentScans.filter((item) => item.score >= 70).length
    const moderate = recentScans.filter((item) => item.score >= 40 && item.score < 70).length
    const poor = recentScans.filter((item) => item.score < 40).length
    const total = recentScans.length

    return {
      healthy: total > 0 ? Math.round((healthy / total) * 100) : 0,
      moderate: total > 0 ? Math.round((moderate / total) * 100) : 0,
      poor: total > 0 ? Math.round((poor / total) * 100) : 0,
      total,
    }
  }

  const distribution = getQualityDistribution()

  // Get streak
  const getStreak = () => {
    const sortedScans = [...localScanHistory].sort(
      (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
    )

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const scan of sortedScans) {
      const scanDate = new Date(scan.scannedAt)
      scanDate.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor((currentDate.getTime() - scanDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === streak) {
        streak++
        currentDate = scanDate
      } else if (daysDiff > streak) {
        break
      }
    }

    return streak
  }

  const streak = getStreak()

  const getUserSubscription = () => {
    if (typeof window === "undefined") return "free"
    const user = JSON.parse(localStorage.getItem("user") || '{"subscription":"free"}')
    return user.subscription || "free"
  }

  const userSubscription = getUserSubscription()

  return (
    <div className="px-4 pt-8 pb-24 text-foreground bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <User className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              Perfil de <span className="text-primary">Saúde</span>
            </h1>
            <p className="text-muted-foreground text-pretty font-medium text-sm">
              Seu progresso e histórico de longevidade.
            </p>
          </div>
        </div>
        <div className="flex space-x-2 p-1 bg-muted/50 border border-border rounded-full">
          <button
            onClick={() => setSelectedPeriod("week")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${selectedPeriod === "week" ? "bg-primary/10 text-primary border border-primary" : "text-muted-foreground border border-transparent hover:bg-accent"}`}
          >
            7 Dias
          </button>
          <button
            onClick={() => setSelectedPeriod("month")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${selectedPeriod === "month" ? "bg-primary/10 text-primary border border-primary" : "text-muted-foreground border border-transparent hover:bg-accent"}`}
          >
            30 Dias
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card de Assinatura */}
        <div className="relative bg-card border border-border rounded-[2rem] p-6 overflow-hidden border-b-[6px] border-b-primary shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-black text-xl uppercase tracking-tight text-foreground">
                Plano {userSubscription.charAt(0).toUpperCase() + userSubscription.slice(1)}
              </h3>
              <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase">
                {userSubscription === "free" ? "Recursos Limitados" : "Acesso Total"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/subscription")}
            className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 group"
          >
            {userSubscription === "free" ? "Fazer Upgrade" : "Gerenciar"}
          </Button>
        </div>

        {/* Grid de Estatísticas */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Score Médio */}
          <div className={`relative bg-card border border-border rounded-[2rem] p-6 overflow-hidden shadow-2xl text-center flex flex-col justify-between`}>
            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent ${scoreBg} pointer-events-none`} />
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Score Médio</h3>
              <p className={`text-7xl font-black ${scoreColor}`}>{averageScore}</p>
            </div>
            <Progress value={averageScore} className="h-2 bg-muted" indicatorClassName={scoreColor.replace("text-", "bg-")} />
          </div>

          {/* Sequência */}
          <div className="relative bg-card border border-border rounded-[2rem] p-6 overflow-hidden shadow-2xl text-center flex flex-col justify-center">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Sequência</h3>
            <p className="text-7xl font-black text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground">dias consecutivos</p>
          </div>

          {/* Scans no Período */}
          <div className="relative bg-card border border-border rounded-[2rem] p-6 overflow-hidden shadow-2xl text-center flex flex-col justify-center">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Scans no Período</h3>
            <p className="text-7xl font-black text-foreground">{distribution.total}</p>
            <p className="text-xs text-muted-foreground">{selectedPeriod === "week" ? "últimos 7 dias" : "últimos 30 dias"}</p>
          </div>
        </div>

        {/* Histórico de Scans */}
        <div className="relative bg-card border border-border rounded-[2rem] p-6 overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-xl opacity-80" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-xl opacity-80" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-xl opacity-80" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-xl opacity-80" />
          <ScanHistory items={localScanHistory} showAll />
        </div>
      </div>
    </div>
  )
}
