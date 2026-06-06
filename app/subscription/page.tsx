"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Crown,
  Loader2,
  Lock,
  Shield,
  Sparkles,
  Star,
  XCircle,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { supabase } from "@/lib/supabase"
import { useTranslation } from "@/lib/i18n"
import { toast } from "sonner"

type Plan = "free" | "pro" | "premium" | "banned"
type PaidPlan = Exclude<Plan, "free" | "banned">

const checkoutTimeoutMs = 15000

const plans = [
  {
    id: "free" as Plan,
    name: "FREE",
    subtitle: "Comece sem compromisso",
    subtitleEn: "Start with no commitment",
    price: "R$ 0",
    priceUsd: "$0",
    period: "/sempre",
    periodEn: "/forever",
    icon: Shield,
    accent: "zinc",
    features: [
      { text: "5 scans por dia", textEn: "5 scans per day" },
      { text: "Analise basica de alimentos", textEn: "Basic food analysis" },
      { text: "Historico de 7 dias", textEn: "7-day history" },
      { text: "Com anuncios", textEn: "With ads" },
    ],
  },
  {
    id: "pro" as Plan,
    name: "PRO",
    subtitle: "Mais recursos para evoluir",
    subtitleEn: "More tools to evolve",
    price: "R$ 19,90",
    priceUsd: "$19.90",
    period: "/mes",
    periodEn: "/month",
    icon: Star,
    accent: "blue",
    popular: true,
    features: [
      { text: "50 scans por dia", textEn: "50 scans per day" },
      { text: "Analise detalhada", textEn: "Detailed analysis" },
      { text: "Historico de 30 dias", textEn: "30-day history" },
      { text: "5 treinos por mes", textEn: "5 workouts/month" },
      { text: "5 receitas por mes", textEn: "5 recipes/month" },
      { text: "Sem anuncios", textEn: "Ad-free" },
    ],
  },
  {
    id: "premium" as Plan,
    name: "PREMIUM",
    subtitle: "Tudo liberado para alta performance",
    subtitleEn: "Everything unlocked for high performance",
    price: "R$ 29,90",
    priceUsd: "$29.90",
    period: "/mes",
    periodEn: "/month",
    icon: Crown,
    accent: "orange",
    features: [
      { text: "Scans ilimitados", textEn: "Unlimited scans" },
      { text: "Analise VIP com IA", textEn: "VIP AI analysis" },
      { text: "Historico ilimitado", textEn: "Unlimited history" },
      { text: "Treinos ilimitados", textEn: "Unlimited workouts" },
      { text: "Receitas ilimitadas", textEn: "Unlimited recipes" },
      { text: "Suporte prioritario", textEn: "Priority support" },
      { text: "Sem anuncios", textEn: "Ad-free" },
    ],
  },
]

