"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  CreditCard,
  Activity,
  UserPlus,
  UserCheck,
  Crown,
  Sparkles
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { MetricCard } from "@/components/admin/metric-card"
import { ActivityFeed } from "@/components/admin/activity-feed"
import { PlansDonut } from "@/components/admin/plans-donut"
import { GrowthChart } from "@/components/admin/growth-chart"
import { useAdminRealtime } from "@/hooks/useAdminRealtime"

interface Stats {
  totalUsers: number
  usersToday: number
  activeSubscriptions: number
  mrr: number
  mrrUSD: number
  conversionRate: number
  onlineUsers: number
  freeUsers: number
  premiumUsers: number
}

interface DailyData {
  date: string
  newUsers: number
  totalUsers: number
}

interface TopUser {
  id: string
  name: string | null
  email: string
  plan: string
  total_messages: number
}

export default function AdminDashboardPage() {
  const { t, locale } = useTranslation()
  const { onlineCount, recentEvents, isConnected } = useAdminRealtime()
  
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    usersToday: 0,
    activeSubscriptions: 0,
    mrr: 0,
    mrrUSD: 0,
    conversionRate: 0,
    onlineUsers: 0,
    freeUsers: 0,
    premiumUsers: 0
  })
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [
        { count: totalUsers },
        { count: usersToday },
        { count: activeSubscriptions },
        { count: freeUsers },
        { count: premiumUsers },
        { data: profiles },
        { data: subscriptions },
        { data: topUsersData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'premium'),
        supabase.from('profiles').select('created_at').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('subscriptions').select('amount_brl, amount_usd').eq('status', 'active'),
        supabase.from('top_users_view').select('*').limit(5)
      ])

      const mrrBRL = subscriptions?.reduce((sum, s) => sum + (s.amount_brl || 0), 0) || 0
      const mrrUSD = subscriptions?.reduce((sum, s) => sum + (s.amount_usd || 0), 0) || 0
      const conversionRate = totalUsers ? ((premiumUsers || 0) / totalUsers) * 100 : 0

      setStats({
        totalUsers: totalUsers || 0,
        usersToday: usersToday || 0,
        activeSubscriptions: activeSubscriptions || 0,
        mrr: mrrBRL,
        mrrUSD: mrrUSD,
        conversionRate: Math.round(conversionRate * 10) / 10,
        onlineUsers: onlineCount,
        freeUsers: freeUsers || 0,
        premiumUsers: premiumUsers || 0
      })

      const groupedData: Record<string, { newUsers: number; total: number }> = {}
      const sortedProfiles = [...(profiles || [])].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      sortedProfiles.forEach(p => {
        const date = p.created_at.split('T')[0]
        if (!groupedData[date]) {
          groupedData[date] = { newUsers: 0, total: 0 }
        }
        groupedData[date].newUsers++
        groupedData[date].total = Object.keys(groupedData).filter(d => d <= date).length * groupedData[date].newUsers
      })

      const dailyDataArray = Object.entries(groupedData)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, data], index) => ({
          date,
          newUsers: data.newUsers,
          totalUsers: index + 1
        }))

      setDailyData(dailyDataArray)
      setTopUsers(topUsersData || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [onlineCount])

  useEffect(() => {
    fetchDashboardData()
    
    const interval = setInterval(fetchDashboardData, 30000)
    
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat(locale === 'en-US' ? 'en-US' : 'pt-BR', {
      style: 'currency',
      currency: locale === 'en-US' ? 'USD' : 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(locale === 'en-US' ? value : value / 4)
  }

  const metricCards = [
    {
      title: locale === "en-US" ? "Online Now" : "Online Agora",
      value: stats.onlineUsers,
      icon: Activity,
      variant: "success" as const,
      pulse: true,
      subtitle: locale === "en-US" ? `${stats.onlineUsers} users in app` : `${stats.onlineUsers} usuários no app`
    },
    {
      title: locale === "en-US" ? "Total Users" : "Total de Usuários",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      variant: "default" as const,
      subtitle: locale === "en-US" 
        ? `+${stats.usersToday} today` 
        : `+${stats.usersToday} hoje`
    },
    {
      title: locale === "en-US" ? "Free Plan" : "Plano Free",
      value: stats.freeUsers.toLocaleString(),
      icon: UserCheck,
      variant: "default" as const,
      subtitle: `${((stats.freeUsers / (stats.totalUsers || 1)) * 100).toFixed(1)}%`
    },
    {
      title: locale === "en-US" ? "Premium" : "Premium",
      value: stats.premiumUsers.toLocaleString(),
      icon: Crown,
      variant: "highlight" as const,
      subtitle: `${stats.conversionRate}% ${locale === "en-US" ? "conversion" : "conversão"}`
    },
    {
      title: locale === "en-US" ? "MRR" : "Receita Mensal",
      value: formatCurrency(locale === 'en-US' ? stats.mrrUSD : stats.mrr),
      icon: TrendingUp,
      variant: "warning" as const,
      subtitle: locale === "en-US"
        ? `$${(stats.mrrUSD * 4).toLocaleString()}/mo projection`
        : `R$ ${(stats.mrr * 12).toLocaleString()}/ano projeção`
    },
    {
      title: locale === "en-US" ? "New Today" : "Novos Hoje",
      value: stats.usersToday,
      icon: UserPlus,
      variant: "success" as const,
      subtitle: locale === "en-US" ? `of ${stats.totalUsers} total` : `de ${stats.totalUsers} total`
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-orange-400" />
        <h1 className="text-3xl font-black text-white">
          {locale === "en-US" ? "Dashboard Overview" : "Visão Geral"}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((metric, index) => (
          <MetricCard
            key={metric.title}
            {...metric}
            isLoading={loading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GrowthChart data={dailyData} isLoading={loading} />
        </div>
        <div>
          <PlansDonut 
            freeCount={stats.freeUsers} 
            premiumCount={stats.premiumUsers}
            isLoading={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed 
          events={recentEvents}
          isLoading={loading && recentEvents.length === 0}
        />

        <div className="glass-strong border border-orange-500/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-bold text-white">
              {locale === "en-US" ? "Top Users (This Week)" : "Top Usuários (Esta Semana)"}
            </h3>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : topUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-neutral-500">
                {locale === "en-US" ? "No data available" : "Nenhum dado disponível"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div 
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name || user.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {user.total_messages} {locale === "en-US" ? "messages" : "mensagens"}
                    </p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    user.plan === 'premium' 
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-neutral-700/50 text-neutral-400"
                  )}>
                    {user.plan === 'premium' ? 'Premium' : 'Free'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}