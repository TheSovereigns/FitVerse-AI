"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useTranslation } from "@/lib/i18n"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const checkRecoverySession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsCheckingSession(false)

      if (!session) {
        setError(isEnglish
          ? "This reset link is invalid or expired. Request a new one."
          : "Este link de recuperacao e invalido ou expirou. Solicite um novo.")
      }
    }

    void checkRecoverySession()
  }, [isEnglish])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError(isEnglish ? "Password must be at least 8 characters." : "A senha deve ter pelo menos 8 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError(isEnglish ? "Passwords do not match." : "As senhas nao coincidem.")
      return
    }

    setIsLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(isEnglish ? "Could not update password. Try again." : "Nao foi possivel atualizar a senha. Tente novamente.")
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)

    setTimeout(() => {
      router.replace("/auth/login")
    }, 1800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#0d0705] to-[#1a0f00] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-2xl font-black text-white">FitVerse AI</span>
          </Link>
        </div>

        <div className="glass-strong border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">
              {isEnglish ? "Create New Password" : "Criar Nova Senha"}
            </h1>
            <p className="text-sm text-white/40">
              {isEnglish ? "Choose a new password for your account." : "Escolha uma nova senha para sua conta."}
            </p>
          </div>

          {isCheckingSession ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <p className="text-emerald-400 font-bold mb-2">
                {isEnglish ? "Password updated." : "Senha atualizada."}
              </p>
              <p className="text-sm text-white/50">
                {isEnglish ? "Redirecting to login..." : "Redirecionando para o login..."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="password" className="text-white/80 text-sm font-medium mb-2 block">
                  {isEnglish ? "New Password" : "Nova Senha"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/20 rounded-xl pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-white/80 text-sm font-medium mb-2 block">
                  {isEnglish ? "Confirm Password" : "Confirmar Senha"}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/20 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !!error?.includes("link")}
                className="w-full h-12 text-base font-black bg-primary text-white rounded-xl hover:bg-primary/90 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isEnglish ? "Updating..." : "Atualizando..."}
                  </>
                ) : (
                  isEnglish ? "Update Password" : "Atualizar Senha"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
