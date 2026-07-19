"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { DailyActivity, MetabolicPlan } from "@/lib/types"

interface ExportData {
  dailyActivity?: DailyActivity
  metabolicPlan?: MetabolicPlan | null
  scanHistory?: Array<{ name: string; score: number; scannedAt: string }>
  habits?: Array<{ name: string; completedDates: string[] }>
  sleep?: Array<{ date: string; hours: number; quality: string }>
  measurements?: Array<{ date: string; weight?: number; bodyFat?: number; chest?: number; waist?: number; hips?: number }>
}

function generateCSV(data: Record<string, unknown>[], headers: string[]): string {
  const headerRow = headers.join(",")
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h]
      return typeof val === "string" && val.includes(",") ? `"${val}"` : String(val ?? "")
    }).join(",")
  )
  return [headerRow, ...rows].join("\n")
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportActivityCSV(data: ExportData) {
  const rows = (data.scanHistory || []).map((s) => ({
    Data: format(new Date(s.scannedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    Produto: s.name,
    Score: s.score,
  }))
  const csv = generateCSV(rows, ["Data", "Produto", "Score"])
  downloadFile(csv, `fitverse-activity-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv")
}

export function exportMeasurementsCSV(measurements: ExportData["measurements"]) {
  if (!measurements?.length) return
  const rows = measurements.map((m) => ({
    Data: format(new Date(m.date), "dd/MM/yyyy"),
    Peso: m.weight ?? "",
    "Gordura %": m.bodyFat ?? "",
    Peito: m.chest ?? "",
    Cintura: m.waist ?? "",
    Quadril: m.hips ?? "",
  }))
  const csv = generateCSV(rows, ["Data", "Peso", "Gordura %", "Peito", "Cintura", "Quadril"])
  downloadFile(csv, `fitverse-measurements-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv")
}

export function exportAllDataJSON(data: ExportData) {
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, `fitverse-full-export-${format(new Date(), "yyyy-MM-dd")}.json`, "application/json")
}

export function exportPlanPDF(plan: MetabolicPlan) {
  const content = `
FITVERSE AI - PLANO METABÓLICO
================================

CALORIAS: ${plan.calories || plan.macros?.calories || 0} kcal
PROTEÍNA: ${plan.protein || plan.macros?.protein || 0}g
CARBOIDRATOS: ${plan.carbs || plan.macros?.carbs || 0}g
GORDURA: ${plan.fat || plan.macros?.fat || 0}g

OBJETIVO: ${plan.goal || "Não definido"}

${plan.mealPlan ? `
PLANO DE REFEIÇÕES:
${plan.mealPlan.map((m) => `\n${m.name}:\n${m.foods.map((f) => `  - ${f}`).join("\n")}`).join("\n")}` : ""}

---
Gerado por FitVerse AI em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
  `.trim()

  downloadFile(content, `fitverse-plan-${format(new Date(), "yyyy-MM-dd")}.txt`, "text/plain")
}
