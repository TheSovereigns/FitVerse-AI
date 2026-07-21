"use client"

import { useMemo, useState, useEffect } from "react"
import { logger } from "@/lib/logger"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RecipeModal } from "@/components/recipe-modal"
import {
  AlertCircle,
  ArrowRight,
  ChefHat,
  Clock,
  Flame,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

type Recipe = {
  name: string
  prepTime: string
  difficulty: string
  macros: { calories: number; protein: number; carbs: number; fat: number }
  ingredients: string[]
  instructions: string[]
  biohackingTips?: string[]
  description?: string
  servings?: number
}

type RecipesTabProps = {
  metabolicPlan?: any
}

const suggestions = ["Frango", "Ovos", "Aveia", "Salmao", "Banana"]

export function RecipesTab({ metabolicPlan }: RecipesTabProps) {
  const { t, locale } = useTranslation()
  const [ingredient, setIngredient] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const isEnglish = locale === "en-US"
  const totalCalories = useMemo(
    () => recipes.reduce((sum, recipe) => sum + (recipe.macros?.calories || 0), 0),
    [recipes]
  )

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fitverse-recipes")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) setRecipes(parsed)
      }
    } catch {}
  }, [])

  const handleGenerateRecipes = async (ingredientOverride?: string) => {
    const nextIngredient = ingredientOverride ?? ingredient
    const trimmedIngredient = nextIngredient.trim()
    if (!trimmedIngredient) {
      const message = isEnglish ? "Enter an ingredient before generating recipes." : "Digite um ingrediente antes de gerar receitas."
      setGenerationError(message)
      toast.error(message)
      return
    }

    if (ingredientOverride) {
      setIngredient(ingredientOverride)
    }

    setIsGenerating(true)
    setGenerationError(null)
    try {
      let token = ""
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes("sb-") && key.includes("-auth-token")) {
          const storedSession = localStorage.getItem(key)
          if (storedSession) {
            const parsed = JSON.parse(storedSession)
            if (parsed?.access_token) {
              token = parsed.access_token
              break
            }
          }
        }
      }

      if (!token) {
        const { data: { session } } = await supabase.auth.getSession()
        token = session?.access_token || ""
      }

      if (!token) {
        throw new Error(isEnglish ? "Please sign in again before generating recipes." : "Entre novamente antes de gerar receitas.")
      }

      const response = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName: trimmedIngredient,
          dietProfile: metabolicPlan?.goal || "Maintenance/Longevity",
          locale,
        }),
      })

      const data = await response.json().catch((e) => { logger.error("[RecipesTab] Failed to parse recipe response:", e); return null })
      if (!response.ok) {
        const message = data?.error || (isEnglish ? "Could not generate recipes right now." : "Nao foi possivel gerar receitas agora.")
        setGenerationError(message)
        toast.error(message)
        return
      }

      if (!Array.isArray(data?.recipes) || data.recipes.length === 0) {
        throw new Error(isEnglish ? "The generator did not return recipes. Try another ingredient." : "O gerador nao retornou receitas. Tente outro ingrediente.")
      }

      setRecipes(data.recipes)
      localStorage.setItem("fitverse-recipes", JSON.stringify(data.recipes))
      toast.success(isEnglish ? "Recipes generated!" : "Receitas geradas!")
    } catch (error) {
      console.error("Error generating recipes:", error)
      const message = error instanceof Error
        ? error.message
        : isEnglish
          ? "Unexpected error while generating recipes."
          : "Erro inesperado ao gerar receitas."
      setGenerationError(message)
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="relative pb-safe-nav max-w-2xl mx-auto">
      <div className="relative space-y-6">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2"
        >
          <div className="flex items-center gap-2 mb-1">
            <ChefHat className="h-4 w-4 text-brand" />
            <span className="text-xs font-medium text-brand">{isEnglish ? "AI Chef" : "IA Chef"}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t("recipes_title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("recipes_subtitle")}
          </p>
        </motion.section>

        {/* Stats */}
        {recipes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { label: isEnglish ? "Recipes" : "Receitas", value: recipes.length },
              { label: "kcal", value: totalCalories || "-" },
              { label: isEnglish ? "Mode" : "Modo", value: "AI" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl glass-strong p-3 text-center">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Search */}
        <motion.form
          id="recipe-generator-form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={(e) => {
            e.preventDefault()
            handleGenerateRecipes()
          }}
        >
          <div className="rounded-2xl glass-strong p-3">
            <div className="flex gap-2">
              <div className="flex min-h-12 flex-1 items-center gap-3 rounded-xl bg-muted/50 px-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder={t("recipes_placeholder")}
                  value={ingredient}
                  onChange={(e) => setIngredient(e.target.value)}
                  className="h-12 flex-1 border-none bg-transparent px-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                disabled={isGenerating || !ingredient.trim()}
                className="h-12 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand/90 disabled:opacity-40"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleGenerateRecipes(item)}
                  disabled={isGenerating}
                  className="shrink-0 rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-40"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </motion.form>

        {/* Error / Loading */}
        <AnimatePresence>
          {(isGenerating || generationError) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-medium",
                generationError
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                {isGenerating && !generationError ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>
                  {generationError ||
                    (isEnglish
                      ? "Generating recipes with AI..."
                      : "Gerando receitas com IA...")}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-64 rounded-2xl glass-strong p-5">
                  <div className="space-y-4">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                    <div className="space-y-2">
                      <div className="h-5 w-4/5 animate-pulse rounded-full bg-muted" />
                      <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-6">
                      {[0, 1, 2].map((macro) => (
                        <div key={macro} className="h-14 animate-pulse rounded-xl bg-muted" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : recipes.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {recipes.map((recipe, index) => (
                <RecipeCard key={`${recipe.name}-${index}`} recipe={recipe} index={index} onOpen={() => setSelectedRecipe(recipe)} />
              ))}
            </motion.div>
          ) : (
            <motion.section
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid gap-4 lg:grid-cols-[1fr_0.82fr]"
            >
              <div className="rounded-2xl glass-strong p-6">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {isEnglish ? "Turn one ingredient into a complete menu." : "Transforme um ingrediente em um menu completo."}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isEnglish
                    ? "Pick an ingredient and FitVerse returns three recipes with calories, macros, prep time and steps."
                    : "Escolha um ingrediente e o FitVerse retorna tres receitas com calorias, macros, preparo e passo a passo."}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: isEnglish ? "Protein" : "Proteina", value: "P" },
                    { label: isEnglish ? "Carbs" : "Carbos", value: "C" },
                    { label: isEnglish ? "Fat" : "Gordura", value: "G" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-bold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-muted/30 p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  {isEnglish ? "Quick picks" : "Escolhas rapidas"}
                </p>
                <div className="mt-3 grid gap-2">
                  {suggestions.slice(0, 4).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleGenerateRecipes(item)}
                      className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      <span>{item}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
      </div>
    </div>
  )
}

function RecipeCard({ recipe, index, onOpen }: { recipe: Recipe; index: number; onOpen: () => void }) {
  const macros = [
    { label: "P", value: recipe.macros?.protein || 0, color: "text-brand" },
    { label: "C", value: recipe.macros?.carbs || 0, color: "text-warning" },
    { label: "G", value: recipe.macros?.fat || 0, color: "text-destructive" },
  ]

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl glass-strong p-5 text-left transition-all duration-200 hover:bg-brand/5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          {recipe.difficulty}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white opacity-0 transition group-hover:opacity-100">
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-bold leading-tight text-foreground">
          {recipe.name}
        </h3>
        {recipe.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
            {recipe.description}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1">
          <Clock className="h-3 w-3" />
          {recipe.prepTime}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1">
          <Flame className="h-3 w-3" />
          {recipe.macros?.calories || 0} kcal
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {macros.map((macro) => (
          <div key={macro.label} className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-[10px] text-muted-foreground">{macro.label}</p>
            <p className={cn("text-sm font-bold", macro.color)}>{macro.value}g</p>
          </div>
        ))}
      </div>
    </motion.button>
  )
}
