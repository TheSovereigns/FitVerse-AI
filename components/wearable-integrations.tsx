"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Watch, Smartphone, Activity, Footprints, Moon as MoonIcon,
  Heart, Zap, Check, Loader2, Unplug, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
  const { t, locale } = useTranslation()
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
    } catch {}
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/6 via-transparent to-blue-500/4" />

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/20">
              <Watch className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">
                {isEnglish ? "Wearables" : "Wearables"}
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
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
              className="h-8 w-8 rounded-lg border border-cyan-500/14 bg-cyan-500/8"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 text-cyan-400", isSyncing && "animate-spin")} />
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
                className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3 hover:bg-cyan-500/5 transition-all"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/12">
                  <Icon className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-black text-foreground">{integration.name}</p>
                </div>
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                ) : integration.connected ? (
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      {isEnglish ? "On" : "Ligado"}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
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
              { icon: Footprints, value: wearableData.steps.toLocaleString(), label: isEnglish ? "Steps" : "Passos", color: "text-cyan-400" },
              { icon: Zap, value: `${wearableData.calories}`, label: "KCAL", color: "text-foreground/60" },
              { icon: Heart, value: `${wearableData.heartRate}`, label: isEnglish ? "BPM" : "BPM", color: "text-red-400" },
              { icon: MoonIcon, value: `${wearableData.sleepHours}h`, label: isEnglish ? "Sleep" : "Sono", color: "text-purple-400" },
              { icon: Activity, value: `${wearableData.activeMinutes}m`, label: isEnglish ? "Active" : "Ativo", color: "text-emerald-400" },
              { icon: Zap, value: `${wearableData.distance}km`, label: isEnglish ? "Distance" : "Distancia", color: "text-blue-400" },
            ].map(({ icon: ItemIcon, value, label, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/10 bg-black/30 p-3 text-center"
              >
                <ItemIcon className={cn("h-4 w-4 mx-auto mb-1", color)} />
                <p className="text-base font-black text-foreground">{value}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-foreground/30">{label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {wearableData && (
          <p className="text-[9px] text-center text-foreground/20 mt-3">
            {isEnglish ? "Last sync:" : "Ultimo sync:"} {new Date(wearableData.lastSync).toLocaleTimeString(isEnglish ? "en-US" : "pt-BR")}
          </p>
        )}
      </div>
    </motion.div>
  )
}
