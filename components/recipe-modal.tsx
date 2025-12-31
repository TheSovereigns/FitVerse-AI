"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Clock, Flame, ChefHat, Utensils, Activity, CheckCircle2, Sparkles } from "lucide-react"

interface Recipe {
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
  description?: string
}

interface RecipeModalProps {
  recipe: Recipe
  onClose: () => void
}

export function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0" showCloseButton={false}>
        <ScrollArea className="flex-1 p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-primary">{recipe.name}</DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  {recipe.description}
                </DialogDescription>
              </div>
              <Badge 
                variant={
                  recipe.difficulty === "Fácil" ? "secondary" : 
                  recipe.difficulty === "Médio" ? "default" : "destructive"
                }
                className="shrink-0"
              >
                {recipe.difficulty}
              </Badge>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-xl border border-border/50">
              <Clock className="w-5 h-5 mb-2 text-primary" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tempo</span>
              <span className="font-bold">{recipe.prepTime}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-xl border border-border/50">
              <Flame className="w-5 h-5 mb-2 text-orange-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Calorias</span>
              <span className="font-bold">{recipe.macros.calories}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-xl border border-border/50">
              <Activity className="w-5 h-5 mb-2 text-blue-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Proteína</span>
              <span className="font-bold">{recipe.macros.protein}g</span>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-primary border-b pb-2">
                <Utensils className="w-5 h-5" />
                Ingredientes
              </h3>
              <ul className="grid gap-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm bg-muted/30 p-3 rounded-lg border border-transparent hover:border-border/50 transition-colors">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="leading-relaxed">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-primary border-b pb-2">
                <ChefHat className="w-5 h-5" />
                Modo de Preparo
              </h3>
              <div className="space-y-6">
                {recipe.instructions.map((step, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed pt-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {recipe.biohackingTips && recipe.biohackingTips.length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
                <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                  Dicas de Biohacking
                </h3>
                <ul className="space-y-3">
                  {recipe.biohackingTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-emerald-900/80 dark:text-emerald-100/80">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button onClick={onClose} className="w-full" variant="outline">Fechar Receita</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}