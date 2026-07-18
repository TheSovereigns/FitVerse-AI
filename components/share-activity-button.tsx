"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Share2, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useClanFeed } from "@/hooks/useClanFeed"
import { useClans } from "@/hooks/useClans"
import { useTranslation } from "@/lib/i18n"

interface ShareActivityButtonProps {
  activityType: "scan" | "workout" | "diet" | "streak" | "badge"
  activityData: any
  variant?: "default" | "ghost"
  className?: string
}

export function ShareActivityButton({ activityType, activityData, variant = "ghost", className }: ShareActivityButtonProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { userClan } = useClans()
  const { shareActivity } = useClanFeed(userClan?.id || null)
  const [isSharing, setIsSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (!userClan) return null

  const handleShare = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      setTimeout(() => setShowConfirm(false), 3000)
      return
    }

    setIsSharing(true)
    const success = await shareActivity(activityType, activityData)
    if (success) {
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
    setIsSharing(false)
    setShowConfirm(false)
  }

  return (
    <Button
      variant={variant}
      onClick={handleShare}
      disabled={isSharing || shared}
      className={cn(
        "h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
        shared
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
          : showConfirm
            ? "bg-white/10 text-foreground border border-white/10"
            : "border border-white/10 bg-white/8 text-foreground/50 hover:bg-white/10",
        className
      )}
    >
      {isSharing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
      ) : shared ? (
        <Check className="h-3.5 w-3.5 mr-1.5" />
      ) : (
        <Share2 className="h-3.5 w-3.5 mr-1.5" />
      )}
      {shared
        ? (isEnglish ? "Shared!" : "Compartilhado!")
        : showConfirm
          ? (isEnglish ? "Confirm Share" : "Confirmar")
          : (isEnglish ? "Share to Clan" : "Compartilhar no Clã")}
    </Button>
  )
}
