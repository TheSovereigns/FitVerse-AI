"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import type { Plan } from "@/lib/plan-limits"

const plans = [
  {
    id: "free" as Plan,
    name: "FREE",
    subtitle: "Para começar sua jornada",
    price: "R$ 0",
    period: "/sempre",
    icon: Shield,
    color: "zinc",
    features: [
      "5 scans por dia",
      "Análise básica de ingredientes",
      "Histórico de 7 dias",
    ],
    limitations: [
      "Sem geração de treinos",
      "Sem geração de dietas",
      "Com anúncios",
    ],
    cta: "Plano Atual",
    ctaDisabled: true,
  },
  {
    id: "pro" as Plan,
    name: "PRO",
    subtitle: "Para quem quer evoluir",
    price: "R$ 19,90",
    period: "/mês",
    icon: Star,
    color: "blue",
    popular: true,
    features: [
      "50 scans por dia",
      "Análise detalhada de ingredientes",
      "Histórico de 30 dias",
      "Geração de 5 treinos/mês",
      "Geração de 5 dietas/mês",
      "Navegação sem anúncios",
    ],
    cta: "Assinar Pro",
    ctaDisabled: false,
  },
  {
    id: "premium" as Plan,
    name: "PREMIUM",
    subtitle: "Performance ilimitada",
    price: "R$ 29,90",
    period: "/mês",
    icon: Crown,
    color: "orange",
    features: [
      "Scans ILIMITADOS com BioScan AI",
      "Geração de treinos e dietas sem limites",
      "Análise aprofundada de longevidade",
      "Histórico completo de scans",
      "Suporte prioritário",
      "Navegação sem anúncios",
    ],
    cta: "Assinar Premium",
    ctaDisabled: false,
  },
]

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan>("free")
  const router = useRouter()
  const { user } = useAuth()

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
    await new Promise(resolve => setTimeout(resolve, 2000))
    alert(`Iniciando checkout para o plano ${plan.toUpperCase()}`)
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[150px]" />
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
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Escolha seu <span className="text-orange-500">Plano</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {currentPlan !== "free"
                ? `Seu plano atual: ${currentPlan.toUpperCase()}`
                : "Comece grátis e evolua quando quiser"}
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
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
                  "relative rounded-3xl p-6 md:p-8 overflow-hidden transition-all duration-300",
                  plan.color === "orange"
                    ? "bg-gradient-to-b from-orange-500/10 to-zinc-950/80 border-2 border-orange-500/50 shadow-lg shadow-orange-500/10"
                    : plan.popular
                    ? "bg-gradient-to-b from-blue-500/10 to-zinc-950/80 border border-blue-500/30"
                    : "bg-zinc-950/50 border border-zinc-800"
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs font-bold">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
                    plan.color === "orange"
                      ? "bg-orange-500/20 text-orange-500"
                      : plan.color === "blue"
                      ? "bg-blue-500/20 text-blue-500"
                      : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Plan Info */}
                <div className="mb-6">
                  <h2
                    className={cn(
                      "text-xl font-bold",
                      plan.color === "orange"
                        ? "text-orange-500"
                        : plan.color === "blue"
                        ? "text-blue-500"
                        : "text-zinc-400"
                    )}
                  >
                    {plan.name}
                  </h2>
                  <p className="text-zinc-500 text-xs mt-1">{plan.subtitle}</p>
                  <div className="mt-3">
                    <span className="text-3xl font-black text-white">
                      {plan.price}
                    </span>
                    <span className="text-sm text-zinc-500 ml-1">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check
                        className={cn(
                          "w-4 h-4 mt-0.5 shrink-0",
                          plan.color === "orange"
                            ? "text-orange-500"
                            : plan.color === "blue"
                            ? "text-blue-500"
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
                        {feature}
                      </span>
                    </div>
                  ))}
                  {plan.limitations?.map((limitation, i) => (
                    <div key={i} className="flex items-start gap-3 opacity-50">
                      <span className="w-4 h-4 mt-0.5 shrink-0 text-zinc-600">
                        ×
                      </span>
                      <span className="text-sm text-zinc-600">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() =>
                    !plan.ctaDisabled && handleCheckout(plan.id as "pro" | "premium")
                  }
                  disabled={plan.ctaDisabled || !!loading}
                  className={cn(
                    "w-full h-12 rounded-xl font-bold text-sm transition-all duration-300",
                    plan.color === "orange"
                      ? "bg-orange-500 hover:bg-orange-600 text-black hover:shadow-lg hover:shadow-orange-500/25"
                      : plan.color === "blue"
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  )}
                >
                  {loading === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {plan.cta}
                      {!plan.ctaDisabled && (
                        <ArrowRight className="w-4 h-4 ml-2" />
                      )}
                    </>
                  )}
                </Button>

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="mt-3 text-center">
                    <Badge
                      variant="outline"
                      className="text-xs border-zinc-700 text-zinc-500"
                    >
                      Plano Atual
                    </Badge>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-zinc-600 text-xs">
          <p>Pagamento seguro via Stripe. Cancele quando quiser.</p>
        </div>
      </div>
    </div>
  )
}
