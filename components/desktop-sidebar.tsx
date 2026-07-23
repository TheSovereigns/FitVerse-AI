"use client"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { View } from "@/lib/types"
import {
  Home, ScanLine, Dumbbell, ChefHat,
  Moon, Brain, Activity, Apple, Wind,
  Heart, Timer, Smile, ListChecks,
  Trophy, Swords, Gift,
  User, Settings, Lock, Users, MessageCircle,
  Salad, Pill, ArrowLeftRight, Zap
} from "lucide-react"

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
  isFeatureLocked: (feature: string) => boolean
}

export function DesktopSidebar({ currentView, onNavigate, isFeatureLocked }: SidebarProps) {
  const { t } = useTranslation()

  const mainNavItems: { view: View; icon: any; label: string }[] = [
    { view: "home", icon: Home, label: t("nav_home") },
    { view: "dashboard", icon: ScanLine, label: t("nav_bioscan") },
    { view: "training", icon: Dumbbell, label: t("nav_workouts") },
    { view: "recipes", icon: ChefHat, label: t("nav_recipes") },
    { view: "clans", icon: Users, label: t("nav_clans") },
  ]

  const healthFeatures: { view: View; icon: any; label: string; feature?: string }[] = [
    { view: "sleep", icon: Moon, label: t("nav_sleep"), feature: "sleep" },
    { view: "stress", icon: Brain, label: t("nav_stress"), feature: "stress" },
    { view: "supplements", icon: Apple, label: t("nav_supplements"), feature: "supplements" },
    { view: "longevity", icon: Heart, label: t("nav_longevity") },
    { view: "fasting", icon: Timer, label: t("nav_fasting"), feature: "fasting" },
    { view: "biological-age", icon: Smile, label: t("nav_biological_age"), feature: "biological-age" },
  ]

  const mentalFeatures: { view: View; icon: any; label: string; feature?: string }[] = [
    { view: "mood", icon: Smile, label: t("nav_mood"), feature: "mood" },
    { view: "habits", icon: ListChecks, label: t("nav_habits") },
    { view: "meditation", icon: Brain, label: t("nav_meditation"), feature: "meditation" },
  ]

  const dietFeatures: { view: View; icon: any; label: string; feature?: string }[] = [
    { view: "planner", icon: Salad, label: t("nav_diet") },
    { view: "meal-planner", icon: Apple, label: t("nav_meal_plan"), feature: "meal-planner" },
    { view: "micronutrients", icon: Pill, label: t("nav_micronutrients"), feature: "micronutrients" },
    { view: "substitutions", icon: ArrowLeftRight, label: t("nav_substitutions"), feature: "substitutions" },
  ]

  const trainingFeatures: { view: View; icon: any; label: string; feature?: string }[] = [
    { view: "equipment", icon: Dumbbell, label: t("nav_equipment"), feature: "equipment" },
    { view: "mobility", icon: Wind, label: t("nav_mobility"), feature: "mobility" },
    { view: "workout-feedback", icon: Zap, label: t("nav_workout_feedback"), feature: "workout-feedback" },
  ]

  const gamificationFeatures: { view: View; icon: any; label: string; feature?: string }[] = [
    { view: "seasons", icon: Trophy, label: t("nav_seasons"), feature: "seasons" },
    { view: "boss-battles", icon: Swords, label: t("nav_boss_battles"), feature: "boss-battles" },
    { view: "reward-shop", icon: Gift, label: t("nav_reward_shop"), feature: "reward-shop" },
  ]

  return (
    <aside className="hidden md:flex flex-col w-16 fixed top-0 left-0 h-full glass-strong z-50 border-r border-border overflow-hidden">
      <div className="p-3 flex items-center justify-center mb-2">
        <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
          <ScanLine className="w-4 h-4 text-white" />
        </div>
      </div>

      <nav className="flex-1 px-1.5 space-y-0.5 overflow-y-auto scrollbar-thin">
        {mainNavItems.map((item) => (
          <button key={item.view} onClick={() => onNavigate(item.view)}
            className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all", currentView === item.view ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span className="text-[8px] font-medium leading-none">{item.label.split(' ')[0]}</span>
          </button>
        ))}

        <div className="pt-1.5 pb-0.5 px-1">
          <span className="text-[7px] font-semibold uppercase tracking-wider text-muted-foreground">{t("ds_health")}</span>
        </div>
        {healthFeatures.map((item) => (
          <button key={item.view} onClick={() => onNavigate(item.view)}
            className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all relative", currentView === item.view ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            {item.feature && isFeatureLocked(item.feature) && <Lock className="w-2 h-2 absolute top-0.5 right-0.5 text-primary/50" />}
            <item.icon className="w-[18px] h-[18px]" />
            <span className="text-[8px] font-medium leading-none truncate max-w-[52px]">{item.label}</span>
          </button>
        ))}

        <div className="pt-1.5 pb-0.5 px-1">
          <span className="text-[7px] font-semibold uppercase tracking-wider text-muted-foreground">{t("nav_diet")}</span>
        </div>
        {dietFeatures.map((item) => (
          <button key={item.view} onClick={() => onNavigate(item.view)}
            className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all relative", currentView === item.view ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            {item.feature && isFeatureLocked(item.feature) && <Lock className="w-2 h-2 absolute top-0.5 right-0.5 text-primary/50" />}
            <item.icon className="w-[18px] h-[18px]" />
            <span className="text-[8px] font-medium leading-none truncate max-w-[52px]">{item.label}</span>
          </button>
        ))}

        <div className="pt-1.5 pb-0.5 px-1">
          <span className="text-[7px] font-semibold uppercase tracking-wider text-muted-foreground">{t("ds_training")}</span>
        </div>
        {trainingFeatures.map((item) => (
          <button key={item.view} onClick={() => onNavigate(item.view)}
            className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all relative", currentView === item.view ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            {item.feature && isFeatureLocked(item.feature) && <Lock className="w-2 h-2 absolute top-0.5 right-0.5 text-primary/50" />}
            <item.icon className="w-[18px] h-[18px]" />
            <span className="text-[8px] font-medium leading-none truncate max-w-[52px]">{item.label}</span>
          </button>
        ))}

        <div className="pt-1.5 pb-0.5 px-1">
          <span className="text-[7px] font-semibold uppercase tracking-wider text-muted-foreground">{t("nav_mood")}</span>
        </div>
        {mentalFeatures.map((item) => (
          <button key={item.view} onClick={() => onNavigate(item.view)}
            className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all relative", currentView === item.view ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            {item.feature && isFeatureLocked(item.feature) && <Lock className="w-2 h-2 absolute top-0.5 right-0.5 text-primary/50" />}
            <item.icon className="w-[18px] h-[18px]" />
            <span className="text-[8px] font-medium leading-none truncate max-w-[52px]">{item.label}</span>
          </button>
        ))}

        <div className="pt-1.5 pb-0.5 px-1">
          <span className="text-[7px] font-semibold uppercase tracking-wider text-muted-foreground">{t("nav_seasons")}</span>
        </div>
        {gamificationFeatures.map((item) => (
          <button key={item.view} onClick={() => onNavigate(item.view)}
            className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all relative", currentView === item.view ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            {item.feature && isFeatureLocked(item.feature) && <Lock className="w-2 h-2 absolute top-0.5 right-0.5 text-primary/50" />}
            <item.icon className="w-[18px] h-[18px]" />
            <span className="text-[8px] font-medium leading-none truncate max-w-[52px]">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-1.5 py-2 space-y-0.5 border-t border-border">
        <button onClick={() => onNavigate("chatbot")}
          className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all", currentView === "chatbot" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          <span className="text-[8px] font-medium leading-none">Chat</span>
        </button>
        <button onClick={() => onNavigate("profile")}
          className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all", currentView === "profile" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <User className="w-[18px] h-[18px]" />
          <span className="text-[8px] font-medium leading-none">{t("nav_profile").split(' ')[0]}</span>
        </button>
        <button onClick={() => onNavigate("settings")}
          className={cn("flex flex-col items-center gap-0.5 w-full py-1.5 rounded-xl transition-all", currentView === "settings" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <Settings className="w-[18px] h-[18px]" />
          <span className="text-[8px] font-medium leading-none">{t("nav_settings").split(' ')[0]}</span>
        </button>
      </div>
    </aside>
  )
}
