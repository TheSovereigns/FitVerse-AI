"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { User } from "@supabase/supabase-js"
import { supabase, getUserProfile, Profile } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { clearVyseFitStorage } from "@/lib/auth-helpers"
import { logger } from "@/lib/logger"

/**
 * @deprecated Non-httpOnly document.cookie path removed.
 * httpOnly cookies are now set server-side via `lib/supabase/middleware.ts`
 * using `@supabase/ssr` (see middleware.ts). This no-op is kept for
 * backwards compatibility until `npm install @supabase/ssr` is complete.
 * TODO: Remove this function after httpOnly migration is verified.
 */
function syncSessionToCookie(_accessToken: string | undefined) {
  // No-op: session cookies are managed httpOnly by the server/middleware.
  return
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const hasRedirectedRef = useRef(false)

  const loadProfile = async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId)
      if (userProfile) {
        setProfile(userProfile)
        setIsAdmin(userProfile.is_admin || false)
        logger.info("[Auth] Profile loaded, is_admin:", userProfile.is_admin)
      } else {
        setProfile(null)
        setIsAdmin(false)
        // Try direct query as fallback
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', userId)
          .maybeSingle()
        if (data?.is_admin) {
          setIsAdmin(true)
          logger.info("[Auth] Admin from direct query")
        }
      }
      return userProfile
    } catch (e) {
      logger.error("[Auth] Profile load error:", e)
      setProfile(null)
      setIsAdmin(false)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    let profileTimer: ReturnType<typeof setTimeout> | null = null

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user && mounted) {
          setUser(session.user)
          syncSessionToCookie(session.access_token)
          await loadProfile(session.user.id)

          // Fire-and-forget: don't block TTFB (saves 40-80ms); don't await
          supabase
            .from('profiles')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', session.user.id)
            .then(
              () => {},
              (e) => logger.error("[Auth] Failed to update last_seen:", e)
            )
      }
    } catch (e) {
      logger.error("[Auth] Session init failed:", e)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return

        setUser(session?.user || null)
        syncSessionToCookie(session?.access_token)
        setIsLoading(false)

        if (session?.user) {
          // Supabase awaits this callback while holding its auth lock. Defer
          // queries that may read the session so OAuth cannot deadlock here.
          if (profileTimer) clearTimeout(profileTimer)
          profileTimer = setTimeout(() => {
            if (mounted) void loadProfile(session.user.id)
          }, 0)
        } else {
          setProfile(null)
          setIsAdmin(false)
          hasRedirectedRef.current = false
        }
      }
    )

    return () => {
      mounted = false
      if (profileTimer) clearTimeout(profileTimer)
      subscription.unsubscribe()
    }
  }, [])

  const isLockError = (e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e ?? "")
    return msg.includes("Navigator LockManager") || msg.includes("immediately failed") || msg.includes("lock:")
  }

  const confirmSessionAfterLockError = async () => {
    try {
      await new Promise((r) => setTimeout(r, 300))
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        syncSessionToCookie(session.access_token)
        await loadProfile(session.user.id)
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true
          router.push("/app")
        }
        return true
      }
    } catch {
      // ignore - caller surfaces the original error
    }
    return false
  }

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      let data
      try {
        const res = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (res.error) throw res.error
        data = res.data
      } catch (e) {
        // Lock contention (multiple tabs / refresh racing sign-in):
        // the session is often already persisted - verify before failing.
        if (isLockError(e) && (await confirmSessionAfterLockError())) {
          return { error: null }
        }
        throw e
      }

      if (data.user) {
        try {
          await supabase.rpc('log_event', {
            p_type: 'login',
            p_user_id: data.user.id,
            p_metadata: { email }
          })
        } catch (e) {
          logger.error("[Auth] Failed to log login event:", e)
        }

        // Always redirect - don't wait for profile
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true
          router.push("/app")
        }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            country: navigator.language.startsWith('en') ? 'US' : 'BR',
          },
        },
      })

      if (error) throw error

      if (data.user) {
        try {
          await supabase.rpc('log_event', {
            p_type: 'signup',
            p_user_id: data.user.id,
            p_metadata: { email }
          })
        } catch (e) {
          logger.error("[Auth] Failed to log signup event:", e)
        }
      }

      if (data.session) {
        return { error: null }
      }

      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (!signInError) {
          return { error: null }
        }
        if (isLockError(signInError) && (await confirmSessionAfterLockError())) {
          return { error: null }
        }
      } catch (e) {
        if (isLockError(e) && (await confirmSessionAfterLockError())) {
          return { error: null }
        }
      }

      return { error: null }
    } catch (error) {
      if (isLockError(error) && (await confirmSessionAfterLockError())) {
        return { error: null }
      }
      return { error: error as Error }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    syncSessionToCookie(undefined)
    clearVyseFitStorage()
    try { supabase.auth.signOut({ scope: 'local' }).catch(() => {}) } catch {}
    window.location.replace("/auth/login")
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const value = {
    user,
    profile,
    isAdmin,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    return {
      user: null,
      profile: null,
      isAdmin: false,
      isLoading: true,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signOut: async () => {},
      signInWithGoogle: async () => ({ error: null }),
      resetPassword: async () => ({ error: null }),
    }
  }
  return context
}

export function useProtectedRoute(redirectTo: string = "/auth/login") {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectTo])

  return { user, isLoading }
}

export function useAdminRoute(redirectTo: string = "/") {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || !profile?.is_admin)) {
      router.push(redirectTo)
    }
  }, [user, profile, isLoading, router, redirectTo])

  return { user, profile, isLoading }
}

export { AuthContext }
