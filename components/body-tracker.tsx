"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { notifications } from "@/lib/notifications"
import { exportMeasurementsCSV } from "@/lib/export-data"
import { Ruler, TrendingDown, TrendingUp, Download, Plus, X } from "lucide-react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Measurement {
  date: string
  weight?: number
  bodyFat?: number
  chest?: number
  waist?: number
  hips?: number
  arms?: number
  thighs?: number
}

export function BodyTracker() {
  const { t } = useTranslation()
  const [measurements, setMeasurements] = useLocalStorage<Measurement[]>("fitverse-measurements", [])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<Measurement>>({})

  const latestMeasurement = measurements[0]
  const previousMeasurement = measurements[1]

  const getTrend = (current?: number, previous?: number) => {
    if (!current || !previous) return null
    const diff = current - previous
    return { value: Math.abs(diff), direction: diff > 0 ? "up" : diff < 0 ? "down" : "same" }
  }

  const weightTrend = getTrend(latestMeasurement?.weight, previousMeasurement?.weight)
  const bodyFatTrend = getTrend(latestMeasurement?.bodyFat, previousMeasurement?.bodyFat)

  const handleSave = () => {
    if (!formData.weight && !formData.bodyFat) {
      notifications.error("Insira pelo menos o peso")
      return
    }
    const newMeasurement: Measurement = {
      date: new Date().toISOString(),
      ...formData,
    }
    setMeasurements([newMeasurement, ...measurements])
    setFormData({})
    setShowForm(false)
    notifications.success("Medidas salvas!")
  }

  const handleDelete = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index))
    notifications.info("Medida removida")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Medidas Corporais</h2>
        <div className="flex gap-2">
          {measurements.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportMeasurementsCSV(measurements)}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              CSV
            </Button>
          )}
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="rounded-xl">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Peso (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    value={formData.weight || ""}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Gordura (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="15.0"
                    value={formData.bodyFat || ""}
                    onChange={(e) => setFormData({ ...formData, bodyFat: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Peito (cm)</label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="100"
                    value={formData.chest || ""}
                    onChange={(e) => setFormData({ ...formData, chest: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cintura (cm)</label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="80"
                    value={formData.waist || ""}
                    onChange={(e) => setFormData({ ...formData, waist: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quadril (cm)</label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="95"
                    value={formData.hips || ""}
                    onChange={(e) => setFormData({ ...formData, hips: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Braços (cm)</label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="35"
                    value={formData.arms || ""}
                    onChange={(e) => setFormData({ ...formData, arms: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full rounded-xl">
                Salvar Medidas
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {measurements.length === 0 ? (
        <EmptyState
          icon={<Ruler className="w-8 h-8 text-muted-foreground" />}
          title="Nenhuma medida registrada"
          description="Comece registrando suas medidas para acompanhar sua evolução corporal."
          action={
            <Button onClick={() => setShowForm(true)} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Primeira Medida
            </Button>
          }
        />
      ) : (
        <>
          {latestMeasurement && (
            <div className="grid grid-cols-2 gap-3">
              {latestMeasurement.weight && (
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold">{latestMeasurement.weight}</span>
                      <span className="text-xs text-muted-foreground">kg</span>
                      {weightTrend && (
                        <span className={`text-xs ${weightTrend.direction === "down" ? "text-success" : "text-destructive"}`}>
                          {weightTrend.direction === "down" ? "↓" : "↑"}{weightTrend.value.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              {latestMeasurement.bodyFat && (
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Gordura</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold">{latestMeasurement.bodyFat}</span>
                      <span className="text-xs text-muted-foreground">%</span>
                      {bodyFatTrend && (
                        <span className={`text-xs ${bodyFatTrend.direction === "down" ? "text-success" : "text-destructive"}`}>
                          {bodyFatTrend.direction === "down" ? "↓" : "↑"}{bodyFatTrend.value.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="space-y-2">
            {measurements.slice(0, 10).map((m, i) => (
              <motion.div
                key={m.date}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{format(new Date(m.date), "dd MMM", { locale: ptBR })}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.weight ? `${m.weight}kg` : ""}
                        {m.weight && m.bodyFat ? " · " : ""}
                        {m.bodyFat ? `${m.bodyFat}%` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(i)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
