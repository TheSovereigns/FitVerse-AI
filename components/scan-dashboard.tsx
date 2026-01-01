"use client"

import { useState, useRef } from "react"
import { Upload, Camera, Scan, History, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ScanDashboardProps {
  onScan: (file: File) => void
  isScanning?: boolean
}

export function ScanDashboard({ onScan, isScanning = false }: ScanDashboardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onScan(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onScan(e.target.files[0])
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-4 animate-in fade-in duration-500">
      
      {/* Header do Terminal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
            Bio<span className="text-primary">Scanner</span>
            <Badge variant="outline" className="ml-2 border-primary/50 text-primary bg-primary/10 text-[10px] py-0 h-5">
              ONLINE
            </Badge>
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Terminal de análise nutricional avançada
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-600">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          SYSTEM_READY
        </div>
      </div>

      {/* Área Principal de Scan */}
      <div className="relative group">
        {/* Efeitos de Fundo (Glow) */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-600/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
        
        <Card 
          className={cn(
            "relative bg-black border-2 border-dashed rounded-[2rem] h-[400px] flex flex-col items-center justify-center transition-all duration-300 overflow-hidden",
            isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-zinc-800 hover:border-primary/50 hover:bg-zinc-900/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Grid Decorativo */}
          <div className="absolute inset-0 grid grid-cols-[repeat(40,1fr)] gap-1 opacity-[0.03] pointer-events-none">
            {[...Array(40)].map((_, i) => <div key={i} className="bg-white h-full w-[1px]" />)}
          </div>
          <div className="absolute inset-0 grid grid-rows-[repeat(40,1fr)] gap-1 opacity-[0.03] pointer-events-none">
            {[...Array(40)].map((_, i) => <div key={i} className="bg-white w-full h-[1px]" />)}
          </div>

          {/* Cantoneiras Tech */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-primary opacity-60" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-primary opacity-60" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-primary opacity-60" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-primary opacity-60" />

          {/* Scanning Animation */}
          {isDragging && (
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-[2rem]">
              <div className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_20px_rgba(249,115,22,0.8)] animate-scan" />
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            </div>
          )}

          {/* Conteúdo Central */}
          <div className="relative z-10 flex flex-col items-center gap-6 p-6 text-center">
            {isScanning ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary blur-xl opacity-20 animate-pulse" />
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Analisando Amostra...</h3>
                  <p className="text-zinc-500 text-sm">Processando composição molecular</p>
                </div>
              </div>
            ) : (
              <>
                <div className="relative group/icon cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="absolute inset-0 bg-primary rounded-full blur-2xl opacity-0 group-hover/icon:opacity-20 transition-opacity duration-500" />
                  <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover/icon:border-primary/50 group-hover/icon:scale-110 transition-all duration-300">
                    <Scan className="w-10 h-10 text-zinc-400 group-hover/icon:text-primary transition-colors" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover/icon:opacity-100 transition-all duration-300 translate-y-2 group-hover/icon:translate-y-0">
                    UPLOAD
                  </div>
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-2xl font-bold text-white">
                    Arraste ou Clique para Escanear
                  </h3>
                  <p className="text-zinc-500 text-sm">
                    Suporta JPG, PNG e WEBP. Análise instantânea via IA.
                  </p>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    className="border-zinc-800 bg-black hover:bg-zinc-900 hover:text-primary hover:border-primary/30 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Carregar Arquivo
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Usar Câmera
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileSelect}
          />
        </Card>
      </div>

      {/* Footer / Histórico Recente (Mock) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 flex items-center gap-3 hover:bg-zinc-900/50 hover:border-primary/20 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
              <History className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-300 group-hover:text-white">Scan #{2409 + i}</p>
              <p className="text-xs text-zinc-600">Há {i * 2 + 5} min</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>
    </div>
  )
}