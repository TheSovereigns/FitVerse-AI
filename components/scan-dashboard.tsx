"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Camera, Scan, Box, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

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
    <div className="w-full max-w-5xl mx-auto space-y-8 md:space-y-12 p-2 md:p-6 animate-in fade-in duration-1000">

      {/* Header */}
      <div className="flex flex-col gap-2 md:gap-4 relative">
        <div className="absolute -top-8 -left-8 w-32 h-32 md:w-48 md:h-48 bg-primary/10 blur-[80px] rounded-full pointer-events-none animate-pulse" />
        <div className="flex items-center justify-between relative z-10">
          <motion.h1
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-4xl font-black text-foreground tracking-tighter leading-none"
          >
            {t("scan_title")} <span className="text-primary italic">2.0</span>
          </motion.h1>
          <Badge className="bg-primary text-white font-black uppercase tracking-[0.2em] px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-xs shadow-xl shadow-primary/20 haptic-press">
            Neural
          </Badge>
        </div>
        <p className="text-sm md:text-lg font-bold text-muted-foreground max-w-2xl opacity-60">
          {t("scan_subtitle")}
        </p>
      </div>

      {/* Main Scan Zone */}
      <div className="relative group">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={cn(
            "relative glass-strong border-white/20 border-2 rounded-[1.5rem] md:rounded-[3rem] h-[200px] md:h-[300px] lg:h-[400px] flex flex-col items-center justify-center transition-all duration-1000 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.3)] haptic-press glass-reflection",
            isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "hover:border-white/30",
            isScanning && "ring-4 ring-primary/20"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) onScan(e.dataTransfer.files[0]) }}
        >
          {/* Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

          {/* Scanning particles */}
          {isScanning && (
            <div className="absolute inset-0 overflow-hidden z-20 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: Math.random() * 400 - 200, y: Math.random() * 400 - 200, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], x: 0, y: 0, scale: [0, 1.5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2, ease: "circOut" }}
                  className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full bg-primary blur-[1px] shadow-[0_0_10px_var(--primary)]"
                />
              ))}
            </div>
          )}

          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 md:top-6 md:left-6 md:w-12 md:h-12 border-t-2 border-l-2 border-white/40 rounded-tl-2xl md:rounded-tl-3xl transition-all duration-700 group-hover:w-10 group-hover:h-10 md:group-hover:w-16 md:group-hover:h-16" />
          <div className="absolute top-4 right-4 w-8 h-8 md:top-6 md:right-6 md:w-12 md:h-12 border-t-2 border-r-2 border-white/40 rounded-tr-2xl md:rounded-tr-3xl transition-all duration-700 group-hover:w-10 group-hover:h-10 md:group-hover:w-16 md:group-hover:h-16" />
          <div className="absolute bottom-4 left-4 w-8 h-8 md:bottom-6 md:left-6 md:w-12 md:h-12 border-b-2 border-l-2 border-white/40 rounded-bl-2xl md:rounded-bl-3xl transition-all duration-700 group-hover:w-10 group-hover:h-10 md:group-hover:w-16 md:group-hover:h-16" />
          <div className="absolute bottom-4 right-4 w-8 h-8 md:bottom-6 md:right-6 md:w-12 md:h-12 border-b-2 border-r-2 border-white/40 rounded-tr-2xl md:rounded-tr-3xl transition-all duration-700 group-hover:w-10 group-hover:h-10 md:group-hover:w-16 md:group-hover:h-16" />

          {/* Content */}
          <div className="relative z-30 flex flex-col items-center gap-4 md:gap-6 p-4 md:p-8 text-center">
            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex flex-col items-center gap-4 md:gap-6"
                >
                  <div className="relative">
                    <Box className="w-16 h-16 md:w-24 md:h-24 text-primary animate-pulse" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-[-15%] border-2 border-dashed border-primary/40 rounded-full"
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">{t("scan_bio_mapping")}</h3>
                    <p className="text-primary font-black uppercase tracking-[0.4em] text-[8px] md:text-[10px] animate-pulse">{t("scan_neural_mesh")}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-6 md:gap-10"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] md:rounded-[3rem] glass-strong border border-white/30 flex items-center justify-center shadow-inner group-hover:border-primary transition-all duration-700 overflow-hidden">
                      <Scan className="w-14 h-14 md:w-20 md:h-20 text-primary" />
                      <div className="absolute inset-0 mesh-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
                    </div>
                    <div className="absolute -bottom-3 -right-3 md:-bottom-4 md:-right-4 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl border-[4px] md:border-[6px] border-card">
                      <Camera className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                  </motion.div>

                  <div className="space-y-2 md:space-y-4 max-w-xs md:max-w-sm px-4 md:px-6">
                    <h3 className="text-2xl md:text-4xl font-black text-foreground tracking-tighter">{t("scan_ready")}</h3>
                    <p className="text-muted-foreground text-base md:text-lg font-bold">{t("scan_instruction")}</p>
                  </div>

                  <div className="flex flex-col w-full max-w-xs md:max-w-sm gap-3 md:gap-4">
                    <Button
                      size="lg"
                      className="w-full h-16 md:h-20 rounded-[2rem] text-lg md:text-xl font-black mesh-gradient text-white shadow-2xl haptic-press luminous-edge relative z-10"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      {t("scan_open_camera")}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
          <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileSelect} />
        </motion.div>
      </div>

      {/* Smart History */}
      <div className="mt-8 md:mt-16">
        <h3 className="text-2xl md:text-[2rem] font-black tracking-tighter text-foreground mb-5 md:mb-8 px-2 md:px-4">
          {t("scan_history_title")}
        </h3>
        <div className="glass-strong border-white/20 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl p-3 md:p-4">
          <div className="space-y-2 md:space-y-3">
            {[1, 2].map((_, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.01, x: 6 }}
                className="p-5 md:p-8 flex items-center gap-5 md:gap-8 glass rounded-[2rem] md:rounded-[3rem] border-white/10 cursor-pointer haptic-press group"
              >
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-[1.25rem] md:rounded-[1.5rem] bg-black/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all shadow-inner">
                  <Box className="w-7 h-7 md:w-10 md:h-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg md:text-2xl font-black text-foreground truncate tracking-tighter">BioScore #{2409 + i}</p>
                  <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-2">
                    <Badge className="bg-[#32D74B]/20 text-[#32D74B] border-none font-black text-[10px] px-2 md:px-3 py-1">{t("scan_good")}</Badge>
                    <span className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest">{t("scan_yesterday")} 14:05</span>
                  </div>
                </div>
                <ChevronRight className="w-7 h-7 md:w-10 md:h-10 text-muted-foreground opacity-20 group-hover:opacity-100 transition-all" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}