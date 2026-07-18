"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { Box, Camera, ChevronRight, Scan, ShieldCheck, Sparkles, Upload, Barcode } from "lucide-react"
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
    <div className="relative mx-auto w-full max-w-3xl space-y-5 pb-safe-nav md:space-y-7">
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-5rem] h-72 bg-[radial-gradient(circle_at_24%_10%,var(--muted-foreground),transparent_42%),radial-gradient(circle_at_86%_2%,var(--muted-foreground),transparent_36%)]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-muted/50 p-5 shadow-sm md:rounded-2xl md:p-7"
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-border via-border/50 to-border" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_34%,rgba(255,255,255,0.04))]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-4 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-foreground">
              {t("scan_dashboard_neural")}
            </Badge>
            <h1 className="text-4xl font-black leading-none tracking-tight text-foreground md:text-6xl">
              {t("scan_title")} <span className="text-primary">2.0</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-muted-foreground md:text-base">
              {t("scan_subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-[320px]">
            <InfoPill icon={ShieldCheck} label="AI" value="Vision" />
            <InfoPill icon={Sparkles} label="Mode" value="BioScan" />
          </div>
        </div>
      </motion.section>

      <motion.div
        whileHover={{ y: -3 }}
        className={cn(
          "relative min-h-[460px] overflow-hidden rounded-2xl border-2 bg-muted/50 p-5 shadow-sm transition md:min-h-[520px] md:rounded-2xl",
          isDragging ? "border-border bg-muted/50" : "border-border hover:border-border",
          isScanning && "ring-4 ring-border"
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
        <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(var(--muted-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--muted-foreground)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-border/5 via-transparent to-border/5" />

        {isScanning && (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            <motion.div
              initial={{ y: "-20%" }}
              animate={{ y: "120%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-x-8 h-px bg-border shadow-sm"
            />
          </div>
        )}

        <div className="relative z-30 flex h-full min-h-[420px] flex-col items-center justify-center gap-7 text-center md:min-h-[480px]">
          <AnimatePresence mode="wait">
            {isScanning ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="relative">
                  <Box className="h-24 w-24 text-primary md:h-32 md:w-32" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-16%] rounded-full border-2 border-dashed border-border"
                  />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">{t("scan_bio_mapping")}</h3>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.34em] text-muted-foreground">{t("scan_neural_mesh")}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex w-full max-w-xl flex-col items-center gap-7"
              >
                <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative">
                  <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-border bg-muted/50 shadow-sm transition group-hover:border-border group-hover:bg-muted/50 md:h-40 md:w-40">
                    <Scan className="h-16 w-16 text-primary md:h-20 md:w-20" />
                  </div>
                  <div className="absolute -bottom-3 -right-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-foreground text-black shadow-sm">
                    <Upload className="h-5 w-5" />
                  </div>
                </button>

                <div>
                  <h3 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">{t("scan_ready")}</h3>
                  <p className="mx-auto mt-3 max-w-md text-base font-bold leading-relaxed text-muted-foreground">{t("scan_instruction")}</p>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-3">
                  <Button
                    className="h-14 rounded-2xl bg-foreground text-sm font-black uppercase tracking-[0.16em] text-black shadow-sm hover:bg-muted/50"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    {t("scan_open_camera")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-14 rounded-2xl border border-border bg-muted/50 text-sm font-black uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Upload
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-14 rounded-2xl border border-border bg-muted/50 text-sm font-black uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted/50"
                    onClick={() => setShowBarcodeScanner(true)}
                  >
                    <Barcode className="mr-2 h-5 w-5" />
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

      <section className="rounded-2xl border border-border bg-muted/50 p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-foreground">{t("scan_history_title")}</h2>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((_, index) => (
            <div key={index} className="flex items-center gap-4 rounded-xl border border-border bg-muted/50 p-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                <Box className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black text-foreground">BioScore #{2409 + index}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-widest text-muted-foreground">{t("scan_yesterday")} 14:05</p>
              </div>
              <Badge className="rounded-full border border-border bg-muted/50 text-muted-foreground">{t("scan_good")}</Badge>
            </div>
          ))}
        </div>
      </section>

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

function InfoPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/50 p-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="mt-2 text-lg font-black text-foreground">{value}</p>
      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  )
}
