"use client"

import { Bot, Lock, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function ChatbotTab() {
  const { t } = useTranslation()

  return (
    <div className="relative mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-5rem] h-72 bg-[radial-gradient(circle_at_24%_10%,rgba(255,149,0,0.22),transparent_42%),radial-gradient(circle_at_86%_2%,rgba(251,191,36,0.12),transparent_36%)]" />
      <section className="relative w-full overflow-hidden rounded-[2rem] border border-orange-300/22 bg-black/50 p-6 text-center shadow-[inset_0_1px_0_rgba(251,146,60,0.16),0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:rounded-[2.5rem] md:p-10">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-300 via-orange-500 to-orange-900" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(251,146,60,0.12),transparent_34%,rgba(245,158,11,0.08))]" />
        <div className="relative mx-auto max-w-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-orange-300/18 bg-orange-500/10 text-amber-100 shadow-xl">
            <Bot className="h-10 w-10" />
          </div>
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-orange-300/18 bg-orange-500/10 px-3 py-1.5">
            <Lock className="h-4 w-4 text-amber-200" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-100">{t("store_coming_soon")}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">{t("chatbot_header")}</h1>
          <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-relaxed text-orange-50/52 md:text-base">{t("chatbot_disabled_desc")}</p>
          <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-2xl border border-orange-300/16 bg-orange-500/8 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-orange-100">
            <Sparkles className="h-4 w-4 text-primary" />
            FitVerse AI
          </div>
        </div>
      </section>
    </div>
  )
}
