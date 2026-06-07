"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "./switch"
import { supabase } from "@/lib/supabase"
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Globe,
  LogOut,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  User,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/hooks/useAuth"
import { usePlanLimits } from "@/hooks/usePlanLimits"

type SettingRowProps = {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
  isLast?: boolean
}

const SettingRow = ({ icon: Icon, title, description, children, isLast }: SettingRowProps) => (
  <motion.div
    whileHover={{ backgroundColor: "rgba(249, 115, 22, 0.055)" }}
    className={cn(
      "flex flex-col gap-4 px-4 py-4 transition-all sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-5",
      !isLast && "border-b border-orange-300/10"
    )}
  >
    <div className="flex min-w-0 items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-300/16 bg-orange-500/10 text-amber-100 shadow-inner">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h4 className="text-base font-black leading-tight tracking-tight text-foreground md:text-lg">{title}</h4>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-orange-100/38">{description}</p>
      </div>
    </div>
    <div className="flex shrink-0 items-center justify-end gap-3">{children}</div>
  </motion.div>
)

export function SettingsPage({ onBack }: { onBack?: () => void }) {
  const { t, locale, setLocale } = useTranslation()
  const { signOut, user, profile: authProfile } = useAuth()
  const { plan: planFromHook } = usePlanLimits()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [userSubscription, setUserSubscription] = useState<string>("free")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [adsEnabled, setAdsEnabled] = useState(true)
  const [isAdsLoading, setAdsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (planFromHook) setUserSubscription(planFromHook)
  }, [planFromHook])

  useEffect(() => {
    const storedNotifications = localStorage.getItem("notificationsEnabled")
    if (storedNotifications) setNotificationsEnabled(JSON.parse(storedNotifications))
  }, [])

  useEffect(() => {
    if (!user?.id) return

    supabase
      .from("profiles")
      .select("ads_enabled, plan, is_admin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setUserSubscription(data.plan || "free")
        setAdsEnabled(data.ads_enabled !== false)
        setIsAdmin(data.is_admin === true)
        localStorage.setItem("adsEnabled", JSON.stringify(data.ads_enabled !== false))
      })
  }, [user, planFromHook])

  useEffect(() => {
    if (user?.user_metadata?.is_admin === true || authProfile?.is_admin) {
      setIsAdmin(true)
    }
  }, [user, authProfile])

  const handleAdsToggle = async (checked: boolean) => {
    if (userSubscription === "free") {
      toast.error(t("settings_premium_locked"), {
        description: t("settings_upgrade_error"),
        action: { label: t("settings_upgrade_action"), onClick: () => router.push("/subscription") },
      })
      return
    }

    setAdsLoading(true)
    try {
      const nextAdsEnabled = !checked
      await supabase
        .from("profiles")
        .update({ ads_enabled: nextAdsEnabled })
        .eq("id", user?.id)

      setAdsEnabled(nextAdsEnabled)
      localStorage.setItem("adsEnabled", JSON.stringify(nextAdsEnabled))
      toast.success(nextAdsEnabled ? t("settings_protocol_on") : t("settings_protocol_off"))
    } catch {
      toast.error("Failed to update")
    } finally {
      setAdsLoading(false)
    }
  }

  const handleNotificationsToggle = (checked: boolean) => {
    setNotificationsEnabled(checked)
    localStorage.setItem("notificationsEnabled", JSON.stringify(checked))
    toast.success(checked ? t("settings_haptics_on") : t("settings_haptics_off"))
  }

  const handleClearCache = () => {
    localStorage.removeItem("scanHistory")
    toast.success(t("settings_toast_cleared"))
  }

  const handleLogout = async () => {
    localStorage.clear()
    await signOut()
    window.location.href = "/auth/login"
  }

  const handleLanguageToggle = () => {
    setLocale(locale === "pt-BR" ? "en-US" : "pt-BR")
  }

  const isDark = theme === "dark"

  return (
    <div className="relative mx-auto w-full max-w-5xl space-y-5 pb-safe-nav animate-in fade-in duration-700 md:space-y-7">
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-5rem] h-72 bg-[radial-gradient(circle_at_24%_10%,rgba(255,149,0,0.22),transparent_42%),radial-gradient(circle_at_86%_2%,rgba(251,191,36,0.12),transparent_36%)]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-orange-300/22 bg-black/50 p-5 text-center shadow-[inset_0_1px_0_rgba(251,146,60,0.16),0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:rounded-[2.5rem] md:p-7"
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-300 via-orange-500 to-orange-900" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/55 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(251,146,60,0.12),transparent_34%,rgba(245,158,11,0.08))]" />

        <div className="relative">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onBack?.()}
              className={cn(
                "h-11 w-11 rounded-2xl border border-orange-300/14 bg-orange-500/8 text-orange-100 hover:bg-orange-500/16",
                !onBack && "invisible"
              )}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Badge className="rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-orange-100">
              Control Center
            </Badge>
            <div className="h-11 w-11" />
          </div>

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-orange-300/18 bg-orange-500/10 text-amber-100 shadow-xl md:h-20 md:w-20 md:rounded-[1.8rem]">
            <Smartphone className="h-7 w-7 md:h-9 md:w-9" />
          </div>
          <h1 className="text-3xl font-black leading-none tracking-tight text-foreground md:text-5xl">
            {t("settings_title")}<span className="text-primary italic">{t("settings_accent")}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-xs font-black uppercase tracking-[0.24em] text-orange-50/45 md:text-sm">
            {t("settings_subtitle")}
          </p>
        </div>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Plan", value: userSubscription.toUpperCase(), icon: ShieldCheck },
          { label: "Ads", value: adsEnabled ? "ON" : "OFF", icon: Zap },
          { label: "Lang", value: locale === "pt-BR" ? "PT-BR" : "EN-US", icon: Globe },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-orange-300/14 bg-black/38 p-4 shadow-xl backdrop-blur-2xl">
            <item.icon className="h-5 w-5 text-amber-200" />
            <p className="mt-4 text-2xl font-black tracking-tight text-orange-50">{item.value}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-100/38">{item.label}</p>
          </div>
        ))}
      </section>

      <SettingsGroup icon={User} title={t("settings_account")}>
        <SettingRow icon={ShieldCheck} title={t("settings_premium")} description={t("settings_premium_desc")} isLast>
          <div className="flex items-center gap-3">
            {userSubscription === "free" && (
              <Badge className="rounded-full border border-orange-300/18 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-100">
                {t("settings_upgrade_badge")}
              </Badge>
            )}
            <Switch
              checked={!adsEnabled}
              onCheckedChange={handleAdsToggle}
              disabled={userSubscription === "free" || isAdsLoading}
              className="scale-110"
            />
          </div>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup icon={Zap} title={t("settings_prefs")}>
        <SettingRow
          icon={isDark ? Moon : Sun}
          title={t("settings_theme")}
          description={isDark ? t("settings_theme_desc_dark") : t("settings_theme_desc_light")}
        >
          <Button
            variant="ghost"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="h-11 rounded-2xl border border-orange-300/16 bg-orange-500/10 px-5 text-[10px] font-black uppercase tracking-widest text-orange-100 hover:bg-orange-500 hover:text-black"
          >
            {t("settings_theme_btn")}
          </Button>
        </SettingRow>
        <SettingRow icon={Bell} title={t("settings_notifications")} description={t("settings_notifications_desc")} isLast>
          <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationsToggle} className="scale-110" />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup icon={ShieldAlert} title={t("settings_data")}>
        <SettingRow icon={Trash2} title={t("settings_clear_cache")} description={t("settings_clear_cache_desc")}>
          <Button
            variant="ghost"
            onClick={handleClearCache}
            className="h-11 rounded-2xl border border-red-300/18 bg-red-500/10 px-5 text-[10px] font-black uppercase tracking-widest text-red-200 hover:bg-red-500 hover:text-white"
          >
            {t("settings_clear_btn")}
          </Button>
        </SettingRow>
        <SettingRow icon={Globe} title={t("settings_region")} description={t("settings_region_desc")} isLast>
          <button
            onClick={handleLanguageToggle}
            className="flex h-11 items-center gap-2 rounded-2xl border border-orange-300/16 bg-orange-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-orange-100 transition hover:bg-orange-500/16"
          >
            <span>{locale === "pt-BR" ? "PT-BR" : "EN-US"}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </SettingRow>
      </SettingsGroup>

      {isAdmin && (
        <SettingsGroup icon={ShieldCheck} title="Admin">
          <SettingRow icon={ShieldCheck} title="Admin Dashboard" description="Acessar painel administrativo" isLast>
            <Button
              variant="ghost"
              onClick={() => router.push("/admin-dashboard")}
              className="h-11 rounded-2xl border border-orange-300/16 bg-orange-500/10 px-5 text-[10px] font-black uppercase tracking-widest text-orange-100 hover:bg-orange-500 hover:text-black"
            >
              {locale === "en-US" ? "Access" : "Acessar"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </SettingRow>
        </SettingsGroup>
      )}

      <div className="space-y-5 pt-2">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="h-16 w-full rounded-[1.75rem] border border-red-300/18 bg-red-500/10 text-base font-black uppercase tracking-[0.2em] text-red-200 shadow-xl backdrop-blur-2xl hover:bg-red-500 hover:text-white md:h-[4.5rem]"
        >
          {t("settings_logout")}
          <LogOut className="ml-3 h-5 w-5" />
        </Button>

        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.38em] text-orange-100/24">{t("settings_version")}</p>
          <p className="mt-2 text-[8px] font-bold text-orange-100/18">{t("settings_copyright")}</p>
        </div>
      </div>
    </div>
  )
}

function SettingsGroup({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3 px-2 md:px-4">
        <Icon className="h-4 w-4 text-orange-300" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.32em] text-orange-100/38">{title}</h3>
      </div>
      <div className="relative overflow-hidden rounded-[1.75rem] border border-orange-300/16 bg-black/42 shadow-xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-orange-400/90" />
        {children}
      </div>
    </section>
  )
}
