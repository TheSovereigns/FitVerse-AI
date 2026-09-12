"use client"
import { AuthVisual } from "@/components/app-experience"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().min(1, "validation_required").email("validation_email_invalid"),
  password: z.string().min(1, "validation_required").min(6, "validation_password_min"),
})

type LoginErrors = { email?: string; password?: string }

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth()
  const { t, locale } = useTranslation()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({})

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("error")
    if (reason !== "session_missing" && reason !== "oauth_callback_failed") return
    const timer = window.setTimeout(() => {
      setError(locale === "en-US"
        ? reason === "oauth_callback_failed"
          ? "Google could not complete the session. Start the login again in this same browser."
          : "Your Google session was not saved. Please try again."
        : reason === "oauth_callback_failed"
          ? "O Google não conseguiu concluir a sessão. Inicie o login novamente neste mesmo navegador."
          : "A sessão do Google não foi salva. Tente entrar novamente.")
    }, 0)
    return () => window.clearTimeout(timer)
  }, [locale])

  const validate = (values: { email: string; password: string }): LoginErrors => {
    const result = loginSchema.safeParse(values)
    if (result.success) return {}
    const errors: LoginErrors = {}
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof LoginErrors
      if (key && !errors[key]) {
        errors[key] = t(issue.message as any)
      }
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const errors = validate({ email, password })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsLoading(true)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(locale === "en-US" ? "Invalid email or password" : "Email ou senha inválidos")
      setIsLoading(false)
    }
    // Success path redirects via useAuth (router.push("/app")).
    // No force-redirect here: pushing without a session bounces back to login.
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setIsLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(locale === "en-US" ? "Failed to sign in with Google" : "Falha ao entrar com Google")
      setIsLoading(false)
    }
  }

  return (
    <div className="product-experience auth-experience min-h-screen flex bg-[#070A08] text-[#F5F7F4]">
      <AuthVisual />
      <div className="relative w-full lg:w-1/2 flex items-center justify-center overflow-hidden bg-[#070A08] p-6 md:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(110,255,141,0.12),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:auto,26px_26px] opacity-70" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[#101713] border border-[#6BFF8E]/30 flex items-center justify-center overflow-hidden shadow-[0_0_32px_rgba(107,255,142,0.13)]">
                <img src="/icon.svg" alt="VyseFit" className="w-6 h-6" />
              </div>
              <span className="text-2xl font-semibold tracking-[-0.06em] text-foreground">VyseFit AI</span>
            </Link>
          </div>

          {/* Form Card */}
          <div className="rounded-[2rem] border border-white/[0.12] bg-[#0E1411]/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl md:p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-semibold tracking-[-0.055em] text-foreground mb-2">
                {locale === "en-US" ? "Sign In" : "Entrar"}
              </h1>
              <p className="text-sm leading-6 text-[#B9C3BA]">
                {locale === "en-US" ? "Welcome back! Enter your credentials." : "Bem-vindo de volta! Entre com suas credenciais."}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" aria-live="assertive" className="mb-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="mb-2 block text-sm font-medium text-[#DEE5DF]">
                  {locale === "en-US" ? "Email" : "Email"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setFieldErrors(prev => ({ ...prev, ...validate({ email, password }) }))}
                  placeholder={locale === "en-US" ? "you@example.com" : "seu@email.com"}
                  className={cn("h-12 rounded-2xl border-white/[0.12] bg-black/45 text-foreground placeholder:text-white/35 focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25", fieldErrors.email && "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/25")}
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-200" role="alert">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="mb-2 block text-sm font-medium text-[#DEE5DF]">
                  {locale === "en-US" ? "Password" : "Senha"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setFieldErrors(prev => ({ ...prev, ...validate({ email, password }) }))}
                    placeholder="••••••••"
                    className={cn("h-12 rounded-2xl border-white/[0.12] bg-black/45 pr-12 text-foreground placeholder:text-white/35 focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/25", fieldErrors.password && "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/25")}
                    aria-invalid={!!fieldErrors.password}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? (locale === "en-US" ? "Hide password" : "Ocultar senha") : (locale === "en-US" ? "Show password" : "Mostrar senha")}
                    className="absolute right-0 top-0 h-full px-3 text-white/50 hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-red-200" role="alert">{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-brand hover:text-brand/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  {locale === "en-US" ? "Forgot password?" : "Esqueceu a senha?"}
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-2xl bg-brand text-base font-semibold text-brand-foreground shadow-[0_12px_34px_rgba(52,211,153,0.22)] transition-colors hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1411]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {locale === "en-US" ? "Signing in..." : "Entrando..."}
                  </>
                ) : (
                  <>
                    {locale === "en-US" ? "Sign In" : "Entrar"} →
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/[0.12]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0E1411] px-4 text-white/45">
                  {locale === "en-US" ? "or continue with" : "ou continue com"}
                </span>
              </div>
            </div>

            {/* Google Button */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="h-12 w-full rounded-2xl border border-white/[0.14] bg-white/[0.045] text-foreground transition-colors hover:bg-white/[0.09] focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>}
              {isLoading
                ? (locale === "en-US" ? "Opening Google..." : "Abrindo Google...")
                : (locale === "en-US" ? "Continue with Google" : "Continuar com Google")}
            </Button>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-[#B9C3BA]">
                {locale === "en-US" ? "No account?" : "Não tem conta?"}{" "}
                <Link href="/auth/signup" className="font-medium text-brand hover:text-brand/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                  {locale === "en-US" ? "Create for free" : "Criar grátis"}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
