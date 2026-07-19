"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Download, Upload, FileJson, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import { useAppStore } from "@/stores/app-store"

export function DataExportImport() {
  const { t } = useTranslation()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const { scanHistory, dailyActivity, userMetabolicPlan } = useAppStore()

  const handleExport = useCallback(() => {
    setIsExporting(true)
    try {
      const data = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        scanHistory,
        dailyActivity,
        userMetabolicPlan,
        wearableIntegrations: JSON.parse(localStorage.getItem("wearableIntegrations") || "{}"),
        locale: localStorage.getItem("fitverse-locale") || "pt-BR",
        accent: localStorage.getItem("fitverse-accent") || "orange",
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fitverse-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(t("export_success") || "Dados exportados com sucesso!")
    } catch {
      toast.error(t("export_error") || "Erro ao exportar dados")
    } finally {
      setIsExporting(false)
    }
  }, [scanHistory, dailyActivity, userMetabolicPlan, t])

  const handleImport = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsImporting(true)
      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (data.scanHistory) {
          useAppStore.getState().setScanHistory(data.scanHistory)
        }
        if (data.dailyActivity) {
          useAppStore.getState().setDailyActivity(data.dailyActivity)
        }
        if (data.userMetabolicPlan) {
          useAppStore.getState().setUserMetabolicPlan(data.userMetabolicPlan)
        }
        if (data.wearableIntegrations) {
          localStorage.setItem("wearableIntegrations", JSON.stringify(data.wearableIntegrations))
        }
        if (data.locale) {
          localStorage.setItem("fitverse-locale", data.locale)
        }
        if (data.accent) {
          localStorage.setItem("fitverse-accent", data.accent)
        }

        toast.success(t("import_success") || "Dados importados com sucesso! Recarregando...")
        setTimeout(() => window.location.reload(), 1500)
      } catch {
        toast.error(t("import_error") || "Erro ao importar dados. Verifique o arquivo.")
      } finally {
        setIsImporting(false)
      }
    }
    input.click()
  }, [t])

  return (
    <div className="flex gap-3">
      <Button
        onClick={handleExport}
        disabled={isExporting}
        variant="ghost"
        className="h-11 rounded-2xl border border-border bg-muted px-5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {t("export_btn") || "Exportar"}
      </Button>
      <Button
        onClick={handleImport}
        disabled={isImporting}
        variant="ghost"
        className="h-11 rounded-2xl border border-border bg-muted px-5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        {isImporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        {t("import_btn") || "Importar"}
      </Button>
    </div>
  )
}
