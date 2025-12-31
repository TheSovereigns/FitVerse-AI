"use client"

import { useState } from "react"
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
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("week")
  const router = useRouter()

  // Calculate weekly average score
  const getAverageScore = (period: "week" | "month") => {
    const now = Date.now()
    const periodMs = period === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000

    const recentScans = scanHistory.filter((item) => {
      const scanTime = new Date(item.scannedAt).getTime()
      return now - scanTime <= periodMs
    })

    if (recentScans.length === 0) return 0

    const sum = recentScans.reduce((acc, item) => acc + item.score, 0)
    return Math.round(sum / recentScans.length)
  }

  const averageScore = getAverageScore(selectedPeriod)
  const scoreColor = averageScore >= 70 ? "text-cyan-400" : averageScore >= 40 ? "text-blue-400" : "text-blue-300"
  const scoreBg = averageScore >= 70 ? "bg-cyan-500/10" : averageScore >= 40 ? "bg-blue-500/10" : "bg-blue-400/10"

  // Calculate quality distribution
  const getQualityDistribution = () => {
    const now = Date.now()
    const periodMs = selectedPeriod === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000

    const recentScans = scanHistory.filter((item) => {
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
    const sortedScans = [...scanHistory].sort(
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
    <div className="space-y-4 bg-slate-950 p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-semibold text-white">Perfil de Saúde</h2>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={selectedPeriod === "week" ? "default" : "outline"}
            onClick={() => setSelectedPeriod("week")}
            className={
              selectedPeriod === "week"
                ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                : "border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            }
          >
            7 dias
          </Button>
          <Button
            size="sm"
            variant={selectedPeriod === "month" ? "default" : "outline"}
            onClick={() => setSelectedPeriod("month")}
            className={
              selectedPeriod === "month"
                ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                : "border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            }
          >
            30 dias
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/50 shadow-lg shadow-violet-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">
                Plano {userSubscription.charAt(0).toUpperCase() + userSubscription.slice(1)}
              </h3>
              <p className="text-xs text-slate-400">
                {userSubscription === "free"
                  ? "Faça upgrade para recursos ilimitados"
                  : "Obrigado por ser um membro premium"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => router.push("/subscription")}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white"
          >
            {userSubscription === "free" ? "Fazer Upgrade" : "Gerenciar"}
          </Button>
        </div>
      </Card>

      {/* Average Score Card */}
      <Card className={`p-6 ${scoreBg} bg-slate-900 border-cyan-500/30 shadow-lg shadow-cyan-500/10`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-400">Qualidade Média da Dieta</h3>
          <TrendingUp className={`w-5 h-5 ${scoreColor}`} />
        </div>
        <div className="flex items-end gap-4">
          <p className={`text-5xl font-bold ${scoreColor}`}>{averageScore}</p>
          <div className="flex-1 mb-3">
            <Progress
              value={averageScore}
              className="h-3 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Baseado em {distribution.total} produtos escaneados {selectedPeriod === "week" ? "esta semana" : "este mês"}
        </p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-slate-900 border-cyan-500/30 shadow-lg shadow-cyan-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-medium text-white">Sequência</h3>
          </div>
          <p className="text-3xl font-bold text-cyan-400">{streak}</p>
          <p className="text-xs text-slate-500 mt-1">dias consecutivos</p>
        </Card>

        <Card className="p-4 bg-slate-900 border-cyan-500/30 shadow-lg shadow-cyan-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-medium text-white">Produtos</h3>
          </div>
          <p className="text-3xl font-bold text-cyan-400">{distribution.total}</p>
          <p className="text-xs text-slate-500 mt-1">escaneados</p>
        </Card>
      </div>

      {/* Distribution Chart */}
      <Card className="p-4 bg-slate-900 border-cyan-500/30 shadow-lg shadow-cyan-500/10">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
          <Award className="w-5 h-5 text-cyan-400" />
          Distribuição de Qualidade
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Saudáveis</span>
              <span className="text-sm font-bold text-cyan-400">{distribution.healthy}%</span>
            </div>
            <Progress value={distribution.healthy} className="h-2 bg-slate-800 [&>div]:bg-cyan-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Moderados</span>
              <span className="text-sm font-bold text-blue-400">{distribution.moderate}%</span>
            </div>
            <Progress value={distribution.moderate} className="h-2 bg-slate-800 [&>div]:bg-blue-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Evitar</span>
              <span className="text-sm font-bold text-blue-300">{distribution.poor}%</span>
            </div>
            <Progress value={distribution.poor} className="h-2 bg-slate-800 [&>div]:bg-blue-400" />
          </div>
        </div>
      </Card>

      {/* Insights Card */}
      <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 shadow-lg shadow-cyan-500/10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-white">Suas Metas</h3>
        </div>

        <div className="space-y-3">
          {averageScore >= 70 ? (
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5 bg-cyan-500 text-slate-950 border-0">Excelente</Badge>
              <p className="text-sm flex-1 text-slate-300">
                Você está mantendo uma dieta de alta qualidade! Continue assim para maximizar sua longevidade.
              </p>
            </div>
          ) : averageScore >= 40 ? (
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5 bg-blue-500 text-slate-950 border-0">Bom progresso</Badge>
              <p className="text-sm flex-1 text-slate-300">
                Você está no caminho certo! Tente aumentar a proporção de produtos com score acima de 70.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5 bg-blue-400 text-slate-950 border-0">Atenção</Badge>
              <p className="text-sm flex-1 text-slate-300">
                Sua dieta pode melhorar. Use as sugestões do BioScan para escolher alternativas mais saudáveis.
              </p>
            </div>
          )}

          {streak >= 7 && (
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 border-0">
                Meta alcançada
              </Badge>
              <p className="text-sm flex-1 text-slate-300">
                Parabéns! Você completou {streak} dias de monitoramento consistente!
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Scan History Section */}
      <div className="pt-4">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-white">
          <Clock className="w-5 h-5 text-cyan-400" />
          Histórico de Scans
        </h3>
        <div className="bg-slate-900 rounded-lg p-4 border border-cyan-500/30">
          <ScanHistory items={scanHistory} showAll />
        </div>
      </div>
    </div>
  )
}
