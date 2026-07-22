"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "./switch"
import { supabase, findProfile } from "@/lib/supabase"
import {
  ArrowLeft,
  Bell,
  Calendar,
  ChevronRight,
  Globe,
  LogOut,
  Moon,
  Ruler,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sun,
  Target,
  Trash2,
  User,
  Zap,
  Palette,
  Watch,
  Check,
  Monitor,
  RefreshCw,
  Loader2,
  Heart,
  Activity,
  Footprints,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import { useAuth } from "@/hooks/useAuth"

type SettingRowProps = {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
  isLast?: boolean
}

const SettingRow = ({ icon: Icon, title, description, children, isLast }: SettingRowProps) => (
  <div
    className={cn(
      "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
      !isLast && "border-b border-border"
    )}
  >
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="flex shrink-0 items-center justify-end gap-3">{children}</div>
  </div>
)

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
      <div className="mb-2 flex items-center gap-2 px-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="overflow-hidden rounded-2xl glass-strong">
        {children}
      </div>
    </section>
  )
}

function ThemeSection() {
  const { t } = useTranslation()
  const [theme, setThemeState] = useState<string>("dark")
  const [accent, setAccent] = useState("green")

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fitverse-accent")
      if (saved) setAccent(saved)
      const html = document.documentElement
      if (html.classList.contains("dark")) setThemeState("dark")
      else if (html.classList.contains("light")) setThemeState("light")
      else setThemeState("system")
    } catch (e) {
      logger.error("[SettingsPage] Failed to read theme state:", e)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setThemeState(next)
    document.documentElement.classList.toggle("dark", next === "dark")
    document.documentElement.classList.toggle("light", next === "light")
  }

  const ACCENT_COLORS = [
    { id: "green", color: "#34D399" },
    { id: "blue", color: "#0A84FF" },
    { id: "purple", color: "#BF5AF2" },
    { id: "pink", color: "#FF375F" },
    { id: "orange", color: "#FF9500" },
    { id: "red", color: "#FF453A" },
  ]

  return (
    <div className="rounded-2xl glass-strong p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Palette className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">{t("sp_appearance")}</h3>
          <p className="text-xs text-muted-foreground">{t("sp_customize_look")}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">{t("sp_theme")}</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "dark", icon: Moon, label: t("sp_dark") },
            { id: "light", icon: Sun, label: t("sp_light") },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={toggleTheme}
              className={cn(
                "flex items-center gap-2 rounded-xl p-3 transition-all border",
                theme === id ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">{t("sp_accent_color")}</p>
        <div className="flex gap-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => { setAccent(color.id); localStorage.setItem("fitverse-accent", color.id) }}
              className={cn(
                "relative h-9 w-9 rounded-xl transition-all border-2",
                accent === color.id ? "border-foreground scale-110" : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color.color }}
            >
              {accent === color.id && <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function WearableSection() {
  const { t } = useTranslation()
  const [connected, setConnected] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wearableIntegrations")
      if (saved) setConnected(JSON.parse(saved))
    } catch (e) {
      logger.error("[SettingsPage] Failed to parse wearableIntegrations:", e)
    }
  }, [])

  const toggle = (id: string) => {
    const next = { ...connected, [id]: !connected[id] }
    setConnected(next)
    localStorage.setItem("wearableIntegrations", JSON.stringify(next))
  }

  const items = [
    { id: "google_fit", name: "Google Fit", icon: Activity },
    { id: "apple_health", name: "Apple Health", icon: Heart },
    { id: "fitbit", name: "Fitbit", icon: Watch },
  ]

  return (
    <div className="rounded-2xl glass-strong p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Watch className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">Wearables</h3>
          <p className="text-xs text-muted-foreground">
            {Object.values(connected).some(Boolean) ? t("sp_wearables_connected") : t("sp_wearables_not_connected")}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className="w-full flex items-center gap-3 rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-all"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">{item.name}</p>
            </div>
            {connected[item.id] ? (
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-brand" />
                <span className="text-xs text-brand">{t("sp_wearables_on")}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">{t("sp_wearables_connect")}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SettingsPage({ onBack }: { onBack?: () => void }) {
  const { t, locale, setLocale } = useTranslation()
  const { signOut, user } = useAuth()
  const router = useRouter()
  const [userSubscription, setUserSubscription] = useState<string>("free")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [adsEnabled, setAdsEnabled] = useState(true)
  const [isAdsLoading, setAdsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [profileData, setProfileData] = useState({
    age: null as number | null,
    weight: null as number | null,
    height: null as number | null,
    gender: null as string | null,
    fitness_goal: null as string | null,
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editProfileData, setEditProfileData] = useState({
    age: "", weight: "", height: "", gender: "", fitness_goal: "",
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem("notificationsEnabled")
      if (storedNotifications) setNotificationsEnabled(JSON.parse(storedNotifications))
    } catch (e) {
      logger.error("[SettingsPage] Failed to parse notificationsEnabled:", e)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const fetchProfile = async () => {
      try {
        const data = await findProfile(user.id, user.email)
        if (data) {
          setUserSubscription(data.plan || "free")
          setAdsEnabled(data.ads_enabled !== false)
          setIsAdmin(data.is_admin === true)
        }
      } catch (e) {
        logger.error("[SettingsPage] Failed to fetch profile:", e)
      }
    }
    fetchProfile()
  }, [user])

  useEffect(() => {
    if (user?.user_metadata?.is_admin === true) setIsAdmin(true)
  }, [user])

  useEffect(() => {
    if (!user?.id) return
    const loadProfile = async () => {
      try {
        const data = await findProfile(user.id, user.email)
        if (data) {
          setProfileData({ age: data.age, weight: data.weight, height: data.height, gender: data.gender, fitness_goal: data.fitness_goal })
        }
      } catch (e) {
        logger.error("[SettingsPage] Failed to load profile data:", e)
      }
    }
    loadProfile()
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSavingProfile(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          age: parseInt(editProfileData.age) || null,
          weight: parseFloat(editProfileData.weight) || null,
          height: parseFloat(editProfileData.height) || null,
          gender: editProfileData.gender || null,
          fitness_goal: editProfileData.fitness_goal || null,
        })
        .eq("id", user.id)
      if (!error) {
        setProfileData({
          age: parseInt(editProfileData.age) || null,
          weight: parseFloat(editProfileData.weight) || null,
          height: parseFloat(editProfileData.height) || null,
          gender: editProfileData.gender || null,
          fitness_goal: editProfileData.fitness_goal || null,
        })
        setIsEditingProfile(false)
        toast.success(t("settings_profile_saved") || "Perfil atualizado!")
      }
    } catch (error) {
      toast.error("Erro ao salvar")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleStartEditProfile = () => {
    setEditProfileData({
      age: profileData.age?.toString() || "",
      weight: profileData.weight?.toString() || "",
      height: profileData.height?.toString() || "",
      gender: profileData.gender || "",
      fitness_goal: profileData.fitness_goal || "",
    })
    setIsEditingProfile(true)
  }

  const getGoalLabel = (goal: string | null) => {
    if (!goal) return "—"
    const isEng = locale === "en-US"
    const labels: Record<string, { pt: string; en: string }> = {
      lose_weight: { pt: "Perder Peso", en: "Lose Weight" },
      gain_muscle: { pt: "Ganhar Massa", en: "Gain Muscle" },
      maintain: { pt: "Manter", en: "Maintain" },
      improve_health: { pt: "Melhorar Saude", en: "Improve Health" },
    }
    return labels[goal]?.[isEng ? "en" : "pt"] || goal
  }

  const getGenderLabel = (g: string | null) => {
    if (!g) return "—"
    const isEng = locale === "en-US"
    const labels: Record<string, { pt: string; en: string }> = {
      male: { pt: "Masculino", en: "Male" },
      female: { pt: "Feminino", en: "Female" },
      other: { pt: "Outro", en: "Other" },
    }
    return labels[g]?.[isEng ? "en" : "pt"] || g
  }

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
      await supabase.from("profiles").update({ ads_enabled: nextAdsEnabled }).eq("id", user?.id)
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
    await signOut()
  }

  const handleLanguageToggle = () => {
    setLocale(locale === "pt-BR" ? "en-US" : "pt-BR")
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl space-y-5 pb-safe-nav md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="ghost" size="icon" onClick={() => onBack?.()}
          className={cn("h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted", !onBack && "invisible")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{t("settings_title")}</h1>
      </div>

      {/* Status Cards */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Plan", value: userSubscription.toUpperCase(), icon: ShieldCheck },
          { label: "Ads", value: adsEnabled ? "ON" : "OFF", icon: Zap },
          { label: "Lang", value: locale === "pt-BR" ? "PT" : "EN", icon: Globe },
        ].map((item) => (
          <div key={item.label} className="rounded-xl glass-strong p-4 text-center">
            <item.icon className="mx-auto h-4 w-4 text-brand mb-2" />
            <p className="text-lg font-bold text-foreground">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </section>

      {/* Account */}
      <SettingsGroup icon={User} title={t("settings_account")}>
        <SettingRow icon={ShieldCheck} title={t("settings_premium")} description={t("settings_premium_desc")}>
          <div className="flex items-center gap-3">
            {userSubscription === "free" && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">
                {t("settings_upgrade_badge")}
              </span>
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

      {/* My Data */}
      <SettingsGroup icon={User} title={t("sp_my_data")}>
        {isEditingProfile ? (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("sp_age")}</label>
                <Input type="number" value={editProfileData.age} onChange={(e) => setEditProfileData({ ...editProfileData, age: e.target.value })} className="h-10 rounded-xl border-border bg-muted/50 text-sm" min={10} max={120} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("sp_weight_kg")}</label>
                <Input type="number" value={editProfileData.weight} onChange={(e) => setEditProfileData({ ...editProfileData, weight: e.target.value })} className="h-10 rounded-xl border-border bg-muted/50 text-sm" min={20} max={300} step={0.1} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("sp_height_cm")}</label>
                <Input type="number" value={editProfileData.height} onChange={(e) => setEditProfileData({ ...editProfileData, height: e.target.value })} className="h-10 rounded-xl border-border bg-muted/50 text-sm" min={100} max={250} step={0.1} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("sp_gender")}</label>
                <select value={editProfileData.gender} onChange={(e) => setEditProfileData({ ...editProfileData, gender: e.target.value })} className="flex h-10 w-full rounded-xl border border-border bg-muted/50 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/50">
                  <option value="">{t("sp_select")}</option>
                  <option value="male">{t("sp_male")}</option>
                  <option value="female">{t("sp_female")}</option>
                  <option value="other">{t("sp_other")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("sp_goal")}</label>
                <select value={editProfileData.fitness_goal} onChange={(e) => setEditProfileData({ ...editProfileData, fitness_goal: e.target.value })} className="flex h-10 w-full rounded-xl border border-border bg-muted/50 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/50">
                  <option value="">{t("sp_select")}</option>
                  <option value="lose_weight">{t("sp_lose_weight")}</option>
                  <option value="gain_muscle">{t("sp_gain_muscle")}</option>
                  <option value="maintain">{t("sp_maintain")}</option>
                  <option value="improve_health">{t("sp_improve_health")}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="h-10 flex-1 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand/90">
                {isSavingProfile ? "..." : t("sp_save")}
              </Button>
              <Button onClick={() => setIsEditingProfile(false)} variant="ghost" className="h-10 rounded-xl border border-border text-muted-foreground hover:bg-muted">
                {t("sp_cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <SettingRow icon={Calendar} title={t("sp_age")} description={profileData.age ? `${profileData.age} ${t("sp_years")}` : "—"}><div /></SettingRow>
            <SettingRow icon={Scale} title={t("sp_weight")} description={profileData.weight ? `${profileData.weight} kg` : "—"}><div /></SettingRow>
            <SettingRow icon={Ruler} title={t("sp_height")} description={profileData.height ? `${profileData.height} cm` : "—"}><div /></SettingRow>
            <SettingRow icon={User} title={t("sp_gender")} description={getGenderLabel(profileData.gender)}><div /></SettingRow>
            <SettingRow icon={Target} title={t("sp_goal")} description={getGoalLabel(profileData.fitness_goal)} isLast>
              <Button onClick={handleStartEditProfile} className="h-9 rounded-xl bg-muted px-4 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80">
                {t("sp_edit")}
              </Button>
            </SettingRow>
          </>
        )}
      </SettingsGroup>

      {/* Preferences */}
      <SettingsGroup icon={Zap} title={t("settings_prefs")}>
        <SettingRow icon={Sun} title={t("settings_theme")} description={t("settings_theme_desc_light")}>
          <Button variant="ghost" onClick={() => document.documentElement.classList.toggle("dark")} className="h-9 rounded-xl bg-muted px-4 text-xs font-medium text-muted-foreground hover:text-foreground">
            {t("settings_theme_btn")}
          </Button>
        </SettingRow>
        <SettingRow icon={Bell} title={t("settings_notifications")} description={t("settings_notifications_desc")} isLast>
          <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationsToggle} className="scale-110" />
        </SettingRow>
      </SettingsGroup>

      {/* Theme & Wearables */}
      <ThemeSection />
      <WearableSection />

      {/* Data */}
      <SettingsGroup icon={ShieldAlert} title={t("settings_data")}>
        <SettingRow icon={Trash2} title={t("settings_clear_cache")} description={t("settings_clear_cache_desc")}>
          <Button variant="ghost" onClick={handleClearCache} className="h-9 rounded-xl bg-destructive/10 px-4 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground">
            {t("settings_clear_btn")}
          </Button>
        </SettingRow>
        <SettingRow icon={Globe} title={t("settings_region")} description={t("settings_region_desc")} isLast>
          <button onClick={handleLanguageToggle} className="flex h-9 items-center gap-2 rounded-xl bg-muted px-3 text-xs text-muted-foreground transition hover:bg-muted/80">
            <span>{locale === "pt-BR" ? "PT-BR" : "EN-US"}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </SettingRow>
      </SettingsGroup>

      {isAdmin && (
        <SettingsGroup icon={ShieldCheck} title="Admin">
          <SettingRow icon={ShieldCheck} title="Admin Dashboard" description="Acessar painel administrativo" isLast>
            <Button variant="ghost" onClick={() => router.push("/admin-dashboard")} className="h-9 rounded-xl bg-muted px-4 text-xs font-medium text-muted-foreground hover:text-foreground">
              {t("sp_access")}
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </SettingRow>
        </SettingsGroup>
      )}

      <div className="space-y-4 pt-2">
        <Button variant="ghost" onClick={handleLogout} className="h-14 w-full rounded-2xl border border-destructive/20 bg-destructive/10 text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground">
          {t("settings_logout")}
          <LogOut className="ml-2 h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">{t("settings_version")}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{t("settings_copyright")}</p>
        </div>
      </div>
    </div>
  )
}
