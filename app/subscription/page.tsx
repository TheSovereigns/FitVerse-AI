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
    shell: "border-white/14 bg-white/[0.055]",
    icon: "bg-white/10 text-zinc-100 border-white/10",
    title: "text-zinc-100",
    button: "bg-white/10 hover:bg-white/16 text-white border-white/10",
    check: "text-zinc-200",
    shine: "from-white/12 via-white/[0.03] to-transparent",
    ring: "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_80px_rgba(0,0,0,0.24)]",
  },
  blue: {
    shell: "border-sky-300/35 bg-sky-300/[0.075]",
    icon: "bg-sky-300/15 text-sky-100 border-sky-200/20",
    title: "text-sky-100",
    button: "bg-sky-300 hover:bg-sky-200 text-slate-950 border-sky-100/20",
    check: "text-sky-200",
    shine: "from-sky-200/20 via-white/[0.045] to-transparent",
    ring: "shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_28px_100px_rgba(14,165,233,0.18)]",
  },
  orange: {
    shell: "border-amber-300/35 bg-amber-300/[0.075]",
    icon: "bg-amber-300/15 text-amber-100 border-amber-200/20",
    title: "text-amber-100",
    button: "bg-amber-300 hover:bg-amber-200 text-slate-950 border-amber-100/20",
    check: "text-amber-200",
    shine: "from-amber-200/20 via-white/[0.045] to-transparent",
    ring: "shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_28px_100px_rgba(245,158,11,0.18)]",
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
    <div className="min-h-screen bg-[#07080c] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(115deg,rgba(14,165,233,0.16)_0%,transparent_28%,rgba(245,158,11,0.14)_62%,transparent_100%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-x-0 top-0 h-48 pointer-events-none bg-gradient-to-b from-white/8 to-transparent" />

      <header className="relative z-10 border-b border-white/10 bg-white/[0.045] backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="text-center min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-200/75">
              FitVerse AI
            </p>
            <h1 className="text-base md:text-xl font-black tracking-tight truncate">
              {isEnglish ? "Subscription Plans" : "Planos de Assinatura"}
            </h1>
          </div>

          <div className="h-10 px-3 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-white/45">
              {isEnglish ? "Current" : "Atual"}
            </span>
            <span className="text-xs font-black text-amber-100">{currentPlan.toUpperCase()}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-7">
        <section className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/12 bg-white/[0.055] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_30px_120px_rgba(0,0,0,0.32)] p-5 md:p-6 mb-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0.11),transparent_34%,rgba(14,165,233,0.08)_64%,rgba(245,158,11,0.08))]" />
          <div className="relative grid lg:grid-cols-[1fr_auto] gap-5 items-end">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/18 px-3 py-2 mb-3">
                <Lock className="w-4 h-4 text-sky-200" />
                <span className="text-xs font-black uppercase tracking-widest text-white/68">
                  {isEnglish ? "Stripe checkout protected" : "Checkout protegido pela Stripe"}
                </span>
              </div>
              <h2 className="max-w-3xl text-3xl md:text-5xl font-black tracking-tight leading-[1.02]">
                {isEnglish ? "Choose your FitVerse plan." : "Escolha seu plano FitVerse."}
              </h2>
              <p className="mt-3 max-w-2xl text-sm md:text-base text-white/58 leading-relaxed">
                {isEnglish
                  ? "More scans, richer analysis, workouts and recipes with a smooth ad-free FitVerse experience."
                  : "Mais scans, analises melhores, treinos e receitas em uma experiencia FitVerse mais limpa e sem anuncios."}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            className="grid grid-cols-3 gap-2 md:gap-3 lg:w-[390px]"
            >
              {[
                { label: isEnglish ? "Scans" : "Scans", value: planSummary.scans },
                { label: isEnglish ? "Workouts" : "Treinos", value: planSummary.workouts },
                { label: isEnglish ? "Recipes" : "Receitas", value: planSummary.recipes },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/22 backdrop-blur-xl p-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/40">{item.label}</p>
                  <p className="mt-2 text-lg md:text-2xl font-black text-white">{item.value}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {checkoutError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 border border-red-300/25 bg-red-500/12 backdrop-blur-xl rounded-2xl p-4 flex items-start gap-3"
          >
            <XCircle className="w-5 h-5 text-red-200 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-red-100">
                {isEnglish ? "Checkout unavailable" : "Checkout indisponivel"}
              </p>
              <p className="text-sm text-red-50/75">{checkoutError}</p>
            </div>
          </motion.div>
        )}

        {(currentPlan === "pro" || currentPlan === "premium") && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-200/12 text-amber-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black">
                  {adsEnabled ? (isEnglish ? "Ads enabled" : "Anuncios ativados") : (isEnglish ? "Ads disabled" : "Anuncios desativados")}
                </p>
                <p className="text-xs text-white/45">{isEnglish ? "Paid plans can control ads" : "Planos pagos podem controlar anuncios"}</p>
              </div>
            </div>
            <Switch checked={adsEnabled} onCheckedChange={handleToggleAds} disabled={adsLoading} />
          </motion.div>
        )}

        <section className="grid md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
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
                  "relative overflow-hidden rounded-[2rem] border backdrop-blur-2xl p-5 min-h-[450px] flex flex-col transition-transform duration-300 hover:-translate-y-1",
                  styles.shell,
                  styles.ring,
                  planItem.popular && "md:min-h-[472px]"
                )}
              >
                <div className={cn("absolute inset-x-0 top-0 h-36 bg-gradient-to-b pointer-events-none", styles.shine)} />
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                <div className="relative flex items-start justify-between gap-3 mb-5">
                  <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center", styles.icon)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {planItem.popular && (
                      <Badge className="rounded-full border-sky-200/25 bg-sky-200/12 text-sky-100">
                        {isEnglish ? "Recommended" : "Recomendado"}
                      </Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge className="rounded-full border-amber-200/25 bg-amber-200/12 text-amber-100">
                        {isEnglish ? "Current" : "Atual"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <h3 className={cn("text-2xl md:text-3xl font-black tracking-tight", styles.title)}>{planItem.name}</h3>
                  <p className="text-sm text-white/52 mt-1 min-h-5">
                    {isEnglish ? planItem.subtitleEn : planItem.subtitle}
                  </p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-3xl md:text-4xl font-black tracking-tight">{isEnglish ? planItem.priceUsd : planItem.price}</span>
                    <span className="text-sm text-white/45 mb-2">{isEnglish ? planItem.periodEn : planItem.period}</span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-2.5 flex-1">
                  {planItem.features.map((feature) => (
                    <div key={feature.text} className="flex items-center gap-2.5 text-[13px]">
                      <span className="w-5 h-5 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                        <Check className={cn("w-3.5 h-3.5", styles.check)} />
                      </span>
                      <span className="text-white/70">{isEnglish ? feature.textEn : feature.text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleSwitchPlan(planItem.id)}
                  disabled={isCurrentPlan || Boolean(loading)}
                  className={cn(
                    "relative mt-5 h-12 rounded-2xl border font-black tracking-[0.14em] uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
                    isCurrentPlan
                      ? "bg-white/7 text-white/38 border-white/10"
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

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] backdrop-blur-2xl p-4 md:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { icon: Lock, title: isEnglish ? "Stripe payment" : "Pagamento Stripe", desc: isEnglish ? "Card checkout handled by Stripe." : "Checkout de cartao processado pela Stripe." },
              { icon: BadgeCheck, title: isEnglish ? "Plan sync" : "Plano sincronizado", desc: isEnglish ? "Webhook updates your account after payment." : "O webhook atualiza sua conta apos o pagamento." },
              { icon: Sparkles, title: isEnglish ? "Ad control" : "Controle de anuncios", desc: isEnglish ? "Paid users can disable ads." : "Usuarios pagos podem desativar anuncios." },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/18 p-3">
                <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center text-sky-100 shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-sm">{item.title}</p>
                  <p className="text-xs text-white/45 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
