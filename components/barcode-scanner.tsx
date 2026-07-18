"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera, X, ScanLine, Search, AlertCircle, Check, Barcode,
  ArrowRight, History, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner"
import { useTranslation } from "@/lib/i18n"

interface BarcodeScannerProps {
  onProductFound: (product: any) => void
  onClose: () => void
}

export function BarcodeScanner({ onProductFound, onClose }: BarcodeScannerProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { isScanning, lastResult, error, scanHistory, lookupBarcode, clearHistory, setLastResult } = useBarcodeScanner()

  const [mode, setMode] = useState<"camera" | "manual" | "history">("manual")
  const [manualCode, setManualCode] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === "camera") {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [mode])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setMode("manual")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  const handleManualSearch = async () => {
    if (!manualCode.trim()) return
    const product = await lookupBarcode(manualCode.trim())
    if (product) {
      onProductFound(product)
    }
  }

  const handleHistorySelect = (barcode: string) => {
    lookupBarcode(barcode)
  }

  useEffect(() => {
    if (lastResult) {
      onProductFound(lastResult)
    }
  }, [lastResult])

  const nutriscoreColors: Record<string, string> = {
    a: "bg-emerald-500 text-white",
    b: "bg-lime-500 text-white",
    c: "bg-amber-500 text-white",
    d: "bg-orange-500 text-white",
    e: "bg-red-500 text-white",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Barcode className="h-5 w-5 text-foreground" />
          <h2 className="text-lg font-black text-foreground">
            {isEnglish ? "Barcode Scanner" : "Scanner de Codigo"}
          </h2>
        </div>
        <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 p-4">
        {(["manual", "camera", "history"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
              mode === m
                ? "bg-white/8 text-foreground border border-white/10"
                : "text-foreground/50 border border-transparent"
            )}
          >
            {m === "manual" && <Search className="h-3.5 w-3.5" />}
            {m === "camera" && <Camera className="h-3.5 w-3.5" />}
            {m === "history" && <History className="h-3.5 w-3.5" />}
            {m === "manual" ? (isEnglish ? "Manual" : "Manual") : m === "camera" ? (isEnglish ? "Camera" : "Camera") : (isEnglish ? "History" : "Historico")}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {mode === "manual" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  <ScanLine className="h-5 w-5 text-foreground/60" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{isEnglish ? "Enter Barcode" : "Digite o Codigo"}</p>
                  <p className="text-[10px] font-bold text-foreground/50">
                    {isEnglish ? "Type or paste the barcode number" : "Digite ou cole o numero do codigo de barras"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                  placeholder="7622210449283"
                  className="h-12 rounded-xl border-white/10 bg-black/30 text-sm font-mono"
                  maxLength={14}
                />
                <Button
                  onClick={handleManualSearch}
                  disabled={!manualCode.trim() || isScanning}
                  className="h-12 rounded-xl bg-foreground px-4 text-[10px] font-black uppercase tracking-widest text-black hover:bg-foreground/80"
                >
                  {isScanning ? (
                    <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-2">
                {isEnglish ? "Where to find it" : "Onde encontrar"}
              </p>
              <p className="text-xs text-foreground/50 leading-relaxed">
                {isEnglish
                  ? "The barcode is usually located on the back or bottom of the product packaging. It's the series of vertical lines with numbers below."
                  : "O codigo de barras geralmente fica na parte de tras ou embaixo da embalagem do produto. E a serie de linhas verticais com numeros abaixo."}
              </p>
            </div>
          </div>
        )}

        {mode === "camera" && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[3/4] relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-32 border-2 border-foreground/40 rounded-xl relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-foreground/60 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-foreground/60 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-foreground/60 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-foreground/60 rounded-br-lg" />
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-foreground"
                    animate={{ y: [0, 120, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
              <div className="absolute bottom-4 inset-x-0 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 bg-black/50 rounded-full px-4 py-2 inline-block">
                  {isEnglish ? "Align barcode within the frame" : "Alinhe o codigo dentro da moldura"}
                </p>
              </div>
            </div>
          </div>
        )}

        {mode === "history" && (
          <div className="space-y-3">
            {scanHistory.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
                <History className="mx-auto mb-3 h-10 w-10 text-foreground/50" />
                <p className="text-sm font-bold text-foreground/50">
                  {isEnglish ? "No scan history yet" : "Nenhum historico de escaneamento ainda"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button
                    onClick={clearHistory}
                    variant="ghost"
                    className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {isEnglish ? "Clear" : "Limpar"}
                  </Button>
                </div>
                {scanHistory.map((item) => (
                  <button
                    key={item.barcode}
                    onClick={() => handleHistorySelect(item.barcode)}
                    className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3 hover:bg-white/5 transition-all"
                  >
                    {item.image ? (
                      <img src={item.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <Barcode className="h-5 w-5 text-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-black text-foreground truncate">{item.name}</p>
                      <p className="text-[9px] font-bold text-foreground/50 font-mono">{item.barcode}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black",
                        item.score >= 70 ? "bg-emerald-500/20 text-emerald-400" :
                        item.score >= 40 ? "bg-foreground/20 text-foreground/60" :
                        "bg-red-500/20 text-red-400"
                      )}>
                        {item.score}
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
