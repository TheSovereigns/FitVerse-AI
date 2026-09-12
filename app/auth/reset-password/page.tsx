"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Lock } from "lucide-react"
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
    <div className="relative min-h-screen overflow-hidden bg-[#070A08] px-6 py-12 text-[#F5F7F4] flex items-center justify-center">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(110,255,141,0.13),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:auto,26px_26px]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-[#6BFF8E]/30 bg-[#101713] shadow-[0_0_32px_rgba(107,255,142,0.13)]">
              <img src="/icon.svg" alt="VyseFit" className="w-6 h-6" />
            </div>
            <span className="text-2xl font-semibold tracking-[-0.06em] text-foreground">VyseFit AI</span>
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/[0.12] bg-[#0E1411]/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl md:p-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-semibold tracking-[-0.055em] text-foreground">
              {isEnglish ? "Create New Password" : "Criar Nova Senha"}
            </h1>
            <p className="text-sm leading-6 text-[#B9C3BA]">
              {isEnglish ? "Choose a new password for your account." : "Escolha uma nova senha para sua conta."}
            </p>
          </div>

          {isCheckingSession ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <p className="mb-2 font-semibold text-brand">
                {isEnglish ? "Password updated." : "Senha atualizada."}
              </p>
              <p className="text-sm text-[#B9C3BA]">
                {isEnglish ? "Redirecting to login..." : "Redirecionando para o login..."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div role="alert" aria-live="assertive" className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="password" className="mb-2 block text-sm font-medium text-[#DEE5DF]">
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
                    className="h-12 rounded-2xl border-white/[0.12] bg-black/45 pr-12 text-foreground placeholder:text-white/35 focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? (isEnglish ? "Hide password" : "Ocultar senha") : (isEnglish ? "Show password" : "Mostrar senha")}
                    className="absolute right-0 top-0 h-full px-3 text-white/50 hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-[#DEE5DF]">
                  {isEnglish ? "Confirm Password" : "Confirmar Senha"}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  className="h-12 rounded-2xl border-white/[0.12] bg-black/45 text-foreground placeholder:text-white/35 focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !!error?.includes("link")}
                className="h-12 w-full rounded-2xl bg-brand text-base font-semibold text-brand-foreground shadow-[0_12px_34px_rgba(52,211,153,0.22)] hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1411]"
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
