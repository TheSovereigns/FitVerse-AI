"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, Trash2, Flame, Dumbbell, Wheat, Droplets, X, Calculator, Save, Download, Lock, Award, Target, TrendingUp, Zap, ChevronDown, ChevronUp, ChevronRight, Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { useTranslation } from "@/lib/i18n"

interface PlateItem {
  id: string
  productName: string
  grams: number
  originalGrams: number
  macros: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  image?: string
}

interface MealPlateProps {
  onBack: () => void
}

export function MealPlate({ onBack }: MealPlateProps) {
  const { t } = useTranslation()
  const { plan } = usePlanLimits()
  const isPremium = plan === "pro" || plan === "premium"
  
  const [items, setItems] = useState<PlateItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<"today" | "week" | "all">("today")

  const savedPlates = useMemo(() => {
    const saved = localStorage.getItem("mealPlates")
    return saved ? JSON.parse(saved) : []
  }, [])

  const scanHistory = useMemo(() => {
    const saved = localStorage.getItem("dailyActivity")
    if (!saved) return []
    const activity = JSON.parse(saved)
    return activity.scannedProducts || []
  }, [])

  const filteredHistory = useMemo(() => {
    if (!scanHistory.length) return []
    
    const now = new Date()
    const today = now.toISOString().split("T")[0]
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return scanHistory.filter((item: any) => {
      if (!item.scannedAt) return false
      const itemDate = new Date(item.scannedAt)
      
      if (historyFilter === "today") {
        return itemDate.toISOString().split("T")[0] === today
      } else if (historyFilter === "week") {
        return itemDate >= weekAgo
      }
      return true
    })
  }, [scanHistory, historyFilter])

  const totalMacros = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const ratio = item.grams / item.originalGrams
        return {
          calories: acc.calories + Math.round(item.macros.calories * ratio),
          protein: acc.protein + Math.round(item.macros.protein * ratio),
          carbs: acc.carbs + Math.round(item.macros.carbs * ratio),
          fat: acc.fat + Math.round(item.macros.fat * ratio),
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [items])

  const addItemToPlate = (product: any, grams?: number) => {
    const defaultGrams = product.servingSize ? parseInt(product.servingSize.replace(/\D/g, "")) || 100 : 100
    
    const newItem: PlateItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productName: product.productName,
      grams: grams || defaultGrams,
      originalGrams: defaultGrams,
      macros: product.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 },
      image: product.image,
    }
    
    setItems((prev) => [...prev, newItem])
  }

  const updateItemGrams = (id: string, newGrams: number) => {
    if (!isPremium) return
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, grams: Math.max(10, newGrams) } : item
      )
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const savePlate = () => {
    if (items.length === 0) return
    
    const newPlate = {
      id: `plate-${Date.now()}`,
      name: `Refeição ${savedPlates.length + 1}`,
      date: new Date().toISOString(),
      items: items,
      totalMacros,
    }
    
    const updatedPlates = [...savedPlates, newPlate]
    localStorage.setItem("mealPlates", JSON.stringify(updatedPlates))
    
    alert(t("plate_saved") || "Prato salvo com sucesso!")
  }

  const loadPlate = (plate: any) => {
    setItems(plate.items)
    setShowHistory(false)
  }

  const exportData = () => {
    if (!isPremium) return
    
    const data = {
      date: new Date().toISOString(),
      plates: savedPlates,
      totalScans: scanHistory.length,
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fitverse-export-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6 pb-32 animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack} className="w-14 h-14 rounded-2xl glass-strong border-white/10">
          <Calculator className="w-8 h-8" />
        </Button>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] tracking-widest px-3 py-2 rounded-full">
            {t("plate_title") || "MODO PRATO"}
          </Badge>
        </div>
        <div className="w-14" />
      </div>

      {/* Total Macros Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-strong border-white/20 rounded-3xl p-6 md:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black tracking-tight">
            {t("plate_total") || "Total da Refeição"}
          </h2>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowHistory(true)}
              className="rounded-xl"
            >
              <Calendar className="w-5 h-5" />
            </Button>
            {isPremium && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={exportData}
                className="rounded-xl"
              >
                <Download className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("pr_kcal"), val: totalMacros.calories, icon: Flame, color: "text-[#FF453A]" },
            { label: t("pr_prot"), val: totalMacros.protein + "g", icon: Dumbbell, color: "text-[#0A84FF]" },
            { label: t("pr_carb"), val: totalMacros.carbs + "g", icon: Wheat, color: "text-[#FFD60A]" },
            { label: t("pr_fat"), val: totalMacros.fat + "g", icon: Droplets, color: "text-[#FF375F]" }
          ].map((m, i) => (
            <div 
              key={i}
              className="glass border-white/10 rounded-2xl p-4 flex flex-col items-center"
            >
              <m.icon className={cn("w-6 h-6 mb-2", m.color)} />
              <p className="text-2xl font-black">{m.val}</p>
              <p className="text-[10px] font-bold opacity-40 uppercase">{m.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black uppercase tracking-widest opacity-40">
            {t("plate_items") || "Itens"} ({items.length})
          </h3>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="rounded-full px-6 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t("plate_add") || "Adicionar"}
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="glass-strong border-white/10 rounded-3xl p-12 text-center">
            <Calculator className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold opacity-40">
              {t("plate_empty") || "Adicione itens escaneados ao seu prato"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-strong border-white/10 rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="flex-1">
                  <p className="font-black text-lg">{item.productName}</p>
                  <p className="text-sm opacity-40">
                    {item.grams}g / {item.originalGrams}g padrão
                  </p>
                </div>

                {isPremium ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateItemGrams(item.id, item.grams - 10)}
                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black w-16 text-center">{item.grams}g</span>
                    <button 
                      onClick={() => updateItemGrams(item.id, item.grams + 10)}
                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-primary">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs">{item.grams}g</span>
                  </div>
                )}

                <div className="text-right min-w-[80px]">
                  <p className="font-black">{Math.round(item.macros.calories * (item.grams / item.originalGrams))}</p>
                  <p className="text-[10px] opacity-40">KCAL</p>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="rounded-xl text-rose-400"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      {items.length > 0 && (
        <Button 
          onClick={savePlate}
          className="w-full rounded-2xl py-6 bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="w-6 h-6 mr-2" />
          {t("plate_save") || "Salvar Prato"}
        </Button>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong border-white/20 rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black">{t("plate_select") || "Selecionar Item"}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {scanHistory.length === 0 ? (
                <p className="text-center opacity-40 py-8">
                  {t("plate_no_history") || "Nenhum item no histórico. Escaneie algo primeiro!"}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.map((item: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        addItemToPlate(item)
                        setShowAddModal(false)
                      }}
                      className="w-full glass border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="text-left">
                        <p className="font-bold">{item.productName}</p>
                        <p className="text-sm opacity-40">
                          {item.macros?.calories || 0} KCAL
                        </p>
                      </div>
                      <Plus className="w-5 h-5 text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong border-white/20 rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black">{t("plate_saved") || "Pratos Salvos"}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 mb-4">
                {(["today", "week", "all"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setHistoryFilter(filter)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold transition-colors",
                      historyFilter === filter
                        ? "bg-primary text-white"
                        : "bg-white/10 opacity-60"
                    )}
                  >
                    {filter === "today" ? "Hoje" : filter === "week" ? "Semana" : "Todos"}
                  </button>
                ))}
              </div>

              {savedPlates.length === 0 ? (
                <p className="text-center opacity-40 py-8">
                  {t("plate_no_saved") || "Nenhum prato salvo ainda"}
                </p>
              ) : (
                <div className="space-y-2">
                  {savedPlates.map((plate: any) => (
                    <button
                      key={plate.id}
                      onClick={() => loadPlate(plate)}
                      className="w-full glass border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="text-left">
                        <p className="font-bold">{plate.name}</p>
                        <p className="text-sm opacity-40">
                          {plate.items.length} itens • {plate.totalMacros.calories} KCAL
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 opacity-40" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
