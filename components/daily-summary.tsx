"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, Flame, Dumbbell, Wheat, Droplets, TrendingUp, Target, PieChart, Activity, ChevronRight, X, Download, Lock, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { useTranslation } from "@/lib/i18n"

interface DailySummary {
  date: string
  scans: any[]
  workouts: any[]
  diets: any[]
}

export function DailySummary() {
  const { t } = useTranslation()
  const { plan } = usePlanLimits()
  const isPremium = plan === "pro" || plan === "premium"
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  const dailyData = useMemo(() => {
    const activity = localStorage.getItem("dailyActivity")
    const scans = activity ? JSON.parse(activity).scannedProducts || [] : []
    
    const savedWorkouts = localStorage.getItem("generatedWorkouts")
    const workouts = savedWorkouts ? JSON.parse(savedWorkouts) : []
    
    const savedDiets = localStorage.getItem("generatedDiets")
    const diets = savedDiets ? JSON.parse(savedDiets) : []

    const todayScans = scans.filter((s: any) => {
      if (!s.scannedAt) return false
      return s.scannedAt.split("T")[0] === selectedDate
    })

    const todayWorkouts = workouts.filter((w: any) => {
      if (!w.createdAt) return false
      return w.createdAt.split("T")[0] === selectedDate
    })

    const todayDiets = diets.filter((d: any) => {
      if (!d.createdAt) return false
      return d.createdAt.split("T")[0] === selectedDate
    })

    return {
      scans: todayScans,
      workouts: todayWorkouts,
      diets: todayDiets,
    }
  }, [selectedDate])

  const totalMacros = useMemo(() => {
    return dailyData.scans.reduce(
      (acc: { calories: number; protein: number; carbs: number; fat: number }, item: any) => {
        const macros = item.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 }
        return {
          calories: acc.calories + (macros.calories || 0),
          protein: acc.protein + (macros.protein || 0),
          carbs: acc.carbs + (macros.carbs || 0),
          fat: acc.fat + (macros.fat || 0),
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [dailyData.scans])

  const averageScore = useMemo(() => {
    if (dailyData.scans.length === 0) return 0
    const total = dailyData.scans.reduce((acc: number, s: any) => acc + (s.longevityScore || 0), 0)
    return Math.round(total / dailyData.scans.length)
  }, [dailyData.scans])

  const weekData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      
      const activity = localStorage.getItem("dailyActivity")
      const scans = activity ? JSON.parse(activity).scannedProducts || [] : []
      const dayScans = scans.filter((s: any) => s.scannedAt?.split("T")[0] === dateStr)
      
      const dayMacros = dayScans.reduce((acc: { calories: number; protein: number; carbs: number; fat: number }, s: any) => {
        const m = s.macros || {}
        return {
          calories: acc.calories + (m.calories || 0),
          protein: acc.protein + (m.protein || 0),
          carbs: acc.carbs + (m.carbs || 0),
          fat: acc.fat + (m.fat || 0),
        }
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
      
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString("pt-BR", { weekday: "short" }),
        scans: dayScans.length,
        calories: dayMacros.calories,
      })
    }
    return days
  }, [])

  const maxCalories = Math.max(...weekData.map(d => d.calories), 1)

  const exportSummary = () => {
    if (!isPremium) return
    
    const data = {
      date: selectedDate,
      summary: {
        totalScans: dailyData.scans.length,
        totalWorkouts: dailyData.workouts.length,
        totalDiets: dailyData.diets.length,
      },
      macros: totalMacros,
      averageLongevityScore: averageScore,
      items: dailyData.scans,
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fitverse-daily-${selectedDate}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="glass-strong border-white/20 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-foreground font-bold text-lg focus:outline-none"
          />
          {isPremium && (
            <Button variant="ghost" size="icon" onClick={exportSummary}>
              <Download className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -5 }}
          className="glass-strong border-white/10 rounded-2xl p-4 text-center"
        >
          <Activity className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-black">{dailyData.scans.length}</p>
          <p className="text-xs opacity-40 uppercase">{t("summary_scans") || "Scans"}</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5 }}
          className="glass-strong border-white/10 rounded-2xl p-4 text-center"
        >
          <Flame className="w-6 h-6 mx-auto mb-2 text-[#FF453A]" />
          <p className="text-2xl font-black">{totalMacros.calories}</p>
          <p className="text-xs opacity-40 uppercase">{t("summary_kcal") || "KCAL"}</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5 }}
          className="glass-strong border-white/10 rounded-2xl p-4 text-center"
        >
          <Target className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
          <p className="text-2xl font-black">{averageScore}</p>
          <p className="text-xs opacity-40 uppercase">{t("summary_score") || "Score"}</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5 }}
          className="glass-strong border-white/10 rounded-2xl p-4 text-center"
        >
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
          <p className="text-2xl font-black">{dailyData.workouts.length + dailyData.diets.length}</p>
          <p className="text-xs opacity-40 uppercase">{t("summary_generated") || "Gerados"}</p>
        </motion.div>
      </div>

      {/* Macros Breakdown */}
      <div className="glass-strong border-white/20 rounded-2xl p-6">
        <h3 className="font-black uppercase tracking-widest opacity-40 mb-4">{t("summary_macros") || "Macros"}</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-[#FF453A]" />
            <p className="text-xl font-black">{totalMacros.calories}</p>
            <p className="text-xs opacity-40">KCAL</p>
          </div>
          <div className="text-center">
            <Dumbbell className="w-5 h-5 mx-auto mb-1 text-[#0A84FF]" />
            <p className="text-xl font-black">{totalMacros.protein}g</p>
            <p className="text-xs opacity-40">PROT</p>
          </div>
          <div className="text-center">
            <Wheat className="w-5 h-5 mx-auto mb-1 text-[#FFD60A]" />
            <p className="text-xl font-black">{totalMacros.carbs}g</p>
            <p className="text-xs opacity-40">CARB</p>
          </div>
          <div className="text-center">
            <Droplets className="w-5 h-5 mx-auto mb-1 text-[#FF375F]" />
            <p className="text-xl font-black">{totalMacros.fat}g</p>
            <p className="text-xs opacity-40">FAT</p>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="glass-strong border-white/20 rounded-2xl p-6">
        <h3 className="font-black uppercase tracking-widest opacity-40 mb-4">{t("summary_week") || "Últimos 7 dias"}</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {weekData.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-white/5 rounded-t-lg relative overflow-hidden flex-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.calories / maxCalories) * 100}%` }}
                  className={cn(
                    "absolute bottom-0 w-full rounded-t-lg",
                    day.date === selectedDate ? "bg-primary" : "bg-primary/40"
                  )}
                />
              </div>
              <span className={cn(
                "text-[10px] font-bold",
                day.date === selectedDate ? "text-primary" : "opacity-40"
              )}>
                {day.dayName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scanned Items */}
      <div className="space-y-3">
        <h3 className="font-black uppercase tracking-widest opacity-40">{t("summary_items") || "Itens Escaneados"}</h3>
        
        {dailyData.scans.length === 0 ? (
          <div className="glass-strong border-white/10 rounded-2xl p-8 text-center">
            <PieChart className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="opacity-40">{t("summary_no_scans") || "Nenhum scan neste dia"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dailyData.scans.map((item: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-strong border-white/10 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg",
                    item.longevityScore >= 70 ? "bg-emerald-500/20 text-emerald-400" :
                    item.longevityScore >= 40 ? "bg-amber-500/20 text-amber-400" :
                    "bg-rose-500/20 text-rose-400"
                  )}>
                    {item.longevityScore}
                  </div>
                  <div>
                    <p className="font-bold">{item.productName}</p>
                    <p className="text-xs opacity-40">
                      {item.macros?.calories || 0} KCAL
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 opacity-20" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Generated Content */}
      {(dailyData.workouts.length > 0 || dailyData.diets.length > 0) && (
        <div className="space-y-3">
          <h3 className="font-black uppercase tracking-widest opacity-40">{t("summary_generated") || "Conteúdo Gerado"}</h3>
          
          <div className="space-y-2">
            {dailyData.workouts.map((workout: any, i: number) => (
              <div key={i} className="glass-strong border-orange-500/20 rounded-xl p-4 flex items-center gap-3">
                <Dumbbell className="w-6 h-6 text-orange-400" />
                <div>
                  <p className="font-bold">{workout.name || "Treino"}</p>
                  <p className="text-xs opacity-40">{workout.exercises?.length || 0} exercícios</p>
                </div>
              </div>
            ))}
            
            {dailyData.diets.map((diet: any, i: number) => (
              <div key={i} className="glass-strong border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                <Wheat className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="font-bold">{diet.name || "Dieta"}</p>
                  <p className="text-xs opacity-40">{diet.meals?.length || 0} refeições</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isPremium && (
        <div className="glass-strong border-primary/30 rounded-2xl p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-primary" />
          <div>
            <p className="font-bold text-primary">{t("summary_premium") || "Disponível no Premium"}</p>
            <p className="text-xs opacity-60">{t("summary_premium_desc") || "Exportar resumo em JSON"}</p>
          </div>
        </div>
      )}
    </div>
  )
}
