"use client"

import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  ArrowRight,
  ChefHat,
  Clock,
  Flame,
  Info,
  Sparkles,
  Utensils,
  Users,
  X,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"

type Recipe = {
  name: string
  prepTime: string
  difficulty: "Facil" | "Medio" | "Dificil" | string
  macros: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  ingredients: string[]
  instructions: string[]
  biohackingTips?: string[]
  description?: string
  servings?: number
}

interface RecipeModalProps {
  recipe: Recipe
  onClose: () => void
}

export function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  const { t } = useTranslation()
  const totalMacros = Math.max(
    1,
    (recipe.macros?.protein || 0) + (recipe.macros?.carbs || 0) + (recipe.macros?.fat || 0)
  )

  const getDifficultyLabel = (diff: string) => {
    if (["Facil", "Fácil", "FÃ¡cil", "Easy"].includes(diff)) return t("rm_easy")
    if (["Medio", "Médio", "MÃ©dio", "Medium"].includes(diff)) return t("rm_medium")
    if (["Dificil", "Difícil", "DifÃ­cil", "Hard"].includes(diff)) return t("rm_hard")
    return diff
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="h-[86vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border-none bg-transparent p-0 shadow-none md:h-[84vh]"
        showCloseButton={false}
      >
        <motion.div
          initial={{ y: 36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_24px_90px_rgba(0,0,0,0.58)] backdrop-blur-2xl"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(255,255,255,0.10),transparent_36%),radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.06),transparent_32%)]" />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative flex items-center justify-between border-b border-white/10 bg-black/35 px-4 py-3 md:px-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-foreground">
                <ChefHat className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.26em] text-foreground/40">
                  {t("rm_ga_synthesis")}
                </p>
                <p className="text-xs font-black text-foreground/70">{getDifficultyLabel(recipe.difficulty)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-foreground/70 transition hover:bg-white/16 hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <ScrollArea className="relative flex-1">
            <div className="space-y-5 p-4 pb-28 md:p-6 md:pb-28">
              <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 p-5 md:p-6">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-white/20 via-white/10 to-transparent" />
                <DialogTitle className="max-w-3xl text-2xl font-black leading-tight tracking-tight text-foreground md:text-4xl">
                  {recipe.name}
                </DialogTitle>
                {recipe.description && (
                  <DialogDescription className="mt-3 max-w-3xl text-sm font-bold leading-relaxed text-foreground/55 md:text-base">
                    {recipe.description}
                  </DialogDescription>
                )}
              </section>

              <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: t("rm_time"), val: recipe.prepTime, icon: Clock },
                  { label: t("rm_energy"), val: `${recipe.macros.calories} kcal`, icon: Flame },
                  { label: t("rm_level"), val: getDifficultyLabel(recipe.difficulty), icon: ChefHat },
                  { label: t("rm_servings"), val: recipe.servings || 1, icon: Users },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/38 p-3 shadow-lg backdrop-blur-xl md:p-4">
                    <stat.icon className="h-5 w-5 text-foreground/70" />
                    <p className="mt-3 text-lg font-black leading-tight text-foreground md:text-xl">{stat.val}</p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-foreground/38">{stat.label}</p>
                  </div>
                ))}
              </section>

              <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/42 p-4 shadow-xl backdrop-blur-2xl md:p-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-foreground">
                      {t("rm_energy")}
                    </h3>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-foreground">
                      {recipe.macros.calories} kcal
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { label: t("rm_prot"), val: recipe.macros.protein, bar: "bg-foreground/20" },
                      { label: t("rm_carb"), val: recipe.macros.carbs, bar: "bg-foreground/20" },
                      { label: t("rm_fat"), val: recipe.macros.fat, bar: "bg-foreground/20" },
                    ].map((macro) => (
                      <div key={macro.label} className="rounded-2xl border border-white/10 bg-white/10 p-3">
                        <div className="mb-2 flex items-end justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-foreground/42">{macro.label}</span>
                          <span className="text-xl font-black text-foreground">{macro.val}g</span>
                        </div>
                        <Progress
                          value={(macro.val / totalMacros) * 100}
                          className="h-2 bg-white/10"
                          indicatorClassName={macro.bar}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-black/42 p-4 shadow-xl backdrop-blur-2xl md:p-5">
                  <h3 className="mb-4 flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-foreground">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-foreground">
                      <Utensils className="h-4 w-4" />
                    </span>
                    {t("rm_ingredients")}
                  </h3>
                  <div className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <div
                        key={`${ingredient}-${index}`}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 p-3"
                      >
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-foreground/20 shadow-[0_0_18px_rgba(255,255,255,0.15)]" />
                        <span className="text-sm font-bold leading-relaxed text-foreground/76">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-black/42 p-4 shadow-xl backdrop-blur-2xl md:p-5">
                  <h3 className="mb-4 flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-foreground">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-foreground">
                      <ChefHat className="h-4 w-4" />
                    </span>
                    {t("rm_instructions")}
                  </h3>
                  <div className="space-y-3">
                    {recipe.instructions.map((step, index) => (
                      <div key={`${step}-${index}`} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sm font-black text-foreground">
                          {index + 1}
                        </div>
                        <p className="pt-1 text-sm font-bold leading-relaxed text-foreground/70">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {recipe.biohackingTips && recipe.biohackingTips.length > 0 && (
                <section className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-2xl md:p-5">
                  <h3 className="mb-4 flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-foreground">
                    <Sparkles className="h-5 w-5 text-foreground/70" />
                    {t("rm_biohacks")}
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {recipe.biohackingTips.map((tip, index) => (
                      <div key={`${tip}-${index}`} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/28 p-3">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
                        <span className="text-sm font-bold leading-relaxed text-foreground/70">{tip}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </ScrollArea>

          <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/70 p-4 backdrop-blur-2xl">
            <Button
              onClick={onClose}
              className="mx-auto flex h-12 w-full max-w-sm rounded-2xl bg-foreground text-sm font-black uppercase tracking-[0.16em] text-black shadow-[0_14px_34px_rgba(255,255,255,0.12)] hover:bg-foreground/60"
            >
              {t("rm_close")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
