"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export default function NotFound() {
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
          <Search className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-white">
          {isEnglish ? "Page not found" : "Pagina nao encontrada"}
        </h1>
        
        <p className="text-white/60 max-w-md mx-auto">
          {isEnglish
            ? "The page you were looking for doesn't exist or has been moved."
            : "A pagina que voce procurou nao existe ou foi movida."}
        </p>

        <Link href="/">
          <Button className="h-12 px-8 rounded-2xl font-bold">
            <Home className="w-5 h-5 mr-2" />
            {isEnglish ? "Back to Home" : "Voltar ao Inicio"}
          </Button>
        </Link>
      </div>
    </div>
  )
}
