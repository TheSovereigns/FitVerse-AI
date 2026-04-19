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

  const getIslandWidth = () => {
    if (isDocked && !isHovered) return "w-48"
    if (isHovered || islandState === "expanded") return "w-64 md:w-80 lg:w-96 xl:w-[28rem]"
    if (islandState === "scanning") return "w-48"
    if (islandState === "success" || islandState === "error") return "w-40"
    return "w-32"
  }

  const getIslandHeight = () => {
    if (islandState === "expanded") return "h-32"
    if (isHovered) return "h-14"
    if (isDocked) return "h-12"
    return "h-10"
  }

  return (
    <div className={cn(
      "fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-auto transition-all duration-700",
      isDocked ? "top-3 md:top-4" : "top-6 md:top-8"
    )}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setTimeout(() => setIsHovered(false), 1500)}
        className={cn(
          "bg-black/95 backdrop-blur-3xl text-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-center overflow-hidden border border-white/20",
          getIslandWidth(),
          getIslandHeight(),
          islandState === "scanning" && "animate-island-morph",
          isDocked && !isHovered && "ring-1 ring-primary/30"
        )}
      >
        <div className="flex items-center gap-3 px-4 w-full h-full justify-center">
          {islandState === "idle" && !isHovered && !isDocked && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-500">
              <div className="relative w-4 h-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/10" />
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-primary" strokeDasharray={Math.PI * 12} strokeDashoffset={Math.PI * 12 * 0.3} />
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{t("island_ready")}</span>
            </div>
          )}

          {isDocked && !isHovered && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-black tracking-tight">{title || "FitVerse"}</span>
            </div>
          )}

          {islandState === "scanning" && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs font-bold tracking-tight">{t("island_scanning")}</span>
            </div>
          )}

          {islandState === "success" && (
            <div className="flex items-center gap-2 text-primary animate-in zoom-in duration-300">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">{t("island_done")}</span>
            </div>
          )}

          {isHovered && (
            <div className="flex items-center justify-around w-full animate-in fade-in slide-in-from-top-4 duration-500">
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
      className="group flex flex-col items-center justify-center p-3 min-w-[44px] min-h-[44px] lg:min-w-[48px] lg:min-h-[48px] hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
      title={label}
    >
      <Icon className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
    </button>
  )
}
