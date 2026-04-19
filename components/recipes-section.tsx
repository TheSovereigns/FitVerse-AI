"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChefHat, Clock, Users, Flame, Sparkles } from "lucide-react"
import { RecipeModal } from "./recipe-modal"
import { useTranslation } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Recipe {
  name: string
  description: string
  prepTime: string
  difficulty: "Fácil" | "Médio" | "Difícil"
  servings: number
  macros: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  ingredients: string[]
  instructions: string[]
  biohackingTips?: string[]
}

interface RecipesSectionProps {
  productName: string
  dietProfile?: string[]
}

export function RecipesSection({ productName, dietProfile }: RecipesSectionProps) {
  const { t, locale } = useTranslation()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [showRecipeModal, setShowRecipeModal] = useState(false)

  const handleGenerateRecipes = async () => {
    setIsLoading(true)
    try {
      // Get token from localStorage directly
      let token = ''
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('sb-') && key.includes('-auth-token')) {
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
      
      const response = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ productName, dietProfile, locale }),
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || (locale === "en-US" ? "Error generating recipes" : "Erro ao gerar receitas"))
        return
      }
      console.log("[Fitverse] Recipes generated:", data.recipes)
      setRecipes(data.recipes)
    } catch (error) {
      console.error("[Fitverse] Error generating recipes:", error)
      alert(locale === "en-US" ? "Error generating recipes. Please try again." : "Erro ao gerar receitas. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setShowRecipeModal(true)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
      case "Easy":
        return "bg-success/10 text-success border-success/20"
      case "Médio":
      case "Medium":
        return "bg-warning/10 text-warning border-warning/20"
      case "Difícil":
      case "Hard":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted"
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === "Fácil" || difficulty === "Easy") return locale === "en-US" ? "Easy" : "Fácil"
    if (difficulty === "Médio" || difficulty === "Medium") return locale === "en-US" ? "Medium" : "Médio"
    if (difficulty === "Difícil" || difficulty === "Hard") return locale === "en-US" ? "Hard" : "Difícil"
    return difficulty
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ChefHat className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{locale === "en-US" ? "Smart Recipes" : "Receitas Inteligentes"}</h3>
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {locale === "en-US"
                ? `Generate healthy recipes using ${productName} as an ingredient`
                : `Gere receitas saudáveis usando ${productName} como ingrediente`}
            </p>
            <Button onClick={handleGenerateRecipes} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {locale === "en-US" ? "Generating recipes..." : "Gerando receitas..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {locale === "en-US" ? "Generate Fit Recipes" : "Gerar Receitas Fit"}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe, index) => (
              <Card
                key={index}
                className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleRecipeClick(recipe)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-semibold text-sm flex-1">{recipe.name}</h4>
                  <Badge variant="outline" className={getDifficultyColor(recipe.difficulty)}>
                    {getDifficultyLabel(recipe.difficulty)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{recipe.description}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {recipe.prepTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                  {recipe.servings || 1}x
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {recipe.macros.calories} kcal
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="text-xs bg-muted">
                    P: {recipe.macros.protein}g
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-muted">
                    C: {recipe.macros.carbs}g
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-muted">
                    G: {recipe.macros.fat}g
                  </Badge>
                </div>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={handleGenerateRecipes}
              disabled={isLoading}
              className="w-full mt-2 bg-transparent"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {locale === "en-US" ? "Generating..." : "Gerando..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {locale === "en-US" ? "Generate New Recipes" : "Gerar Novas Receitas"}
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {selectedRecipe && showRecipeModal && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => {
            setShowRecipeModal(false)
            setSelectedRecipe(null)
          }}
        />
      )}
    </>
  )
}
