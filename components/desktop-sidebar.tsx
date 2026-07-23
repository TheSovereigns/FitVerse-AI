"use client"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { View } from "@/lib/types"
import {
  Home, ScanLine, Dumbbell, ChefHat,
  Moon, Brain, Apple,
  Heart, Timer, Smile, ListChecks,
  Trophy, Swords, Gift,
  User, Settings, Users, MessageCircle,
  Salad, Wind
} from "lucide-react"

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
  isFeatureLocked: (feature: string) => boolean
}

export function DesktopSidebar({ currentView, onNavigate, isFeatureLocked }: SidebarProps) {
  const { t } = useTranslation()

  const items: { view: View; icon: any; label: string; divider?: boolean }[] = [
    { view: "home", icon: Home, label: t("nav_home") },
    { view: "dashboard", icon: ScanLine, label: t("nav_bioscan") },
    { view: "training", icon: Dumbbell, label: t("nav_workouts") },
    { view: "recipes", icon: ChefHat, label: t("nav_recipes") },
    { view: "clans", icon: Users, label: t("nav_clans") },
    { view: "sleep", icon: Moon, label: t("nav_sleep"), divider: true },
    { view: "planner", icon: Salad, label: t("nav_diet") },
    { view: "longevity", icon: Heart, label: t("nav_longevity") },
    { view: "fasting", icon: Timer, label: t("nav_fasting") },
    { view: "mood", icon: Smile, label: t("nav_mood") },
    { view: "habits", icon: ListChecks, label: t("nav_habits") },
    { view: "seasons", icon: Trophy, label: t("nav_seasons"), divider: true },
    { view: "boss-battles", icon: Swords, label: t("nav_boss_battles") },
    { view: "reward-shop", icon: Gift, label: t("nav_reward_shop") },
  ]

  return (
    <aside className="hidden md:flex flex-col w-16 fixed top-0 left-0 h-full glass-strong z-50 border-r border-border overflow-hidden">
      <div className="p-3 flex items-center justify-center mb-1">
        <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
          <ScanLine className="w-4 h-4 text-white" />
        </div>
      </div>

      <nav className="flex-1 px-1.5 space-y-0.5 overflow-y-auto scrollbar-thin">
        {items.map((item) => (
          <div key={item.view}>
            {item.divider && <div className="h-px bg-border/50 mx-1 my-1.5" />}
            <button
              onClick={() => onNavigate(item.view)}
              className={cn(
                "flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all",
                currentView === item.view
                  ? "bg-brand-muted text-brand"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span className="text-[7px] font-medium leading-none truncate max-w-[52px]">{item.label}</span>
            </button>
          </div>
        ))}
      </nav>

      <div className="px-1.5 py-2 space-y-0.5 border-t border-border">
        <button
          onClick={() => onNavigate("chatbot")}
          className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all", currentView === "chatbot" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          <span className="text-[7px] font-medium leading-none">Chat</span>
        </button>
        <button
          onClick={() => onNavigate("profile")}
          className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all", currentView === "profile" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <User className="w-[18px] h-[18px]" />
          <span className="text-[7px] font-medium leading-none">{t("nav_profile").split(' ')[0]}</span>
        </button>
        <button
          onClick={() => onNavigate("settings")}
          className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all", currentView === "settings" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <Settings className="w-[18px] h-[18px]" />
          <span className="text-[7px] font-medium leading-none">{t("nav_settings").split(' ')[0]}</span>
        </button>
      </div>
    </aside>
  )
}
