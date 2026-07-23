"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { Camera, ChevronRight, Scan, Upload, Barcode, Sparkles } from "lucide-react"
import { BarcodeScanner } from "@/components/barcode-scanner"

interface ScanDashboardProps {
  onScan: (file: File) => void
  isScanning?: boolean
}

export function ScanDashboard({ onScan, isScanning = false }: ScanDashboardProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onScan(e.target.files[0])
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl space-y-6 pb-safe-nav">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-2"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-brand" />
          <span className="text-xs font-medium text-brand">AI Vision</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t("scan_title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("scan_subtitle")}
        </p>
      </motion.section>

      {/* Scan Area */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={cn(
          "relative min-h-[400px] overflow-hidden rounded-3xl border-2 transition-all duration-300 md:min-h-[460px]",
          isDragging
            ? "border-brand/40 bg-brand/5"
            : "border-border glass-strong hover:border-brand/20",
          isScanning && "ring-4 ring-brand/20 border-brand/30"
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer.files?.[0]) onScan(e.dataTransfer.files[0])
        }}
      >
        {/* Scan line animation */}
        {isScanning && (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            <motion.div
              initial={{ y: "-20%" }}
              animate={{ y: "120%" }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-x-8 h-px bg-brand shadow-[0_0_12px_rgba(52,211,153,0.4)]"
            />
          </div>
        )}

        <div className="relative z-30 flex h-full min-h-[360px] flex-col items-center justify-center gap-6 text-center md:min-h-[420px]">
          <AnimatePresence mode="wait">
            {isScanning ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center gap-5"
              >
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand/10">
                    <Scan className="h-12 w-12 text-brand" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-12%] rounded-full border-2 border-dashed border-brand/30"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{t("scan_bio_mapping")}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t("scan_neural_mesh")}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex w-full max-w-sm flex-col items-center gap-6"
              >
                <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative">
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-muted/50 transition group-hover:bg-brand/5 md:h-32 md:w-32">
                    <Scan className="h-14 w-14 text-brand md:h-16 md:w-16" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/25">
                    <Upload className="h-4 w-4" />
                  </div>
                </button>

                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">{t("scan_ready")}</h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t("scan_instruction")}</p>
                </div>

                <div className="grid w-full grid-cols-3 gap-3">
                  <Button
                    className="h-14 rounded-2xl bg-brand text-sm font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand/90"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {t("scan_open_camera")}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 rounded-2xl border-border bg-transparent text-sm font-medium text-foreground hover:bg-muted/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 rounded-2xl border-border bg-transparent text-sm font-medium text-foreground hover:bg-muted/50"
                    onClick={() => setShowBarcodeScanner(true)}
                  >
                    <Barcode className="mr-2 h-4 w-4" />
                    Barcode
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileSelect} />
      </motion.div>

      {/* Recent Scans Placeholder */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl glass-strong p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{t("scan_history_title")}</h2>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Scan className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">Score #{2409 + index}</p>
                <p className="text-xs text-muted-foreground">{t("scan_yesterday")} 14:05</p>
              </div>
              <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">{t("scan_good")}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {showBarcodeScanner && (
        <BarcodeScanner
          onProductFound={(product) => {
            setShowBarcodeScanner(false)
            if (product) {
              onScan(product.image || "")
            }
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  )
}
