"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RecipeModal } from "@/components/recipe-modal"
import { ChefHat, Clock, Flame, Loader2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { usePlanLimits } from "@/hooks/usePlanLimits"
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

export function RecipesTab({ metabolicPlan }: RecipesTabProps) {
  const { t, locale } = useTranslation()
  const { plan, canGenerateDiet: checkCanGenerateDiet } = usePlanLimits()
  const [ingredient, setIngredient] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])

  const handleGenerateRecipes = async () => {
    if (!ingredient.trim()) return
    
    const dietsThisMonth = recipes.length
    if (!checkCanGenerateDiet(dietsThisMonth)) {
      toast.error(t("page_limit_diet") || "Limite mensal de dietas atingido. Atualize para um plano superior!")
      return
    }

    setIsGenerating(true)
    try {
      // Get token from localStorage directly
      let token = ''
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('sb-') && key.includes('-auth-token')) {
          const storedSession = localStorage.getItem(key)
          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession)
              if (parsed?.access_token) {
                token = parsed.access_token
                break
              }
            } catch {
              // Skip invalid entries
            }
          }
        }
      }
      
      if (!token) {
        toast.error("Usuário não autenticado. Faça login novamente.")
        setIsGenerating(false)
        return
      }
      
      const response = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          productName: ingredient,
          dietProfile: metabolicPlan?.goal || "Maintenance/Longevity",
          locale,
        }),
      })

      let data;
      try {
        data = await response.json();
      } catch {
        toast.error("Erro ao gerar receitas. Tente novamente.");
        setIsGenerating(false);
        return;
      }
      if (!response.ok) {
        toast.error(data?.error || "Erro ao gerar receitas")
        setIsGenerating(false)
        return
      }
      if (!data?.recipes) {
        toast.error("Erro ao gerar receitas. Tente novamente.");
        setIsGenerating(false);
        return;
      }
      setRecipes(data.recipes)
    } catch (error) {
      console.error("Error generating recipes:", error)
      toast.error("Erro ao gerar receitas")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col space-y-5 md:space-y-8 pb-safe-nav">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-none">
          Bio<span className="text-primary italic">{t("recipes_title").replace("Bio", "")}</span>
        </h1>
        <p className="text-xs md:text-lg font-bold text-muted-foreground mt-2 md:mt-3 opacity-50 uppercase tracking-[0.2em]">
          {t("recipes_subtitle")}
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.form
        id="recipe-generator-form"
        onSubmit={(e) => { e.preventDefault(); handleGenerateRecipes() }}
        className="relative group haptic-press"
      >
        <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-[1.5rem] md:rounded-[2.5rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000" />
        <div className="relative glass-strong border-white/20 rounded-[1.5rem] md:rounded-[2.5rem] p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-xl">
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-primary/10 items-center justify-center text-primary shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <Input
            placeholder={t("recipes_placeholder")}
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            className="flex-1 bg-transparent border-none text-base md:text-xl font-black placeholder:opacity-30 h-12 px-4 focus-visible:ring-0"
          />
          <Button
            type="submit"
            disabled={isGenerating || !ingredient.trim()}
            className="h-12 px-5 md:px-8 rounded-[1.25rem] md:rounded-[1.5rem] mesh-gradient text-white font-black text-xs md:text-base shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : t("recipes_generate_btn")}
          </Button>
        </div>
      </motion.form>

      {/* Results Grid */}
      <AnimatePresence mode="wait">
        {(isGenerating || recipes.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
          >
            {isGenerating ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-48 md:h-56 lg:h-60 xl:h-64 glass-strong rounded-[1.5rem] md:rounded-[2rem] animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 mesh-gradient opacity-10" />
                </div>
              ))
            ) : (
              recipes.map((recipe, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative h-48 md:h-56 lg:h-60 xl:h-64 glass-strong border-white/20 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-5 flex flex-col justify-between overflow-hidden cursor-pointer shadow-xl group ios-active"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    <Badge className="bg-primary/20 text-primary border-none font-black text-[8px] tracking-widest px-2 py-1 rounded-full mb-2 md:mb-3">
                      {recipe.difficulty.toUpperCase()}
                    </Badge>
                    <h3 className="text-lg md:text-2xl font-black text-foreground tracking-tighter leading-tight group-hover:text-primary transition-colors">
                      {recipe.name}
                    </h3>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex gap-2 md:gap-3 text-[8px] md:text-xs font-black uppercase tracking-widest opacity-40">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.prepTime}</span>
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {recipe.macros.calories} KCAL</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i =>
                          <div key={i} className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center font-black text-[7px] md:text-[9px] text-primary">{recipe.macros.protein}g</div>
                        )}
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Recipes */}
      {savedRecipes.length > 0 && (
        <div className="mt-6 md:mt-10">
          <h3 className="text-lg md:text-2xl font-black tracking-tighter text-foreground mb-4 md:mb-6 px-1 md:px-2">{t("recipes_saved_title")}</h3>
          <div className="glass-strong border-white/20 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-xl p-2 md:p-3 lg:p-4 xl:p-6">
            {savedRecipes.map((r, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 4 }}
                className="p-3 md:p-5 flex items-center gap-3 md:gap-5 glass rounded-[1rem] md:rounded-[1.5rem] border-white/10 cursor-pointer haptic-press group mb-1.5 md:mb-2 last:mb-0"
                onClick={() => setSelectedRecipe(r)}
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-[1rem] md:rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <ChefHat className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm md:text-lg font-black tracking-tighter">{r.name}</h4>
                  <p className="text-[8px] md:text-xs font-black uppercase tracking-[0.15em] opacity-40">{r.prepTime} • {r.macros.calories} CAL</p>
                </div>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 opacity-20 group-hover:opacity-100" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
    </div>
  )
}
