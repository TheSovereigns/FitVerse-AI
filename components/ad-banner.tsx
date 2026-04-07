"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { X } from "lucide-react"
import { Button } from "./ui/button"

interface AdBannerProps {
  position?: "top" | "bottom"
  className?: string
}

export function AdBanner({ position = "bottom", className = "" }: AdBannerProps) {
  const { user, profile } = useAuth()
  const [showAd, setShowAd] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdStatus = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      if (profile?.plan === "pro" || profile?.plan === "premium") {
        const { data } = await supabase
          .from('profiles')
          .select('ads_enabled')
          .eq('id', user.id)
          .single()
        
        const adsEnabled = data?.ads_enabled !== false
        setShowAd(adsEnabled && !dismissed)
      } else {
        setShowAd(!dismissed)
      }
      setIsLoading(false)
    }

    checkAdStatus()
  }, [user, profile?.plan, dismissed])

  const handleDismiss = () => {
    setDismissed(true)
    setShowAd(false)
    localStorage.setItem("adDismissed", "true")
  }

  if (isLoading || !showAd) return null

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
  const [adsEnabled, setAdsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAds = async () => {
      if (!user) {
        setAdsEnabled(false)
        setIsLoading(false)
        return
      }

      if (profile?.plan === "pro" || profile?.plan === "premium") {
        const { data } = await supabase
          .from('profiles')
          .select('ads_enabled')
          .eq('id', user.id)
          .single()
        
        setAdsEnabled(data?.ads_enabled === true)
      } else {
        setAdsEnabled(true)
      }
      setIsLoading(false)
    }

    checkAds()
  }, [user, profile?.plan])

  return { adsEnabled, isLoading }
}