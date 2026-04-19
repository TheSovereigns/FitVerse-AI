"use client"

import { useState } from "react"
import { ArrowRight, ScanLine, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

import { useTranslation } from "@/lib/i18n"

const alternatives = [
  {
    id: "1",
    name: "Barra de Proteína Natural",
    brand: "BioFit",
    score: 88,
    price: "R$ 8,90",
    image: "/organic-protein-bar.jpg",
    highlights: ["Sem açúcar", "Orgânico"],
  },
  {
    id: "2",
    name: "Energy Bar Vegana",
    brand: "PureLife",
    score: 82,
    price: "R$ 7,50",
    image: "/vegan-energy-bar.jpg",
    highlights: ["100% vegana", "Low carb"],
  },
  {
    id: "3",
    name: "Protein Snack",
    brand: "LongeVita",
    score: 79,
    price: "R$ 9,90",
    image: "/healthy-protein-snack.jpg",
    highlights: ["Sem glúten", "Rico em fibras"],
  },
]

export function AlternativeProducts({ currentScore, onAnalyze }: { currentScore?: number; onAnalyze: (name: string, image?: string) => void }) {
  const { t } = useTranslation()
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const selectedProduct = alternatives.find((p) => p.id === selectedProductId)

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t("alt_title")}</h3>
          <Badge className="bg-primary/10 text-primary border-primary/20">{t("alt_healthier")}</Badge>
        </div>

        <div className="space-y-3">
          {alternatives.map((product) => (
            <Card key={product.id} className="p-3 hover:shadow-md transition-shadow">
              <div className="flex gap-3">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-20 h-20 rounded-lg object-cover bg-muted flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>
                    <Badge className="bg-success/10 text-success border-success/20 flex-shrink-0">
                      {product.score}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.highlights.map((highlight, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-muted">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">{product.price}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      {t("alt_view")}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">{t("alt_affiliate")}</p>
      </Card>

      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProductId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
              <DialogDescription>{selectedProduct.brand}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-center">
                <img
                  src={selectedProduct.image || "/placeholder.svg"}
                  alt={selectedProduct.name}
                  className="h-48 w-48 object-cover rounded-lg"
                />
              </div>
              <div className="flex items-center justify-between">
                <Badge className="bg-success/10 text-success border-success/20 text-lg px-3 py-1">
                  {t("alt_score_label")}{selectedProduct.score}
                </Badge>
                <span className="text-xl font-bold text-primary">{selectedProduct.price}</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium leading-none">{t("alt_highlights")}</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.highlights.map((highlight, idx) => (
                    <Badge key={idx} variant="outline" className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> {highlight}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                className="w-full mt-2"
                onClick={() =>
                  {
                    onAnalyze(selectedProduct.name, selectedProduct.image)
                    setSelectedProductId(null)
                  }
                }
              >
                <ScanLine className="w-4 h-4 mr-2" />
                {t("alt_analyze_now")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
