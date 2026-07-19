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
    <nav className="mobile-bottom-safe md:hidden fixed left-3 right-3 z-40 mx-auto flex h-16 max-w-md items-center justify-around rounded-2xl border border-border bg-card/90 backdrop-blur-xl px-2 shadow-lg">
      {items.map((item) => (
        <button key={item.view} onClick={() => onNavigate(item.view)}
          className="relative flex h-12 w-12 flex-col items-center justify-center rounded-xl p-2 transition-colors"
        >
          <item.icon className={cn("w-5 h-5 transition-colors", currentView === item.view ? "text-brand" : "text-muted-foreground")} />
          {currentView === item.view && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand" />}
        </button>
      ))}
      <button onClick={() => onNavigate("settings")} className="relative flex h-12 w-12 flex-col items-center justify-center rounded-xl p-2">
        <Settings className={cn("w-5 h-5 transition-colors", currentView === "settings" ? "text-brand" : "text-muted-foreground")} />
        {currentView === "settings" && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand" />}
      </button>
    </nav>
  )
}
