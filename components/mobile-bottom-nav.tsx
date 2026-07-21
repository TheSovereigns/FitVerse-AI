"use client"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { View } from "@/lib/types"
import { Home, Dumbbell, ChefHat, Users, Settings } from "lucide-react"

interface MobileBottomNavProps {
  currentView: View
  onNavigate: (view: View) => void
}

export function MobileBottomNav({ currentView, onNavigate }: MobileBottomNavProps) {
  const { t } = useTranslation()

  const items = [
    { view: "home" as View, icon: Home, label: t("nav_home") },
    { view: "training" as View, icon: Dumbbell, label: t("nav_workouts") },
    { view: "recipes" as View, icon: ChefHat, label: t("nav_recipes") },
    { view: "clans" as View, icon: Users, label: t("nav_clans") },
  ]

  return (
    <nav className="mobile-bottom-safe md:hidden fixed left-3 right-3 z-40 mx-auto flex h-[68px] max-w-md items-center justify-between rounded-[1.25rem] glass-strong px-3 shadow-lg shadow-black/5 dark:shadow-black/30">
      {items.map((item) => {
        const isActive = currentView === item.view
        return (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={cn(
              "relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
              isActive
                ? "bg-brand/10 text-brand"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-[22px] w-[22px]", isActive && "stroke-[2.5]")} />
            {isActive && (
              <span className="absolute -bottom-0.5 h-[3px] w-4 rounded-full bg-brand" />
            )}
          </button>
        )
      })}
      <button
        onClick={() => onNavigate("settings")}
        className={cn(
          "relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
          currentView === "settings"
            ? "bg-brand/10 text-brand"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Settings className={cn("h-[22px] w-[22px]", currentView === "settings" && "stroke-[2.5]")} />
        {currentView === "settings" && (
          <span className="absolute -bottom-0.5 h-[3px] w-4 rounded-full bg-brand" />
        )}
      </button>
    </nav>
  )
}
