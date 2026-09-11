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

    // Covers BOTH OAuth flows:
    // - PKCE (?code=): explicit exchange, regardless of client flowType
    // - Implicit (#access_token): getSession() detects the hash
    const finishOAuth = async (): Promise<boolean> => {
      try {
        const params = new URLSearchParams(window.location.search)
        const oauthError = params.get("error_description") || params.get("error")
        if (oauthError) {
          if (!cancelled) setError(`Login recusado: ${oauthError}`)
          return true
        }
        const code = params.get("code")
        if (!code) return false
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          if (!cancelled) setError(`Falha na troca do código OAuth: ${error.message}`)
          return true
        }
        if (data.session) {
          await goApp(data.session.user.id, data.session.user.email || '')
          return true
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e ?? "")
        if (!cancelled) setError(`Erro no callback OAuth: ${msg}`)
        return true
      }
      return false
    }

    // Single robust flow: poll for the session (covers slow OAuth code
    // exchange + lock waits) instead of 3 racing getSession() calls.
    const waitForSession = async () => {
      if (await finishOAuth()) return
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
        const hasHash = typeof window !== "undefined" && window.location.hash.includes("access_token")
        const hasCode = typeof window !== "undefined" && window.location.search.includes("code=")
        setError(
          hasHash || hasCode
            ? "Sessão não foi criada a partir do retorno OAuth. Verifique as Redirect URLs no Supabase (Authentication → URL Configuration)."
            : "Nenhuma sessão encontrada no retorno do login. Tente novamente ou use email/senha."
        )
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
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-black text-white mb-4">Erro na autenticação</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="h-11 rounded-xl bg-brand text-brand-foreground text-sm font-bold hover:bg-brand/90"
            >
              Tentar novamente
            </button>
            <a href="/auth/login" className="text-primary hover:underline text-sm">
              Voltar ao login
            </a>
          </div>
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
