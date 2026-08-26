"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { View } from "@/lib/types"
import {
  User, Settings, MessageCircle, Users,
  Moon, Brain, Activity, Apple,
  Calculator, Salad, Pill, ArrowLeftRight,
  Timer, Zap, Dumbbell, Wind,
  Heart, Smile, ListChecks, Watch,
  Trophy, Bell, Navigation,
  X, Utensils, Ruler,
  Calendar, TrendingUp, Flame, BarChart3,
  Search, ChevronRight
} from "lucide-react"

interface MobileMoreSheetProps {
  open: boolean
  onClose: () => void
  onNavigate: (view: View) => void
  isFeatureLocked: (feature: string) => boolean
}

interface FeatureItem {
  view: View
  icon: typeof Moon
  label: string
  feature?: string
}

export function MobileMoreSheet({ open, onClose, onNavigate, isFeatureLocked }: MobileMoreSheetProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [query, setQuery] = useState("")

  const handleNavigate = (view: View, feature?: string) => {
    if (feature && isFeatureLocked(feature)) return
    onNavigate(view)
    onClose()
  }

  const sections: { title: string; items: FeatureItem[] }[] = [
    {
      title: t("nav_profile"),
      items: [
        { view: "profile", icon: User, label: t("nav_profile") },
        { view: "settings", icon: Settings, label: t("nav_settings") },
        { view: "chatbot", icon: MessageCircle, label: t("nav_aichat") },
        { view: "clans", icon: Users, label: t("nav_clans") },
      ]
    },
    {
      title: t("ds_health"),
      items: [
        { view: "health-integrations", icon: Watch, label: t("hi_title") },
        { view: "sleep", icon: Moon, label: t("nav_sleep"), feature: "sleep" },
        { view: "stress", icon: Brain, label: t("nav_stress"), feature: "stress" },
        { view: "health-checkin", icon: Activity, label: t("nav_health_checkin"), feature: "health-checkin" },
        { view: "supplements", icon: Apple, label: t("nav_supplements"), feature: "supplements" },
        { view: "fasting", icon: Timer, label: t("nav_fasting"), feature: "fasting" },
        { view: "longevity", icon: Heart, label: t("nav_longevity") },
        { view: "biological-age", icon: Smile, label: t("nav_biological_age"), feature: "biological-age" },
        { view: "smart-reminders", icon: Bell, label: t("misc_reminders") },
      ]
    },
    {
      title: t("nav_diet"),
      items: [
        { view: "planner", icon: Calculator, label: t("nav_diet") },
        { view: "meal-planner", icon: Salad, label: t("nav_meal_plan"), feature: "meal-planner" },
        { view: "dietary", icon: Pill, label: t("nav_restrictions") },
        { view: "micronutrients", icon: Activity, label: t("nav_micronutrients"), feature: "micronutrients" },
        { view: "substitutions", icon: ArrowLeftRight, label: t("nav_substitutions"), feature: "substitutions" },
      ]
    },
    {
      title: t("ds_training"),
      items: [
        { view: "training", icon: Dumbbell, label: t("nav_workouts") },
        { view: "corrida", icon: Navigation, label: isEnglish ? "Run Tracker" : "Corrida" },
        { view: "periodization", icon: Timer, label: t("nav_periodization"), feature: "periodization" },
        { view: "workout-feedback", icon: Zap, label: t("nav_workout_feedback"), feature: "workout-feedback" },
        { view: "equipment", icon: Dumbbell, label: t("nav_equipment"), feature: "equipment" },
        { view: "mobility", icon: Wind, label: t("nav_mobility"), feature: "mobility" },
      ]
    },
    {
      title: t("common_mental"),
      items: [
        { view: "mood", icon: Smile, label: t("nav_mood"), feature: "mood" },
        { view: "habits", icon: ListChecks, label: t("nav_habits") },
        { view: "meditation", icon: Brain, label: t("nav_meditation"), feature: "meditation" },
      ]
    },
    {
      title: t("common_gamification"),
      items: [
        { view: "seasons", icon: Trophy, label: t("nav_seasons"), feature: "seasons" },
        { view: "battle-pass", icon: Zap, label: t("bp_battle_pass") },
      ]
    },
    {
      title: t("common_tracking"),
      items: [
        { view: "food-diary", icon: Utensils, label: t("misc_food_diary") },
        { view: "body", icon: Ruler, label: t("misc_body_measurements") },
      ]
    },
    {
      title: t("common_progress"),
      items: [
        { view: "weekly-report", icon: Calendar, label: t("misc_weekly_report") },
        { view: "body-evolution", icon: TrendingUp, label: t("misc_body_evolution") },
        { view: "streak-calendar", icon: Flame, label: t("misc_streak") },
        { view: "achievements-page", icon: Trophy, label: t("misc_achievements") },
        { view: "analytics-charts", icon: BarChart3, label: t("misc_analytics") },
        { view: "monthly-report", icon: Calendar, label: t("misc_monthly_report") },
      ]
    },
  ]

  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        query.trim() === "" ? true : item.label.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0)

  const exploreTitle = (() => {
    const v = (t as any)("nav_explore")
    if (v && v !== "nav_explore") return v
    return isEnglish ? "Explore" : "Explorar"
  })()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 md:hidden max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background border-t border-border"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-background/80 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <img src="/icon.svg" alt="VyseFit" className="w-5 h-5" />
                <h2 className="text-lg font-bold text-foreground">{exploreTitle}</h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={isEnglish ? "Search..." : "Buscar..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted border border-transparent focus:border-border focus:bg-background text-sm placeholder:text-muted-foreground outline-none transition-colors"
                />
              </div>
            </div>

            <div className="px-5 pb-8 space-y-6">
              {filteredSections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {isEnglish ? "No results found" : "Nenhum resultado encontrado"}
                </p>
              ) : (
                filteredSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {section.title}
                    </h3>
                    <div className={section.items.length <= 2 ? "grid grid-cols-2 gap-1" : "flex flex-col gap-1"}>
                      {section.items.map((item) => {
                        const locked = item.feature && isFeatureLocked(item.feature)
                        // For 2-column grid small sections, use compact vertical style but keep list pattern for larger
                        const isCompactGrid = section.items.length <= 2
                        if (isCompactGrid) {
                          return (
                            <button
                              key={item.view}
                              onClick={() => handleNavigate(item.view, item.feature)}
                              aria-label={item.label}
                              className={cn(
                                "flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border border-transparent",
                                locked
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-muted active:scale-[0.98] hover:border-border/50"
                              )}
                            >
                              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                <item.icon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <span className="text-[14px] font-medium text-foreground truncate flex-1">{item.label}</span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            </button>
                          )
                        }
                        return (
                          <button
                            key={item.view}
                            onClick={() => handleNavigate(item.view, item.feature)}
                            aria-label={item.label}
                            className={cn(
                              "flex items-center justify-between w-full px-2 py-2 rounded-xl text-left transition-all",
                              locked
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:bg-muted active:scale-[0.98]"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                <item.icon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <span className="text-[14px] font-medium text-foreground truncate">{item.label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
