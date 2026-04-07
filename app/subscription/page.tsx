"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Check,
  Loader2,
  ArrowLeft,
  Crown,
  Sparkles,
  Shield,
  Star,
  ArrowRight,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { supabase } from "@/lib/supabase"
import { useTranslation } from "@/lib/i18n"
import { toast } from "sonner"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type Plan = "free" | "pro" | "premium"

const plans = [
  {
    id: "free" as Plan,
    name: "FREE",
    subtitle: "Para começar",
    subtitleEn: "To get started",
    price: "R$ 0",
    priceUsd: "$0",
    period: "/sempre",
    periodEn: "/forever",
    icon: Shield,
    color: "zinc",
    features: [
      { text: "5 scans por dia", textEn: "5 scans per day" },
      { text: "Análise básica", textEn: "Basic analysis" },
      { text: "Histórico de 7 dias", textEn: "7-day history" },
      { text: "Com anúncios", textEn: "With ads" },
    ],
  },
  {
    id: "pro" as Plan,
    name: "PRO",
    subtitle: "Para evoluir",
    subtitleEn: "To evolve",
    price: "R$ 19,90",
    priceUsd: "$4.99",
    period: "/mês",
    periodEn: "/month",
    icon: Star,
    color: "blue",
    popular: true,
    features: [
      { text: "50 scans por dia", textEn: "50 scans per day" },
      { text: "Análise detalhada", textEn: "Detailed analysis" },
      { text: "Histórico de 30 dias", textEn: "30-day history" },
      { text: "5 treinos/mês", textEn: "5 workouts/month" },
      { text: "5 dietas/mês", textEn: "5 diets/month" },
      { text: "Sem anúncios", textEn: "Ad-free" },
    ],
  },
  {
    id: "premium" as Plan,
    name: "PREMIUM",
    subtitle: "Performance máxima",
    subtitleEn: "Maximum performance",
    price: "R$ 29,90",
    priceUsd: "$7.99",
    period: "/mês",
    periodEn: "/month",
    icon: Crown,
    color: "orange",
    features: [
      { text: "Scans ILIMITADOS", textEn: "UNLIMITED scans" },
      { text: "Análise VIP com IA", textEn: "VIP AI analysis" },
      { text: "Histórico ILIMITADO", textEn: "UNLIMITED history" },
      { text: "Treinos ILIMITADOS", textEn: "UNLIMITED workouts" },
      { text: "Dietas ILIMITADAS", textEn: "UNLIMITED diets" },
      { text: "Suporte prioritário", textEn: "Priority support" },
      { text: "Sem anúncios", textEn: "Ad-free" },
    ],
  },
]

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan>("free")
  const [adsEnabled, setAdsEnabled] = useState(true)
  const [adsLoading, setAdsLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { refreshPlan } = usePlanLimits()
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  
  // Detect country from locale
  const isBrazil = locale === "pt-BR"
  const isUSA = locale === "en-US"

  useEffect(() => {
    if (user?.id) {
      supabase
        .from("profiles")
        .select("plan, ads_enabled")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCurrentPlan(data.plan as Plan)
            setAdsEnabled(data.ads_enabled !== false)
          }
        })
    }
  }, [user])

  const handleToggleAds = async (checked: boolean) => {
    if (!user?.id) return
    
    const isPaidPlan = currentPlan === "pro" || currentPlan === "premium"
    if (!isPaidPlan && !checked) {
      toast.error(isEnglish ? "Requires Pro or Premium" : "Requer Pro ou Premium")
      return
    }

    setAdsLoading(true)
    try {
      await supabase
        .from("profiles")
        .update({ ads_enabled: checked })
        .eq("id", user.id)

      setAdsEnabled(checked)
      localStorage.setItem("adsEnabled", JSON.stringify(checked))
      
      toast.success(checked ? (isEnglish ? "Ads enabled" : "Anúncios ativados") : (isEnglish ? "Ads disabled" : "Anúncios desativados"))
    } catch (error) {
      toast.error(isEnglish ? "Failed" : "Falha ao atualizar")
    } finally {
      setAdsLoading(false)
    }
  }

  const handleSwitchPlan = async (newPlan: Plan) => {
    if (!user?.id) return

    if (newPlan === "free") {
      setLoading(newPlan)
      try {
        await supabase
          .from("profiles")
          .update({ 
            plan: newPlan,
            ads_enabled: true
          })
          .eq("id", user.id)

        setCurrentPlan(newPlan)
        setAdsEnabled(true)
        localStorage.setItem("userPlan", newPlan)
        await refreshPlan()
        
        toast.success(isEnglish ? `Switched to ${newPlan}` : `Plano alterado para ${newPlan}`)
      } catch (error) {
        toast.error(isEnglish ? "Failed" : "Falha ao trocar")
      } finally {
        setLoading(null)
      }
      return
    }

    setLoading(newPlan)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: newPlan,
          userId: user.id,
          email: user.email,
        }),
      })

      if (!response.ok) {
        throw new Error('Checkout failed')
      }

      const { url, error: stripeError } = await response.json()

      if (stripeError) {
        throw new Error(stripeError)
      }

      if (url) {
        window.location.href = url
      } else {
        const stripe = await stripePromise
        if (stripe) {
          const { error: stripeLoadError } = await stripe.redirectToCheckout({ sessionId: (await response.json()).sessionId })
          if (stripeLoadError) {
            throw stripeLoadError
          }
        } else {
          await supabase
            .from("profiles")
            .update({ 
              plan: newPlan,
              ads_enabled: newPlan === "free" ? true : false
            })
            .eq("id", user.id)

          setCurrentPlan(newPlan)
          setAdsEnabled(newPlan !== "free")
          localStorage.setItem("userPlan", newPlan)
          
          toast.success(isEnglish ? `Switched to ${newPlan}` : `Plano alterado para ${newPlan}`)
        }
      }
    } catch (error) {
      console.error('Checkout error:', error)
      await supabase
        .from("profiles")
        .update({ 
          plan: newPlan,
          ads_enabled: newPlan === "free" ? true : false
        })
        .eq("id", user.id)

      setCurrentPlan(newPlan)
      setAdsEnabled(newPlan !== "free")
      localStorage.setItem("userPlan", newPlan)
      await refreshPlan()
      
      toast.success(isEnglish ? `Switched to ${newPlan} (demo)` : `Plano alterado para ${newPlan} (demo)`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <h1 className="text-xl font-black tracking-tight">
              {isEnglish ? "Subscription Plans" : "Planos de Assinatura"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEnglish ? "Current: " : "Atual: "}
              <span className="text-primary font-bold">{currentPlan.toUpperCase()}</span>
            </p>
          </div>
          
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            {isEnglish ? "Choose Your" : "Escolha Seu"}{" "}
            <span className="text-primary">{isEnglish ? "Plan" : "Plano"}</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {isEnglish 
              ? "Unlock the full potential of your fitness journey with AI-powered tools"
              : "Desbloqueie o máximo do seu progresso fitness com ferramentas alimentadas por IA"}
          </p>
        </motion.div>
        {/* Ads Toggle for Paid Plans */}
        {(currentPlan === "pro" || currentPlan === "premium") && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 glass-strong border border-white/10 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">
                  {adsEnabled ? (isEnglish ? "Ads Enabled" : "Anúncios Ativados") : (isEnglish ? "Ads Disabled" : "Anúncios Desativados")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEnglish ? "Toggle ads on/off" : "Alterne anúncios on/off"}
                </p>
              </div>
            </div>
            <Switch
              checked={adsEnabled}
              onCheckedChange={handleToggleAds}
              disabled={adsLoading}
            />
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const isCurrentPlan = plan.id === currentPlan
            const Icon = plan.icon

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative rounded-[2.5rem] p-6 md:p-8 glass-strong border transition-all duration-300",
                  plan.color === "orange"
                    ? "border-orange-500/30 hover:border-orange-500/50"
                    : plan.popular
                    ? "border-blue-500/30 hover:border-blue-500/50"
                    : "border-white/10 hover:border-white/20"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {isEnglish ? "Popular" : "Mais Popular"}
                  </Badge>
                )}

                {isCurrentPlan && (
                  <Badge className="absolute -top-3 right-4 bg-primary/20 text-primary border-primary/30">
                    {isEnglish ? "Current" : "Atual"}
                  </Badge>
                )}

                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-5",
                  plan.color === "orange"
                    ? "bg-orange-500/20"
                    : plan.color === "blue"
                    ? "bg-blue-500/20"
                    : "bg-white/5"
                )}>
                  <Icon className={cn(
                    "w-7 h-7",
                    plan.color === "orange" ? "text-orange-500" :
                    plan.color === "blue" ? "text-blue-500" : "text-muted-foreground"
                  )} />
                </div>

                {/* Plan Info */}
                <div className="mb-5">
                  <h2 className={cn(
                    "text-2xl font-black",
                    plan.color === "orange" ? "text-orange-500" :
                    plan.color === "blue" ? "text-blue-500" : "text-muted-foreground"
                  )}>
                    {plan.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                      {isEnglish ? (plan as any).subtitleEn : plan.subtitle}
                    </p>
                  
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black">
                      {isEnglish ? plan.priceUsd : plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isEnglish ? plan.periodEn : plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <Check className={cn(
                        "w-4 h-4 shrink-0",
                        plan.color === "orange" ? "text-orange-500" :
                        plan.color === "blue" ? "text-blue-500" : "text-muted-foreground"
                      )} />
                      <span className="text-muted-foreground">
                        {isEnglish ? feature.textEn : feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {isCurrentPlan ? (
                  <Button
                    disabled
                    className="w-full h-12 rounded-2xl font-bold bg-white/5 text-muted-foreground"
                  >
                    {isEnglish ? "Current Plan" : "Plano Atual"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSwitchPlan(plan.id)}
                    disabled={loading === plan.id}
                    className={cn(
                      "w-full h-12 rounded-2xl font-bold transition-all",
                      plan.color === "orange"
                        ? "bg-orange-500 hover:bg-orange-600 text-black"
                        : plan.color === "blue"
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-white/10 hover:bg-white/20"
                    )}
                  >
                    {loading === plan.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : plan.id === "free" ? (
                      isEnglish ? "Downgrade" : "Voltar ao Grátis"
                    ) : (
                      <>
                        {isEnglish ? "Subscribe" : "Assinar"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Plan Benefits Summary */}
        <div className="mt-12 glass-strong border border-white/10 rounded-[2.5rem] p-6 md:p-8">
          <h3 className="text-lg font-black mb-6">
            {isEnglish ? "Your Plan Benefits" : "Benefícios do Seu Plano"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {isEnglish ? "Scans/Day" : "Scans/Dia"}
              </p>
              <p className="text-2xl font-black text-primary">
                {currentPlan === "free" ? "5" : currentPlan === "pro" ? "50" : "∞"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {isEnglish ? "Workouts/Month" : "Treinos/Mês"}
              </p>
              <p className="text-2xl font-black text-primary">
                {currentPlan === "free" ? "0" : currentPlan === "pro" ? "5" : "∞"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {isEnglish ? "Diets/Month" : "Dietas/Mês"}
              </p>
              <p className="text-2xl font-black text-primary">
                {currentPlan === "free" ? "0" : currentPlan === "pro" ? "5" : "∞"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {isEnglish ? "Ads" : "Anúncios"}
              </p>
              <p className="text-2xl font-black">
                {currentPlan === "free" ? (
                  <span className="text-red-500">✓</span>
                ) : (
                  <span className="text-green-500">✗</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
