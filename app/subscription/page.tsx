"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Loader2,
  ArrowLeft,
  Zap,
  Crown,
  Sparkles,
  Shield,
  Star,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { useTranslation } from "@/lib/i18n"
import type { Plan } from "@/lib/plan-limits"

const plans = [
  {
    id: "free" as Plan,
    name: "FREE",
    subtitle: "Para começar sua jornada",
    price: "R$ 0",
    priceUsd: "$0",
    period: "/sempre",
    periodEn: "/forever",
    icon: Shield,
    color: "zinc",
    gradient: "from-zinc-900/80 to-zinc-950/80",
    border: "border-zinc-800",
    features: [
      { text: "5 scans por dia", textEn: "5 scans per day" },
      { text: "Análise básica de ingredientes", textEn: "Basic ingredient analysis" },
      { text: "Histórico de 7 dias", textEn: "7-day history" },
    ],
    limitations: [
      { text: "Sem geração de treinos", textEn: "No workout generation" },
      { text: "Sem geração de dietas", textEn: "No diet generation" },
      { text: "Com anúncios", textEn: "With ads" },
    ],
    cta: "Plano Atual",
    ctaEn: "Current Plan",
    ctaDisabled: true,
  },
  {
    id: "pro" as Plan,
    name: "PRO",
    subtitle: "Para quem quer evoluir",
    price: "R$ 19,90",
    priceUsd: "$3.90",
    period: "/mês",
    periodEn: "/month",
    icon: Star,
    color: "blue",
    popular: true,
    gradient: "from-blue-500/10 to-zinc-950/80",
    border: "border-blue-500/30",
    features: [
      { text: "50 scans por dia", textEn: "50 scans per day" },
      { text: "Análise detalhada de ingredientes", textEn: "Detailed ingredient analysis" },
      { text: "Histórico de 30 dias", textEn: "30-day history" },
      { text: "Geração de 5 treinos/mês", textEn: "5 workouts/month" },
      { text: "Geração de 5 dietas/mês", textEn: "5 diets/month" },
      { text: "Navegação sem anúncios", textEn: "Ad-free navigation" },
    ],
    cta: "Assinar Pro",
    ctaEn: "Subscribe to Pro",
    ctaDisabled: false,
  },
  {
    id: "premium" as Plan,
    name: "PREMIUM",
    subtitle: "Performance ilimitada",
    price: "R$ 29,90",
    priceUsd: "$5.90",
    period: "/mês",
    periodEn: "/month",
    icon: Crown,
    color: "orange",
    gradient: "from-orange-500/10 to-zinc-950/80",
    border: "border-orange-500/50",
    features: [
      { text: "Scans ILIMITADOS com BioScan AI", textEn: "UNLIMITED BioScan AI scans" },
      { text: "Geração de treinos e dietas sem limites", textEn: "Unlimited workout & diet generation" },
      { text: "Análise aprofundada de longevidade", textEn: "Deep longevity analysis" },
      { text: "Histórico completo de scans", textEn: "Complete scan history" },
      { text: "Suporte prioritário", textEn: "Priority support" },
      { text: "Navegação sem anúncios", textEn: "Ad-free navigation" },
    ],
    cta: "Assinar Premium",
    ctaEn: "Subscribe to Premium",
    ctaDisabled: false,
  },
]

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan>("free")
  const router = useRouter()
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  useEffect(() => {
    if (user?.id) {
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setCurrentPlan(data.plan as Plan)
        })
    }
  }, [user])

  const handleCheckout = async (plan: "pro" | "premium") => {
    setLoading(plan)
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: plan === 'pro' ? 'pro_price_id' : 'premium_price_id' 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(isEnglish 
          ? `Error: ${errorData.message || 'Failed to start checkout'}`
          : `Erro: ${errorData.message || 'Falha ao iniciar checkout'}`
        )
        setLoading(null)
        return
      }

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else if (data.sessionId) {
        alert(isEnglish 
          ? 'Checkout session created! Redirecting...' 
          : 'Sessão de checkout criada! Redirecionando...'
        )
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert(isEnglish 
        ? 'Unable to process checkout. Please try again.' 
        : 'Não foi possível processar o checkout. Tente novamente.'
      )
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mb-2"
            >
              <Crown className="w-5 h-5 text-orange-500" />
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                {isEnglish ? "Premium Plans" : "Planos Premium"}
              </span>
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {isEnglish ? "Choose your " : "Escolha seu "}
              <span className="text-orange-500">{isEnglish ? "Plan" : "Plano"}</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto">
              {currentPlan !== "free"
                ? `${isEnglish ? "Your current plan: " : "Seu plano atual: "}${currentPlan.toUpperCase()}`
                : isEnglish 
                  ? "Start free and upgrade when you're ready"
                  : "Comece grátis e evolua quando quiser"}
            </p>
          </div>
          
          <div className="w-10" />
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          <AnimatePresence mode="wait">
            {plans.map((plan, index) => {
              const isCurrentPlan = plan.id === currentPlan
              const Icon = plan.icon

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className={cn(
                    "relative rounded-3xl p-6 md:p-8 overflow-hidden transition-all duration-500",
                    plan.color === "orange"
                      ? "bg-gradient-to-b from-orange-500/15 via-orange-500/5 to-zinc-950/90 border-2 border-orange-500/50 shadow-2xl shadow-orange-500/20"
                      : plan.popular
                      ? "bg-gradient-to-b from-blue-500/15 via-blue-500/5 to-zinc-950/90 border-2 border-blue-500/40 shadow-xl shadow-blue-500/10"
                      : "bg-gradient-to-b from-zinc-900/60 via-zinc-900/30 to-zinc-950/90 border border-zinc-800"
                  )}
                >
                  {/* Glow Effect */}
                  {(plan.color === "orange" || plan.popular) && (
                    <div className={cn(
                      "absolute -inset-1 rounded-3xl blur-2xl -z-10 opacity-30",
                      plan.color === "orange" ? "bg-orange-500" : "bg-blue-500"
                    )} />
                  )}

                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 text-xs font-bold px-3 py-1">
                        {isEnglish ? "Most Popular" : "Mais Popular"}
                      </Badge>
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mb-5",
                      plan.color === "orange"
                        ? "bg-gradient-to-br from-orange-500/30 to-orange-600/20 text-orange-400"
                        : plan.color === "blue"
                        ? "bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-400"
                        : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Plan Info */}
                  <div className="mb-6">
                    <h2
                      className={cn(
                        "text-2xl font-black tracking-tight",
                        plan.color === "orange"
                          ? "text-orange-400"
                          : plan.color === "blue"
                          ? "text-blue-400"
                          : "text-zinc-400"
                      )}
                    >
                      {plan.name}
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">{isEnglish ? plan.subtitle : plan.subtitle}</p>
                    
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl lg:text-5xl font-black text-white">
                        {isEnglish ? plan.priceUsd : plan.price}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {isEnglish ? plan.periodEn : plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2
                          className={cn(
                            "w-5 h-5 mt-0.5 shrink-0",
                            plan.color === "orange"
                              ? "text-orange-400"
                              : plan.color === "blue"
                              ? "text-blue-400"
                              : "text-zinc-600"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm",
                            plan.color === "orange" || plan.color === "blue"
                              ? "text-zinc-300"
                              : "text-zinc-500"
                          )}
                        >
                          {isEnglish ? feature.textEn : feature.text}
                        </span>
                      </motion.div>
                    ))}
                    {plan.limitations?.map((limitation, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-start gap-3 opacity-50"
                      >
                        <span className="w-5 h-5 mt-0.5 shrink-0 text-zinc-600 flex items-center justify-center">
                          ×
                        </span>
                        <span className="text-sm text-zinc-600">
                          {isEnglish ? limitation.textEn : limitation.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() =>
                      !plan.ctaDisabled && handleCheckout(plan.id as "pro" | "premium")
                    }
                    disabled={plan.ctaDisabled || !!loading}
                    className={cn(
                      "w-full h-14 rounded-2xl font-bold text-sm transition-all duration-300 relative overflow-hidden",
                      plan.color === "orange"
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black hover:shadow-2xl hover:shadow-orange-500/30"
                        : plan.color === "blue"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-2xl hover:shadow-blue-500/30"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    )}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading === plan.id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {isEnglish ? "Processing..." : "Processando..."}
                        </>
                      ) : (
                        <>
                          {isEnglish ? plan.ctaEn : plan.cta}
                          {!plan.ctaDisabled && (
                            <ArrowRight className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </span>
                  </Button>

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 text-center"
                    >
                      <Badge
                        variant="outline"
                        className="border-zinc-700 text-zinc-400 bg-zinc-900/50"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {isEnglish ? "Current Plan" : "Plano Atual"}
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-6 text-zinc-500 text-sm"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>{isEnglish ? "Secure payment" : "Pagamento seguro"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{isEnglish ? "Cancel anytime" : "Cancele quando quiser"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>{isEnglish ? "Instant access" : "Acesso imediato"}</span>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8 text-zinc-600 text-xs">
          <p>
            {isEnglish 
              ? "Prices in BRL (R$). USD prices shown for reference." 
              : "Preços em reais (R$). Valores em dólar仅供参考。"}
          </p>
        </div>
      </div>
    </div>
  )
}
