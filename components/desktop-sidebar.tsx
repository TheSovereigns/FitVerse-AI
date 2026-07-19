"use client"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { View } from "@/lib/types"
import {
  Home, ScanLine, Dumbbell, Calculator, ChefHat,
  Moon, Brain, Activity, Apple, Zap, Wind,
  Heart, Timer, Smile, ListChecks, Trophy, Swords, Gift,
  User, Settings, Lock
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
    { view: "planner", icon: Calculator, label: t("nav_diet") },
    { view: "recipes", icon: ChefHat, label: t("nav_recipes") },
  ]

  const healthFeatures: { view: View; icon: any; label: string; feature: string }[] = [
    { view: "sleep", icon: Moon, label: t("nav_sleep"), feature: "sleep" },
    { view: "stress", icon: Brain, label: t("nav_stress"), feature: "stress" },
    { view: "health-checkin", icon: Activity, label: t("nav_health_checkin"), feature: "health-checkin" },
    { view: "supplements", icon: Apple, label: t("nav_supplements"), feature: "supplements" },
  ]

  const trainingFeatures: { view: View; icon: any; label: string; feature: string }[] = [
    { view: "periodization", icon: Activity, label: t("nav_periodization"), feature: "periodization" },
    { view: "workout-feedback", icon: Zap, label: t("nav_workout_feedback"), feature: "workout-feedback" },
    { view: "equipment", icon: Dumbbell, label: t("nav_equipment"), feature: "equipment" },
    { view: "mobility", icon: Wind, label: t("nav_mobility"), feature: "mobility" },
  ]

  return (
    <aside className="hidden md:flex flex-col w-16 fixed top-0 left-0 h-full bg-card z-50 border-r border-border overflow-hidden">
      <div className="p-3 flex items-center justify-center mb-4">
        <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
          <ScanLine className="w-4 h-4 text-brand-foreground" />
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => (
          <button key={item.view} onClick={() => onNavigate(item.view)}
            className={cn("flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-all", currentView === item.view ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-none">{item.label.split(' ')[0]}</span>
          </button>
        ))}

        <div className="pt-2 pb-1 px-1">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{t("ds_health")}</span>
        </div>
        {healthFeatures.map((item) => (
          <button key={item.view} onClick={() => onNavigate(item.view)}
            className={cn("flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-all relative", currentView === item.view ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            {isFeatureLocked(item.feature) && <Lock className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-primary/50" />}
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-none">{item.label}</span>
          </button>
        ))}

        <div className="pt-2 pb-1 px-1">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{t("ds_training")}</span>
        </div>
        {trainingFeatures.map((item) => (
          <button key={item.view} onClick={() => onNavigate(item.view)}
            className={cn("flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-all relative", currentView === item.view ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            {isFeatureLocked(item.feature) && <Lock className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-primary/50" />}
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-none">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-2 py-3 space-y-1 border-t border-border pt-3">
        <button onClick={() => onNavigate("profile")}
          className={cn("flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-all", currentView === "profile" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-medium leading-none">{t("nav_profile").split(' ')[0]}</span>
        </button>
        <button onClick={() => onNavigate("settings")}
          className={cn("flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-all", currentView === "settings" ? "bg-brand-muted text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-medium leading-none">{t("nav_settings").split(' ')[0]}</span>
        </button>
      </div>
    </aside>
  )
}
