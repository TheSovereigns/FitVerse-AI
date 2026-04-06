"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { User } from "@supabase/supabase-js"
import { supabase, getUserProfile, Profile } from "@/lib/supabase"
import { useRouter } from "next/navigation"

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
      } else {
        setProfile(null)
        setIsAdmin(false)
      }
      return userProfile
    } catch {
      setProfile(null)
      setIsAdmin(false)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user && mounted) {
          setUser(session.user)
          await loadProfile(session.user.id)

          try {
            await supabase
              .from('profiles')
              .update({ last_seen: new Date().toISOString() })
              .eq('id', session.user.id)
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        setUser(session?.user || null)

        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          setIsAdmin(false)
          hasRedirectedRef.current = false
        }

        setIsLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        try {
          await supabase.rpc('log_event', {
            p_type: 'login',
            p_user_id: data.user.id,
            p_metadata: { email }
          })
        } catch {
          // ignore
        }

        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true
          try {
            const p = await getUserProfile(data.user.id)
            if (p?.is_admin) {
              router.push("/admin-dashboard")
            } else {
              router.push("/")
            }
          } catch {
            router.push("/")
          }
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
            country: 'BR',
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
        } catch {
          // ignore
        }
      }

      if (data.session) {
        return { error: null }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!signInError) {
        return { error: null }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setIsAdmin(false)
      hasRedirectedRef.current = false
      router.push("/auth/login")
    } catch {
      // ignore
    }
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
