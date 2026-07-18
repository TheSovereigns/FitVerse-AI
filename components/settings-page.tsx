"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "./switch"
import { supabase } from "@/lib/supabase"
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
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/hooks/useAuth"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { WearableIntegrations } from "@/components/wearable-integrations"

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
      "flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-5",
      !isLast && "border-b border-border"
    )}
  >
    <div className="flex min-w-0 items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h4 className="text-base font-semibold leading-tight text-foreground md:text-lg">{title}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="flex shrink-0 items-center justify-end gap-3">{children}</div>
  </div>
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

  const [profileData, setProfileData] = useState({
    age: null as number | null,
    weight: null as number | null,
    height: null as number | null,
    gender: null as string | null,
    fitness_goal: null as string | null,
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editProfileData, setEditProfileData] = useState({
    age: "",
    weight: "",
    height: "",
    gender: "",
    fitness_goal: "",
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)

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

  useEffect(() => {
    if (!user?.id) return
    const loadProfileData = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("age, weight, height, gender, fitness_goal")
        .eq("id", user.id)
        .single()
      if (data) {
        setProfileData({
          age: data.age,
          weight: data.weight,
          height: data.height,
          gender: data.gender,
          fitness_goal: data.fitness_goal,
        })
      }
    }
    loadProfileData()
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
      console.error("Error updating profile:", error)
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
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-card border border-border p-5 text-center md:rounded-[2.5rem] md:p-7"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onBack?.()}
            className={cn(
              "h-11 w-11 rounded-2xl border border-border text-muted-foreground hover:bg-accent",
              !onBack && "invisible"
            )}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Badge className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            Control Center
          </Badge>
          <div className="h-11 w-11" />
        </div>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground md:h-20 md:w-20">
          <Smartphone className="h-7 w-7 md:h-9 md:w-9" />
        </div>
        <h1 className="text-3xl font-bold leading-none tracking-tight text-foreground md:text-5xl">
          {t("settings_title")}<span className="text-primary">{t("settings_accent")}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-xs text-muted-foreground md:text-sm">
          {t("settings_subtitle")}
        </p>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Plan", value: userSubscription.toUpperCase(), icon: ShieldCheck },
          { label: "Ads", value: adsEnabled ? "ON" : "OFF", icon: Zap },
          { label: "Lang", value: locale === "pt-BR" ? "PT-BR" : "EN-US", icon: Globe },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </section>

      <SettingsGroup icon={User} title={t("settings_account")}>
        <SettingRow icon={ShieldCheck} title={t("settings_premium")} description={t("settings_premium_desc")}>
          <div className="flex items-center gap-3">
            {userSubscription === "free" && (
              <Badge className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
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

      <SettingsGroup icon={User} title={locale === "en-US" ? "My Data" : "Meus Dados"}>
        {isEditingProfile ? (
          <div className="p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  {locale === "en-US" ? "Age" : "Idade"}
                </label>
                <Input
                  type="number"
                  value={editProfileData.age}
                  onChange={(e) => setEditProfileData({ ...editProfileData, age: e.target.value })}
                  className="h-12 rounded-xl border-border bg-background text-foreground"
                  min={10}
                  max={120}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  {locale === "en-US" ? "Weight (kg)" : "Peso (kg)"}
                </label>
                <Input
                  type="number"
                  value={editProfileData.weight}
                  onChange={(e) => setEditProfileData({ ...editProfileData, weight: e.target.value })}
                  className="h-12 rounded-xl border-border bg-background text-foreground"
                  min={20}
                  max={300}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  {locale === "en-US" ? "Height (cm)" : "Altura (cm)"}
                </label>
                <Input
                  type="number"
                  value={editProfileData.height}
                  onChange={(e) => setEditProfileData({ ...editProfileData, height: e.target.value })}
                  className="h-12 rounded-xl border-border bg-background text-foreground"
                  min={100}
                  max={250}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  {locale === "en-US" ? "Gender" : "Genero"}
                </label>
                <select
                  value={editProfileData.gender}
                  onChange={(e) => setEditProfileData({ ...editProfileData, gender: e.target.value })}
                  className="flex h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">{locale === "en-US" ? "Select" : "Selecionar"}</option>
                  <option value="male">{locale === "en-US" ? "Male" : "Masculino"}</option>
                  <option value="female">{locale === "en-US" ? "Female" : "Feminino"}</option>
                  <option value="other">{locale === "en-US" ? "Other" : "Outro"}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  {locale === "en-US" ? "Goal" : "Objetivo"}
                </label>
                <select
                  value={editProfileData.fitness_goal}
                  onChange={(e) => setEditProfileData({ ...editProfileData, fitness_goal: e.target.value })}
                  className="flex h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">{locale === "en-US" ? "Select" : "Selecionar"}</option>
                  <option value="lose_weight">{locale === "en-US" ? "Lose Weight" : "Perder Peso"}</option>
                  <option value="gain_muscle">{locale === "en-US" ? "Gain Muscle" : "Ganhar Massa"}</option>
                  <option value="maintain">{locale === "en-US" ? "Maintain" : "Manter"}</option>
                  <option value="improve_health">{locale === "en-US" ? "Improve Health" : "Melhorar Saude"}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="h-12 flex-1 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {isSavingProfile ? "..." : locale === "en-US" ? "Save" : "Salvar"}
              </Button>
              <Button
                onClick={() => setIsEditingProfile(false)}
                variant="ghost"
                className="h-12 rounded-2xl border border-border text-muted-foreground hover:bg-accent"
              >
                {locale === "en-US" ? "Cancel" : "Cancelar"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <SettingRow icon={Calendar} title={locale === "en-US" ? "Age" : "Idade"} description={profileData.age ? `${profileData.age} ${locale === "en-US" ? "years" : "anos"}` : "—"}>
              <div />
            </SettingRow>
            <SettingRow icon={Scale} title={locale === "en-US" ? "Weight" : "Peso"} description={profileData.weight ? `${profileData.weight} kg` : "—"}>
              <div />
            </SettingRow>
            <SettingRow icon={Ruler} title={locale === "en-US" ? "Height" : "Altura"} description={profileData.height ? `${profileData.height} cm` : "—"}>
              <div />
            </SettingRow>
            <SettingRow icon={User} title={locale === "en-US" ? "Gender" : "Genero"} description={getGenderLabel(profileData.gender)}>
              <div />
            </SettingRow>
            <SettingRow icon={Target} title={locale === "en-US" ? "Goal" : "Objetivo"} description={getGoalLabel(profileData.fitness_goal)} isLast>
              <Button
                onClick={handleStartEditProfile}
                className="h-11 rounded-2xl border border-border bg-muted px-5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {locale === "en-US" ? "Edit" : "Editar"}
              </Button>
            </SettingRow>
          </>
        )}
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
            className="h-11 rounded-2xl border border-border bg-muted px-5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {t("settings_theme_btn")}
          </Button>
        </SettingRow>
        <SettingRow icon={Bell} title={t("settings_notifications")} description={t("settings_notifications_desc")} isLast>
          <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationsToggle} className="scale-110" />
        </SettingRow>
      </SettingsGroup>

      <ThemeCustomizer />

      <WearableIntegrations />

      <SettingsGroup icon={ShieldAlert} title={t("settings_data")}>
        <SettingRow icon={Trash2} title={t("settings_clear_cache")} description={t("settings_clear_cache_desc")}>
          <Button
            variant="ghost"
            onClick={handleClearCache}
            className="h-11 rounded-2xl border border-destructive/20 bg-destructive/10 px-5 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            {t("settings_clear_btn")}
          </Button>
        </SettingRow>
        <SettingRow icon={Globe} title={t("settings_region")} description={t("settings_region_desc")} isLast>
          <button
            onClick={handleLanguageToggle}
            className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-muted px-4 text-xs text-muted-foreground transition hover:bg-accent"
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
              className="h-11 rounded-2xl border border-border bg-muted px-5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
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
          className="h-16 w-full rounded-2xl border border-destructive/20 bg-destructive/10 text-base font-semibold uppercase tracking-wider text-destructive hover:bg-destructive hover:text-destructive-foreground md:h-[4.5rem]"
        >
          {t("settings_logout")}
          <LogOut className="ml-3 h-5 w-5" />
        </Button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">{t("settings_version")}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t("settings_copyright")}</p>
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
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {children}
      </div>
    </section>
  )
}