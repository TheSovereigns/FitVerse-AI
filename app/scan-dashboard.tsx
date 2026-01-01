"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload } from "lucide-react"

interface ScanDashboardProps {
  onScan: (imageData?: string, productUrl?: string) => void
}

export function ScanDashboard({ onScan }: ScanDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-black text-4xl tracking-tighter uppercase text-foreground text-balance">
          FitVerse
        </h1>
        <p className="text-muted-foreground text-sm">Seu Ecossistema de Performance & Longevidade</p>
      </div>

      <Card className="bg-card border-border rounded-2xl p-6 text-center shadow-lg">
        <CardContent className="p-0 space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-accent flex items-center justify-center border-4 border-background">
            <Camera className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-primary">5</span> scans restantes hoje
          </p>
          <Button
            onClick={() => onScan()}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl glow-primary transition-all duration-300 ease-in-out hover:opacity-95"
          >
            Escanear Produto
          </Button>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <hr className="flex-1 border-border" />
            <span>OU</span>
            <hr className="flex-1 border-border" />
          </div>
          <Button
            variant="outline"
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Colar link do produto
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}