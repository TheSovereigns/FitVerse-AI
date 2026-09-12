"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Loader2, Check, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "@/lib/i18n"

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const { t, locale } = useTranslation()
  
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error } = await resetPassword(email)
    
    if (error) {
      setError(locale === "en-US" ? "Failed to send reset email" : "Falha ao enviar email de recuperação")
      setIsLoading(false)
    } else {
      setSent(true)
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#070A08] px-6 py-12 text-[#F5F7F4] flex items-center justify-center">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(110,255,141,0.13),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:auto,26px_26px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md rounded-[2rem] border border-white/[0.12] bg-[#0E1411]/95 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10 shadow-[0_0_36px_rgba(107,255,142,0.14)]">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="mb-2 text-3xl font-semibold tracking-[-0.055em] text-foreground">
            {locale === "en-US" ? "Check your inbox!" : "Verifique sua caixa de entrada!"}
          </h2>
          <p className="mb-6 leading-6 text-[#B9C3BA]">
            {locale === "en-US"
              ? `We've sent a password reset link to ${email}. Click the link to create a new password.`
              : `Enviamos um link de recuperação para ${email}. Clique no link para criar uma nova senha.`}
          </p>
          <Link href="/auth/login">
            <Button className="rounded-2xl bg-brand px-5 font-semibold text-brand-foreground hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand">
              {locale === "en-US" ? "Back to Login" : "Voltar ao Login"}
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070A08] px-6 py-12 text-[#F5F7F4] flex items-center justify-center">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(110,255,141,0.13),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:auto,26px_26px]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-[#6BFF8E]/30 bg-[#101713] shadow-[0_0_32px_rgba(107,255,142,0.13)]">
              <img src="/icon.svg" alt="VyseFit" className="w-6 h-6" />
            </div>
            <span className="text-2xl font-semibold tracking-[-0.06em] text-foreground">VyseFit AI</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="rounded-[2rem] border border-white/[0.12] bg-[#0E1411]/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl md:p-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-semibold tracking-[-0.055em] text-foreground">
              {locale === "en-US" ? "Reset Password" : "Recuperar Senha"}
            </h1>
            <p className="text-sm leading-6 text-[#B9C3BA]">
              {locale === "en-US"
                ? "Enter your email and we'll send you a reset link"
                : "Digite seu email e enviaremos um link de recuperação"}
            </p>
          </div>

          {error && (
            <div role="alert" aria-live="assertive" className="mb-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="mb-2 block text-sm font-medium text-[#DEE5DF]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={locale === "en-US" ? "you@example.com" : "seu@email.com"}
                required
                className="h-12 rounded-2xl border-white/[0.12] bg-black/45 text-foreground placeholder:text-white/35 focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-2xl bg-brand text-base font-semibold text-brand-foreground shadow-[0_12px_34px_rgba(52,211,153,0.22)] hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1411]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {locale === "en-US" ? "Sending..." : "Enviando..."}
                </>
              ) : (
                locale === "en-US" ? "Send Reset Link →" : "Enviar Link de Recuperação →"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#B9C3BA]">
              {locale === "en-US" ? "Remember your password?" : "Lembrou a senha?"}{" "}
              <Link href="/auth/login" className="font-medium text-brand hover:text-brand/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                {locale === "en-US" ? "Sign In" : "Entrar"}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
