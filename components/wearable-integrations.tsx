"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Watch, Activity, Footprints, Moon as MoonIcon,
  Heart, Zap, Check, Loader2, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { useTranslation } from "@/lib/i18n"

interface WearableData {
  steps: number
  calories: number
  heartRate: number
  sleepHours: number
  distance: number
  activeMinutes: number
  lastSync: string
}

interface WearableIntegration {
  id: string
  name: string
  icon: any
  connected: boolean
}

export function WearableIntegrations() {
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [integrations, setIntegrations] = useState<WearableIntegration[]>([
    { id: "google_fit", name: "Google Fit", icon: Activity, connected: false },
    { id: "apple_health", name: "Apple Health", icon: Heart, connected: false },
    { id: "fitbit", name: "Fitbit", icon: Watch, connected: false },
  ])
  const [wearableData, setWearableData] = useState<WearableData | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wearableIntegrations")
      if (saved) setIntegrations(JSON.parse(saved))
      const data = localStorage.getItem("wearableData")
      if (data) setWearableData(JSON.parse(data))
    } catch (e) {
      logger.error("[WearableIntegrations] Failed to parse wearable data:", e)
    }
  }, [])

  const toggleConnection = async (id: string) => {
    setIsSyncing(true)
    await new Promise((r) => setTimeout(r, 1500))

    const updated = integrations.map((i) =>
      i.id === id ? { ...i, connected: !i.connected } : i
    )
    setIntegrations(updated)
    localStorage.setItem("wearableIntegrations", JSON.stringify(updated))

    if (updated.some((i) => i.connected)) {
      const mockData: WearableData = {
        steps: Math.floor(Math.random() * 5000) + 3000,
        calories: Math.floor(Math.random() * 300) + 200,
        heartRate: Math.floor(Math.random() * 20) + 60,
        sleepHours: Math.round((Math.random() * 2 + 5.5) * 10) / 10,
        distance: Math.round((Math.random() * 3 + 1.5) * 10) / 10,
        activeMinutes: Math.floor(Math.random() * 40) + 20,
        lastSync: new Date().toISOString(),
      }
      setWearableData(mockData)
      localStorage.setItem("wearableData", JSON.stringify(mockData))
    } else {
      setWearableData(null)
      localStorage.removeItem("wearableData")
    }
    setIsSyncing(false)
  }

  const syncData = async () => {
    setIsSyncing(true)
    await new Promise((r) => setTimeout(r, 1500))
    if (wearableData) {
      const updated = {
        ...wearableData,
        steps: wearableData.steps + Math.floor(Math.random() * 500),
        calories: wearableData.calories + Math.floor(Math.random() * 50),
        lastSync: new Date().toISOString(),
      }
      setWearableData(updated)
      localStorage.setItem("wearableData", JSON.stringify(updated))
    }
    setIsSyncing(false)
  }

  const anyConnected = integrations.some((i) => i.connected)

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <Watch className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isEnglish ? "Wearables" : "Wearables"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {anyConnected ? (isEnglish ? "Connected" : "Conectado") : (isEnglish ? "Not connected" : "Nao conectado")}
            </p>
          </div>
        </div>
        {anyConnected && (
          <Button
            onClick={syncData}
            disabled={isSyncing}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg border border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", isSyncing && "animate-spin")} />
          </Button>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {integrations.map((integration) => {
          const Icon = integration.icon
          return (
            <button
              key={integration.id}
              onClick={() => toggleConnection(integration.id)}
              disabled={isSyncing}
              className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3 hover:bg-accent transition-all"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{integration.name}</p>
              </div>
              {isSyncing ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              ) : integration.connected ? (
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs text-green-500">
                    {isEnglish ? "On" : "Ligado"}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {isEnglish ? "Connect" : "Conectar"}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {wearableData && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Footprints, value: wearableData.steps.toLocaleString(), label: isEnglish ? "Steps" : "Passos" },
            { icon: Zap, value: `${wearableData.calories}`, label: "KCAL" },
            { icon: Heart, value: `${wearableData.heartRate}`, label: "BPM" },
            { icon: MoonIcon, value: `${wearableData.sleepHours}h`, label: isEnglish ? "Sleep" : "Sono" },
            { icon: Activity, value: `${wearableData.activeMinutes}m`, label: isEnglish ? "Active" : "Ativo" },
            { icon: Zap, value: `${wearableData.distance}km`, label: isEnglish ? "Distance" : "Distancia" },
          ].map(({ icon: ItemIcon, value, label }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-muted/50 p-3 text-center"
            >
              <ItemIcon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-base font-semibold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {wearableData && (
        <p className="text-[10px] text-center text-muted-foreground mt-3">
          {isEnglish ? "Last sync:" : "Ultimo sync:"} {new Date(wearableData.lastSync).toLocaleTimeString(isEnglish ? "en-US" : "pt-BR")}
        </p>
      )}
    </div>
  )
}