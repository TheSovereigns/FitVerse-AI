"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Flame, Beef, Cookie, Droplet } from "lucide-react"
import { Button } from "./ui/button"

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

export function MacroDetailModal({ macroType, products, onClose }: MacroDetailModalProps) {
  const macroInfo = {
    calories: { label: "Calorias", unit: "kcal", icon: Flame, color: "text-primary" },
    protein: { label: "Proteína", unit: "g", icon: Beef, color: "text-indigo-500 dark:text-indigo-400" },
    carbs: { label: "Carboidratos", unit: "g", icon: Cookie, color: "text-amber-500 dark:text-amber-400" },
    fat: { label: "Gordura", unit: "g", icon: Droplet, color: "text-rose-500 dark:text-rose-400" },
  };

  const currentMacro = macroInfo[macroType];
  const Icon = currentMacro.icon;

  const relevantProducts = products
    .filter(p => p.macros && p.macros[macroType] > 0)
    .sort((a, b) => b.macros[macroType] - a.macros[macroType]);

  const totalValue = relevantProducts.reduce((sum, p) => sum + p.macros[macroType], 0);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-background/80 dark:bg-gray-950/80 backdrop-blur-xl border border-border dark:border-white/10 text-foreground p-0 max-w-md md:rounded-3xl shadow-2xl dark:shadow-black/50">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <Icon className={currentMacro.color} />
            Detalhes de {currentMacro.label}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Total de hoje: <span className={`font-bold ${currentMacro.color}`}>{Math.round(totalValue)}{currentMacro.unit}</span> dos produtos analisados.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] border-y border-border dark:border-white/10">
          <div className="p-6 space-y-3">
            {relevantProducts.length > 0 ? (
              relevantProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 dark:bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img src={product.image || "/placeholder.svg?width=40&height=40"} alt={product.productName} className="w-10 h-10 rounded-md object-cover bg-muted" />
                    <span className="font-semibold text-sm text-foreground">{product.productName}</span>
                  </div>
                  <span className={`font-bold text-lg ${currentMacro.color}`}>
                    {Math.round(product.macros[macroType])}{currentMacro.unit}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10">Nenhum produto contribuiu para esta meta ainda.</p>
            )}
          </div>
        </ScrollArea>
        <div className="p-4">
            <Button onClick={onClose} variant="outline" className="w-full bg-transparent border-border hover:bg-accent">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}