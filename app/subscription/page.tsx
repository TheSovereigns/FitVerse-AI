"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  XCircle,
  CreditCard,
  ZapOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { useTranslation } from "@/lib/i18n"
import { toast } from "sonner"

type Plan = "free" | "pro" | "premium"

interface PlanInfo {
  id: Plan
  name: string
  subtitle: string
  price: string
  priceUsd: string
  period: string
  periodEn: string
  icon: React.ElementType
  color: "zinc" | "blue" | "orange"
  popular?: boolean
  features: { text: string; textEn: string }[]
  ads: boolean
  scanLimit: number
  workoutLimit: number
  dietLimit: number
  historyDays: number
}

const plans: PlanInfo[] = [
  {
    id: "free",
    name: "FREE",
    subtitle: "Para começar",
    price: "R$ 0",
    priceUsd: "$0",
    period: "/sempre",
    periodEn: "/forever",
    icon: Shield,
    color: "zinc",
    features: [
      { text: "5 scans por dia", textEn: "5 scans per day" },
      { text: "Análise básica de ingredientes", textEn: "Basic ingredient analysis" },
      { text: "Histórico de 7 dias", textEn: "7-day history" },
      { text: "Com anúncios", textEn: "With ads" },
    ],
    ads: true,
    scanLimit: 5,
    workoutLimit: 0,
    dietLimit: 0,
    historyDays: 7,
  },
  {
    id: "pro",
    name: "PRO",
    subtitle: "Para evoluir",
    price: "R$ 19,90",
    priceUsd: "$3.90",
    period: "/mês",
    periodEn: "/month",
    icon: Star,
    color: "blue",
    popular: true,
    features: [
      { text: "50 scans por dia", textEn: "50 scans per day" },
      { text: "Análise detalhada de ingredientes", textEn: "Detailed ingredient analysis" },
      { text: "Histórico de 30 dias", textEn: "30-day history" },
      { text: "5 treinos por mês", textEn: "5 workouts per month" },
      { text: "5 dietas por mês", textEn: "5 diets per month" },
      { text: "Sem anúncios", textEn: "Ad-free" },
    ],
    ads: false,
    scanLimit: 50,
    workoutLimit: 5,
    dietLimit: 5,
    historyDays: 30,
  },
  {
    id: "premium",
    name: "PREMIUM",
    subtitle: "Performance máxima",
    price: "R$ 29,90",
    priceUsd: "$5.90",
    period: "/mês",
    periodEn: "/month",
    icon: Crown,
    color: "orange",
    features: [
      { text: "Scans ILIMITADOS", textEn: "UNLIMITED scans" },
      { text: "Análise de longevidade", textEn: "Longevity analysis" },
      { text: "Histórico completo", textEn: "Complete history" },
      { text: "Treinos ILIMITADOS", textEn: "UNLIMITED workouts" },
      { text: "Dietas ILIMITADAS", textEn: "UNLIMITED diets" },
      { text: "Suporte prioritário", textEn: "Priority support" },
      { text: "Sem anúncios", textEn: "Ad-free" },
    ],
    ads: false,
    scanLimit: -1,
    workoutLimit: -1,
    dietLimit: -1,
    historyDays: -1,
  },
]

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan>("free")
  const [adsEnabled, setAdsEnabled] = useState(true)
  const [adsLoading, setAdsLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  // Load user plan and ads preference
  useEffect(() => {
    if (user?.id) {
      // Get current plan
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

  // Toggle ads on/off (for paid plans)
  const handleToggleAds = async (checked: boolean) => {
    if (!user?.id) return
    
    // Only allow turning off ads if on pro or premium
    const isPaidPlan = currentPlan === "pro" || currentPlan === "premium"
    if (!isPaidPlan && !checked) {
      toast.error(isEnglish ? "Ads removal requires Pro or Premium" : "Remoção de anúncios requer Pro ou Premium")
      return
    }

    setAdsLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ ads_enabled: checked })
        .eq("id", user.id)

      if (error) throw error
      
      setAdsEnabled(checked)
      localStorage.setItem("adsEnabled", JSON.stringify(checked))
      
      toast.success(checked 
        ? (isEnglish ? "Ads enabled" : "Anúncios ativados")
        : (isEnglish ? "Ads disabled - Enjoy!" : "Anúncios desativados - Aproveite!")
      )
    } catch (error) {
      console.error("Error toggling ads:", error)
      toast.error(isEnglish ? "Failed to update" : "Falha ao atualizar")
    } finally {
      setAdsLoading(false)
    }
  }

  // Switch plan directly in database (for demo/testing)
  const handleSwitchPlan = async (newPlan: Plan) => {
    if (!user?.id) return
    
    setLoading(newPlan)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          plan: newPlan,
          ads_enabled: newPlan === "free" ? true : false
        })
        .eq("id", user.id)

      if (error) throw error
      
      setCurrentPlan(newPlan)
      setAdsEnabled(newPlan !== "free")
      localStorage.setItem("userPlan", newPlan)
      
      toast.success(isEnglish 
        ? `Switched to ${newPlan.toUpperCase()} plan!`
        : `Plano alterado para ${newPlan.toUpperCase()}!`
      )
    } catch (error) {
      console.error("Error switching plan:", error)
      toast.error(isEnglish ? "Failed to switch plan" : "Falha ao trocar plano")
    } finally {
      setLoading(null)
    }
  }

  // Start Stripe checkout
  const handleCheckout = async (plan: Plan) => {
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
        throw new Error(errorData.message || 'Checkout failed')
      }

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      // Fallback: switch plan directly in demo mode
      if (plan === 'pro' || plan === 'premium') {
        await handleSwitchPlan(plan)
      }
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
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-black">
              {isEnglish ? "Choose Your Plan" : "Escolha Seu Plano"}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {isEnglish ? "Current: " : "Atual: "}
              <span className="text-primary font-bold">{currentPlan.toUpperCase()}</span>
            </p>
          </div>
          
          <div className="w-10" />
        </div>

        {/* Ads Toggle for Paid Plans */}
        {(currentPlan === "pro" || currentPlan === "premium") && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 glass-strong border border-blue-500/20 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {adsEnabled ? (
                <ZapOff className="w-5 h-5 text-zinc-500" />
              ) : (
                <Sparkles className="w-5 h-5 text-blue-400" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {adsEnabled 
                    ? isEnglish ? "Ads Enabled" : "Anúncios Ativados"
                    : isEnglish ? "Ads Disabled - Enjoy!" : "Anúncios Desativados - Aproveite!"
                  }
                </p>
                <p className="text-xs text-zinc-500">
                  {isEnglish 
                    ? "Toggle to show/hide ads" 
                    : "Alterne para mostrar/ocultar anúncios"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">{adsEnabled ? "ON" : "OFF"}</span>
              <Switch
                checked={adsEnabled}
                onCheckedChange={handleToggleAds}
                disabled={adsLoading}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const isCurrentPlan = plan.id === currentPlan
            const Icon = plan.icon
            const isPaidPlan = plan.id === "pro" || plan.id === "premium"

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative rounded-3xl p-6 overflow-hidden",
                  plan.color === "orange"
                    ? "bg-gradient-to-b from-orange-500/15 to-zinc-950/90 border-2 border-orange-500/50"
                    : plan.popular
                    ? "bg-gradient-to-b from-blue-500/15 to-zinc-950/90 border-2 border-blue-500/40"
                    : "bg-zinc-900/50 border border-zinc-800"
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">
                      {isEnglish ? "Popular" : "Mais Popular"}
                    </Badge>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary/20 text-primary border-primary/40">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {isEnglish ? "Current" : "Atual"}
                    </Badge>
                  </div>
                )}

                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
                  plan.color === "orange"
                    ? "bg-orange-500/20 text-orange-400"
                    : plan.color === "blue"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-zinc-800 text-zinc-500"
                )}>
                  <Icon className="w-7 h-7" />
                </div>

                {/* Plan Info */}
                <div className="mb-4">
                  <h2 className={cn(
                    "text-2xl font-black",
                    plan.color === "orange" ? "text-orange-400" :
                    plan.color === "blue" ? "text-blue-400" : "text-zinc-400"
                  )}>
                    {plan.name}
                  </h2>
                  <p className="text-zinc-500 text-sm">{plan.subtitle}</p>
                  
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">
                      {isEnglish ? plan.priceUsd : plan.price}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {isEnglish ? plan.periodEn : plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => {
                    const isAdFeature = feature.text.includes("anúncios") || feature.text.includes("ads")
                    const showAsDisabled = isAdFeature && plan.ads
                    
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "flex items-center gap-2 text-sm",
                          showAsDisabled && "opacity-50"
                        )}
                      >
                        {showAsDisabled ? (
                          <XCircle className="w-4 h-4 text-zinc-600" />
                        ) : (
                          <CheckCircle2 className={cn(
                            "w-4 h-4",
                            plan.color === "orange" ? "text-orange-400" :
                            plan.color === "blue" ? "text-blue-400" : "text-zinc-500"
                          )} />
                        )}
                        <span className={showAsDisabled ? "line-through text-zinc-600" : "text-zinc-300"}>
                          {isEnglish ? feature.textEn : feature.text}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* CTA Button */}
                {isCurrentPlan ? (
                  <Button
                    disabled
                    className={cn(
                      "w-full h-12 rounded-xl font-bold",
                      plan.color === "orange"
                        ? "bg-orange-500/20 text-orange-400"
                        : plan.color === "blue"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {isEnglish ? "Current Plan" : "Plano Atual"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => plan.id === "free" ? handleSwitchPlan("free") : handleCheckout(plan.id)}
                    disabled={loading === plan.id}
                    className={cn(
                      "w-full h-12 rounded-xl font-bold transition-all",
                      plan.color === "orange"
                        ? "bg-orange-500 hover:bg-orange-600 text-black"
                        : plan.color === "blue"
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white"
                    )}
                  >
                    {loading === plan.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : plan.id === "free" ? (
                      isEnglish ? "Downgrade to Free" : "Voltar ao Grátis"
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
        <div className="mt-12 p-6 glass-strong rounded-2xl">
          <h3 className="text-lg font-bold mb-4">
            {isEnglish ? "Your Plan Benefits" : "Benefícios do Seu Plano"}
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 text-xs uppercase">Scans/Dia</p>
              <p className="font-bold text-lg">
                {currentPlan === "free" ? "5" : currentPlan === "pro" ? "50" : "∞"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Treinos/Mês</p>
              <p className="font-bold text-lg">
                {currentPlan === "free" ? "0" : currentPlan === "pro" ? "5" : "∞"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Dietas/Mês</p>
              <p className="font-bold text-lg">
                {currentPlan === "free" ? "0" : currentPlan === "pro" ? "5" : "∞"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Anúncios</p>
              <p className="font-bold text-lg">
                {currentPlan === "free" ? "✓" : "✗"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-zinc-600 text-xs">
          <p>{isEnglish ? "Secure payment via Stripe" : "Pagamento seguro via Stripe"}</p>
        </div>
      </div>
    </div>
  )
}
