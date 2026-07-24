"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ruler, TrendingUp, TrendingDown, Trash2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Measurement {
  date: string
  weight?: number
  chest?: number
  waist?: number
  hips?: number
  arms?: number
  thighs?: number
}

const STORAGE_KEY = "fitverse-body-measurements"

export function BodyEvolution() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<Measurement>>({})
  const [selectedField, setSelectedField] = useState<keyof Measurement>("weight")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setMeasurements(JSON.parse(saved))
    } catch (e) {
      logger.error("[BodyEvolution] Failed to parse measurements:", e)
    }
  }, [])

  const saveMeasurements = useCallback((data: Measurement[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setMeasurements(data)
  }, [])

  const handleSave = () => {
    if (!formData.weight) return
    const newMeasurement: Measurement = {
      date: new Date().toISOString(),
      weight: formData.weight ? Number(formData.weight) : undefined,
      chest: formData.chest ? Number(formData.chest) : undefined,
      waist: formData.waist ? Number(formData.waist) : undefined,
      hips: formData.hips ? Number(formData.hips) : undefined,
      arms: formData.arms ? Number(formData.arms) : undefined,
      thighs: formData.thighs ? Number(formData.thighs) : undefined,
    }
    saveMeasurements([newMeasurement, ...measurements])
    setFormData({})
    setShowForm(false)
  }

  const handleDelete = (index: number) => {
    const updated = measurements.filter((_, i) => i !== index)
    saveMeasurements(updated)
  }

  const chartData = useMemo(() => {
    return [...measurements]
      .reverse()
      .map((m) => ({
        date: format(new Date(m.date), "dd/MM", { locale: isEnglish ? undefined : ptBR }),
        [selectedField]: m[selectedField] ?? null,
      }))
  }, [measurements, selectedField])

  const latest = measurements[0]
  const previous = measurements[1]

  const getTrend = (current?: number, prev?: number) => {
    if (!current || !prev) return null
    const diff = current - prev
    return { value: Math.abs(diff), direction: diff > 0 ? "up" : diff < 0 ? "down" : "same" }
  }

  const weightTrend = getTrend(latest?.weight, previous?.weight)

  const fields: { key: keyof Measurement; label: string; unit: string }[] = [
    { key: "weight", label: isEnglish ? "Weight" : "Peso", unit: "kg" },
    { key: "chest", label: isEnglish ? "Chest" : "Peito", unit: "cm" },
    { key: "waist", label: isEnglish ? "Waist" : "Cintura", unit: "cm" },
    { key: "hips", label: isEnglish ? "Hips" : "Quadril", unit: "cm" },
    { key: "arms", label: isEnglish ? "Arms" : "Bracos", unit: "cm" },
    { key: "thighs", label: isEnglish ? "Thighs" : "Coxas", unit: "cm" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong border border-border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted">
            <Ruler className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isEnglish ? "Body Evolution" : "Evolucao Corporal"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {measurements.length} {isEnglish ? "measurements" : "registros"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="h-8 rounded-lg bg-brand-muted border border-border px-3 text-xs font-medium text-brand hover:bg-brand/20"
        >
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3 mr-1" />}
          {showForm ? (isEnglish ? "Close" : "Fechar") : (isEnglish ? "New" : "Novo")}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">
                {isEnglish ? "Log today's measurements" : "Registrar medidas de hoje"}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {fields.map(({ key, label, unit }) => (
                  <div key={key}>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                      {label} ({unit})
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={unit}
                      value={(formData[key] as number) ?? ""}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value ? Number(e.target.value) : undefined })}
                      className="h-8 rounded-lg text-xs bg-background border-border"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={handleSave}
                disabled={!formData.weight}
                className="w-full h-9 rounded-xl text-xs font-medium bg-brand hover:bg-brand/90 text-white disabled:opacity-50"
              >
                {isEnglish ? "Save Measurements" : "Salvar Medidas"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {latest && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {fields.slice(0, 3).map(({ key, label, unit }) => {
            const value = latest[key] as number | undefined
            const trend = getTrend(latest[key] as number | undefined, previous?.[key] as number | undefined)
            return (
              <div key={key} className="text-center p-2 rounded-xl bg-muted/50">
                <p className="text-lg font-bold text-foreground">{value ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">{unit}</p>
                {trend && (
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {trend.direction === "up" ? (
                      <TrendingUp className="h-2.5 w-2.5 text-red-500" />
                    ) : trend.direction === "down" ? (
                      <TrendingDown className="h-2.5 w-2.5 text-emerald-500" />
                    ) : null}
                    <span className={cn("text-[10px] font-medium", trend.direction === "up" ? "text-red-500" : "text-emerald-500")}>
                      {trend.direction === "up" ? "+" : "-"}{trend.value.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {measurements.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {isEnglish ? "Trends" : "Tendencias"}
            </span>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value as keyof Measurement)}
              className="text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground"
            >
              {fields.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(value: number) => [`${value}`, fields.find((f) => f.key === selectedField)?.label]}
                />
                <Line
                  type="monotone"
                  dataKey={selectedField}
                  stroke="hsl(var(--brand))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--brand))" }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {measurements.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            {isEnglish ? "Measurement History" : "Historico de Medidas"}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">{isEnglish ? "Date" : "Data"}</th>
                  {fields.map(({ key, label, unit }) => (
                    <th key={key} className="text-right py-2 text-muted-foreground font-medium">
                      {label} ({unit})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {measurements.map((m, i) => (
                  <tr key={m.date} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 text-foreground">
                      {format(new Date(m.date), "dd/MM/yyyy")}
                    </td>
                    {fields.map(({ key }) => (
                      <td key={key} className="text-right py-2 text-foreground">
                        {(m[key] as number) ?? "—"}
                      </td>
                    ))}
                    <td className="text-right py-2">
                      <button
                        onClick={() => handleDelete(i)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {measurements.length === 0 && !showForm && (
        <div className="rounded-xl border border-border bg-muted/20 p-8 text-center">
          <Ruler className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            {isEnglish ? "No measurements yet. Start tracking your body evolution!" : "Nenhuma medida ainda. Comece a acompanhar sua evolucao corporal!"}
          </p>
        </div>
      )}
    </motion.div>
  )
}
