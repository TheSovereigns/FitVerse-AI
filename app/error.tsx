"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto overflow-hidden">
          <img src="/icon.svg" alt="VyseFit" className="w-12 h-12" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-white">
          {isEnglish ? "Oops! Something went wrong" : "Ops! Algo deu errado"}
        </h1>
        
        <p className="text-white/60 max-w-md mx-auto">
          {isEnglish
            ? "We encountered an unexpected error. Try again or go back to the home page."
            : "Encontramos um erro inesperado. Tente novamente ou volte para a pagina inicial."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => reset()}
            className="h-12 px-8 rounded-2xl font-bold"
          >
            {isEnglish ? "Try again" : "Tentar novamente"}
          </Button>
          
          <Link href="/">
            <Button 
              variant="outline"
              className="h-12 px-8 rounded-2xl font-bold border-border text-white hover:bg-muted/30"
            >
              <Home className="w-5 h-5 mr-2" />
              {isEnglish ? "Home" : "Inicio"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
