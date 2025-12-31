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
        <h1 className="font-black text-4xl tracking-tighter uppercase text-white">
          FitVerse
        </h1>
        <p className="text-slate-400">Seu Ecossistema de Performance & Longevidade</p>
      </div>

      <Card className="bg-[#121212] border-[#1F1F1F] rounded-2xl p-6 text-center shadow-lg">
        <CardContent className="p-0 space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#1F1F1F] flex items-center justify-center border-4 border-[#080808]">
            <Camera className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-sm text-slate-400">
            <span className="font-bold text-[#FF8C00]">5</span> scans restantes hoje
          </p>
          <Button
            onClick={() => onScan()}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-600 to-orange-400 text-white rounded-xl shadow-[0_0_20px_rgba(255,140,0,0.3)] hover:shadow-[0_0_30px_rgba(255,140,0,0.5)] transition-all duration-300 ease-in-out"
          >
            Escanear Produto
          </Button>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <hr className="flex-1 border-slate-700" />
            <span>OU</span>
            <hr className="flex-1 border-slate-700" />
          </div>
          <Button
            variant="outline"
            className="w-full border-[#1F1F1F] bg-transparent text-slate-400 hover:bg-[#1F1F1F] hover:text-white transition-all duration-300 ease-in-out"
          >
            <Upload className="w-4 h-4 mr-2" />
            Colar link do produto
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}