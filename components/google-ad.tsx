"use client"

import { useEffect, useRef } from "react"
import { usePlanLimits } from "@/hooks/usePlanLimits"

interface GoogleAdProps {
  adSlot: string
  format?: "auto" | "rectangle" | "vertical" | "horizontal"
  className?: string
}

export function GoogleAd({ adSlot, format = "auto", className = "" }: GoogleAdProps) {
  const { limits } = usePlanLimits()
  const adRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (limits.hasAds && adRef.current) {
      try {
        const adClientId = process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT
        if (adClientId) {
          ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
          ;(window as any).adsbygoogle.push({})
        }
      } catch (e) {
        // ignore
      }
    }
  }, [limits.hasAds])

  if (!limits.hasAds) return null

  const adClientId = process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT
  if (!adClientId) return null

  return (
    <div className={`my-4 ${className}`}>
      <ins
        ref={adRef as any}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adClientId}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

export function AdBanner({ className = "" }: { className?: string }) {
  const { limits } = usePlanLimits()
  if (!limits.hasAds) return null

  return (
    <div className={`w-full h-16 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-center ${className}`}>
      <p className="text-zinc-600 text-xs">
        Anúncio • Atualize para remover anúncios
      </p>
    </div>
  )
}

export function AdInterstitial() {
  const { limits } = usePlanLimits()
  if (!limits.hasAds) return null

  return (
    <div className="w-full max-w-md mx-auto my-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-zinc-600 text-xs">Publicidade</span>
        <a href="/subscription" className="text-orange-500 text-xs hover:underline">
          Remover anúncios →
        </a>
      </div>
      <div className="h-32 bg-zinc-800/50 rounded-xl flex items-center justify-center">
        <p className="text-zinc-600 text-sm">Espaço para anúncio</p>
      </div>
    </div>
  )
}