const accentStyles = {
  zinc: {
    icon: "bg-white/8 text-zinc-300",
    title: "text-zinc-200",
    border: "border-white/10",
    button: "bg-white/10 hover:bg-white/15 text-white",
    check: "text-zinc-300",
    glow: "from-zinc-400/10",
  },
  blue: {
    icon: "bg-blue-500/15 text-blue-300",
    title: "text-blue-300",
    border: "border-blue-400/35 shadow-[0_24px_80px_rgba(37,99,235,0.18)]",
    button: "bg-blue-500 hover:bg-blue-400 text-white",
    check: "text-blue-300",
    glow: "from-blue-500/20",
  },
  orange: {
    icon: "bg-orange-500/15 text-orange-300",
    title: "text-orange-300",
    border: "border-orange-400/35 shadow-[0_24px_80px_rgba(249,115,22,0.18)]",
    button: "bg-orange-500 hover:bg-orange-400 text-black",
    check: "text-orange-300",
    glow: "from-orange-500/20",
  },
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<Plan | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan>("free")
  const [adsEnabled, setAdsEnabled] = useState(true)
  const [adsLoading, setAdsLoading] = useState(false)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { plan, refreshPlan } = usePlanLimits()
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const planSummary = useMemo(() => {
    if (currentPlan === "premium") {
      return {
        scans: isEnglish ? "Unlimited" : "Ilimitado",
        workouts: isEnglish ? "Unlimited" : "Ilimitado",
        recipes: isEnglish ? "Unlimited" : "Ilimitado",
      }
    }

    if (currentPlan === "pro") {
      return { scans: "50", workouts: "5", recipes: "5" }
    }

    return { scans: "5", workouts: "0", recipes: "2" }
  }, [currentPlan, isEnglish])

  useEffect(() => {
    if (plan) {
      setCurrentPlan(plan)
    }
  }, [plan])

  useEffect(() => {
    if (!user?.id) return

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
  }, [user])

  useEffect(() => {
    if (!loading) return

    const timer = window.setTimeout(() => {
      setLoading(null)
      const message = isEnglish
        ? "Checkout did not respond. Check the Stripe keys and try again."
        : "O checkout nao respondeu. Verifique as chaves da Stripe e tente novamente."
      setCheckoutError(message)
      toast.error(message)
    }, checkoutTimeoutMs + 2000)

    return () => window.clearTimeout(timer)
  }, [loading, isEnglish])

  const showCheckoutError = (message: string) => {
    setCheckoutError(message)
    toast.error(message)
  }

  const getSessionToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ""
  }

  const handleToggleAds = async (checked: boolean) => {
    if (!user?.id) return

    const isPaidPlan = currentPlan === "pro" || currentPlan === "premium"
    if (!isPaidPlan && !checked) {
      toast.error(isEnglish ? "Requires Pro or Premium" : "Requer Pro ou Premium")
      return
    }

    setAdsLoading(true)
    try {
      await supabase.from("profiles").update({ ads_enabled: checked }).eq("id", user.id)
      setAdsEnabled(checked)
      localStorage.setItem("adsEnabled", JSON.stringify(checked))
      toast.success(checked ? (isEnglish ? "Ads enabled" : "Anuncios ativados") : (isEnglish ? "Ads disabled" : "Anuncios desativados"))
    } catch {
      toast.error(isEnglish ? "Failed to update ads" : "Falha ao atualizar anuncios")
    } finally {
      setAdsLoading(false)
    }
  }

  const switchToFree = async () => {
    const token = await getSessionToken()
    if (!token) {
      throw new Error(isEnglish ? "Your session expired. Sign in again." : "Sua sessao expirou. Entre novamente.")
    }

    const response = await fetch("/api/subscription/plan", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ plan: "free" }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok || data?.error) {
      throw new Error(data?.error || (isEnglish ? "Could not switch plan." : "Nao foi possivel trocar de plano."))
    }

    setCurrentPlan("free")
    setAdsEnabled(true)
    localStorage.setItem("userPlan", "free")
    await refreshPlan()
  }

  const startStripeCheckout = async (newPlan: PaidPlan) => {
    const token = await getSessionToken()
    if (!token) {
      throw new Error(isEnglish ? "Your session expired. Sign in again before subscribing." : "Sua sessao expirou. Entre novamente antes de assinar.")
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), checkoutTimeoutMs)

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: newPlan }),
        signal: controller.signal,
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || data?.error) {
        throw new Error(data?.error || (isEnglish ? "Checkout failed." : "Falha ao iniciar checkout."))
      }

      if (!data?.url) {
        throw new Error(isEnglish ? "Stripe did not return a checkout link." : "A Stripe nao retornou o link de checkout.")
      }

      window.location.href = data.url
    } finally {
      window.clearTimeout(timer)
    }
  }

  const handleSwitchPlan = async (newPlan: Plan) => {
    if (loading || newPlan === currentPlan) return

    if (!user?.id && !authLoading) {
      const message = isEnglish ? "Sign in before subscribing." : "Entre na sua conta antes de assinar."
      showCheckoutError(message)
      router.push("/auth/login")
      return
    }

    setLoading(newPlan)
    setCheckoutError(null)

    try {
      if (newPlan === "free") {
        await switchToFree()
        toast.success(isEnglish ? "Switched to Free" : "Plano alterado para Free")
        return
      }

      if (newPlan !== "pro" && newPlan !== "premium") {
        throw new Error(isEnglish ? "Invalid checkout plan." : "Plano de checkout invalido.")
      }

      await startStripeCheckout(newPlan)
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError"
        ? (isEnglish ? "Checkout took too long. Please try again." : "O checkout demorou demais. Tente novamente.")
        : error instanceof Error
          ? error.message
          : (isEnglish ? "Unable to start checkout. Please try again." : "Nao foi possivel iniciar o checkout. Tente novamente.")
      showCheckoutError(message)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#080705] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(249,115,22,0.20),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_45%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/40 to-transparent" />

      <header className="relative z-10 border-b border-white/10 bg-black/25 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-orange-300/80">
              FitVerse AI
            </p>
            <h1 className="text-lg md:text-2xl font-black tracking-tight">
              {isEnglish ? "Subscription Plans" : "Planos de Assinatura"}
            </h1>
          </div>

          <Badge className="rounded-full border-orange-400/25 bg-orange-500/10 text-orange-200">
            {currentPlan.toUpperCase()}
          </Badge>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 md:gap-10 items-end mb-10">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 mb-5">
              <Lock className="w-4 h-4 text-orange-300" />
              <span className="text-xs font-black uppercase tracking-widest text-white/70">
                {isEnglish ? "Secure Stripe checkout" : "Pagamento seguro via Stripe"}
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none max-w-3xl">
              {isEnglish ? "Choose the plan that matches your pace." : "Escolha o plano que acompanha seu ritmo."}
            </h2>
            <p className="mt-5 text-base md:text-lg text-white/55 max-w-2xl">
              {isEnglish
                ? "Unlock scans, workouts, recipes, history and an ad-free experience as your routine grows."
                : "Libere scans, treinos, receitas, historico e uma experiencia sem anuncios conforme sua rotina evolui."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 md:p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-orange-500/15 text-orange-300 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black">{isEnglish ? "Current benefits" : "Beneficios atuais"}</p>
                <p className="text-xs text-white/45">{isEnglish ? "Based on your active plan" : "Com base no seu plano ativo"}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: isEnglish ? "Scans" : "Scans", value: planSummary.scans },
                { label: isEnglish ? "Workouts" : "Treinos", value: planSummary.workouts },
                { label: isEnglish ? "Recipes" : "Receitas", value: planSummary.recipes },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-black/25 border border-white/10 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/40">{item.label}</p>
                  <p className="text-xl font-black text-orange-200 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {checkoutError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border border-red-400/25 bg-red-500/10 rounded-2xl p-4 flex items-start gap-3"
          >
            <XCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-red-200">
                {isEnglish ? "Checkout unavailable" : "Checkout indisponivel"}
              </p>
              <p className="text-sm text-red-100/75">{checkoutError}</p>
            </div>
          </motion.div>
        )}

        {(currentPlan === "pro" || currentPlan === "premium") && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-orange-300" />
              <div>
                <p className="text-sm font-black">
                  {adsEnabled ? (isEnglish ? "Ads enabled" : "Anuncios ativados") : (isEnglish ? "Ads disabled" : "Anuncios desativados")}
                </p>
                <p className="text-xs text-white/45">{isEnglish ? "Paid plans can control ads" : "Planos pagos podem controlar anuncios"}</p>
              </div>
            </div>
            <Switch checked={adsEnabled} onCheckedChange={handleToggleAds} disabled={adsLoading} />
          </motion.div>
        )}

        <section className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {plans.map((planItem, index) => {
            const isCurrentPlan = planItem.id === currentPlan
            const isLoadingPlan = loading === planItem.id
            const Icon = planItem.icon
            const styles = accentStyles[planItem.accent as keyof typeof accentStyles]

            return (
              <motion.article
                key={planItem.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className={cn(
                  "relative overflow-hidden rounded-[2rem] border bg-white/[0.035] p-5 md:p-6 min-h-[560px] flex flex-col",
                  styles.border,
                  planItem.popular && "md:-translate-y-3"
                )}
              >
                <div className={cn("absolute inset-x-0 top-0 h-36 bg-gradient-to-b to-transparent pointer-events-none", styles.glow)} />

                <div className="relative flex items-start justify-between mb-6">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", styles.icon)}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex gap-2">
                    {planItem.popular && (
                      <Badge className="rounded-full bg-blue-500/15 text-blue-200 border-blue-300/25">
                        {isEnglish ? "Best value" : "Mais escolhido"}
                      </Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge className="rounded-full bg-orange-500/15 text-orange-200 border-orange-300/25">
                        {isEnglish ? "Current" : "Atual"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="relative mb-6">
                  <h3 className={cn("text-3xl font-black tracking-tight", styles.title)}>{planItem.name}</h3>
                  <p className="text-sm text-white/50 mt-1">
                    {isEnglish ? planItem.subtitleEn : planItem.subtitle}
                  </p>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-black">{isEnglish ? planItem.priceUsd : planItem.price}</span>
                    <span className="text-sm text-white/45 mb-1">{isEnglish ? planItem.periodEn : planItem.period}</span>
                  </div>
                </div>

                <div className="relative space-y-3 flex-1">
                  {planItem.features.map((feature) => (
                    <div key={feature.text} className="flex items-center gap-3 text-sm">
                      <Check className={cn("w-4 h-4 shrink-0", styles.check)} />
                      <span className="text-white/68">{isEnglish ? feature.textEn : feature.text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleSwitchPlan(planItem.id)}
                  disabled={isCurrentPlan || Boolean(loading)}
                  className={cn(
                    "relative mt-7 h-14 rounded-2xl font-black tracking-[0.18em] uppercase",
                    isCurrentPlan
                      ? "bg-white/5 text-white/35 border border-white/10"
                      : styles.button
                  )}
                >
                  {isCurrentPlan ? (
                    isEnglish ? "Current plan" : "Plano atual"
                  ) : isLoadingPlan ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isEnglish ? "Opening" : "Abrindo"}
                    </span>
                  ) : planItem.id === "free" ? (
                    isEnglish ? "Downgrade" : "Voltar ao gratis"
                  ) : (
                    <span className="flex items-center gap-2">
                      {isEnglish ? "Subscribe" : "Assinar"}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </motion.article>
            )
          })}
        </section>

        <section className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            { icon: Lock, title: isEnglish ? "Stripe payment" : "Pagamento Stripe", desc: isEnglish ? "Card checkout handled by Stripe." : "Checkout de cartao processado pela Stripe." },
            { icon: BadgeCheck, title: isEnglish ? "Plan sync" : "Plano sincronizado", desc: isEnglish ? "Webhook updates your account after payment." : "O webhook atualiza sua conta apos o pagamento." },
            { icon: Sparkles, title: isEnglish ? "Ad control" : "Controle de anuncios", desc: isEnglish ? "Paid users can disable ads." : "Usuarios pagos podem desativar anuncios." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-orange-300 shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm">{item.title}</p>
                <p className="text-xs text-white/45 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
