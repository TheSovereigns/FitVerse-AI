"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import type { Session } from "@supabase/supabase-js"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

async function ensureProfileExists(userId: string, email: string) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle()

  if (existing) return

  if (email) {
    const { data: existingByEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingByEmail) return
  }

  await supabase.from("profiles").insert({
    id: userId,
    email,
    name: null,
    plan: "free",
    is_admin: false,
    country: navigator.language.startsWith("en") ? "US" : "BR",
  })
}

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const completeOAuth = async () => {
      try {
        const query = new URLSearchParams(window.location.search)
        const providerError = query.get("error_description") || query.get("error")
        if (providerError) throw new Error(providerError)

        const code = query.get("code")
        let session: Session | null = null

        if (code) {
          // This page is the only owner of the one-time PKCE exchange.
          const result = await supabase.auth.exchangeCodeForSession(code)
          if (result.error) throw result.error
          session = result.data.session
        } else {
          // Supports a login started by an older deployed implicit-flow build.
          const hash = new URLSearchParams(window.location.hash.slice(1))
          const accessToken = hash.get("access_token")
          const refreshToken = hash.get("refresh_token")
          if (accessToken && refreshToken) {
            const result = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (result.error) throw result.error
            session = result.data.session
          }
        }

        if (!session) {
          const result = await supabase.auth.getSession()
          if (result.error) throw result.error
          session = result.data.session
        }

        if (!session?.user) {
          throw new Error("O Google não retornou uma sessão válida. Tente entrar novamente.")
        }

        // Profile setup is useful, but a slow database request must not prevent
        // an authenticated user from reaching the application.
        try {
          await Promise.race([
            ensureProfileExists(session.user.id, session.user.email || ""),
            new Promise((resolve) => setTimeout(resolve, 2500)),
          ])
        } catch {}

        if (!cancelled) {
          // A full navigation makes the application rehydrate from the session
          // that exchangeCodeForSession has already persisted in localStorage.
          window.location.replace("/app")
        }
      } catch (cause) {
        if (!cancelled) {
          const message = cause instanceof Error ? cause.message : String(cause ?? "")
          setError(`Não foi possível concluir o login com Google: ${message}`)
        }
      }
    }

    void completeOAuth()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-black text-white mb-4">Erro na autenticação</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <div className="flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="h-11 rounded-xl bg-brand text-brand-foreground text-sm font-bold hover:bg-brand/90 flex items-center justify-center"
            >
              Tentar novamente
            </Link>
            <Link href="/" className="text-primary hover:underline text-sm">
              Voltar ao início
            </Link>
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
