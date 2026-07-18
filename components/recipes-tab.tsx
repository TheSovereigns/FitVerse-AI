"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Utensils,
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

      const data = await response.json().catch(() => null)
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
    <div className="relative pb-safe-nav">
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-5rem] h-64 bg-[radial-gradient(circle_at_28%_20%,rgba(255,255,255,0.08),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.05),transparent_38%)]" />

      <div className="relative space-y-5 md:space-y-7">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-4 md:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
        >
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-white/60 via-foreground/40 to-foreground/10" />
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="relative grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <ChefHat className="h-4 w-4 text-foreground/60" />
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/50">
                  {isEnglish ? "AI Chef" : "IA Chef"}
                </span>
              </div>
              <h1 className="max-w-2xl text-3xl font-black leading-[0.96] tracking-tight text-foreground md:text-5xl">
                Bio<span className="text-primary italic">{t("recipes_title").replace("Bio", "")}</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm font-bold leading-relaxed text-foreground/50 md:text-base">
                {t("recipes_subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: isEnglish ? "Generated" : "Geradas", value: recipes.length || "-" },
                { label: isEnglish ? "Calories" : "Kcal", value: totalCalories || "-" },
                { label: isEnglish ? "Mode" : "Modo", value: isEnglish ? "AI" : "IA" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
                        <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40">{item.label}</p>
                  <p className="mt-2 text-lg font-black text-foreground md:text-2xl">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.form
          id="recipe-generator-form"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={(e) => {
            e.preventDefault()
            handleGenerateRecipes()
          }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-[1.75rem] bg-white/5 blur-2xl" />
          <div className="relative rounded-[1.75rem] border border-white/10 bg-black/55 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex min-h-12 flex-1 items-center gap-3 rounded-[1.2rem] border border-white/8 bg-white/5 px-3">
                <Search className="h-5 w-5 shrink-0 text-foreground/60" />
                <Input
                  placeholder={t("recipes_placeholder")}
                  value={ingredient}
                  onChange={(e) => setIngredient(e.target.value)}
                  className="h-12 flex-1 border-none bg-transparent px-0 text-base font-black text-foreground placeholder:text-foreground/30 focus-visible:ring-0 md:text-lg"
                />
              </div>
              <Button
                type="submit"
                disabled={isGenerating || !ingredient.trim()}
                className="h-12 rounded-[1.2rem] bg-foreground px-5 text-xs font-black uppercase tracking-[0.16em] text-background shadow-[0_14px_34px_rgba(0,0,0,0.24)] hover:bg-white/90 disabled:opacity-45 md:px-7"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEnglish ? "Generating" : "Gerando"}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {t("recipes_generate_btn")}
                  </span>
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
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/60 transition hover:border-white/20 hover:bg-white/10 disabled:opacity-45"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </motion.form>

        <AnimatePresence>
          {(isGenerating || generationError) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn(
                "rounded-[1.4rem] border px-4 py-3 text-sm font-bold shadow-lg backdrop-blur-xl",
                generationError
                  ? "border-red-300/25 bg-red-500/12 text-red-100"
                  : "border-white/10 bg-white/5 text-foreground/80"
              )}
            >
              <div className="flex items-center gap-3">
                {isGenerating && !generationError ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>
                  {generationError ||
                    (isEnglish
                      ? "Generating recipes with AI. This can take a few seconds."
                      : "Gerando receitas com IA. Isso pode levar alguns segundos.")}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {[0, 1, 2].map((item) => (
                <div key={item} className="relative h-72 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/45 p-5 shadow-xl backdrop-blur-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/3" />
                  <div className="relative space-y-5">
                    <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
                    <div className="space-y-3">
                      <div className="h-7 w-4/5 animate-pulse rounded-full bg-white/8" />
                      <div className="h-4 w-full animate-pulse rounded-full bg-white/6" />
                      <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/6" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-10">
                      {[0, 1, 2].map((macro) => (
                        <div key={macro} className="h-16 animate-pulse rounded-2xl bg-white/8" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : recipes.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {recipes.map((recipe, index) => (
                <RecipeCard key={`${recipe.name}-${index}`} recipe={recipe} index={index} onOpen={() => setSelectedRecipe(recipe)} />
              ))}
            </motion.div>
          ) : (
            <motion.section
              key="empty"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="grid gap-4 lg:grid-cols-[1fr_0.82fr]"
            >
              <div className="relative min-h-[280px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/45 p-5 shadow-xl backdrop-blur-2xl md:p-6">
                <div className="absolute right-[-3rem] top-[-3rem] h-44 w-44 rounded-full bg-white/5 blur-3xl" />
                <div className="relative flex h-full flex-col justify-between gap-8">
                  <div>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-foreground/80">
                      <Utensils className="h-7 w-7" />
                    </div>
                    <h2 className="max-w-lg text-2xl font-black tracking-tight text-foreground md:text-3xl">
                      {isEnglish ? "Turn one ingredient into a complete menu." : "Transforme um ingrediente em um menu completo."}
                    </h2>
                    <p className="mt-3 max-w-xl text-sm font-bold leading-relaxed text-foreground/50">
                      {isEnglish
                        ? "Pick an ingredient and FitVerse returns three recipes with calories, macros, prep time and steps."
                        : "Escolha um ingrediente e o FitVerse retorna tres receitas com calorias, macros, preparo e passo a passo."}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: isEnglish ? "Protein" : "Proteina", value: "P" },
                      { label: isEnglish ? "Carbs" : "Carbos", value: "C" },
                      { label: isEnglish ? "Fat" : "Gordura", value: "G" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/8 bg-white/5 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40">{item.label}</p>
                        <p className="mt-2 text-2xl font-black text-primary">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-foreground/40">
                  {isEnglish ? "Fast picks" : "Escolhas rapidas"}
                </p>
                <div className="mt-4 grid gap-2">
                  {suggestions.slice(0, 4).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleGenerateRecipes(item)}
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/28 px-4 py-3 text-left font-black text-foreground transition hover:border-white/20 hover:bg-white/10"
                    >
                      <span>{item}</span>
                      <ArrowRight className="h-4 w-4 text-primary" />
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
    { label: "P", value: recipe.macros?.protein || 0, className: "text-foreground" },
    { label: "C", value: recipe.macros?.carbs || 0, className: "text-foreground/80" },
    { label: "G", value: recipe.macros?.fat || 0, className: "text-foreground/60" },
  ]

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="group relative min-h-[320px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/50 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-2xl transition hover:border-white/20"
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-foreground/40 via-foreground/30 to-foreground/10" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/3 opacity-60 transition group-hover:opacity-100" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <Badge className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-foreground/80">
            {recipe.difficulty}
          </Badge>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-primary transition group-hover:bg-foreground group-hover:text-background">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-5 flex-1">
          <h3 className="text-xl font-black leading-tight tracking-tight text-foreground md:text-2xl">
            {recipe.name}
          </h3>
          {recipe.description && (
            <p className="mt-3 line-clamp-3 text-sm font-bold leading-relaxed text-foreground/50">
              {recipe.description}
            </p>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/40">
            <span className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/5 px-2.5 py-1.5">
              <Clock className="h-3.5 w-3.5 text-foreground/60" />
              {recipe.prepTime}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/5 px-2.5 py-1.5">
              <Flame className="h-3.5 w-3.5 text-foreground/60" />
              {recipe.macros?.calories || 0} kcal
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {macros.map((macro) => (
              <div key={macro.label} className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40">{macro.label}</p>
                <p className={cn("mt-1 text-lg font-black", macro.className)}>{macro.value}g</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  )
}
