"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { Box, Camera, ChevronRight, Scan, ShieldCheck, Sparkles, Upload } from "lucide-react"

interface ScanDashboardProps {
  onScan: (file: File) => void
  isScanning?: boolean
}

export function ScanDashboard({ onScan, isScanning = false }: ScanDashboardProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onScan(e.target.files[0])
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-5 pb-safe-nav md:space-y-7">
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-5rem] h-72 bg-[radial-gradient(circle_at_24%_10%,rgba(255,149,0,0.22),transparent_42%),radial-gradient(circle_at_86%_2%,rgba(251,191,36,0.12),transparent_36%)]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-orange-300/22 bg-black/50 p-5 shadow-[inset_0_1px_0_rgba(251,146,60,0.16),0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:rounded-[2.5rem] md:p-7"
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-300 via-orange-500 to-orange-900" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(251,146,60,0.12),transparent_34%,rgba(245,158,11,0.08))]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-4 rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-orange-100">
              {t("scan_dashboard_neural")}
            </Badge>
            <h1 className="text-4xl font-black leading-none tracking-tight text-foreground md:text-6xl">
              {t("scan_title")} <span className="text-primary">2.0</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-orange-50/52 md:text-base">
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
          "relative min-h-[460px] overflow-hidden rounded-[2rem] border-2 bg-black/50 p-5 shadow-[inset_0_1px_0_rgba(251,146,60,0.16),0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl transition md:min-h-[520px] md:rounded-[2.5rem]",
          isDragging ? "border-orange-300 bg-orange-500/8" : "border-orange-300/22 hover:border-orange-300/38",
          isScanning && "ring-4 ring-orange-400/18"
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
        <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(251,146,60,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(251,146,60,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-300/8" />

        <div className="absolute left-5 top-5 h-12 w-12 rounded-tl-2xl border-l-2 border-t-2 border-orange-300/55" />
        <div className="absolute right-5 top-5 h-12 w-12 rounded-tr-2xl border-r-2 border-t-2 border-orange-300/55" />
        <div className="absolute bottom-5 left-5 h-12 w-12 rounded-bl-2xl border-b-2 border-l-2 border-orange-300/55" />
        <div className="absolute bottom-5 right-5 h-12 w-12 rounded-br-2xl border-b-2 border-r-2 border-orange-300/55" />

        {isScanning && (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            <motion.div
              initial={{ y: "-20%" }}
              animate={{ y: "120%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-x-8 h-px bg-orange-300 shadow-[0_0_30px_rgba(251,146,60,0.8)]"
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
                    className="absolute inset-[-16%] rounded-full border-2 border-dashed border-orange-300/45"
                  />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">{t("scan_bio_mapping")}</h3>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.34em] text-orange-300">{t("scan_neural_mesh")}</p>
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
                  <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-orange-300/20 bg-orange-500/10 shadow-xl transition group-hover:border-orange-300/40 group-hover:bg-orange-500/16 md:h-40 md:w-40">
                    <Scan className="h-16 w-16 text-primary md:h-20 md:w-20" />
                  </div>
                  <div className="absolute -bottom-3 -right-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-200/30 bg-orange-500 text-black shadow-xl">
                    <Upload className="h-5 w-5" />
                  </div>
                </button>

                <div>
                  <h3 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">{t("scan_ready")}</h3>
                  <p className="mx-auto mt-3 max-w-md text-base font-bold leading-relaxed text-orange-50/52">{t("scan_instruction")}</p>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-2">
                  <Button
                    className="h-14 rounded-2xl bg-orange-500 text-sm font-black uppercase tracking-[0.16em] text-black shadow-[0_14px_34px_rgba(255,149,0,0.24)] hover:bg-amber-300"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    {t("scan_open_camera")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-14 rounded-2xl border border-orange-300/16 bg-orange-500/8 text-sm font-black uppercase tracking-[0.16em] text-orange-100 hover:bg-orange-500/16"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Upload
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileSelect} />
      </motion.div>

      <section className="rounded-[2rem] border border-orange-300/16 bg-black/42 p-4 shadow-xl backdrop-blur-2xl md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-foreground">{t("scan_history_title")}</h2>
          <ChevronRight className="h-5 w-5 text-orange-100/35" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((_, index) => (
            <div key={index} className="flex items-center gap-4 rounded-[1.5rem] border border-orange-300/12 bg-orange-950/14 p-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-amber-100">
                <Box className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black text-orange-50">BioScore #{2409 + index}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-orange-100/35">{t("scan_yesterday")} 14:05</p>
              </div>
              <Badge className="rounded-full border border-orange-300/16 bg-orange-500/10 text-orange-100">{t("scan_good")}</Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function InfoPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-orange-300/14 bg-orange-950/20 p-3">
      <Icon className="h-4 w-4 text-amber-200" />
      <p className="mt-2 text-lg font-black text-orange-50">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-widest text-orange-100/38">{label}</p>
    </div>
  )
}
