"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, Flame, ChefHat, Utensils, Activity, CheckCircle2, Sparkles, Zap, Beef, Cookie, Droplet } from "lucide-react"

type Recipe = { // Tipo unificado para consistência
  name: string;
  prepTime: string;
  difficulty: "Fácil" | "Médio" | "Difícil";
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: string[];
  instructions: string[];
  biohackingTips?: string[];
  description?: string;
  servings?: number;
}

interface RecipeModalProps {
  recipe: Recipe
  onClose: () => void
}

export function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0 gap-0 bg-zinc-950/90 backdrop-blur-xl border border-primary/30 shadow-[0_0_50px_rgba(249,115,22,0.15)] rounded-3xl overflow-hidden" showCloseButton={false}>
        <ScrollArea className="flex-1 p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Receita Inteligente</h2>
            <p className="text-zinc-500 text-sm">Análise e Preparo Guiado por IA</p>
          </div>

          <div className="mb-8 text-center">
            <DialogTitle className="text-3xl font-bold text-primary">{recipe.name}</DialogTitle>
            <DialogDescription className="text-base text-zinc-400 mt-1 max-w-2xl mx-auto">
              {recipe.description}
            </DialogDescription>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/40 rounded-xl border border-primary/20 aspect-square">
              <Clock className="w-5 h-5 mb-2 text-primary" />
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Tempo</span>
              <span className="font-bold text-white">{recipe.prepTime}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/40 rounded-xl border border-primary/20 aspect-square">
              <Flame className="w-5 h-5 mb-2 text-primary" />
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Calorias</span>
              <span className="font-bold text-white">{recipe.macros.calories}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/40 rounded-xl border border-primary/20 aspect-square">
              <ChefHat className="w-5 h-5 mb-2 text-primary" />
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Dificuldade</span>
              <span className="font-bold text-white">{recipe.difficulty}</span>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-primary border-b border-primary/20 pb-2">
                <Utensils className="w-5 h-5" />
                Ingredientes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="relative p-3 text-center bg-zinc-900/40 rounded-lg border border-primary/20">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50 rounded-tl-md" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/50 rounded-tr-md" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/50 rounded-bl-md" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50 rounded-br-md" />
                    <span className="text-sm text-zinc-300 leading-tight">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-primary border-b border-primary/20 pb-2">
                <ChefHat className="w-5 h-5" />
                Modo de Preparo
              </h3>
              <div className="space-y-6">
                {recipe.instructions.map((step, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-900 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed pt-1.5 text-zinc-400 group-hover:text-white transition-colors">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {recipe.biohackingTips && recipe.biohackingTips.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-emerald-400 border-b border-emerald-400/20 pb-2">
                  <Sparkles className="w-5 h-5" />
                  Dicas de Biohacking
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {recipe.biohackingTips.map((tip, index) => (
                    <div key={index} className="relative p-3 text-center bg-emerald-950/20 rounded-lg border border-emerald-500/30">
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-500/50 rounded-tl-md" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500/50 rounded-tr-md" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-500/50 rounded-bl-md" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-emerald-500/50 rounded-br-md" />
                      <span className="text-sm text-emerald-200 leading-tight">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-primary/20 bg-black/50">
          <Button onClick={onClose} className="w-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20" variant="outline">Fechar Receita</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}