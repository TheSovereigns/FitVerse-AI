"use client"

import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export default function OfflinePage() {
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand/10 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-brand" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">
            {isEnglish ? "No connection" : "Sem conexao"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEnglish
              ? "Check your internet connection and try again."
              : "Verifique sua conexao com a internet e tente novamente."}
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="w-full h-11 rounded-xl bg-brand hover:bg-brand-hover text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {isEnglish ? "Try again" : "Tentar novamente"}
        </Button>
      </div>
    </div>
  )
}
