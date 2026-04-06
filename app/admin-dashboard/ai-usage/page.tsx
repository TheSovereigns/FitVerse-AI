"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Bot, 
  MessageCircle, 
  Clock, 
  Zap,
  TrendingUp,
  BarChart3,
  Calendar,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

interface AIUsageStats {
  totalMessages: number
  avgMessagesPerUser: number
  totalTokens: number
  peakHour: number
  topQuestions: { question: string; count: number }[]
}

export default function AdminAIUsagePage() {
  const router = useRouter()
  const { user, isLoading: authLoading, profile } = useAuth()
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login")
        return
      }
      if (profile && !profile.is_admin) {
        setAccessDenied(true)
      } else if (!profile) {
        supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (!data?.is_admin) setAccessDenied(true)
          })
      }
    }
  }, [user, authLoading, profile, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-black text-white mb-4">Acesso Negado</h1>
          <p className="text-zinc-400 mb-8">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => router.push("/")} className="bg-orange-500 hover:bg-orange-600 text-black font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar ao Início
          </Button>
        </div>
      </div>
    )
  }

  const { t, locale } = useTranslation()
  const [stats, setStats] = useState<AIUsageStats>({
    totalMessages: 0,
    avgMessagesPerUser: 0,
    totalTokens: 0,
    peakHour: 0,
    topQuestions: []
  })
  const [hourlyData, setHourlyData] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAIUsageData()
  }, [])

  const fetchAIUsageData = async () => {
    try {
      // Fetch AI usage data
      const { data: usageData } = await supabase
        .from('ai_usage')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)

      // Calculate stats
      const totalMessages = usageData?.reduce((acc, u) => acc + (u.messages_count || 0), 0) || 0
      const totalTokens = usageData?.reduce((acc, u) => acc + (u.tokens_used || 0), 0) || 0
      
      // Get unique users
      const { count: uniqueUsers } = await supabase
        .from('ai_usage')
        .select('*', { count: 'exact', head: true })

      const avgMessages = uniqueUsers ? Math.round(totalMessages / uniqueUsers) : 0

      // Mock hourly data (would need real timestamps)
      const mockHourly = Array.from({ length: 24 }, (_, i) => {
        const base = 50
        const morning = i >= 6 && i <= 11 ? 1.5 : 1
        const evening = i >= 18 && i <= 22 ? 2 : 1
        const night = i >= 0 && i <= 5 ? 0.3 : 1
        return Math.floor(base * morning * evening * night * (0.8 + Math.random() * 0.4))
      })

      // Find peak hour
      const peakHour = mockHourly.indexOf(Math.max(...mockHourly))

      // Mock top questions
      const topQuestions = [
        { question: locale === "en-US" ? "What should I eat for breakfast?" : "O que devo comer no café da manhã?", count: 245 },
        { question: locale === "en-US" ? "Create a workout plan for me" : "Crie um treino para mim", count: 189 },
        { question: locale === "en-US" ? "How many calories should I eat?" : "Quantas calorias devo comer?", count: 156 },
        { question: locale === "en-US" ? "Best exercises for abs" : "Melhores exercícios para abdomen", count: 134 },
        { question: locale === "en-US" ? "Healthy snack options" : "Opções de lanche saudável", count: 98 },
      ]

      setStats({
        totalMessages,
        avgMessagesPerUser: avgMessages,
        totalTokens,
        peakHour,
        topQuestions
      })

      setHourlyData(mockHourly)
    } catch (error) {
      console.error("Error fetching AI usage data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatHour = (hour: number) => {
    if (locale === "en-US") {
      return hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`
    }
    return `${hour}:00`
  }

  const usageCards = [
    {
      title: locale === "en-US" ? "Total Messages" : "Total de Mensagens",
      value: stats.totalMessages.toLocaleString(),
      icon: MessageCircle,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      title: locale === "en-US" ? "Avg Messages/User" : "Média Mensagens/Usuário",
      value: stats.avgMessagesPerUser,
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10"
    },
    {
      title: locale === "en-US" ? "Peak Usage Hour" : "Hora de Pico",
      value: formatHour(stats.peakHour),
      icon: Clock,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10"
    },
    {
      title: locale === "en-US" ? "Total Tokens" : "Total de Tokens",
      value: (stats.totalTokens / 1000).toFixed(1) + "K",
      icon: Zap,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10"
    },
  ]

  const maxHourly = Math.max(...hourlyData)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">
          {locale === "en-US" ? "AI Usage" : "Uso da IA"}
        </h1>
        <p className="text-white/40 mt-1">
          {locale === "en-US" ? "Monitor AI chat and generation usage" : "Monitorar uso do chat e geração de IA"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {usageCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-strong border border-white/10 rounded-2xl p-5"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", card.bgColor)}>
              <card.icon className={cn("w-6 h-6", card.color)} />
            </div>
            <p className="text-2xl font-black text-white">{card.value}</p>
            <p className="text-sm text-white/40 mt-1">{card.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Hourly Heatmap */}
      <div className="glass-strong border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-black text-white mb-6">
          {locale === "en-US" ? "Usage by Hour of Day" : "Uso por Hora do Dia"}
        </h3>
        
        <div className="flex items-end gap-1 h-32">
          {hourlyData.map((count, hour) => {
            const height = maxHourly ? (count / maxHourly) * 100 : 0
            const intensity = height / 100
            
            return (
              <div key={hour} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full rounded-t transition-all hover:opacity-80"
                  style={{ 
                    height: `${Math.max(height, 4)}%`,
                    backgroundColor: `rgba(255, 140, 0, ${0.2 + intensity * 0.8})`
                  }}
                  title={`${formatHour(hour)}: ${count} messages`}
                />
                <span className="text-[10px] text-white/30">{hour % 6 === 0 ? formatHour(hour).replace(/ (AM|PM)/, '') : ''}</span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-white/40">
          <span>12AM</span>
          <span>6AM</span>
          <span>12PM</span>
          <span>6PM</span>
          <span>11PM</span>
        </div>
      </div>

      {/* Top Questions */}
      <div className="glass-strong border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-black text-white mb-6">
          {locale === "en-US" ? "Most Asked Questions" : "Perguntas Mais Frequentes"}
        </h3>
        
        <div className="space-y-3">
          {stats.topQuestions.map((q, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{q.question}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary">{q.count}</p>
                <p className="text-xs text-white/40">{locale === "en-US" ? "times" : "vezes"}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}