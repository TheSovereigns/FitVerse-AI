"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "./switch"
import {
  Moon,
  Sun,
  Bell,
  Trash2,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Zap,
  ShieldAlert,
  User,
  Smartphone,
  Globe,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation, type Locale } from "@/lib/i18n"
import { useAuth } from "@/hooks/useAuth"

const SettingRow = ({
  icon: Icon, title, description, children, isLast,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
  isLast?: boolean
}) => (
  <motion.div
    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
    className={cn(
      "flex items-center justify-between py-4 md:py-6 px-5 md:px-10 border-white/5 transition-all",
      !isLast && "border-b"
    )}
  >
    <div className="flex items-center gap-4 md:gap-6">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
        <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
      </div>
      <div>
        <h4 className="font-black text-foreground tracking-tight text-base md:text-lg leading-tight mb-0.5">{title}</h4>
        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">{description}</p>
      </div>
    </div>
    <div className="flex items-center gap-3 md:gap-4">
      {children}
    </div>
  </motion.div>
)

export function SettingsPage({ onBack }: { onBack?: () => void }) {
  const { t, locale, setLocale } = useTranslation()
  const { signOut } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [userSubscription, setUserSubscription] = useState("free")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [adsEnabled, setAdsEnabled] = useState(true)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || '{"subscription":"free"}')
    const subscription = user.subscription || "free"
    setUserSubscription(subscription)
    if (subscription !== "free") {
      const storedAds = localStorage.getItem("adsEnabled")
      setAdsEnabled(storedAds ? JSON.parse(storedAds) : false)
    } else {
      setAdsEnabled(true)
    }
    const storedNotifications = localStorage.getItem("notificationsEnabled")
    if (storedNotifications) setNotificationsEnabled(JSON.parse(storedNotifications))
  }, [])

  const handleAdsToggle = (checked: boolean) => {
    if (userSubscription === "free") {
      toast.error(t("settings_premium_locked"), {
        description: t("settings_upgrade_error"),
        action: { label: t("settings_upgrade_action"), onClick: () => router.push("/subscription") },
      })
      return
    }
    setAdsEnabled(!checked)
    localStorage.setItem("adsEnabled", JSON.stringify(!checked))
    toast.success(`Protocol ${!checked ? t("settings_protocol_on") : t("settings_protocol_off")}.`)
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
    toast.success(t("settings_toast_logout"))
    await signOut()
  }

  const handleLanguageToggle = () => {
    setLocale(locale === "pt-BR" ? "en-US" : "pt-BR")
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10 md:space-y-16 pb-safe-nav animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col items-center justify-center pt-8 md:pt-12 pb-4 md:pb-6 text-center">
        <div className="w-12 h-12 md:w-20 md:h-20 rounded-[1.25rem] md:rounded-[2rem] glass-strong border-white/20 mb-3 md:mb-6 flex items-center justify-center shadow-xl relative group">
          <div className="absolute inset-0 mesh-gradient opacity-20 rounded-[1.25rem] md:rounded-[2rem]" />
          <Smartphone className="w-5 h-5 md:w-8 md:h-8 text-primary relative z-10" />
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-none">
          {t("settings_title")}<span className="text-primary italic">{t("settings_accent")}</span>
        </h1>
        <p className="text-xs md:text-lg font-bold text-muted-foreground mt-2 md:mt-3 opacity-50 uppercase tracking-[0.3em]">
          {t("settings_subtitle")}
        </p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Account */}
        <div>
          <div className="flex items-center gap-2 px-3 md:px-8 mb-3 md:mb-5">
            <User className="w-3 h-3 text-primary" />
            <h3 className="font-black text-muted-foreground text-[8px] uppercase tracking-[0.3em] opacity-40">{t("settings_account")}</h3>
          </div>
          <div className="glass-strong border-white/10 shadow-xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
            <SettingRow icon={ShieldCheck} title={t("settings_premium")} description={t("settings_premium_desc")} isLast>
              <div className="flex items-center gap-2 md:gap-3">
                {userSubscription === "free" && (
                  <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] tracking-widest px-2 md:px-3 py-1">
                    {t("settings_upgrade_badge")}
                  </Badge>
                )}
                <Switch
                  checked={!adsEnabled}
                  onCheckedChange={handleAdsToggle}
                  disabled={userSubscription === "free"}
                  className="scale-110 md:scale-125"
                />
              </div>
            </SettingRow>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <div className="flex items-center gap-3 px-5 md:px-10 mb-4 md:mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="font-black text-muted-foreground text-[10px] uppercase tracking-[0.4em] opacity-40">{t("settings_prefs")}</h3>
          </div>
          <div className="glass-strong border-white/10 shadow-2xl rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden">
            <SettingRow
              icon={theme === "dark" ? Moon : Sun}
              title={t("settings_theme")}
              description={theme === "dark" ? t("settings_theme_desc_dark") : t("settings_theme_desc_light")}
            >
              <Button
                variant="ghost"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-10 md:h-12 rounded-full font-black text-[9px] md:text-[10px] tracking-widest px-4 md:px-6 glass border-white/10 hover:bg-primary hover:text-white transition-all"
              >
                {t("settings_theme_btn")}
              </Button>
            </SettingRow>
            <SettingRow icon={Bell} title={t("settings_notifications")} description={t("settings_notifications_desc")} isLast>
              <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationsToggle} className="scale-110 md:scale-125" />
            </SettingRow>
          </div>
        </div>

        {/* Data & Region */}
        <div>
          <div className="flex items-center gap-3 px-5 md:px-10 mb-4 md:mb-6">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <h3 className="font-black text-muted-foreground text-[10px] uppercase tracking-[0.4em] opacity-40">{t("settings_data")}</h3>
          </div>
          <div className="glass-strong border-white/10 shadow-2xl rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden">
            <SettingRow icon={Trash2} title={t("settings_clear_cache")} description={t("settings_clear_cache_desc")}>
              <Button
                variant="ghost"
                onClick={handleClearCache}
                className="h-10 md:h-12 rounded-full font-black text-[9px] md:text-[10px] tracking-widest px-4 md:px-6 glass border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
              >
                {t("settings_clear_btn")}
              </Button>
            </SettingRow>

            {/* Language / Region Switcher */}
            <SettingRow icon={Globe} title={t("settings_region")} description={t("settings_region_desc")} isLast>
              <button
                onClick={handleLanguageToggle}
                className={cn(
                  "flex items-center gap-2 px-4 h-10 rounded-full glass border border-white/20 font-black text-[10px] tracking-widest transition-all haptic-press hover:border-primary/60",
                  "hover:bg-primary/10"
                )}
              >
                <span className="text-base leading-none">{locale === "pt-BR" ? "🇧🇷" : "🇺🇸"}</span>
                <span className="text-foreground/70">{locale === "pt-BR" ? "PT-BR" : "EN-US"}</span>
              </button>
            </SettingRow>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 md:pt-8 space-y-4 md:space-y-6">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full h-18 md:h-24 rounded-[2rem] md:rounded-[2.5rem] glass-strong border-white/10 font-black text-xl md:text-2xl uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl flex items-center justify-center ios-active py-6"
          >
            {t("settings_logout")}
            <LogOut className="ml-3 md:ml-4 w-6 h-6 md:w-8 md:h-8" />
          </Button>

          <div className="text-center opacity-20">
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">{t("settings_version")}</p>
            <p className="text-[8px] font-bold mt-2">{t("settings_copyright")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}