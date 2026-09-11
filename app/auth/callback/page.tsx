"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

async function ensureProfileExists(userId: string, email: string) {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existing) return

  if (email) {
    const { data: existingByEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingByEmail) return
  }

  await supabase.from('profiles').insert({
    id: userId,
    email: email,
    name: null,
    plan: 'free',
    is_admin: false,
    country: navigator.language.startsWith('en') ? 'US' : 'BR',
  })
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const goApp = async (userId: string, email: string) => {
      try {
        await ensureProfileExists(userId, email)
      } catch {}
      if (!cancelled) router.replace("/app")
    }

    // Single robust flow: poll for the session (covers slow OAuth code
    // exchange + lock waits) instead of 3 racing getSession() calls.
    const waitForSession = async () => {
      for (let i = 0; i < 16 && !cancelled; i++) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            await goApp(session.user.id, session.user.email || '')
            return
          }
        } catch {
          // lock contention / transient - just retry
        }
        await new Promise((r) => setTimeout(r, 500))
      }
      if (!cancelled) {
        setError("Não foi possível concluir o login. Verifique sua conexão e tente novamente.")
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: { user: { id: string; email?: string } } | null) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session && !cancelled) {
        goApp(session.user.id, session.user.email || '')
      }
    })

    waitForSession()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white mb-4">Erro na autenticação</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <a href="/auth/login" className="text-primary hover:underline">
            Voltar ao login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">
          Verificando autenticação...
        </h2>
        <p className="text-white/60">Aguarde um momento</p>
      </div>
    </div>
  )
}
