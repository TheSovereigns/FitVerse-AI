"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, Zap, ArrowRight } from "lucide-react"

export default function SubscriptionPage() {
  const features = [
    "Scans ilimitados com BioScan AI",
    "Geração de treinos e dietas sem limites",
    "Análise aprofundada de longevidade",
    "Histórico completo de scans",
    "Suporte prioritário",
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-foreground bg-background font-sans antialiased">
      <div className="w-full max-w-md mx-auto">
        {/* Cabeçalho Centralizado */}
        <div className="flex flex-col items-center justify-center pt-8 pb-12 text-center">
          {/* Ícone Hero */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 opacity-15 blur-[120px]" />
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,140,0,0.5)] mb-8 z-10">
            <Zap className="w-10 h-10 text-primary-foreground" />
          </div>
          {/* Título e Slogan */}
          <h1 className="text-5xl font-black tracking-tighter text-foreground">
            FitVerse PRO
          </h1>
          <p className="text-muted-foreground text-[9px] font-bold tracking-[0.4em] uppercase mt-2">
            PERFORMANCE ILIMITADA
          </p>
        </div>

        {/* Card de Upgrade */}
        <div className="relative bg-card/80 border border-border rounded-[2rem] p-8 overflow-hidden border-b-[6px] border-b-primary shadow-2xl">
          {/* Cantoneiras */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-xl opacity-80" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-xl opacity-80" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-xl opacity-80" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-xl opacity-80" />

          <div className="text-center mb-8">
            <p className="text-muted-foreground">Acesso total por</p>
            <p className="text-5xl font-black text-foreground my-2">R$ 19,90<span className="text-lg font-bold text-muted-foreground">/mês</span></p>
            <p className="text-xs text-muted-foreground">Cancele a qualquer momento.</p>
          </div>

          <div className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 flex-shrink-0 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <Button
            className="w-full h-16 bg-primary hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(255,140,0,0.4)] text-primary-foreground font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 group"
          >
            ASSINAR AGORA
            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <div className="text-center mt-8">
          <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Restaurar compras
          </a>
        </div>
      </div>
    </div>
  )
}