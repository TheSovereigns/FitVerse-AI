"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Heart, Activity, Footprints, Moon, Zap,
  Watch, Smartphone, Check, ExternalLink, RefreshCw,
  Shield, Clock, TrendingUp, Wifi, WifiOff, Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface Platform {
  id: string
  name: string
  icon: any
  color: string
  bgColor: string
  available: boolean
  description: string
  dataTypes: string[]
  website: string
}

export function HealthIntegrations() {
  const { t } = useTranslation()
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({})
  const [lastSync, setLastSync] = useState<Record<string, string>>({})
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wearableIntegrations")
      if (stored) setConnectedPlatforms(JSON.parse(stored))
      const syncData = localStorage.getItem("wearableLastSync")
      if (syncData) setLastSync(JSON.parse(syncData))
    } catch {}
  }, [])

  const toggleConnection = (platformId: string) => {
    const next = { ...connectedPlatforms, [platformId]: !connectedPlatforms[platformId] }
    if (!next[platformId]) {
      delete next[platformId]
      const syncNext = { ...lastSync }
      delete syncNext[platformId]
      setLastSync(syncNext)
      localStorage.setItem("wearableLastSync", JSON.stringify(syncNext))
    }
    setConnectedPlatforms(next)
    localStorage.setItem("wearableIntegrations", JSON.stringify(next))
  }

  const handleSync = async (platformId: string) => {
    setSyncing(platformId)
    await new Promise(r => setTimeout(r, 2000))
    const now = new Date().toISOString()
    const next = { ...lastSync, [platformId]: now }
    setLastSync(next)
    localStorage.setItem("wearableLastSync", JSON.stringify(next))
    setSyncing(null)
  }

  const platforms: Platform[] = [
    {
      id: "apple_health",
      name: "Apple Health",
      icon: Heart,
      color: "text-red-400",
      bgColor: "bg-red-500/10 border-red-500/20",
      available: false,
      description: t("hi_apple_desc"),
      dataTypes: ["heart_rate", "steps", "sleep", "spo2", "weight", "activity", "blood_pressure"],
      website: "https://developer.apple.com/healthkit/",
    },
    {
      id: "samsung_health",
      name: "Samsung Health",
      icon: Smartphone,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      available: false,
      description: t("hi_samsung_desc"),
      dataTypes: ["heart_rate", "steps", "sleep", "spo2", "weight", "stress", "blood_pressure"],
      website: "https://developer.samsung.com/health",
    },
    {
      id: "google_fit",
      name: "Google Fit",
      icon: Activity,
      color: "text-green-400",
      bgColor: "bg-green-500/10 border-green-500/20",
      available: true,
      description: t("hi_google_desc"),
      dataTypes: ["heart_rate", "steps", "sleep", "weight", "activity", "blood_pressure"],
      website: "https://developers.google.com/fit",
    },
    {
      id: "fitbit",
      name: "Fitbit",
      icon: Watch,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10 border-cyan-500/20",
      available: true,
      description: t("hi_fitbit_desc"),
      dataTypes: ["heart_rate", "steps", "sleep", "spo2", "weight", "activity", "breathing_rate"],
      website: "https://dev.fitbit.com",
    },
    {
      id: "garmin",
      name: "Garmin Connect",
      icon: TrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-600/10 border-blue-600/20",
      available: true,
      description: t("hi_garmin_desc"),
      dataTypes: ["heart_rate", "steps", "sleep", "spo2", "stress", "weight", "activity"],
      website: "https://developer.garmin.com",
    },
    {
      id: "whoop",
      name: "Whoop",
      icon: Zap,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10 border-yellow-500/20",
      available: true,
      description: t("hi_whoop_desc"),
      dataTypes: ["heart_rate", "sleep", "recovery", "strain", "activity"],
      website: "https://developer.whoop.com",
    },
    {
      id: "oura",
      name: "Oura Ring",
      icon: Moon,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/20",
      available: true,
      description: t("hi_oura_desc"),
      dataTypes: ["heart_rate", "sleep", "readiness", "activity", "weight"],
      website: "https://cloud.ouraring.com",
    },
  ]

  const connectedCount = Object.keys(connectedPlatforms).filter(k => connectedPlatforms[k]).length

  const formatLastSync = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return t("hi_just_now")
    if (diffMin < 60) return `${diffMin}min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h`
    return `${Math.floor(diffH / 24)}d`
  }

  const dataTypeLabels: Record<string, string> = {
    heart_rate: t("hi_dt_heart_rate"),
    steps: t("hi_dt_steps"),
    sleep: t("hi_dt_sleep"),
    spo2: t("hi_dt_spo2"),
    weight: t("hi_dt_weight"),
    activity: t("hi_dt_activity"),
    stress: t("hi_dt_stress"),
    blood_pressure: t("hi_dt_blood_pressure"),
    recovery: t("hi_dt_recovery"),
    strain: t("hi_dt_strain"),
    readiness: t("hi_dt_readiness"),
    "breathing_rate": t("hi_dt_breathing"),
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-32 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Heart className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">{t("hi_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("hi_subtitle")}</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-strong border border-border rounded-2xl p-4 text-center">
          <Wifi className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
          <p className="text-2xl font-black text-foreground">{connectedCount}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("hi_connected")}</p>
        </div>
        <div className="glass-strong border border-border rounded-2xl p-4 text-center">
          <Smartphone className="w-5 h-5 mx-auto mb-2 text-blue-400" />
          <p className="text-2xl font-black text-foreground">{platforms.length}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("hi_platforms")}</p>
        </div>
        <div className="glass-strong border border-border rounded-2xl p-4 text-center">
          <Clock className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
          <p className="text-2xl font-black text-foreground">
            {Object.keys(lastSync).length > 0
              ? formatLastSync(Object.values(lastSync).sort().pop()!)
              : "--"}
          </p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("hi_last_sync")}</p>
        </div>
      </div>

      {/* Platforms */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-widest opacity-30">{t("hi_available_platforms")}</h3>

        {platforms.map((platform, i) => {
          const isConnected = !!connectedPlatforms[platform.id]
          const platformLastSync = lastSync[platform.id]
          const isSyncing = syncing === platform.id
          const Icon = platform.icon

          return (
            <motion.div
              key={platform.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "glass-strong border rounded-2xl p-5 transition-all",
                isConnected ? "border-emerald-500/30" : "border-border"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", platform.bgColor)}>
                  <Icon className={cn("w-6 h-6", platform.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-bold text-foreground">{platform.name}</h4>
                    {isConnected && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px] font-black px-2 py-0.5 rounded-full">
                        {t("hi_status_connected")}
                      </Badge>
                    )}
                    {!platform.available && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-none text-[10px] font-black px-2 py-0.5 rounded-full">
                        {t("hi_coming_soon")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{platform.description}</p>

                  {/* Data Types */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {platform.dataTypes.map((dt) => (
                      <span
                        key={dt}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground"
                      >
                        {dataTypeLabels[dt] || dt}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {platform.available ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => toggleConnection(platform.id)}
                          className={cn(
                            "h-8 rounded-xl text-xs font-bold px-4",
                            isConnected
                              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              : "bg-brand text-brand-foreground hover:bg-brand/90"
                          )}
                        >
                          {isConnected ? (
                            <><Check className="w-3 h-3 mr-1" /> {t("hi_connected_btn")}</>
                          ) : (
                            t("hi_connect_btn")
                          )}
                        </Button>

                        {isConnected && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSync(platform.id)}
                            disabled={isSyncing}
                            className="h-8 rounded-xl text-xs font-bold px-3"
                          >
                            <RefreshCw className={cn("w-3 h-3 mr-1", isSyncing && "animate-spin")} />
                            {isSyncing ? t("hi_syncing") : t("hi_sync_now")}
                          </Button>
                        )}

                        {isConnected && platformLastSync && (
                          <span className="text-[10px] text-muted-foreground">
                            {t("hi_synced_ago").replace("{time}", formatLastSync(platformLastSync))}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-xs text-yellow-400 font-bold">{t("hi_requires_native_app")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-strong border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-brand" />
          <h3 className="text-sm font-black uppercase tracking-wider">{t("hi_how_it_works")}</h3>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand/20 text-brand text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
            <p>{t("hi_step_1")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand/20 text-brand text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
            <p>{t("hi_step_2")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand/20 text-brand text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
            <p>{t("hi_step_3")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand/20 text-brand text-xs font-black flex items-center justify-center shrink-0 mt-0.5">4</span>
            <p>{t("hi_step_4")}</p>
          </div>
        </div>
      </motion.div>

      {/* Apple Health & Samsung Coming Soon Detail */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-yellow-400">{t("hi_native_coming_soon")}</h3>
            <p className="text-xs text-muted-foreground">{t("hi_native_desc")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-foreground/5 border border-foreground/10">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-xs font-black">Apple Health</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("hi_apple_detail")}</p>
          </div>
          <div className="p-3 rounded-xl bg-foreground/5 border border-foreground/10">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-black">Samsung Health</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("hi_samsung_detail")}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
