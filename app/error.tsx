"use client"

import { useEffect } from "next/error"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-white">
          Ops! Algo deu errado
        </h1>
        
        <p className="text-white/60 max-w-md mx-auto">
          Encontramos um erro inesperado. Tente novamente ou volte para a página inicial.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => reset()}
            className="h-12 px-8 rounded-2xl font-bold"
          >
            Tentar novamente
          </Button>
          
          <Link href="/">
            <Button 
              variant="outline"
              className="h-12 px-8 rounded-2xl font-bold border-white/20 text-white hover:bg-white/10"
            >
              <Home className="w-5 h-5 mr-2" />
              Início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}