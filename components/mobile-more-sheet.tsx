"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { View } from "@/lib/types"
import {
  User, Settings, MessageCircle, Users,
  Moon, Brain, Activity, Apple,
  Calculator, Salad, Pill, ArrowLeftRight,
  Timer, Zap, Dumbbell, Wind,
  Heart, Smile, ListChecks,
  Trophy, Swords, Gift,
  X, Utensils, Ruler
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
        { view: "sleep", icon: Moon, label: t("nav_sleep"), feature: "sleep" },
        { view: "stress", icon: Brain, label: t("nav_stress"), feature: "stress" },
        { view: "health-checkin", icon: Activity, label: t("nav_health_checkin"), feature: "health-checkin" },
        { view: "supplements", icon: Apple, label: t("nav_supplements"), feature: "supplements" },
      ]
    },
    {
      title: t("nav_diet"),
      items: [
        { view: "planner", icon: Calculator, label: t("nav_diet") },
        { view: "meal-planner", icon: Salad, label: t("nav_meal_plan"), feature: "meal-planner" },
        { view: "dietary", icon: Pill, label: t("nav_diet") },
        { view: "micronutrients", icon: Activity, label: t("nav_micronutrients"), feature: "micronutrients" },
        { view: "substitutions", icon: ArrowLeftRight, label: t("nav_substitutions"), feature: "substitutions" },
      ]
    },
    {
      title: t("ds_training"),
      items: [
        { view: "periodization", icon: Timer, label: t("nav_periodization"), feature: "periodization" },
        { view: "workout-feedback", icon: Zap, label: t("nav_workout_feedback"), feature: "workout-feedback" },
        { view: "equipment", icon: Dumbbell, label: t("nav_equipment"), feature: "equipment" },
        { view: "mobility", icon: Wind, label: t("nav_mobility"), feature: "mobility" },
      ]
    },
    {
      title: "Fitness",
      items: [
        { view: "longevity", icon: Heart, label: t("nav_longevity") },
        { view: "fasting", icon: Timer, label: t("nav_fasting"), feature: "fasting" },
        { view: "biological-age", icon: Smile, label: t("nav_biological_age"), feature: "biological-age" },
      ]
    },
    {
      title: "Mental",
      items: [
        { view: "mood", icon: Smile, label: t("nav_mood"), feature: "mood" },
        { view: "habits", icon: ListChecks, label: t("nav_habits") },
        { view: "meditation", icon: Brain, label: t("nav_meditation"), feature: "meditation" },
      ]
    },
    {
      title: "Gamification",
      items: [
        { view: "seasons", icon: Trophy, label: t("nav_seasons"), feature: "seasons" },
        { view: "boss-battles", icon: Swords, label: t("nav_boss_battles"), feature: "boss-battles" },
        { view: "reward-shop", icon: Gift, label: t("nav_reward_shop"), feature: "reward-shop" },
      ]
    },
    {
      title: isEnglish ? "Tracking" : "Acompanhamento",
      items: [
        { view: "food-diary", icon: Utensils, label: isEnglish ? "Food Diary" : "Diario Alimentar" },
        { view: "body", icon: Ruler, label: isEnglish ? "Body Measurements" : "Medidas Corporais" },
      ]
    },
  ]

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
              <h2 className="text-lg font-bold text-foreground">{t("nav_search_placeholder")}</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 pb-8 space-y-6">
              {sections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {section.items.map((item) => {
                      const locked = item.feature && isFeatureLocked(item.feature)
                      return (
                        <button
                          key={item.view}
                          onClick={() => handleNavigate(item.view, item.feature)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                            locked
                              ? "opacity-40 cursor-not-allowed"
                              : "active:scale-95 hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            "bg-muted/50 text-muted-foreground"
                          )}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground">
                            {item.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
