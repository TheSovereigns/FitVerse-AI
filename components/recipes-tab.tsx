"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RecipeModal } from "@/components/recipe-modal"
import { ChefHat, Clock, Target, Sparkles, Search, Loader2 } from "lucide-react"

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
    <div className="px-4 pt-8 pb-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/50">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-balance text-foreground">Receitas Inteligentes</h1>
            <p className="text-sm text-muted-foreground">Geradas por IA para seu perfil</p>
          </div>
        </div>
      </div>

      {metabolicPlan && (
        <Card className="mb-6 border-primary/30 bg-card shadow-lg shadow-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/30">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Suas Metas Diárias</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-background/80 border">
                    {metabolicPlan.dailyCalories} kcal
                  </span>
                  <span className="px-2 py-1 rounded-full bg-background/80 border">
                    {metabolicPlan.macros?.protein}g proteína
                  </span>
                  <span className="px-2 py-1 rounded-full bg-background/80 border">
                    {metabolicPlan.macros?.carbs}g carbos
                  </span>
                  <span className="px-2 py-1 rounded-full bg-background/80 border">
                    {metabolicPlan.macros?.fat}g gordura
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8 shadow-lg border-primary/30 shadow-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Gerar Receitas Fit</CardTitle>
          <CardDescription>Digite um ingrediente ou produto para criar receitas personalizadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ingredient">Ingrediente ou Produto</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="ingredient"
                placeholder="Ex: frango, ovos, batata doce..."
                value={ingredient}
                onChange={(e) => setIngredient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateRecipes()}
                className="pl-10"
              />
            </div>
          </div>

          <Button onClick={handleGenerateRecipes} disabled={isGenerating || !ingredient.trim()} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando Receitas...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar 3 Receitas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {recipes.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-foreground">Receitas Geradas</h2>
          <div className="grid gap-4">
            {recipes.map((recipe, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer border-primary/20 hover:border-primary/60 bg-card"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg text-balance">{recipe.name}</CardTitle>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap ${getDifficultyColor(recipe.difficulty)}`}
                    >
                      {recipe.difficulty}
                    </span>
                  </div>
                  {recipe.description && (
                    <CardDescription className="text-pretty leading-relaxed mt-2">{recipe.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
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

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <p className="text-xs text-muted-foreground mb-0.5">Proteína</p>
                      <p className="text-sm font-bold text-blue-600">{recipe.macros.protein}g</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <p className="text-xs text-muted-foreground mb-0.5">Carbos</p>
                      <p className="text-sm font-bold text-amber-600">{recipe.macros.carbs}g</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                      <p className="text-xs text-muted-foreground mb-0.5">Gordura</p>
                      <p className="text-sm font-bold text-rose-600">{recipe.macros.fat}g</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {savedRecipes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Receitas Salvas</h2>
          <div className="grid gap-4">
            {savedRecipes.map((recipe, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-balance">{recipe.name}</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
    </div>
  )
}
