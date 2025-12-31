"use client"

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

// ⚠️ SE O ARQUIVO .ENV NÃO ESTIVER FUNCIONANDO, COLE SUA CHAVE PÚBLICA (pk_test_...) AQUI:
const FALLBACK_STRIPE_KEY = "pk_test_51Sjjdw2UPHbu1CaNIVJSpepcnDeI4tv6oXGvJNnK4fSgaNLZW72tgpF8amNqvzFTuurfTkDJtYFvcZ21HkIfIj9k00aYUhPLfv" 

// Função auxiliar para carregar o Stripe apenas quando necessário
const getStripe = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || FALLBACK_STRIPE_KEY
  if (!key) return null
  return loadStripe(key)
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Log para depuração (aparecerá no console do navegador - F12)
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || FALLBACK_STRIPE_KEY
    console.log("Status da Chave Stripe:", key ? "Configurada ✅" : "Ausente ❌")
  }, [])

  const handleCheckout = async (plan: "pro" | "premium") => {
    const stripe = await getStripe()

    if (!stripe) {
      console.error("Stripe Key Missing.")
      alert("Erro: Chave do Stripe não encontrada. Verifique o .env ou adicione a chave na constante FALLBACK_STRIPE_KEY no arquivo app/subscription/page.tsx")
      return
    }

    setLoading(plan)
    try {
      // TODO: Obter o e-mail do usuário logado (por exemplo, de um contexto de autenticação)
      const userEmail = "email.do.usuario@example.com"

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Envia o nome do plano e o e-mail para o backend
        body: JSON.stringify({ plan, userEmail }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Erro desconhecido")
        console.error("Erro na resposta da API:", response.status, errorText)
        if (response.status === 404) {
          throw new Error("Rota da API não encontrada (404). Tente reiniciar o servidor (npm run dev).")
        }
        throw new Error(`Falha ao criar sessão: ${response.status}`)
      }

      const { sessionId } = await response.json()

      if (stripe && sessionId) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Erro ao iniciar checkout. Verifique suas configurações.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Escolha seu Plano</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Plano Gratuito */}
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Para começar sua jornada</CardDescription>
              <div className="text-3xl font-bold mt-4">R$ 0<span className="text-sm font-normal text-muted-foreground">/sempre</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 5 scans por dia</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Análise básica de ingredientes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Histórico de 7 dias</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" disabled>Plano Atual</Button>
            </CardFooter>
          </Card>

          {/* Plano Pro */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-blue-500">Pro</CardTitle>
              <CardDescription>Para quem quer evoluir</CardDescription>
              <div className="text-3xl font-bold mt-4">R$ 19,90<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> 20 scans por dia</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Análise detalhada</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Histórico de 30 dias</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Sem anúncios</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={() => handleCheckout("pro")}
                disabled={!!loading}
              >
                {loading === "pro" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assinar Pro"}
              </Button>
            </CardFooter>
          </Card>

          {/* Plano Premium */}
          <Card className="border-primary bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
              RECOMENDADO
            </div>
            <CardHeader>
              <CardTitle className="text-primary">Premium</CardTitle>
              <CardDescription>Longevidade sem limites</CardDescription>
              <div className="text-3xl font-bold mt-4">R$ 29,90<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Scans <strong>ILIMITADOS</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Análise profunda de biohacking</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Geração de receitas com IA</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Treinos personalizados</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Histórico completo</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20" 
                onClick={() => handleCheckout("premium")}
                disabled={!!loading}
              >
                {loading === "premium" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assinar Premium"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}