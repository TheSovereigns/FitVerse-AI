"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  PieChart
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface Subscription {
  id: string
  user_id: string
  plan: string
  status: string
  created_at: string
  current_period_end: string | null
}

export default function AdminRevenuePage() {
  const { t, locale } = useTranslation()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    mrr: 0,
    arr: 0,
    activeCount: 0,
    canceledCount: 0,
    churnRate: 0,
    newSubsThisMonth: 0,
    ltv: 0
  })

  useEffect(() => {
    fetchRevenueData()
  }, [])

  const fetchRevenueData = async () => {
    try {
      // Fetch all subscriptions
      const { data: subs, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate stats
      const active = subs?.filter(s => s.status === 'active') || []
      const canceled = subs?.filter(s => s.status === 'canceled') || []
      
      // MRR calculation (assuming R$29.90 for premium)
      const mrr = active.length * 29.90
      const arr = mrr * 12

      // Churn rate
      const total = subs?.length || 0
      const churnRate = total > 0 ? (canceled.length / total) * 100 : 0

      // New subscriptions this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const newThisMonth = active.filter(s => new Date(s.created_at) >= startOfMonth).length

      // LTV (average) - assuming 6 months average lifetime
      const ltv = mrr > 0 ? mrr * 6 : 0

      setStats({
        mrr,
        arr,
        activeCount: active.length,
        canceledCount: canceled.length,
        churnRate: Math.round(churnRate * 10) / 10,
        newSubsThisMonth: newThisMonth,
        ltv
      })

      setSubscriptions(subs || [])
    } catch (error) {
      console.error("Error fetching revenue data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'en-US' ? 'en-US' : 'pt-BR', {
      style: 'currency',
      currency: locale === 'en-US' ? 'USD' : 'BRL',
      minimumFractionDigits: 0
    }).format(locale === 'en-US' ? value / 4 : value)
  }

  // Mock data for charts
  const monthlyData = [
    { month: "Jan", revenue: 1200, new: 45 },
    { month: "Feb", revenue: 1800, new: 62 },
    { month: "Mar", revenue: 2400, new: 78 },
    { month: "Apr", revenue: 2100, new: 55 },
    { month: "May", revenue: 3200, new: 95 },
    { month: "Jun", revenue: 3800, new: 110 },
  ]

  const planDistribution = [
    { name: "Free", value: 70, color: "bg-white/20" },
    { name: "Premium", value: 30, color: "bg-primary" },
  ]

  const revenueCards = [
    {
      title: locale === "en-US" ? "Monthly Recurring Revenue" : "Receita Mensal Recorrente",
      value: formatCurrency(stats.mrr),
      icon: DollarSign,
      variation: "+12.5%",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: locale === "en-US" ? "Annual Recurring Revenue" : "Receita Anual Recorrente",
      value: formatCurrency(stats.arr),
      icon: Calendar,
      variation: "+15.2%",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10"
    },
    {
      title: locale === "en-US" ? "Churn Rate" : "Taxa de Cancelamento",
      value: `${stats.churnRate}%`,
      icon: TrendingDown,
      variation: "-2.1%",
      color: stats.churnRate > 10 ? "text-red-400" : "text-emerald-400",
      bgColor: stats.churnRate > 10 ? "bg-red-500/10" : "bg-emerald-500/10"
    },
    {
      title: locale === "en-US" ? "Customer LTV" : "Valor do Cliente",
      value: formatCurrency(stats.ltv),
      icon: CreditCard,
      variation: "+8.3%",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10"
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">
          {locale === "en-US" ? "Revenue & Subscriptions" : "Receita e Assinaturas"}
        </h1>
        <p className="text-white/40 mt-1">
          {locale === "en-US" ? "Track your subscription metrics and revenue" : "Acompanhe suas métricas de assinatura e receita"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-strong border border-white/10 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", card.bgColor)}>
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
              {card.variation && (
                <div className={cn("flex items-center gap-1 text-xs font-medium", card.variation.startsWith('+') ? "text-emerald-400" : "text-red-400")}>
                  {card.variation.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {card.variation}
                </div>
              )}
            </div>
            <p className="text-2xl font-black text-white">{card.value}</p>
            <p className="text-sm text-white/40 mt-1">{card.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-strong border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-black text-white mb-6">
            {locale === "en-US" ? "Revenue & New Subscriptions" : "Receita e Novas Assinaturas"}
          </h3>
          
          <div className="h-64 flex items-end gap-4">
            {monthlyData.map((month, index) => {
              const maxRevenue = Math.max(...monthlyData.map(m => m.revenue))
              const height = (month.revenue / maxRevenue) * 100
              
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full space-y-1">
                    <div 
                      className="w-full bg-primary rounded-t-lg"
                      style={{ height: `${height}%` }}
                    />
                    <div 
                      className="w-full bg-blue-500/50 rounded-t-lg"
                      style={{ height: `${(month.new / 120) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40">{month.month}</span>
                </div>
              )
            })}
          </div>
          
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-white/60">{locale === "en-US" ? "Revenue" : "Receita"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500/50" />
              <span className="text-xs text-white/60">{locale === "en-US" ? "New Subs" : "Novas Assinaturas"}</span>
            </div>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="glass-strong border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-black text-white mb-6">
            {locale === "en-US" ? "Plan Distribution" : "Distribuição de Planos"}
          </h3>
          
          <div className="space-y-6">
            {planDistribution.map((plan) => (
              <div key={plan.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">{plan.name}</span>
                  <span className="text-sm font-medium text-white">{plan.value}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all", plan.color)}
                    style={{ width: `${plan.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{locale === "en-US" ? "Active Subs" : "Assinaturas Ativas"}</span>
              <span className="text-white font-medium">{stats.activeCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{locale === "en-US" ? "New This Month" : "Novos Este Mês"}</span>
              <span className="text-white font-medium">{stats.newSubsThisMonth}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{locale === "en-US" ? "Canceled" : "Cancelados"}</span>
              <span className="text-white font-medium">{stats.canceledCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-strong border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-black text-white mb-6">
          {locale === "en-US" ? "Recent Subscriptions" : "Assinaturas Recentes"}
        </h3>
        
        <div className="space-y-3">
          {subscriptions.slice(0, 10).map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  sub.status === 'active' ? "bg-emerald-500/10" : "bg-red-500/10"
                )}>
                  <CreditCard className={cn("w-5 h-5", sub.status === 'active' ? "text-emerald-400" : "text-red-400")} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{sub.plan}</p>
                  <p className="text-xs text-white/40">
                    {new Date(sub.created_at).toLocaleDateString(locale === 'en-US' ? 'en-US' : 'pt-BR')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-sm font-medium",
                  sub.status === 'active' ? "text-emerald-400" : "text-red-400"
                )}>
                  {sub.status === 'active' 
                    ? (locale === "en-US" ? "Active" : "Ativa")
                    : (locale === "en-US" ? "Canceled" : "Cancelada")}
                </p>
              </div>
            </div>
          ))}
          
          {subscriptions.length === 0 && (
            <p className="text-center text-white/30 py-8">
              {locale === "en-US" ? "No subscriptions yet" : "Nenhuma assinatura ainda"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}