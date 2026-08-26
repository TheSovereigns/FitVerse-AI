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
  Heart,
  HeartOff,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
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
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])
  const [selectedPortions, setSelectedPortions] = useState<Record<number, number>>({})
  const [shoppingListRecipe, setShoppingListRecipe] = useState<string | null>(null)

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fitverse-saved-recipes")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setSavedRecipes(parsed)
      }
    } catch {}
  }, [])

  const isRecipeSaved = (recipe: Recipe) =>
    savedRecipes.some((r) => r.name === recipe.name)

  const toggleSaveRecipe = (recipe: Recipe) => {
    let updated: Recipe[]
    if (isRecipeSaved(recipe)) {
      updated = savedRecipes.filter((r) => r.name !== recipe.name)
      toast.info(isEnglish ? "Recipe removed from favorites" : "Receita removida dos favoritos")
    } else {
      updated = [...savedRecipes, recipe]
      toast.success(isEnglish ? "Recipe saved to favorites!" : "Receita salva nos favoritos!")
    }
    setSavedRecipes(updated)
    localStorage.setItem("fitverse-saved-recipes", JSON.stringify(updated))
  }

  const generateShoppingList = (recipe: Recipe, portions: number) => {
    const factor = portions / (recipe.servings || 1)
    const items = recipe.ingredients.map((ing) => {
      const match = ing.match(/^([\d.,]+)\s*([a-zA-Z]+)\s+(.+)/)
      if (match) {
        const qty = parseFloat(match[1].replace(",", "."))
        const unit = match[2]
        const name = match[3]
        const scaledQty = Math.round(qty * factor * 100) / 100
        return { name, quantity: `${scaledQty} ${unit}` }
      }
      return { name: ing, quantity: isEnglish ? "as needed" : "a gosto" }
    })

    const existing = JSON.parse(localStorage.getItem("fitverse-shopping-list") || "[]")
    const newItems = [...existing, ...items.map((i) => ({ ...i, recipeName: recipe.name }))]
    localStorage.setItem("fitverse-shopping-list", JSON.stringify(newItems))
    setShoppingListRecipe(recipe.name)
    setTimeout(() => setShoppingListRecipe(null), 2000)
    toast.success(isEnglish ? "Ingredients added to shopping list!" : "Ingredientes adicionados à lista de compras!")
  }

  const getPortions = (index: number, recipe: Recipe) =>
    selectedPortions[index] || recipe.servings || 1

  const updatePortions = (index: number, delta: number, recipe: Recipe) => {
    const current = getPortions(index, recipe)
    const next = Math.max(1, current + delta)
    setSelectedPortions((prev) => ({ ...prev, [index]: next }))
  }

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
              <div className="flex h-11 flex-1 items-center gap-3 rounded-xl bg-muted/50 px-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder={t("recipes_placeholder")}
                  value={ingredient}
                  onChange={(e) => setIngredient(e.target.value)}
                  className="h-11 flex-1 border-none bg-transparent px-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                disabled={isGenerating || !ingredient.trim()}
                aria-label={isGenerating ? "Generating" : t("recipes_generate_btn")}
                className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand/90 disabled:opacity-40"
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
                  aria-label={`Generate recipes with ${item}`}
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
                <RecipeCard
                  key={`${recipe.name}-${index}`}
                  recipe={recipe}
                  index={index}
                  portions={getPortions(index, recipe)}
                  onPortionsChange={(delta) => updatePortions(index, delta, recipe)}
                  isSaved={isRecipeSaved(recipe)}
                  onToggleSave={() => toggleSaveRecipe(recipe)}
                  onOpen={() => setSelectedRecipe(recipe)}
                />
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
                    ? "Pick an ingredient and VyseFit returns three recipes with calories, macros, prep time and steps."
                    : "Escolha um ingrediente e o VyseFit retorna tres receitas com calorias, macros, preparo e passo a passo."}
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

              <div className="rounded-2xl glass-strong p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  {isEnglish ? "Quick picks" : "Escolhas rapidas"}
                </p>
                <div className="mt-3 grid gap-2">
                  {suggestions.slice(0, 4).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleGenerateRecipes(item)}
                      aria-label={`Generate recipes with ${item}`}
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

        {/* Saved Recipes Section */}
        {savedRecipes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-destructive fill-destructive" />
              <span className="text-xs font-medium text-muted-foreground">
                {t("recipes_saved_section")}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AnimatePresence>
                {savedRecipes.map((recipe, index) => (
                  <motion.div
                    key={`saved-${recipe.name}-${index}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative rounded-xl glass-strong p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-foreground">{recipe.name}</h4>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {recipe.macros?.calories || 0} kcal · {recipe.prepTime}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedRecipe(recipe)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label={t("recipes_view")}
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSaveRecipe(recipe)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition hover:bg-destructive/20"
                          aria-label={t("recipes_unsave")}
                        >
                          <HeartOff className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}

        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            portions={getPortions(recipes.indexOf(selectedRecipe), selectedRecipe)}
            onPortionsChange={(delta) => updatePortions(recipes.indexOf(selectedRecipe), delta, selectedRecipe)}
            onGenerateShoppingList={() => generateShoppingList(selectedRecipe, getPortions(recipes.indexOf(selectedRecipe), selectedRecipe))}
            shoppingListAdded={shoppingListRecipe === selectedRecipe.name}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
      </div>
    </div>
  )
}

function RecipeCard({
  recipe,
  index,
  portions,
  onPortionsChange,
  isSaved,
  onToggleSave,
  onOpen,
}: {
  recipe: Recipe
  index: number
  portions: number
  onPortionsChange: (delta: number) => void
  isSaved: boolean
  onToggleSave: () => void
  onOpen: () => void
}) {
  const { t } = useTranslation()
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
      aria-label={`View ${recipe.name}`}
      className="group relative overflow-hidden rounded-2xl glass-strong p-5 text-left transition-all duration-200 hover:bg-brand/5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          {recipe.difficulty}
        </span>
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); onToggleSave() }}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-muted"
            aria-label={isSaved ? t("recipes_unsave") : t("recipes_save")}
          >
            <Heart
              className={cn("h-4 w-4 transition-colors", isSaved ? "text-destructive fill-destructive" : "text-muted-foreground")}
            />
          </motion.button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white opacity-0 transition group-hover:opacity-100">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
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
          {Math.round((recipe.macros?.calories || 0) * (portions / (recipe.servings || 1)))} kcal
        </span>
      </div>

      {/* Portion Adjuster */}
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <span className="text-[10px] font-medium text-muted-foreground">{t("recipes_portions")}</span>
        <div className="ml-auto flex items-center gap-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => onPortionsChange(-1)}
            disabled={portions <= 1}
            aria-label="Decrease portions"
            className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-foreground transition hover:bg-muted/80 disabled:opacity-40"
          >
            <Minus className="h-3 w-3" />
          </motion.button>
          <span className="w-6 text-center text-sm font-bold text-foreground">{portions}</span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => onPortionsChange(1)}
            aria-label="Increase portions"
            className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-foreground transition hover:bg-muted/80"
          >
            <Plus className="h-3 w-3" />
          </motion.button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {macros.map((macro) => (
          <div key={macro.label} className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-[10px] text-muted-foreground">{macro.label}</p>
            <p className={cn("text-sm font-bold", macro.color)}>
              {Math.round(macro.value * (portions / (recipe.servings || 1)))}g
            </p>
          </div>
        ))}
      </div>
    </motion.button>
  )
}
