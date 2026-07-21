"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { X } from "lucide-react"
import { Button } from "./ui/button"

interface AdBannerProps {
  position?: "top" | "bottom"
  className?: string
}

export function AdBanner({ position = "bottom", className = "" }: AdBannerProps) {
  const { user, profile } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  const isPaidPlan = profile?.plan === "pro" || profile?.plan === "premium"
  const adsEnabledForPlan = isPaidPlan ? (profile as any)?.ads_enabled !== false : true
  const showAd = user && adsEnabledForPlan && !dismissed

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem("adDismissed", "true")
  }

  if (!showAd) return null

  return (
    <div className={`w-full ${position === "top" ? "pt-2" : "pb-2"} ${className}`}>
      <div className="relative glass-strong border border-white/10 rounded-2xl p-3 mx-4 overflow-hidden">
        <button 
          onClick={handleDismiss}
          className="absolute top-1 right-1 p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
            <span className="text-lg">📢</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              Anúncio Publicitário
            </p>
            <p className="text-xs text-muted-foreground truncate">
             -space for ads-
            </p>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            className="shrink-0 text-xs h-8"
            onClick={() => window.open('/subscription', '_blank')}
          >
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useAdsEnabled() {
  const { user, profile } = useAuth()
  const isPaidPlan = profile?.plan === "pro" || profile?.plan === "premium"
  const adsEnabled = isPaidPlan ? (profile as any)?.ads_enabled === true : !!user
  return { adsEnabled, isLoading: false }
}