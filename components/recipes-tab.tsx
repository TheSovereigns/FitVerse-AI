"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RecipeModal } from "@/components/recipe-modal"
import { ChefHat, Clock, Target, Flame, Search, Loader2, ArrowRight } from "lucide-react"

type Recipe = {
  name: string
  prepTime: string
  difficulty: "Fácil" | "Médio" | "Difícil"
  macros: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  ingredients: string[]
  instructions: string[]
  biohackingTips: string[]
  description?: string // Added description field
}

type RecipesTabProps = {
  metabolicPlan?: any
}

export function RecipesTab({ metabolicPlan }: RecipesTabProps) {
  const [ingredient, setIngredient] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])

  const handleGenerateRecipes = async () => {
    if (!ingredient.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: ingredient,
          dietProfile: metabolicPlan?.goal || "Manutenção/Longevidade",
        }),
      })

      if (!response.ok) throw new Error("Failed to generate recipes")

      const data = await response.json()
      setRecipes(data.recipes)
    } catch (error) {
      console.error("Error generating recipes:", error)
      alert("Erro ao gerar receitas. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "Médio":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case "Difícil":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleSaveRecipe = (recipe: Recipe) => {
    setSavedRecipes((prev) => {
      const exists = prev.some((r) => r.name === recipe.name)
      if (exists) return prev
      return [recipe, ...prev]
    })
  }

  return (
    <div className="px-4 pt-8 pb-24 text-foreground bg-background min-h-screen">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-4xl font-black mb-2 text-balance tracking-tighter uppercase italic">
          Receitas <span className="text-primary">Inteligentes</span>
        </h1>
        <p className="text-muted-foreground text-pretty font-medium text-sm">
          Gere receitas personalizadas com base no seu perfil e ingredientes.
        </p>
      </div>

      {/* Container Principal */}
      <form onSubmit={(e) => { e.preventDefault(); handleGenerateRecipes(); }} className="relative bg-card border border-border rounded-[2rem] p-6 overflow-hidden border-b-[6px] border-b-primary shadow-2xl">
        {/* Cantoneiras Iluminadas (4 cantos) */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-xl opacity-80" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-xl opacity-80" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-xl opacity-80" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-xl opacity-80" />
        
        {/* Glow de Fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-[0.03] blur-[80px] pointer-events-none" />

        <div className="space-y-8 relative z-10">
          {/* Cabeçalho da Seção */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_0_20px_rgba(255,140,0,0.3)]">
              <ChefHat className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="font-black text-xl uppercase tracking-tight text-foreground">Gerador de Receitas</h3>
              <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Powered by IA</p>
            </div>
          </div>

          {/* Input de Ingredientes */}
          <div className="space-y-2">
            <Label htmlFor="ingredient" className="text-sm font-medium text-muted-foreground">
              Ingrediente Principal
            </Label>
            <Input
              id="ingredient"
              placeholder="Ex: frango, ovos, batata doce..."
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              className="h-12 px-4 bg-muted/50 border border-input focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground rounded-xl transition-all"
            />
          </div>

          {/* Botão de Ação */}
          <Button
            type="submit"
            className="w-full h-16 bg-primary hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(255,140,0,0.4)] text-primary-foreground font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 group"
            disabled={isGenerating || !ingredient.trim()}
          >
            {isGenerating ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                GERANDO...
              </div>
            ) : (
              <>
                GERAR 3 RECEITAS
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </form>

      {(isGenerating || recipes.length > 0) && (
        <div className="w-full space-y-4 mb-8 mt-12">
          <h2 className="text-xl font-bold text-foreground text-center">Receitas Geradas</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {isGenerating ? (
              [...Array(3)].map((_, index) => (
                <div key={index} className="bg-card/50 border border-border rounded-2xl p-4 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-muted rounded w-full mb-4"></div>
                  <div className="flex gap-4">
                    <div className="h-5 bg-muted rounded w-1/4"></div>
                    <div className="h-5 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              ))
            ) : (
              recipes.map((recipe, index) => (
              <div
                key={index}
                className="overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer border border-border hover:border-primary/30 bg-card backdrop-blur-xl rounded-2xl p-4"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-lg font-bold text-foreground text-balance">{recipe.name}</h4>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap ${getDifficultyColor(recipe.difficulty)}`}
                    >
                      {recipe.difficulty}
                    </span>
                  </div>
                  {recipe.description && (
                    <p className="text-muted-foreground text-pretty leading-relaxed mt-2 text-sm">{recipe.description}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{recipe.prepTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-primary" />
                      <span>{recipe.macros.calories} kcal</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-muted border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">Proteína</p>
                      <p className="text-sm font-bold text-foreground">{recipe.macros.protein}g</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">Carbos</p>
                      <p className="text-sm font-bold text-foreground">{recipe.macros.carbs}g</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">Gordura</p>
                      <p className="text-sm font-bold text-foreground">{recipe.macros.fat}g</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSaveRecipe(recipe)
                    }}
                  >
                    Salvar Receita
                  </Button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {savedRecipes.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-bold text-foreground">Receitas Salvas</h2>
          <div className="grid gap-4">
            {savedRecipes.map((recipe, index) => (
              <div
                key={index}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-card/50 border border-border rounded-xl p-4"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="pb-3">
                  <h4 className="text-base font-bold text-foreground text-balance">{recipe.name}</h4>
                </div>
                <div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.prepTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      <span>{recipe.macros.calories} kcal</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
    </div>
  )
}
