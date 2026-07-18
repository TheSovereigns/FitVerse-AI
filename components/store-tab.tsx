"use client"

import { ArrowRight, Lock, ShoppingBag, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function StoreTab() {
  const { t } = useTranslation()

  return (
    <div className="relative mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-5rem] h-72 bg-[radial-gradient(circle_at_24%_10%,rgba(255,255,255,0.1),transparent_42%),radial-gradient(circle_at_86%_2%,rgba(255,255,255,0.05),transparent_36%)]" />
      <section className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:rounded-[2.5rem] md:p-10">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-white/20 via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_34%,rgba(255,255,255,0.08))]" />
        <div className="relative mx-auto max-w-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/10 text-foreground/50 shadow-xl">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
            <Lock className="h-4 w-4 text-foreground/60" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/50">{t("store_coming_soon")}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">{t("store_heading")}</h1>
          <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-relaxed text-foreground/50 md:text-base">{t("store_desc")}</p>
          <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/50">
            <Sparkles className="h-4 w-4 text-primary" />
            FitVerse Market
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
        </div>
      </section>
    </div>
  )
}
