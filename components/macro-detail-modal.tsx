"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Flame, Beef, Cookie, Droplet, ArrowRight, Zap, Target, Activity, X } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

interface ProductAnalysis {
  productName: string;
  image?: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface MacroDetailModalProps {
  macroType: 'calories' | 'protein' | 'carbs' | 'fat';
  products: ProductAnalysis[];
  onClose: () => void;
}

import { useTranslation } from "@/lib/i18n"

export function MacroDetailModal({ macroType, products, onClose }: MacroDetailModalProps) {
  const { t, locale } = useTranslation()
  const macroInfo = {
    calories: { label: t("home_calorie_label"), unit: "kcal", icon: Flame, color: "text-primary", bg: "bg-primary/20" },
    protein: { label: t("md_protein"), unit: "g", icon: Beef, color: "text-blue-400", bg: "bg-blue-400/20" },
    carbs: { label: t("md_carbs"), unit: "g", icon: Cookie, color: "text-amber-400", bg: "bg-amber-400/20" },
    fat: { label: t("md_fat"), unit: "g", icon: Droplet, color: "text-rose-400", bg: "bg-rose-400/20" },
  };

  const currentMacro = macroInfo[macroType];
  const Icon = currentMacro.icon;

  const relevantProducts = products
    .filter(p => p.macros && p.macros[macroType] > 0)
    .sort((a, b) => b.macros[macroType] - a.macros[macroType]);

  const totalValue = relevantProducts.reduce((sum, p) => sum + p.macros[macroType], 0);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl w-full h-[85vh] md:h-[80vh] flex flex-col p-0 gap-0 bg-transparent border-none shadow-none overflow-hidden" showCloseButton={false}>
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-1 glass-strong border-t border-white/20 rounded-[4rem] flex flex-col overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
        >
          {/* Header Bar */}
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2 shrink-0" />

          {/* Action Header */}
          <div className="flex items-center justify-between px-10 py-6 border-b border-white/10 shrink-0">
             <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner", currentMacro.bg)}>
                   <Icon className={cn("w-5 h-5", currentMacro.color)} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">{t("lp_bio_modules")}</span>
             </div>
             <Button variant="ghost" onClick={onClose} className="rounded-full hover:bg-white/10 text-foreground/40 hover:text-foreground">
                <X className="w-6 h-6" />
             </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-10 space-y-12 pb-32">
               {/* Hero Stats */}
               <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-3">
                     <Activity className="w-4 h-4 text-primary animate-pulse" />
                      <h2 className="text-xl font-bold text-muted-foreground opacity-50 uppercase tracking-[0.3em]">{locale === "en-US" ? "Concentration of" : "Concentração de"} {currentMacro.label}</h2>
                  </div>
                  <div className="relative inline-block">
                     <div className={cn("absolute inset-0 blur-[40px] opacity-20 rounded-full", currentMacro.bg)} />
                     <p className={cn("text-8xl font-black tracking-tighter leading-none relative", currentMacro.color)}>
                        {Math.round(totalValue)}<span className="text-3xl opacity-40 ml-2 tracking-normal">{currentMacro.unit}</span>
                     </p>
                  </div>
               </div>

               {/* Product Breakdown List */}
               <div className="space-y-6">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 px-4">{locale === "en-US" ? "Identified Sources" : "Fontes Identificadas"}</h3>
                  <div className="grid gap-4">
                    {relevantProducts.length > 0 ? (
                      relevantProducts.map((product, index) => (
                        <motion.div 
                          key={index} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-5 glass border-white/5 rounded-[2.5rem] group hover:bg-white/5 transition-all"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                               <img src={product.image || "/placeholder.svg"} alt={product.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                               <p className="text-lg font-black text-foreground tracking-tight leading-tight mb-1">{product.productName}</p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{locale === "en-US" ? "Mapped via Scan" : "Mapeado via Scan"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className={cn("text-2xl font-black leading-none", currentMacro.color)}>
                               {Math.round(product.macros[macroType])}<span className="text-xs ml-1 opacity-40 font-bold uppercase tracking-normal">{currentMacro.unit}</span>
                             </div>
                             {/* Progress mini bar */}
                             <div className="mt-2 w-16 h-1 bg-white/5 rounded-full overflow-hidden ml-auto">
                                <div 
                                  className={cn("h-full", currentMacro.color.replace("text-", "bg-"))} 
                                  style={{ width: `${(product.macros[macroType] / totalValue) * 100}%` }} 
                                />
                             </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-20 glass border-white/5 rounded-[3.5rem] opacity-20">
                         <Target className="w-12 h-12 mx-auto mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest">{locale === "en-US" ? "No data captured" : "Nenhum dado captado"}</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </ScrollArea>

          {/* Action Bar */}
          <div className="absolute bottom-0 inset-x-0 glass-strong border-t border-white/10 p-8 flex items-center justify-center z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <Button 
              onClick={onClose} 
              className="w-full max-w-sm h-16 rounded-3xl mesh-gradient text-white font-black text-xs uppercase tracking-widest shadow-2xl haptic-press scale-animation"
            >
              {locale === "en-US" ? "RETURN TO DASHBOARD" : "RETORNAR AO DASHBOARD"}
              <ArrowRight className="ml-4 w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}