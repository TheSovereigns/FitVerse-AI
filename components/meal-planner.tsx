"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  ChefHat,
  ShoppingCart,
  Copy,
  Check,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Utensils,
  Apple,
  Beef,
  Wheat,
  Carrot,
  Fish,
  Milk,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface MealItem {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface DayPlan {
  day: string
  breakfast: MealItem
  lunch: MealItem
  dinner: MealItem
  snacks: MealItem
}

interface ShoppingItem {
  name: string
  amount: string
  category: string
}

interface MealPlannerProps {
  isLocked?: boolean
  onUpgrade?: () => void
  macros?: { calories: number; protein: number; carbs: number; fat: number }
}

const CATEGORIES = [
  { key: "proteins", label: "Proteins", icon: Beef },
  { key: "carbs", label: "Carbs", icon: Wheat },
  { key: "vegetables", label: "Vegetables", icon: Carrot },
  { key: "fruits", label: "Fruits", icon: Apple },
  { key: "dairy", label: "Dairy", icon: Milk },
  { key: "other", label: "Other", icon: Utensils },
] as const

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const MEAL_ICONS: Record<string, typeof ChefHat> = {
  breakfast: Apple,
  lunch: Utensils,
  dinner: ChefHat,
  snacks: Apple,
}

export function MealPlanner({ isLocked = false, onUpgrade, macros }: MealPlannerProps) {
  const { t } = useTranslation()
  const [mealPlan, setMealPlan] = useState<DayPlan[]>([])
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [budgetLevel, setBudgetLevel] = useState<"low" | "medium" | "high">("medium")
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])

  useEffect(() => {
    try {
      const savedMeals = localStorage.getItem("fitverse-weekly-meals")
      if (savedMeals) {
        const parsed = JSON.parse(savedMeals)
        if (Array.isArray(parsed) && parsed.length > 0) setMealPlan(parsed)
      }
      const savedShopping = localStorage.getItem("fitverse-shopping-list")
      if (savedShopping) {
        const parsed = JSON.parse(savedShopping)
        if (Array.isArray(parsed)) setShoppingList(parsed)
      }
    } catch {}
  }, [])

  const generatePlan = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch("/api/generate-weekly-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          macros: macros || { calories: 2000, protein: 150, carbs: 200, fat: 70 },
          dietaryRestrictions,
          budgetLevel,
        }),
      })
      const data = await res.json()

      const mapMeal = (meals: any[], name: string): MealItem => {
        const m = meals?.find((meal: any) => {
          const lower = (meal.name || "").toLowerCase()
          return lower.includes(name)
        })
        return m ? { name: m.name, calories: m.calories || 0, protein: m.protein || 0, carbs: m.carbs || 0, fat: m.fat || 0 } : { name, calories: 0, protein: 0, carbs: 0, fat: 0 }
      }

      if (data.week && Array.isArray(data.week)) {
        const mapped: DayPlan[] = data.week.map((dayData: any) => ({
          day: dayData.day,
          breakfast: mapMeal(dayData.meals, "breakfast") || mapMeal(dayData.meals, "café") || mapMeal(dayData.meals, "manhã"),
          lunch: mapMeal(dayData.meals, "lunch") || mapMeal(dayData.meals, "almoço"),
          dinner: mapMeal(dayData.meals, "dinner") || mapMeal(dayData.meals, "jantar"),
          snacks: mapMeal(dayData.meals, "snack") || mapMeal(dayData.meals, "lanche"),
        }))
        setMealPlan(mapped)
        localStorage.setItem("fitverse-weekly-meals", JSON.stringify(mapped))
      } else if (data.mealPlan && Array.isArray(data.mealPlan)) {
        setMealPlan(data.mealPlan)
        localStorage.setItem("fitverse-weekly-meals", JSON.stringify(data.mealPlan))
      }

      if (data.shoppingList) {
        const mappedShopping: ShoppingItem[] = []
        if (Array.isArray(data.shoppingList)) {
          for (const cat of data.shoppingList) {
            if (cat.items && Array.isArray(cat.items)) {
              for (const item of cat.items) {
                mappedShopping.push({ name: item.name || item.item || "", amount: item.quantity || item.amount || "", category: "other" })
              }
            }
          }
        }
        setShoppingList(mappedShopping)
        localStorage.setItem("fitverse-shopping-list", JSON.stringify(mappedShopping))
      }
    } catch (err) {
      console.error("Failed to generate meal plan:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const swapMeal = async (dayIndex: number, mealType: string) => {
    try {
      const res = await fetch("/api/generate-weekly-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          macros: macros || { calories: 2000, protein: 150, carbs: 200, fat: 70 },
          swap: { dayIndex, mealType, currentPlan: mealPlan },
        }),
      })
      const data = await res.json()
      if (data.meal) {
        setMealPlan((prev) =>
          prev.map((day, i) =>
            i === dayIndex ? { ...day, [mealType]: data.meal } : day
          )
        )
      }
    } catch (err) {
      console.error("Failed to swap meal:", err)
    }
  }

  const groupedShopping = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {}
    for (const cat of CATEGORIES) groups[cat.key] = []
    for (const item of shoppingList) {
      const cat = CATEGORIES.find((c) => c.key === item.category) ? item.category : "other"
      groups[cat]!.push(item)
    }
    return groups
  }, [shoppingList])

  const copyShoppingList = () => {
    const text = shoppingList
      .map((item) => `${item.name} - ${item.amount}`)
      .join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLocked) {
    return (
      <div className="glass-strong border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-brand" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Weekly Meal Planner</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Upgrade to Pro or Premium to unlock AI-powered weekly meal planning with shopping lists.
        </p>
        <Button onClick={onUpgrade} className="mt-2">
          Upgrade to Pro
        </Button>
      </div>
    )
  }

  return (
    <div className="glass-strong border border-border rounded-2xl p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Weekly Meal Planner</h2>
          <p className="text-xs text-muted-foreground">Plan your meals, auto-generate shopping list</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Budget</label>
          <div className="flex gap-1">
            {(["low", "medium", "high"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setBudgetLevel(level)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors capitalize",
                  budgetLevel === level
                    ? "bg-brand text-white border-brand"
                    : "bg-transparent text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mealPlan.length === 0 && (
        <Button
          onClick={generatePlan}
          disabled={isGenerating}
          className="w-full h-11"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating plan...
            </>
          ) : (
            <>
              <ChefHat className="w-4 h-4 mr-2" />
              Generate Weekly Plan
            </>
          )}
        </Button>
      )}

      {mealPlan.length > 0 && (
        <>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generatePlan}
              disabled={isGenerating}
              className="border-border"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1", isGenerating && "animate-spin")} />
              Regenerate
            </Button>
          </div>

          <div className="space-y-2">
            {mealPlan.map((day, dayIdx) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIdx * 0.04 }}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{day.day}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {day.breakfast.calories + day.lunch.calories + day.dinner.calories + day.snacks.calories} kcal
                    </span>
                    {expandedDay === day.day ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedDay === day.day && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(["breakfast", "lunch", "dinner", "snacks"] as const).map((mealType) => {
                          const meal = day[mealType]
                          const Icon = MEAL_ICONS[mealType]!
                          return (
                            <div
                              key={mealType}
                              className="bg-muted/30 rounded-xl p-3 space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-[10px] font-medium uppercase text-muted-foreground tracking-wider">
                                    {mealType}
                                  </span>
                                </div>
                                <button
                                  onClick={() => swapMeal(dayIdx, mealType)}
                                  className="text-[10px] text-brand hover:underline"
                                >
                                  Swap
                                </button>
                              </div>
                              <p className="text-sm font-medium text-foreground">{meal.name}</p>
                              <div className="flex gap-2 text-[10px] text-muted-foreground">
                                <span>{meal.calories} kcal</span>
                                <span>P: {meal.protein}g</span>
                                <span>C: {meal.carbs}g</span>
                                <span>F: {meal.fat}g</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {shoppingList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Shopping List</h3>
                </div>
                <Button variant="outline" size="sm" onClick={copyShoppingList} className="border-border h-8">
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              {CATEGORIES.map(({ key, label, icon: Icon }) => {
                const items = groupedShopping[key]!
                if (!items.length) return null
                const isOpen = expandedCategory === key
                return (
                  <div key={key} className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isOpen ? null : key)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">{label}</span>
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {items.length}
                        </Badge>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-2 space-y-1">
                            {items.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-xs py-1"
                              >
                                <span className="text-foreground">{item.name}</span>
                                <span className="text-muted-foreground">{item.amount}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
