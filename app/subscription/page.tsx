"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Zap, ArrowRight, Loader2, Check, ArrowLeft, ShieldCheck } from "lucide-react"

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const freeFeatures = [
    "5 scans por dia",
    "Análise básica de ingredientes",
    "Histórico de 7 dias",
  ]

  const proFeatures = [
    "50 scans por dia",
    "Análise detalhada de ingredientes",
    "Histórico de 30 dias",
    "Geração de 5 treinos/mês",
    "Geração de 5 dietas/mês",
    "Navegação sem anúncios",
  ]

  const premiumFeatures = [
    "Scans ILIMITADOS com BioScan AI",
    "Geração de treinos e dietas sem limites",
    "Análise aprofundada de longevidade",
    "Histórico completo de scans",
    "Suporte prioritário",
    "Navegação sem anúncios",
  ]

  const handleCheckout = async (plan: "pro" | "premium") => {
    setLoading(plan)
    // Simula chamada à API de checkout
    await new Promise(resolve => setTimeout(resolve, 2000))
    alert(`Iniciando checkout para o plano ${plan.toUpperCase()}`)
    setLoading(null)
    // Aqui você adicionaria a lógica real de checkout com Stripe
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 text-white bg-black font-sans antialiased">
      <div className="w-full max-w-6xl mx-auto relative">
        {/* Botão Voltar */}
        <div className="absolute top-8 left-4 sm:left-8 z-20">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>

        {/* Cabeçalho Centralizado */}
        <div className="flex flex-col items-center justify-center pt-8 pb-12 text-center">
          {/* Ícone Hero */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/20 opacity-15 blur-[120px]" />
          <div className="w-24 h-24 bg-gradient-to-br from-[#FF8C00] to-[#CC5500] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,140,0,0.5)] mb-8 z-10">
            <Zap className="w-10 h-10 text-black" />
          </div>
          {/* Título e Slogan */}
          <h1 className="text-5xl font-black tracking-tighter text-white">
            FitVerse PRO
          </h1>
          <p className="text-zinc-500 text-[9px] font-bold tracking-[0.4em] uppercase mt-2">
            PERFORMANCE ILIMITADA
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Plano Free */}
          <div className="relative bg-zinc-950/50 border border-zinc-800 rounded-[2rem] p-8 overflow-hidden shadow-xl h-full flex flex-col">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">FREE</h2>
              <p className="text-zinc-400 text-xs">Para começar sua jornada</p>
              <p className="text-4xl font-black text-white my-2">R$ 0<span className="text-lg font-bold text-zinc-500">/sempre</span></p>
            </div>

            <div className="space-y-3 mb-8 flex-grow">
              {freeFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-400">{feature}</span>
                </div>
              ))}
            </div>
            <Button className="w-full h-14 bg-zinc-800 text-zinc-500 cursor-not-allowed mt-auto" disabled>Plano Atual</Button>
          </div>

          {/* Plano Pro */}
          <div className="relative bg-zinc-950/50 border border-zinc-800 rounded-[2rem] p-8 overflow-hidden shadow-xl h-full flex flex-col">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">PRO</h2>
              <p className="text-zinc-400 text-xs">Para quem quer evoluir</p>
              <p className="text-4xl font-black text-white my-2">R$ 19,90<span className="text-lg font-bold text-zinc-500">/mês</span></p>
            </div>

            <div className="space-y-3 mb-8 flex-grow">
              {proFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-zinc-300">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => handleCheckout("pro")}
              disabled={!!loading}
              className="w-full h-14 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest text-sm rounded-xl transition-all duration-300 group mt-auto"
            >
              {loading === "pro" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Assinar Pro"}
            </Button>
          </div>

          {/* Plano Premium */}
          <div className="relative bg-zinc-950/80 border border-[#FF8C00] rounded-[2rem] p-8 overflow-hidden shadow-2xl shadow-orange-500/10 h-full flex flex-col">
            {/* Cantoneiras */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#FF8C00] rounded-tl-xl opacity-80" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF8C00] rounded-tr-xl opacity-80" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#FF8C00] rounded-bl-xl opacity-80" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#FF8C00] rounded-br-xl opacity-80" />

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#FF8C00]">PREMIUM</h2>
              <p className="text-zinc-400 text-xs">Performance ilimitada</p>
              <p className="text-4xl font-black text-white my-2">R$ 29,90<span className="text-lg font-bold text-zinc-500">/mês</span></p>
            </div>

            <div className="space-y-3 mb-8 flex-grow">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-zinc-300">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => handleCheckout("premium")}
              disabled={!!loading}
              className="w-full h-16 bg-[#FF8C00] hover:bg-[#FF9D29] hover:shadow-[0_0_30px_rgba(255,140,0,0.4)] text-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 group mt-auto"
            >
              {loading === "premium" ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Assinar Premium
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-center mt-8">
          <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Restaurar compras
          </a>
        </div>
      </div>
    </div>
  )
}