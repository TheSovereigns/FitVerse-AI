"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Trash2, Coffee, Sun, Moon as MoonIcon, Cookie, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface FoodEntry {
  id: string
  name: string
  meal: "breakfast" | "lunch" | "dinner" | "snack"
  calories: number
  protein: number
  carbs: number
  fat: number
  timestamp: string
}

const MEAL_TYPES = [
  { key: "breakfast" as const, icon: Coffee, label: { "pt-BR": "Cafe da Manha", "en-US": "Breakfast" } },
  { key: "lunch" as const, icon: Sun, label: { "pt-BR": "Almoco", "en-US": "Lunch" } },
  { key: "dinner" as const, icon: MoonIcon, label: { "pt-BR": "Jantar", "en-US": "Dinner" } },
  { key: "snack" as const, icon: Cookie, label: { "pt-BR": "Lanche", "en-US": "Snack" } },
]

function getStorageKey(userId?: string): string {
  return userId ? `fitverse-food-diary-${userId}` : "fitverse-food-diary"
}

export function FoodDiary({ onBack }: { onBack: () => void }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<FoodEntry["meal"]>("breakfast")
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" })

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey())
    if (saved) setEntries(JSON.parse(saved))
  }, [])

  const saveEntries = (newEntries: FoodEntry[]) => {
    setEntries(newEntries)
    localStorage.setItem(getStorageKey(), JSON.stringify(newEntries))
  }

  const addEntry = () => {
    if (!form.name.trim()) return
    const entry: FoodEntry = {
      id: `food-${Date.now()}`,
      name: form.name.trim(),
      meal: selectedMeal,
      calories: parseInt(form.calories) || 0,
      protein: parseInt(form.protein) || 0,
      carbs: parseInt(form.carbs) || 0,
      fat: parseInt(form.fat) || 0,
      timestamp: new Date().toISOString(),
    }
    saveEntries([entry, ...entries])
    setForm({ name: "", calories: "", protein: "", carbs: "", fat: "" })
    setShowAdd(false)
  }

  const removeEntry = (id: string) => {
    saveEntries(entries.filter(e => e.id !== id))
  }

  const today = new Date().toISOString().split("T")[0]
  const todayEntries = entries.filter(e => e.timestamp.startsWith(today))
  const totals = todayEntries.reduce(
    (acc, e) => ({ cal: acc.cal + e.calories, pro: acc.pro + e.protein, carb: acc.carb + e.carbs, fat: acc.fat + e.fat }),
    { cal: 0, pro: 0, carb: 0, fat: 0 }
  )

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="w-10 h-10 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{isEnglish ? "Food Diary" : "Diario Alimentar"}</h1>
          <p className="text-xs text-muted-foreground">{todayEntries.length} {isEnglish ? "entries today" : "registros hoje"}</p>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "kcal", value: totals.cal, color: "text-brand" },
          { label: "P", value: totals.pro, color: "text-blue-400" },
          { label: "C", value: totals.carb, color: "text-yellow-400" },
          { label: "G", value: totals.fat, color: "text-rose-400" },
        ].map(m => (
          <div key={m.label} className="glass-strong rounded-xl p-3 text-center">
            <p className={cn("text-lg font-bold", m.color)}>{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Meals */}
      {MEAL_TYPES.map(meal => {
        const mealEntries = todayEntries.filter(e => e.meal === meal.key)
        const mealCal = mealEntries.reduce((s, e) => s + e.calories, 0)
        return (
          <div key={meal.key} className="glass-strong rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <meal.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{meal.label[locale] || meal.label["pt-BR"]}</span>
                <span className="text-xs text-muted-foreground">{mealCal} kcal</span>
              </div>
              <button onClick={() => { setSelectedMeal(meal.key); setShowAdd(true) }} className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center text-brand hover:bg-brand/20 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {mealEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 text-center py-2">{isEnglish ? "No entries" : "Nenhum registro"}</p>
            ) : (
              <div className="space-y-1.5">
                {mealEntries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                      <p className="text-[10px] text-muted-foreground">{entry.calories} kcal · P{entry.protein} · C{entry.carbs} · G{entry.fat}</p>
                    </div>
                    <button onClick={() => removeEntry(entry.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdd(false)} />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md glass-strong rounded-t-3xl md:rounded-3xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">{isEnglish ? "Add Food" : "Adicionar Alimento"}</h3>
                <button onClick={() => setShowAdd(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2">
                {MEAL_TYPES.map(m => (
                  <button key={m.key} onClick={() => setSelectedMeal(m.key)}
                    className={cn("flex-1 py-2 rounded-xl text-xs font-medium transition-all",
                      selectedMeal === m.key ? "bg-brand text-white" : "bg-muted text-muted-foreground"
                    )}>
                    {m.label[locale] || m.label["pt-BR"]}
                  </button>
                ))}
              </div>

              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder={isEnglish ? "Food name" : "Nome do alimento"} className="h-11 rounded-xl" />

              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "calories", label: "kcal" },
                  { key: "protein", label: "P (g)" },
                  { key: "carbs", label: "C (g)" },
                  { key: "fat", label: "G (g)" },
                ].map(f => (
                  <Input key={f.key} type="number" value={(form as any)[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    placeholder={f.label} className="h-10 rounded-xl text-center text-xs" />
                ))}
              </div>

              <Button onClick={addEntry} disabled={!form.name.trim()}
                className="w-full h-11 rounded-xl bg-brand text-white hover:bg-brand/90 font-semibold">
                {isEnglish ? "Add" : "Adicionar"}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
