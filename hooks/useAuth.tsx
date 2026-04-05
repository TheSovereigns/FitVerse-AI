"use client"

// FitVerse AI - Authentication Context v2
// Handles login, signup, Google OAuth, and session management

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User, Session } from "@supabase/supabase-js"
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
  const [hasRedirected, setHasRedirected] = useState(false)

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
    } catch (e) {
      setProfile(null)
      setIsAdmin(false)
      return null
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          const p = await loadProfile(session.user.id)
          
          try {
            await supabase
              .from('profiles')
              .update({ last_seen: new Date().toISOString() })
              .eq('id', session.user.id)
          } catch (e) {
            // ignore
          }

          if (!hasRedirected) {
            setHasRedirected(true)
            if (p?.is_admin) {
              router.push("/admin-dashboard")
            } else {
              router.push("/")
            }
          }
        }
      } catch (error) {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        
        if (session?.user) {
          const p = await loadProfile(session.user.id)
          
          if (!hasRedirected) {
            setHasRedirected(true)
            if (p?.is_admin) {
              router.push("/admin-dashboard")
            } else {
              router.push("/")
            }
          }
        } else {
          setProfile(null)
          setIsAdmin(false)
          setHasRedirected(false)
        }
        
        setIsLoading(false)
      }
    )

    return () => {
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
        } catch (e) {
          // ignore
        }

        // Redirect directly - don't rely on onAuthStateChange
        try {
          const p = await getUserProfile(data.user.id)
          if (p?.is_admin) {
            router.push("/admin-dashboard")
          } else {
            router.push("/")
          }
        } catch (e) {
          router.push("/")
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
        } catch (e) {
          // ignore
        }
      }

      if (data.session) {
        return { error: null }
      }

      // No session - try auto-login
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
      setHasRedirected(false)
      router.push("/")
    } catch (error) {
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
