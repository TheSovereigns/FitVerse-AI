"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { View } from "@/lib/types"
import {
  Home, ScanLine, Dumbbell, ChefHat,
  Moon, Brain, Apple, Wind,
  Heart, Timer, Smile, ListChecks,
  Trophy, Swords, Gift,
  User, Settings, Users, MessageCircle,
  Salad, Pill, ArrowLeftRight, Zap,
  ChevronDown
} from "lucide-react"

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
  isFeatureLocked: (feature: string) => boolean
}

export function DesktopSidebar({ currentView, onNavigate, isFeatureLocked }: SidebarProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (key: string) => setExpanded(prev => prev === key ? null : key)

  const groups: { key: string; icon: any; label: string; items: { view: View; icon: any; label: string; feature?: string }[] }[] = [
    {
      key: "training", icon: Dumbbell, label: t("nav_workouts"),
      items: [
        { view: "training", icon: Dumbbell, label: t("nav_workouts") },
        { view: "mobility", icon: Wind, label: t("nav_mobility"), feature: "mobility" },
        { view: "workout-feedback", icon: Zap, label: t("nav_workout_feedback"), feature: "workout-feedback" },
      ]
    },
    {
      key: "health", icon: Heart, label: t("ds_health"),
      items: [
        { view: "sleep", icon: Moon, label: t("nav_sleep"), feature: "sleep" },
        { view: "stress", icon: Brain, label: t("nav_stress"), feature: "stress" },
        { view: "supplements", icon: Apple, label: t("nav_supplements"), feature: "supplements" },
        { view: "fasting", icon: Timer, label: t("nav_fasting"), feature: "fasting" },
        { view: "longevity", icon: Heart, label: t("nav_longevity") },
        { view: "biological-age", icon: Smile, label: t("nav_biological_age"), feature: "biological-age" },
      ]
    },
    {
      key: "diet", icon: Salad, label: t("nav_diet"),
      items: [
        { view: "planner", icon: Salad, label: t("nav_diet") },
        { view: "meal-planner", icon: Apple, label: t("nav_meal_plan"), feature: "meal-planner" },
        { view: "micronutrients", icon: Pill, label: t("nav_micronutrients"), feature: "micronutrients" },
        { view: "substitutions", icon: ArrowLeftRight, label: t("nav_substitutions"), feature: "substitutions" },
      ]
    },
    {
      key: "mental", icon: Brain, label: t("nav_mood"),
      items: [
        { view: "mood", icon: Smile, label: t("nav_mood"), feature: "mood" },
        { view: "habits", icon: ListChecks, label: t("nav_habits") },
        { view: "meditation", icon: Brain, label: t("nav_meditation"), feature: "meditation" },
      ]
    },
    {
      key: "game", icon: Trophy, label: t("nav_seasons"),
      items: [
        { view: "seasons", icon: Trophy, label: t("nav_seasons"), feature: "seasons" },
        { view: "boss-battles", icon: Swords, label: t("nav_boss_battles"), feature: "boss-battles" },
        { view: "reward-shop", icon: Gift, label: t("nav_reward_shop"), feature: "reward-shop" },
      ]
    },
  ]

  return (
    <aside className="hidden md:flex flex-col w-16 fixed top-0 left-0 h-full glass-strong z-50 border-r border-border overflow-hidden">
      <div className="p-3 flex items-center justify-center mb-1">
        <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
          <ScanLine className="w-4 h-4 text-white" />
        </div>
      </div>

      <nav className="flex-1 px-1.5 space-y-0.5 overflow-y-auto scrollbar-thin">
        <button
          onClick={() => onNavigate("home")}
          className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all", currentView === "home" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <Home className="w-[18px] h-[18px]" />
          <span className="text-[7px] font-medium leading-none">{t("nav_home")}</span>
        </button>
        <button
          onClick={() => onNavigate("dashboard")}
          className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all", currentView === "dashboard" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <ScanLine className="w-[18px] h-[18px]" />
          <span className="text-[7px] font-medium leading-none">{t("nav_bioscan")}</span>
        </button>

        {groups.map((g) => {
          const isGroupActive = g.items.some(s => s.view === currentView)
          const isOpen = expanded === g.key
          return (
            <div key={g.key}>
              <button
                onClick={() => toggle(g.key)}
                className={cn(
                  "flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all relative",
                  isGroupActive && !isOpen ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <g.icon className="w-[18px] h-[18px]" />
                <span className="text-[7px] font-medium leading-none truncate max-w-[52px]">{g.label}</span>
                <ChevronDown className={cn("w-2 h-2 absolute right-1.5 top-1.5 transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="grid grid-cols-3 gap-1 px-1 py-1">
                  {g.items.map((sub) => (
                    <button
                      key={sub.view}
                      onClick={() => { onNavigate(sub.view); setExpanded(null) }}
                      title={sub.label}
                      className={cn(
                        "flex items-center justify-center w-full aspect-square rounded-lg transition-all",
                        currentView === sub.view
                          ? "bg-brand-muted text-brand"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <sub.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <button
          onClick={() => onNavigate("clans")}
          className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all", currentView === "clans" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <Users className="w-[18px] h-[18px]" />
          <span className="text-[7px] font-medium leading-none">{t("nav_clans")}</span>
        </button>
        <button
          onClick={() => onNavigate("recipes")}
          className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all", currentView === "recipes" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <ChefHat className="w-[18px] h-[18px]" />
          <span className="text-[7px] font-medium leading-none">{t("nav_recipes")}</span>
        </button>
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
