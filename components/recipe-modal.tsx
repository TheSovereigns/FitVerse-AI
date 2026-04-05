"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  Clock, 
  Flame, 
  ChefHat, 
  Utensils, 
  Activity, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Beef, 
  Cookie, 
  Droplet,
  ArrowRight,
  ChevronRight,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"

import { useTranslation } from "@/lib/i18n"

type Recipe = {
  name: string;
  prepTime: string;
  difficulty: "Fácil" | "Médio" | "Difícil" | string;
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
  const { t } = useTranslation()

  const getDifficultyLabel = (diff: string) => {
    if (diff === "Fácil" || diff === "Easy") return t("rm_easy")
    if (diff === "Médio" || diff === "Medium") return t("rm_medium")
    if (diff === "Difícil" || diff === "Hard") return t("rm_hard")
    return diff
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>      
      <DialogContent className="max-w-3xl w-full h-[80vh] md:h-[80vh] flex flex-col p-0 gap-0 bg-transparent border-none shadow-none rounded-[2rem] overflow-hidden" showCloseButton={false}>
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-1 glass-strong border-t border-white/20 rounded-[2rem] flex flex-col overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
        >
          {/* Header Bar */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2 shrink-0" />
          
          <ScrollArea className="flex-1">
            <div className="p-4 md:p-6 space-y-6 pb-28">
              {/* Hero Section */}
              <div className="text-center space-y-6">
               <div className="flex items-center justify-center gap-3">
                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40">{t("rm_ga_synthesis")}</span>
                 </div>
                 <DialogTitle className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                    {recipe.name}
                 </DialogTitle>
                 {recipe.description && (
                   <DialogDescription className="text-sm md:text-base font-bold text-muted-foreground opacity-50 italic max-w-2xl mx-auto leading-relaxed">
                     "{recipe.description}"
                   </DialogDescription>
                 )}
              </div>

               {/* Quick Stats Bento */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                  { label: t("rm_time"), val: recipe.prepTime, icon: Clock, color: "text-blue-400" },
                  { label: t("rm_energy"), val: recipe.macros.calories + " kcal", icon: Flame, color: "text-rose-500" },
                  { label: t("rm_level"), val: getDifficultyLabel(recipe.difficulty), icon: ChefHat, color: "text-amber-400" },
                  { label: t("rm_servings"), val: recipe.servings || 1, icon: Utensils, color: "text-emerald-400" }
                ].map((stat, i) => (
                  <div key={i} className="glass-strong border-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all">
                    <stat.icon className={cn("w-4 h-4 md:w-6 md:h-6", stat.color)} />
                    <div className="text-center">
                       <p className="text-lg md:text-2xl font-black text-foreground tracking-tighter">{stat.val}</p>
                       <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-30 mt-1">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Macros Breakdown */}
              <div className="p-10 glass-strong border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 mesh-gradient opacity-10 group-hover:opacity-20 transition-opacity" />
                 <div className="relative z-10 grid grid-cols-3 gap-8">
                    {[
                      { label: t("rm_prot"), val: recipe.macros.protein, color: "bg-blue-500" },
                      { label: t("rm_carb"), val: recipe.macros.carbs, color: "bg-amber-500" },
                      { label: t("rm_fat"), val: recipe.macros.fat, color: "bg-rose-500" }
                    ].map((m, i) => (
                      <div key={i} className="space-y-4">
                         <div className="flex items-end justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{m.label}</span>
                            <span className="text-2xl font-black text-foreground">{m.val}g</span>
                         </div>
                         <Progress value={(m.val / (recipe.macros.protein + recipe.macros.carbs + recipe.macros.fat)) * 100} className="h-2 bg-white/5" indicatorClassName={m.color} />
                      </div>
                    ))}
                 </div>
              </div>

               <div className="grid md:grid-cols-2 gap-6">
                {/* Ingredients Column */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3 italic">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                       <Utensils className="w-4 h-4" />
                    </div>
                    {t("rm_ingredients")}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <motion.div 
                        key={index}
                        whileHover={{ x: 5 }}
                        className="p-3 glass-strong border-white/5 rounded-2xl flex items-center gap-3 group"
                      >
                         <div className="w-3 h-3 rounded-full border-2 border-primary/30 group-hover:bg-primary group-hover:border-primary transition-all shrink-0" />
                         <span className="text-sm font-bold text-foreground/80 group-hover:text-foreground transition-colors">{ingredient}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Instructions Column */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3 italic">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                       <ChefHat className="w-4 h-4" />
                    </div>
                    {t("rm_instructions")}
                  </h3>
                  <div className="space-y-3">
                    {recipe.instructions.map((step, index) => (
                      <div key={index} className="flex gap-3 group">
                        <div className="shrink-0 w-8 h-8 rounded-xl glass-strong border-primary/20 text-primary flex items-center justify-center font-black text-sm shadow-lg transition-all group-hover:bg-primary group-hover:text-white">
                          {index + 1}
                        </div>
                        <p className="text-sm font-bold leading-relaxed text-muted-foreground group-hover:text-foreground transition-all pt-1">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Biohacking Tips Bento */}
              {recipe.biohackingTips && recipe.biohackingTips.length > 0 && (
                <div className="p-6 glass-strong border-emerald-500/20 rounded-2xl shadow-xl relative overflow-hidden">
                   <div className="absolute inset-0 bg-emerald-500/5 opacity-50" />
                   <div className="relative z-10">
                      <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3 text-emerald-400 italic mb-4">
                         <Sparkles className="w-5 h-5 animate-pulse" />
                         {t("rm_biohacks")}
                      </h3>
                       <div className="grid md:grid-cols-2 gap-3">
                         {recipe.biohackingTips.map((tip, index) => (
                           <div key={index} className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                             <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                             <span className="text-sm font-bold text-emerald-100/80 leading-relaxed">{tip}</span>
                           </div>
                         ))}
                       </div>
                   </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Action Bar */}
          <div className="absolute bottom-0 inset-x-0 glass-strong border-t border-white/10 p-4 flex items-center justify-center gap-4 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <Button 
              onClick={onClose} 
              className="w-full max-w-sm h-14 rounded-2xl mesh-gradient text-white font-black text-base uppercase tracking-widest shadow-xl haptic-press"
            >
              {t("rm_close")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}