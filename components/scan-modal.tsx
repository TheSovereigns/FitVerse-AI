"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, Upload, Loader2 } from "lucide-react"

interface ScanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanComplete: (imageData: string) => Promise<void>
}

export function ScanModal({ open, onOpenChange, onScanComplete }: ScanModalProps) {
  const [isScanning, setIsScanning] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result as string
      try {
        await onScanComplete(base64String)
      } catch (error) {
        console.error("Erro na análise:", error)
      } finally {
        setIsScanning(false)
        onOpenChange(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear Produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isScanning ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Analisando produto...</p>
            </div>
          ) : (
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Carregar da Galeria
              </Button>
              <Button
                className="w-full"
                onClick={() => document.getElementById("camera-upload")?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Usar Câmera
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                id="camera-upload"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}