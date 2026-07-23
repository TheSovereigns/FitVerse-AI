"use client"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { View } from "@/lib/types"
import {
  Home, ScanLine, Dumbbell, ChefHat,
  Moon, Brain, Apple, Wind,
  Heart, Timer, Smile, ListChecks,
  Trophy, Swords, Gift,
  User, Settings, Users, MessageCircle,
  Salad, Pill, ArrowLeftRight, Zap
} from "lucide-react"

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
  isFeatureLocked: (feature: string) => boolean
}

export function DesktopSidebar({ currentView, onNavigate, isFeatureLocked }: SidebarProps) {
  const { t } = useTranslation()

  const items: { view: View; icon: any; label: string; feature?: string; section?: string }[] = [
    { view: "home", icon: Home, label: t("nav_home"), section: "start" },
    { view: "dashboard", icon: ScanLine, label: t("nav_bioscan"), section: "start" },
    { view: "training", icon: Dumbbell, label: t("nav_workouts"), section: "start" },
    { view: "recipes", icon: ChefHat, label: t("nav_recipes"), section: "start" },
    { view: "clans", icon: Users, label: t("nav_clans"), section: "start" },

    { view: "sleep", icon: Moon, label: t("nav_sleep"), feature: "sleep", section: "health" },
    { view: "stress", icon: Brain, label: t("nav_stress"), feature: "stress", section: "health" },
    { view: "supplements", icon: Apple, label: t("nav_supplements"), feature: "supplements", section: "health" },
    { view: "fasting", icon: Timer, label: t("nav_fasting"), feature: "fasting", section: "health" },
    { view: "longevity", icon: Heart, label: t("nav_longevity"), section: "health" },
    { view: "biological-age", icon: Smile, label: t("nav_biological_age"), feature: "biological-age", section: "health" },

    { view: "planner", icon: Salad, label: t("nav_diet"), section: "diet" },
    { view: "meal-planner", icon: Apple, label: t("nav_meal_plan"), feature: "meal-planner", section: "diet" },
    { view: "micronutrients", icon: Pill, label: t("nav_micronutrients"), feature: "micronutrients", section: "diet" },
    { view: "substitutions", icon: ArrowLeftRight, label: t("nav_substitutions"), feature: "substitutions", section: "diet" },

    { view: "mobility", icon: Wind, label: t("nav_mobility"), feature: "mobility", section: "training" },
    { view: "workout-feedback", icon: Zap, label: t("nav_workout_feedback"), feature: "workout-feedback", section: "training" },

    { view: "mood", icon: Smile, label: t("nav_mood"), feature: "mood", section: "mental" },
    { view: "habits", icon: ListChecks, label: t("nav_habits"), section: "mental" },
    { view: "meditation", icon: Brain, label: t("nav_meditation"), feature: "meditation", section: "mental" },

    { view: "seasons", icon: Trophy, label: t("nav_seasons"), feature: "seasons", section: "game" },
    { view: "boss-battles", icon: Swords, label: t("nav_boss_battles"), feature: "boss-battles", section: "game" },
    { view: "reward-shop", icon: Gift, label: t("nav_reward_shop"), feature: "reward-shop", section: "game" },
  ]

  const sections = ["start", "health", "diet", "training", "mental", "game"]

  return (
    <aside className="hidden md:flex flex-col w-16 fixed top-0 left-0 h-full glass-strong z-50 border-r border-border overflow-hidden">
      <div className="p-3 flex items-center justify-center mb-1">
        <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
          <ScanLine className="w-4 h-4 text-white" />
        </div>
      </div>

      <nav className="flex-1 px-1.5 overflow-y-auto scrollbar-thin">
        {sections.map((section, si) => {
          const sectionItems = items.filter(i => i.section === section)
          return (
            <div key={section}>
              {si > 0 && <div className="h-px bg-border/50 mx-1 my-1" />}
              {sectionItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all relative",
                    currentView === item.view
                      ? "bg-brand-muted text-brand"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {item.feature && isFeatureLocked(item.feature) && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary/50" />
                  )}
                  <item.icon className="w-[18px] h-[18px]" />
                  <span className="text-[7px] font-medium leading-none truncate max-w-[52px]">{item.label}</span>
                </button>
              ))}
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
    </aside>
  )
}
