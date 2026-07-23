"use client"

import { useState, useRef, useEffect } from "react"
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
  ChevronRight, Activity
} from "lucide-react"

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
  isFeatureLocked: (feature: string) => boolean
}

interface SubItem {
  view: View
  icon: any
  label: string
  feature?: string
}

interface GroupItem {
  icon: any
  label: string
  view?: View
  subItems?: SubItem[]
}

export function DesktopSidebar({ currentView, onNavigate, isFeatureLocked }: SidebarProps) {
  const { t } = useTranslation()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  const handleGroupEnter = (key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpenGroup(key)
  }

  const handleGroupLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenGroup(null), 200)
  }

  const handlePanelEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  const handlePanelLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenGroup(null), 200)
  }

  const groups: Record<string, { label: string; items: SubItem[] }> = {
    health: {
      label: t("ds_health"),
      items: [
        { view: "sleep", icon: Moon, label: t("nav_sleep"), feature: "sleep" },
        { view: "stress", icon: Brain, label: t("nav_stress"), feature: "stress" },
        { view: "supplements", icon: Apple, label: t("nav_supplements"), feature: "supplements" },
        { view: "fasting", icon: Timer, label: t("nav_fasting"), feature: "fasting" },
        { view: "longevity", icon: Heart, label: t("nav_longevity") },
        { view: "biological-age", icon: Smile, label: t("nav_biological_age"), feature: "biological-age" },
      ]
    },
    diet: {
      label: t("nav_diet"),
      items: [
        { view: "planner", icon: Salad, label: t("nav_diet") },
        { view: "meal-planner", icon: Apple, label: t("nav_meal_plan"), feature: "meal-planner" },
        { view: "micronutrients", icon: Pill, label: t("nav_micronutrients"), feature: "micronutrients" },
        { view: "substitutions", icon: ArrowLeftRight, label: t("nav_substitutions"), feature: "substitutions" },
      ]
    },
    training: {
      label: t("nav_workouts"),
      items: [
        { view: "training", icon: Dumbbell, label: t("nav_workouts") },
        { view: "mobility", icon: Wind, label: t("nav_mobility"), feature: "mobility" },
        { view: "workout-feedback", icon: Zap, label: t("nav_workout_feedback"), feature: "workout-feedback" },
      ]
    },
    mental: {
      label: t("nav_mood"),
      items: [
        { view: "mood", icon: Smile, label: t("nav_mood"), feature: "mood" },
        { view: "habits", icon: ListChecks, label: t("nav_habits") },
        { view: "meditation", icon: Brain, label: t("nav_meditation"), feature: "meditation" },
      ]
    },
    game: {
      label: t("nav_seasons"),
      items: [
        { view: "seasons", icon: Trophy, label: t("nav_seasons"), feature: "seasons" },
        { view: "boss-battles", icon: Swords, label: t("nav_boss_battles"), feature: "boss-battles" },
        { view: "reward-shop", icon: Gift, label: t("nav_reward_shop"), feature: "reward-shop" },
      ]
    },
  }

  const mainItems: GroupItem[] = [
    { icon: Home, label: t("nav_home"), view: "home" },
    { icon: ScanLine, label: t("nav_bioscan"), view: "dashboard" },
    { icon: Dumbbell, label: t("nav_workouts"), subItems: groups.training.items },
    { icon: ChefHat, label: t("nav_recipes"), view: "recipes" },
    { icon: Users, label: t("nav_clans"), view: "clans" },
    { icon: Moon, label: t("ds_health"), subItems: groups.health.items },
    { icon: Salad, label: t("nav_diet"), subItems: groups.diet.items },
    { icon: Smile, label: t("nav_mood"), subItems: groups.mental.items },
    { icon: Trophy, label: t("nav_seasons"), subItems: groups.game.items },
  ]

  return (
    <aside className="hidden md:flex flex-col w-16 fixed top-0 left-0 h-full glass-strong z-50 border-r border-border overflow-hidden">
      <div className="p-3 flex items-center justify-center mb-1">
        <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
          <ScanLine className="w-4 h-4 text-white" />
        </div>
      </div>

      <nav className="flex-1 px-1.5 space-y-0.5 overflow-y-auto scrollbar-thin">
        {mainItems.map((item) => {
          const hasSub = item.subItems && item.subItems.length > 0
          const isActive = hasSub
            ? item.subItems!.some(s => s.view === currentView)
            : item.view === currentView

          return (
            <div key={item.label} className="relative">
              <button
                onClick={() => {
                  if (hasSub) {
                    const groupKey = item.label
                    if (openGroup === groupKey) setOpenGroup(null)
                    else setOpenGroup(groupKey)
                  } else if (item.view) {
                    onNavigate(item.view)
                  }
                }}
                onMouseEnter={() => hasSub && handleGroupEnter(item.label)}
                onMouseLeave={() => hasSub && handleGroupLeave()}
                className={cn(
                  "flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all",
                  isActive ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span className="text-[7px] font-medium leading-none truncate max-w-[52px]">{item.label}</span>
                {hasSub && <ChevronRight className="w-2 h-2 absolute right-1 top-1/2 -translate-y-1/2 opacity-40" />}
              </button>
            </div>
          )
        })}
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

      {/* Flyout Panel */}
      {openGroup && groups[Object.keys(groups).find(k => groups[k].label === openGroup) || ""] && (
        <div
          ref={panelRef}
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
          className="fixed left-16 top-0 h-full w-52 glass-strong border-r border-border z-50 overflow-y-auto scrollbar-thin py-4 px-2"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
            {groups[Object.keys(groups).find(k => groups[k].label === openGroup) || ""].label}
          </p>
          <div className="space-y-0.5">
            {groups[Object.keys(groups).find(k => groups[k].label === openGroup) || ""].items.map((sub) => {
              const locked = sub.feature && isFeatureLocked(sub.feature)
              return (
                <button
                  key={sub.view}
                  onClick={() => { onNavigate(sub.view); setOpenGroup(null) }}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm transition-all relative",
                    currentView === sub.view
                      ? "bg-brand-muted text-brand font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <sub.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{sub.label}</span>
                  {locked && <span className="w-1.5 h-1.5 rounded-full bg-primary/50 ml-auto shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}
