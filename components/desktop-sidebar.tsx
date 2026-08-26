"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { View } from "@/lib/types"
import {
  Home, ScanLine, Dumbbell, ChefHat,
  Moon, Brain, Apple, Wind,
  Heart, Timer, Smile, ListChecks,
  Trophy, Bell, Watch, Navigation,
  User, Settings, Users, MessageCircle,
  Salad, Pill, ArrowLeftRight, Zap,
  ChevronRight, Utensils, Ruler,
  Calendar, TrendingUp, Flame, BarChart3,
  PanelLeftClose, PanelLeft, Activity
} from "lucide-react"

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
  isFeatureLocked: (feature: string) => boolean
}

interface NavItem {
  view: View
  icon: any
  label: string
  feature?: string
  accent?: string
}

interface NavGroup {
  key: string
  icon: any
  label: string
  accent: string
  items: NavItem[]
}

export function DesktopSidebar({ currentView, onNavigate, isFeatureLocked }: SidebarProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggle = (key: string) => setExpandedGroup(prev => prev === key ? null : key)

  const singleItems: NavItem[] = [
    { view: "home", icon: Home, label: t("nav_home") },
    { view: "dashboard", icon: ScanLine, label: t("nav_bioscan") },
    { view: "clans", icon: Users, label: t("nav_clans") },
    { view: "recipes", icon: ChefHat, label: t("nav_recipes") },
    { view: "food-diary", icon: Utensils, label: t("common_diary") },
    { view: "body", icon: Ruler, label: t("common_body") },
  ]

  const groups: NavGroup[] = [
    {
      key: "training", icon: Dumbbell, label: t("nav_workouts"), accent: "#34D399",
      items: [
        { view: "training", icon: Dumbbell, label: t("nav_workouts") },
        { view: "corrida", icon: Navigation, label: isEnglish ? "Run" : "Corrida" },
        { view: "mobility", icon: Wind, label: t("nav_mobility"), feature: "mobility" },
        { view: "workout-feedback", icon: Zap, label: t("nav_workout_feedback"), feature: "workout-feedback" },
        { view: "periodization", icon: Timer, label: t("nav_periodization"), feature: "periodization" },
        { view: "equipment", icon: Dumbbell, label: t("nav_equipment"), feature: "equipment" },
      ]
    },
    {
      key: "health", icon: Heart, label: t("ds_health"), accent: "#F87171",
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
      key: "diet", icon: Salad, label: t("nav_diet"), accent: "#FBBF24",
      items: [
        { view: "planner", icon: Salad, label: t("nav_diet") },
        { view: "meal-planner", icon: Apple, label: t("nav_meal_plan"), feature: "meal-planner" },
        { view: "dietary", icon: Pill, label: t("nav_restrictions") },
        { view: "micronutrients", icon: Pill, label: t("nav_micronutrients"), feature: "micronutrients" },
        { view: "substitutions", icon: ArrowLeftRight, label: t("nav_substitutions"), feature: "substitutions" },
      ]
    },
    {
      key: "mental", icon: Brain, label: t("nav_mood"), accent: "#A78BFA",
      items: [
        { view: "mood", icon: Smile, label: t("nav_mood"), feature: "mood" },
        { view: "habits", icon: ListChecks, label: t("nav_habits") },
        { view: "meditation", icon: Brain, label: t("nav_meditation"), feature: "meditation" },
      ]
    },
    {
      key: "game", icon: Trophy, label: t("nav_seasons"), accent: "#FB923C",
      items: [
        { view: "seasons", icon: Trophy, label: t("nav_seasons"), feature: "seasons" },
        { view: "battle-pass", icon: Zap, label: t("bp_battle_pass") },
      ]
    },
    {
      key: "progress", icon: TrendingUp, label: t("common_progress"), accent: "#38BDF8",
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

  const bottomItems: NavItem[] = [
    { view: "chatbot", icon: MessageCircle, label: t("common_chat") },
    { view: "profile", icon: User, label: t("nav_profile") },
    { view: "settings", icon: Settings, label: t("nav_settings") },
  ]

  const isActive = (view: View) => currentView === view
  const isGroupActive = (g: NavGroup) => g.items.some(s => s.view === currentView)
  const activeGroup = groups.find(g => g.key === expandedGroup)

  const NavButton = ({ item, index }: { item: NavItem; index: number }) => {
    const active = isActive(item.view)
    return (
      <motion.button
        key={item.view}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.015 }}
        onClick={() => onNavigate(item.view)}
        title={item.label}
        aria-label={item.label}
        className={cn(
          "relative flex flex-col items-center gap-1.5 w-full rounded-xl py-3 transition-all duration-200 border-l-2",
          active
            ? "bg-brand/10 text-brand border-brand"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
        )}
      >
        <item.icon className={cn("w-5 h-5 transition-all duration-200", active && "stroke-[2.5]")} />
        {!isCollapsed && (
          <span className="text-[11px] font-[550] tracking-[-0.01em] leading-none truncate w-full text-center px-1">{item.label}</span>
        )}
      </motion.button>
    )
  }

  const GroupButton = ({ group, index }: { group: NavGroup; index: number }) => {
    const groupActive = isGroupActive(group)
    const isOpen = expandedGroup === group.key

    return (
      <div key={group.key}>
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (singleItems.length + index) * 0.015 }}
          onClick={() => toggle(group.key)}
          title={group.label}
          aria-label={group.label}
          className={cn(
            "relative flex flex-col items-center gap-1.5 w-full rounded-xl py-3 transition-all duration-200 border-l-2",
            groupActive && !isOpen
              ? "bg-brand/10 text-brand border-brand"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
          )}
        >
          <div className="relative">
            <group.icon className={cn("w-5 h-5 transition-all duration-200")} />
            <ChevronRight className={cn(
              "absolute -bottom-1 -right-1.5 w-2.5 h-2.5 transition-transform duration-200",
              isOpen && "rotate-90"
            )} />
          </div>
          {!isCollapsed && (
            <span className="text-[11px] font-[550] tracking-[-0.01em] leading-none truncate w-full text-center px-1">{group.label}</span>
          )}
        </motion.button>
      </div>
    )
  }

  return (
    <>
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-full z-50 w-[88px] transition-all duration-300"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-card/80 backdrop-blur-2xl border-r border-border/50" />

        <div className="relative flex flex-col h-full">
          {/* Logo */}
          <div className="flex flex-col items-center shrink-0 py-3 border-b border-border/30">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-emerald-600 flex items-center justify-center shadow-lg shadow-brand/20 overflow-hidden">
                <img src="/vf.svg" alt="VyseFit" className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-card" />
            </div>
          </div>

          {/* Main nav - scrollable */}
          <nav className="flex-1 px-1.5 py-2 space-y-0.5 overflow-y-auto scrollbar-thin">
            {singleItems.map((item, i) => (
              <NavButton key={item.view} item={item} index={i} />
            ))}

            <div className="!my-1.5 mx-2">
              <div className="h-px bg-border/40" />
            </div>

            {groups.map((g, i) => (
              <GroupButton key={g.key} group={g} index={i} />
            ))}
          </nav>

          {/* Bottom section */}
          <div className="shrink-0 border-t border-border/30 px-1.5 py-2 space-y-0.5">
            {bottomItems.map((item, i) => (
              <NavButton key={item.view} item={item} index={singleItems.length + groups.length + i} />
            ))}

            {/* Collapse toggle */}
            <div className="!mt-1 pt-1 border-t border-border/30">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? t("nav_expand") : t("nav_collapse")}
                className="flex flex-col items-center gap-1.5 w-full rounded-xl py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                title={isCollapsed ? t("nav_expand") : t("nav_collapse")}
              >
                {isCollapsed ? (
                  <PanelLeft className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
                {!isCollapsed && (
                  <span className="text-[11px] font-[550] tracking-[-0.01em] leading-none">{isEnglish ? "Collapse" : "Recolher"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Flyout panel for expanded group */}
      <AnimatePresence>
        {activeGroup && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="hidden md:flex fixed top-0 h-full z-40 w-[240px] flex-col left-[88px]"
          >
            <div className="absolute inset-0 bg-popover/95 backdrop-blur-2xl border-r border-border/50" />
            <div className="relative flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border/30">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${activeGroup.accent}15` }}>
                  <activeGroup.icon className="w-4 h-4" style={{ color: activeGroup.accent }} />
                </div>
                <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{activeGroup.label}</span>
              </div>

              {/* Items */}
              <nav className="flex-1 py-2 space-y-0.5 px-2">
                {activeGroup.items.map((sub, i) => {
                  const subActive = isActive(sub.view)
                  return (
                    <motion.button
                      key={sub.view}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => { onNavigate(sub.view); setExpandedGroup(null) }}
                      aria-label={sub.label}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                        subActive
                          ? "text-foreground font-semibold bg-brand/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                      style={subActive ? { backgroundColor: `${activeGroup.accent}10` } : undefined}
                    >
                      <sub.icon className={cn("w-4 h-4 shrink-0")} style={subActive ? { color: activeGroup.accent } : undefined} />
                      <span className="text-[14px] truncate">{sub.label}</span>
                    </motion.button>
                  )
                })}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
