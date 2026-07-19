"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, Search, X, Loader2, ExternalLink } from "lucide-react"
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner"
import { useTranslation } from "@/lib/i18n"

export function BarcodeScanner() {
  const { t } = useTranslation()
  const { isScanning, lastResult, error, lookupBarcode, setLastResult } = useBarcodeScanner()
  const [manualCode, setManualCode] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setShowManualInput(true)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const handleManualLookup = useCallback(() => {
    if (manualCode.trim()) {
      lookupBarcode(manualCode.trim())
      setManualCode("")
    }
  }, [manualCode, lookupBarcode])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualLookup()
    }
  }, [handleManualLookup])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={startCamera}
          className="h-12 flex-1 rounded-xl bg-primary text-primary-foreground"
        >
          <Camera className="h-5 w-5 mr-2" />
          {t("barcode_scan_camera") || "Escanear com Camera"}
        </Button>
        <Button
          onClick={() => setShowManualInput(!showManualInput)}
          variant="ghost"
          className="h-12 rounded-xl border border-border bg-muted text-muted-foreground"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {showManualInput && (
        <div className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("barcode_manual_placeholder") || "Digite o codigo de barras..."}
            className="h-12 rounded-xl border-border bg-background text-foreground"
            disabled={isScanning}
          />
          <Button
            onClick={handleManualLookup}
            disabled={!manualCode.trim() || isScanning}
            className="h-12 rounded-xl bg-primary text-primary-foreground"
          >
            {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </Button>
        </div>
      )}

      {streamRef.current && (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <video ref={videoRef} className="w-full h-64 object-cover" />
          <Button
            onClick={stopCamera}
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {lastResult && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            {lastResult.image && (
              <img
                src={lastResult.image}
                alt={lastResult.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate">{lastResult.name}</h3>
              {lastResult.brand && (
                <p className="text-xs text-muted-foreground">{lastResult.brand}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-muted-foreground">{lastResult.barcode}</span>
                {lastResult.nutriscore && (
                  <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${
                    lastResult.nutriscore === 'a' ? 'bg-green-500/20 text-green-500' :
                    lastResult.nutriscore === 'b' ? 'bg-lime-500/20 text-lime-500' :
                    lastResult.nutriscore === 'c' ? 'bg-yellow-500/20 text-yellow-500' :
                    lastResult.nutriscore === 'd' ? 'bg-orange-500/20 text-orange-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {lastResult.nutriscore.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLastResult(null)}
              className="h-8 w-8 rounded-xl text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Cal", value: lastResult.per100g.calories },
              { label: "Prot", value: lastResult.per100g.protein, unit: "g" },
              { label: "Carb", value: lastResult.per100g.carbs, unit: "g" },
              { label: "Gord", value: lastResult.per100g.fat, unit: "g" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-muted p-2 text-center">
                <p className="text-lg font-bold text-foreground">{item.value}</p>
                <p className="text-[9px] uppercase text-muted-foreground">{item.label}{item.unit ? ` (${item.unit})` : ""}</p>
              </div>
            ))}
          </div>

          {lastResult.servingSize && (
            <p className="text-[10px] text-muted-foreground">
              {t("barcode_serving") || "Porcao"}: {lastResult.servingSize}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
