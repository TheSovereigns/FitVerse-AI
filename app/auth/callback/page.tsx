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
    .single()

  if (!existing) {
    await supabase.from('profiles').insert({
      id: userId,
      email: email,
      name: null,
      plan: 'free',
      is_admin: false,
      country: 'BR',
    })
  }
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        await ensureProfileExists(session.user.id, session.user.email || '')
        router.replace("/")
      } else {
        router.replace("/auth/login")
      }
    }

    handleCallback()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        if (session) {
          ensureProfileExists(session.user.id, session.user.email || '').then(() => {
            router.replace("/")
          })
        }
      }
    })

    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          ensureProfileExists(session.user.id, session.user.email || '').then(() => {
            router.replace("/")
          })
        } else {
          router.replace("/auth/login")
        })
      })
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
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
