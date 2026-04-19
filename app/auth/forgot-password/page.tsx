"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Loader2, Sparkles, Check, Mail } from "lucide-react"
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
      <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass-strong border border-white/10 rounded-3xl p-8 max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            {locale === "en-US" ? "Check your inbox!" : "Verifique sua caixa de entrada!"}
          </h2>
          <p className="text-white/60 mb-6">
            {locale === "en-US"
              ? `We've sent a password reset link to ${email}. Click the link to create a new password.`
              : `Enviamos um link de recuperação para ${email}. Clique no link para criar uma nova senha.`}
          </p>
          <Link href="/auth/login">
            <Button className="bg-primary text-white hover:bg-primary/90">
              {locale === "en-US" ? "Back to Login" : "Voltar ao Login"}
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-2xl font-black text-white">FitVerse AI</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="glass-strong border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">
              {locale === "en-US" ? "Reset Password" : "Recuperar Senha"}
            </h1>
            <p className="text-sm text-white/40">
              {locale === "en-US"
                ? "Enter your email and we'll send you a reset link"
                : "Digite seu email e enviaremos um link de recuperação"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-white/80 text-sm font-medium mb-2 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={locale === "en-US" ? "you@example.com" : "seu@email.com"}
                required
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/20 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-black bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:shadow-[0_10px_30px_rgba(255,140,0,0.3)] hover:scale-[1.02] active:scale-[0.98]"
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
            <p className="text-sm text-white/40">
              {locale === "en-US" ? "Remember your password?" : "Lembrou a senha?"}{" "}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                {locale === "en-US" ? "Sign In" : "Entrar"}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}