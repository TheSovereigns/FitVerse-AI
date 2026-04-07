import { createClient } from '@supabase/supabase-js'

// Environment variables - configure these in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Verify that we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase environment variables are missing!\n' +
    'Please add the following to your .env.local file:\n' +
    'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key\n' +
    'SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (server-side only)'
  )
}

// Client-side Supabase client (public, with anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configure the storage adapter for Next.js
    storage: {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null
        return localStorage.getItem(key)
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return
        localStorage.setItem(key, value)
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return
        localStorage.removeItem(key)
      },
    },
  },
})

// Server-side Supabase client (with service role key - for admin operations)
// This should only be used in server-side code (API routes, server components)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Type definitions for better TypeScript support
export type Profile = {
  id: string
  email: string
  name: string | null
  plan: 'free' | 'pro' | 'premium'
  is_admin: boolean
  country: string
  created_at: string
  last_seen: string | null
  stripe_customer_id: string | null
  avatar_url: string | null
}

export type Subscription = {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  plan: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
}

export type Event = {
  id: string
  user_id: string | null
  type: 'signup' | 'login' | 'subscription' | 'cancel' | 'ai_message' | 'scan' | 'workout'
  metadata: Record<string, unknown>
  created_at: string
}

export type AIUsage = {
  id: string
  user_id: string
  messages_count: number
  tokens_used: number
  date: string
  created_at: string
}

// Helper function to get the current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// Helper function to get user profile
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    console.log("[Supabase] Fetching profile for userId:", userId)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // If profile doesn't exist, create it
    if (error?.code === 'PGRST116' || !data) {
      console.log("[Supabase] Profile not found, creating one for:", userId)
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: '',
          plan: 'free',
          is_admin: false,
          country: 'BR',
          ads_enabled: true,
        }, { onConflict: 'id' })
        .select('*')
        .single()

      if (!insertError && newProfile) {
        console.log("[Supabase] Profile created:", newProfile)
        return newProfile
      } else if (insertError) {
        console.warn("[Supabase] Profile creation error:", insertError.message)
      }
    }

    if (error) {
      console.warn("[Supabase] Profile fetch error:", error.message)
      return null
    }
    
    console.log("[Supabase] Profile found:", data)
    return data
  } catch (e) {
    console.warn("[Supabase] Profile fetch exception:", e)
    return null
  }
}

// Helper function to check if user is admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.is_admin || false
}