"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera, X, ArrowLeft, ArrowRight, Trash2, ChevronLeft,
  Weight, Ruler, TrendingUp, TrendingDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface BodyPhoto {
  id: string
  url: string
  type: "front" | "side" | "back"
  date: string
}

interface BodyMetric {
  date: string
  weight?: number
  bodyFat?: number
  chest?: number
  waist?: number
  hips?: number
  arms?: number
}

interface EvolutionEntry {
  date: string
  photos: BodyPhoto[]
  metrics: BodyMetric
}

export function BodyEvolution() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [entries, setEntries] = useState<EvolutionEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<number>(0)
  const [showUpload, setShowUpload] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [compareIndex, setCompareIndex] = useState(1)
  const [sliderPos, setSliderPos] = useState(50)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bodyEvolution")
      if (saved) setEntries(JSON.parse(saved))
    } catch {}
  }, [])

  const saveEntries = useCallback((data: EvolutionEntry[]) => {
    localStorage.setItem("bodyEvolution", JSON.stringify(data))
    setEntries(data)
  }, [])

  const handlePhotoUpload = async (type: "front" | "side" | "back", file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const today = new Date().toISOString().split("T")[0]
      const photo: BodyPhoto = {
        id: Date.now().toString(),
        url: reader.result as string,
        type,
        date: today,
      }

      const existing = entries.find((e) => e.date === today)
      if (existing) {
        const updated = entries.map((e) => {
          if (e.date === today) {
            return { ...e, photos: [...e.photos.filter((p) => p.type !== type), photo] }
          }
          return e
        })
        saveEntries(updated)
      } else {
        saveEntries([{ date: today, photos: [photo], metrics: {} }, ...entries])
      }
    }
    reader.readAsDataURL(file)
  }

  const handleMetricSave = (date: string, metrics: BodyMetric) => {
    const updated = entries.map((e) =>
      e.date === date ? { ...e, metrics: { ...e.metrics, ...metrics } } : e
    )
    saveEntries(updated)
  }

  const deleteEntry = (date: string) => {
    saveEntries(entries.filter((e) => e.date !== date))
    setSelectedEntry(0)
  }

  const getTrend = (field: keyof BodyMetric) => {
    if (entries.length < 2) return null
    const current = entries[selectedEntry]?.metrics?.[field] as number | undefined
    const prev = entries[Math.min(selectedEntry + 1, entries.length - 1)]?.metrics?.[field] as number | undefined
    if (!current || !prev) return null
    return current - prev
  }

  const currentEntry = entries[selectedEntry]
  const compareEntry = entries[compareIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 via-transparent to-pink-500/4" />

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/20">
              <Camera className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">
                {isEnglish ? "Body Evolution" : "Evolucao Corporal"}
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground/50">
                {entries.length} {isEnglish ? "records" : "registros"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowUpload(!showUpload)}
            className="h-8 rounded-lg bg-purple-500/15 border border-purple-500/20 px-3 text-[9px] font-black uppercase tracking-widest text-purple-400 hover:bg-purple-500/25"
          >
            <Camera className="h-3 w-3 mr-1" />
            {isEnglish ? "New" : "Novo"}
          </Button>
        </div>

        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 p-4">
                <p className="text-xs font-bold text-foreground/50 mb-3">
                  {isEnglish ? "Take or select photos" : "Tire ou selecione fotos"}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(["front", "side", "back"] as const).map((type) => (
                    <label
                      key={type}
                      className="flex flex-col items-center gap-1 rounded-xl border border-purple-500/15 bg-black/30 p-3 cursor-pointer hover:bg-purple-500/10 transition-all"
                    >
                      <Camera className="h-5 w-5 text-purple-400/60" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-foreground/50">
                        {type === "front" ? (isEnglish ? "Front" : "Frente") : type === "side" ? (isEnglish ? "Side" : "Lado") : (isEnglish ? "Back" : "Costas")}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handlePhotoUpload(type, file)
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-purple-500/10 bg-black/20 p-8 text-center">
            <Camera className="mx-auto mb-3 h-10 w-10 text-purple-400/20" />
            <p className="text-sm font-bold text-foreground/50">
              {isEnglish ? "No photos yet. Start tracking your evolution!" : "Nenhuma foto ainda. Comece a acompanhar sua evolucao!"}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <Button
                onClick={() => setSelectedEntry(Math.min(selectedEntry + 1, entries.length - 1))}
                disabled={selectedEntry >= entries.length - 1}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
              <p className="text-sm font-black text-foreground">
                {new Date(currentEntry?.date || "").toLocaleDateString(isEnglish ? "en-US" : "pt-BR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <Button
                onClick={() => setSelectedEntry(Math.max(selectedEntry - 1, 0))}
                disabled={selectedEntry <= 0}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {currentEntry?.photos && currentEntry.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(["front", "side", "back"] as const).map((type) => {
                  const photo = currentEntry.photos.find((p) => p.type === type)
                  return (
                    <div key={type} className="aspect-[3/4] rounded-xl overflow-hidden border border-purple-500/10 bg-black/30 relative">
                      {photo ? (
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Camera className="h-6 w-6 text-purple-400/20" />
                        </div>
                      )}
                      <div className="absolute bottom-1 inset-x-0 text-center">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/50 bg-black/50 rounded-full px-2 py-0.5">
                          {type === "front" ? (isEnglish ? "Front" : "Frente") : type === "side" ? (isEnglish ? "Side" : "Lado") : (isEnglish ? "Back" : "Costas")}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-purple-500/10 bg-black/20 p-4 text-center mb-4">
                <p className="text-xs text-foreground/50">
                  {isEnglish ? "No photos for this date" : "Nenhuma foto para esta data"}
                </p>
              </div>
            )}

            {currentEntry?.metrics && Object.keys(currentEntry.metrics).length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: isEnglish ? "Weight" : "Peso", field: "weight", unit: "kg" },
                  { label: isEnglish ? "Body Fat" : "Gordura", field: "bodyFat", unit: "%" },
                  { label: isEnglish ? "Waist" : "Cintura", field: "waist", unit: "cm" },
                ].map(({ label, field, unit }) => {
                  const value = currentEntry.metrics[field as keyof BodyMetric] as number | undefined
                  const trend = getTrend(field as keyof BodyMetric)
                  return (
                    <div key={field} className="rounded-xl border border-purple-500/10 bg-black/30 p-3 text-center">
                      <p className="text-lg font-black text-foreground">{value ? `${value}` : "—"}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-foreground/50">{unit}</p>
                      {trend !== null && (
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          {trend > 0 ? (
                            <TrendingUp className="h-2.5 w-2.5 text-red-400" />
                          ) : trend < 0 ? (
                            <TrendingDown className="h-2.5 w-2.5 text-emerald-400" />
                          ) : null}
                          <span className={cn("text-[8px] font-bold", trend > 0 ? "text-red-400" : "text-emerald-400")}>
                            {trend > 0 ? "+" : ""}{trend.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {entries.length > 1 && (
              <Button
                onClick={() => deleteEntry(currentEntry.date)}
                variant="ghost"
                className="w-full h-8 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-400/50 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {isEnglish ? "Delete this entry" : "Excluir este registro"}
              </Button>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
