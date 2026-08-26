"use client"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { View } from "@/lib/types"
import { Home, ScanLine, Dumbbell, ChefHat, LayoutGrid } from "lucide-react"

interface MobileBottomNavProps {
  currentView: View
  onNavigate: (view: View) => void
  onOpenMore: () => void
}

export function MobileBottomNav({ currentView, onNavigate, onOpenMore }: MobileBottomNavProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const items: { view: View; icon: typeof Home; label: string; isScan?: boolean }[] = [
    { view: "home", icon: Home, label: t("nav_home") },
    { view: "training", icon: Dumbbell, label: t("nav_workouts") },
    { view: "dashboard", icon: ScanLine, label: t("nav_bioscan"), isScan: true },
    { view: "recipes", icon: ChefHat, label: t("nav_recipes") },
  ]

  return (
    <nav
      className="md:hidden fixed left-0 right-0 bottom-0 z-40 flex h-[84px] items-center justify-around rounded-t-3xl rounded-b-none border-t bg-card/85 backdrop-blur-2xl px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const isActive = currentView === item.view
        if (item.isScan) {
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              aria-label={item.label}
              className="relative flex flex-col items-center justify-center flex-1 -mt-6"
            >
              <div
                className={cn(
                  "h-14 w-14 rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 transition-all duration-200",
                  isActive
                    ? "bg-brand text-white"
                    : "bg-brand text-white hover:scale-105 active:scale-95"
                )}
              >
                <item.icon className="h-6 w-6" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none mt-1.5",
                  isActive ? "text-brand" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 h-1 w-6 rounded-b-full bg-brand" />
              )}
            </button>
          )
        }
        return (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            aria-label={item.label}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all duration-200",
              isActive ? "text-brand" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-6 rounded-b-full bg-brand" />
            )}
            <item.icon className={cn("h-[22px] w-[22px]", isActive && "stroke-[2.5]")} />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </button>
        )
      })}
      <button
        onClick={onOpenMore}
        aria-label="More options"
        className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground"
      >
        <LayoutGrid className="h-[22px] w-[22px]" />
        <span className="text-[10px] font-medium leading-none">{isEnglish ? "More" : "Mais"}</span>
      </button>
    </nav>
  )
}
