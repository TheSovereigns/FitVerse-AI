"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ScanLine, CheckCircle2, AlertCircle, Loader2, Home, User, Bot } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export type IslandState = "idle" | "scanning" | "success" | "error" | "expanded" | "docked"

interface DynamicIslandProps {
  state?: IslandState
  content?: React.ReactNode
  title?: string
  icon?: React.ElementType
  onNavigate?: (view: any) => void
  isDocked?: boolean
}

export function DynamicIsland({
  state: initialState = "idle",
  content,
  title,
  icon: Icon,
  onNavigate,
  isDocked = false,
}: DynamicIslandProps) {
  const { t } = useTranslation()
  const [islandState, setIslandState] = useState<IslandState>(initialState)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    setIslandState(initialState)
  }, [initialState])

  const getWidth = () => {
    if (isHovered || islandState === "expanded") return "w-72"
    if (islandState === "scanning") return "w-44"
    if (islandState === "success" || islandState === "error") return "w-36"
    return "w-28"
  }

  return (
    <div className={cn(
      "fixed left-1/2 -translate-x-1/2 z-[100] transition-all duration-300",
      isDocked ? "top-3" : "top-5"
    )}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "rounded-2xl border border-border bg-card shadow-lg transition-all duration-300 flex items-center justify-center overflow-hidden",
          getWidth(),
          "h-10"
        )}
      >
        <div className="flex items-center gap-2 px-3 w-full h-full justify-center">
          {islandState === "idle" && !isHovered && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
              <span className="text-[10px] font-medium text-muted-foreground">{t("island_ready")}</span>
            </div>
          )}

          {islandState === "scanning" && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-xs font-medium text-foreground">{t("island_scanning")}</span>
            </div>
          )}

          {islandState === "success" && (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-semibold">{t("island_done")}</span>
            </div>
          )}

          {islandState === "error" && (
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-semibold">Error</span>
            </div>
          )}

          {isHovered && (
            <div className="flex items-center justify-around w-full">
              <IslandMiniButton icon={Home} label={t("island_home")} onClick={() => onNavigate?.("home")} />
              <IslandMiniButton icon={Bot} label={t("nav_aichat")} onClick={() => onNavigate?.("chatbot")} />
              <IslandMiniButton icon={User} label={t("island_profile")} onClick={() => onNavigate?.("profile")} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function IslandMiniButton({ icon: Icon, onClick, label }: { icon: any, onClick?: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors"
      title={label}
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
    </button>
  )
}
