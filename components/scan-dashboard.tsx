"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { Camera, ChevronRight, Scan, Upload, Barcode, Sparkles, Search, Heart, X } from "lucide-react"
import { toast } from "sonner"
import { BarcodeScanner } from "@/components/barcode-scanner"

interface ScanDashboardProps {
  onScan: (file: File) => void
  onBarcodeProduct?: (product: {
    productName: string
    image: string
    macros: { calories: number; protein: number; carbs: number; fat: number }
    longevityScore: number
    healthBenefits?: string[]
    healthRisks?: string[]
  }) => void
  isScanning?: boolean
}

export function ScanDashboard({ onScan, onBarcodeProduct, isScanning = false }: ScanDashboardProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [scanHistory, setScanHistory] = useState<Array<{ id?: string; name?: string; scannedAt?: string; score?: number; image?: string }>>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const storeRaw = localStorage.getItem("fitverse-app-store")
      if (storeRaw) {
        const store = JSON.parse(storeRaw)
        const state = store.state || store
        const history = (state.scanHistory || []).map((s: any) => ({
          id: s.id, name: s.productName || s.name, scannedAt: s.scannedAt, score: s.longevityScore || s.score, image: s.image,
        }))
        setScanHistory(history)
      }
    } catch {}
    try {
      const stored = localStorage.getItem("fitverse-favorites")
      if (stored) setFavorites(JSON.parse(stored))
    } catch {}
  }, [])

  const toFavoriteId = (name: string) => name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  const toggleFavorite = (id: string) => {
    const favId = toFavoriteId(id)
    setFavorites(prev => {
      const next = prev.includes(favId) ? prev.filter(f => f !== favId) : [...prev, favId]
      localStorage.setItem("fitverse-favorites", JSON.stringify(next))
      toast.success(prev.includes(favId) ? t("scan_removed_favorite") : t("scan_added_favorite"))
      return next
    })
  }

  const recentScans = useMemo(() => {
    return scanHistory.slice(0, 10)
  }, [scanHistory])

  const favoriteScans = useMemo(() => {
    return scanHistory.filter(s => s.name && favorites.includes(toFavoriteId(s.name)))
  }, [scanHistory, favorites])

  const filteredScans = useMemo(() => {
    if (!searchQuery.trim()) return scanHistory
    const q = searchQuery.toLowerCase()
    return scanHistory.filter(s => s.name?.toLowerCase().includes(q))
  }, [scanHistory, searchQuery])

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

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("scan_search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-border bg-card py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>

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
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl glass-strong transition group-hover:bg-brand/5 md:h-32 md:w-32">
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
                    className="h-14 rounded-xl bg-brand text-sm font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand/90"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {t("scan_open_camera")}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 rounded-xl border-border bg-transparent text-sm font-medium text-foreground hover:bg-muted/50"
                     onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 rounded-xl border-border bg-transparent text-sm font-medium text-foreground hover:bg-muted/50"
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

      {/* Search Results */}
      {searchQuery && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass-strong p-5"
        >
          <h2 className="text-base font-semibold text-foreground mb-4">
            {filteredScans.length} {t("scan_search_placeholder")}
          </h2>
          <div className="space-y-3">
            {filteredScans.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("scan_no_results")}</p>
            )}
            {filteredScans.map((scan, index) => (
              <div key={scan.id || index} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                {scan.image ? (
                  <img src={scan.image} alt={scan.name || "Product"} className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Scan className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{scan.name || `Score #${index + 1}`}</p>
                  <p className="text-xs text-muted-foreground">{scan.scannedAt ? new Date(scan.scannedAt).toLocaleDateString() : ""}</p>
                </div>
                {scan.score != null && (
                  <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">{scan.score}</span>
                )}
                {scan.name && (
                  <button onClick={() => toggleFavorite(scan.name!)} className="ml-1">
                    <Heart className={cn("h-5 w-5", favorites.includes(toFavoriteId(scan.name)) ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Favorites Section */}
      {!searchQuery && favoriteScans.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl glass-strong p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
              {t("scan_favorites")}
            </h2>
          </div>
          <div className="space-y-3">
            {favoriteScans.map((scan, index) => (
              <div key={scan.id || index} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                {scan.image ? (
                  <img src={scan.image} alt={scan.name || "Product"} className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Scan className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{scan.name || `Score #${index + 1}`}</p>
                  <p className="text-xs text-muted-foreground">{scan.scannedAt ? new Date(scan.scannedAt).toLocaleDateString() : ""}</p>
                </div>
                {scan.score != null && (
                  <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">{scan.score}</span>
                )}
                <button onClick={() => toggleFavorite(scan.name!)}>
                  <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
                </button>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Recent Scans */}
      {!searchQuery && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl glass-strong p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">{t("scan_recent")}</h2>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {recentScans.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("scan_no_results")}</p>
            )}
            {recentScans.map((scan, index) => (
              <div key={scan.id || index} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                {scan.image ? (
                  <img src={scan.image} alt={scan.name || "Product"} className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Scan className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{scan.name || `Score #${index + 1}`}</p>
                  <p className="text-xs text-muted-foreground">{scan.scannedAt ? new Date(scan.scannedAt).toLocaleDateString() : ""}</p>
                </div>
                {scan.score != null && (
                  <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">{scan.score}</span>
                )}
                {scan.name && (
                  <button onClick={() => toggleFavorite(scan.name!)} className="ml-1">
                    <Heart className={cn("h-5 w-5", favorites.includes(toFavoriteId(scan.name)) ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {showBarcodeScanner && (
        <BarcodeScanner
          onProductFound={(product) => {
            setShowBarcodeScanner(false)
            if (product && onBarcodeProduct) {
              const score = (() => {
                let s = 50
                const n = product.per100g
                if (n.protein > 10) s += 10
                if (n.fiber > 3) s += 10
                if (n.sugars < 5) s += 10
                if (n.salt < 1) s += 5
                if (n.fat < 10) s += 5
                if (n.sugars > 15) s -= 15
                if (n.salt > 2) s -= 10
                if (n.fat > 20) s -= 10
                const g = product.nutriscore
                if (g === "a") s += 15
                else if (g === "b") s += 8
                else if (g === "d") s -= 10
                else if (g === "e") s -= 20
                return Math.max(0, Math.min(100, s))
              })()
              onBarcodeProduct({
                productName: product.name,
                image: product.image || "",
                macros: { calories: product.per100g.calories, protein: product.per100g.protein, carbs: product.per100g.carbs, fat: product.per100g.fat },
                longevityScore: score,
                healthBenefits: product.ingredients ? [product.ingredients] : [],
              })
            } else if (product) {
              onScan(product.image || "")
            }
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  )
}
