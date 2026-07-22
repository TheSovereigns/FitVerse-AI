import { getSupabaseClient } from './supabase-client'
import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

// Lazy getter - only creates client on first access
export function getSupabase() {
  return getSupabaseClient()
}

// Direct export - avoids Proxy val.bind() pattern that breaks JWT header attachment
// The Proxy creates a new function reference on every access, which prevents
// Supabase JS from properly attaching the Authorization header to requests
export const supabase: SupabaseClient = getSupabaseClient()

// Re-export server utilities from supabase-server.ts
export { getSupabaseAdmin, authUser, getTokenFromRequest, getCorsHeaders } from './supabase-server'

// Legacy server client - use getSupabaseAdmin() instead
let _supabaseAdmin: ReturnType<typeof createClient> | null = null
export function getSupabaseAdminLazy() {
  if (_supabaseAdmin) return _supabaseAdmin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) return null
  _supabaseAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _supabaseAdmin
}

// Legacy alias - use getSupabaseAdminLazy() instead
export const supabaseAdmin = typeof window !== 'undefined' ? null : getSupabaseAdminLazy()

// Legacy server client factory - use getSupabaseAdmin() instead
export function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) return null
  return createClient(url, key)
}

// Type definitions for better TypeScript support
export type Profile = {
  id: string
  email: string
  name: string | null
  plan: 'free' | 'pro' | 'premium' | 'banned'
  is_admin: boolean
  country: string
  created_at: string
  last_seen: string | null
  stripe_customer_id: string | null
  avatar_url: string | null
  age: number | null
  weight: number | null
  height: number | null
  gender: 'male' | 'female' | 'other' | null
  fitness_goal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_health' | null
  profile_setup_completed: boolean
  ads_enabled: boolean
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (data) {
      logger.info("[getUserProfile] Found by id:", data.id, "plan:", data.plan)
      return data
    }

    if (error) {
      logger.warn("[getUserProfile] Error by id:", error.message, error.code)
    }

    const { data: { user: authUser } } = await supabase.auth.getUser()
    const email = authUser?.email || ''

    if (email) {
      const { data: existingByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (existingByEmail) {
        logger.info("[getUserProfile] Found by email:", email, "plan:", existingByEmail.plan)
        return existingByEmail
      }
    }

    logger.info("[getUserProfile] No profile found for:", userId, email)
    return null
  } catch (e) {
    logger.error("[getUserProfile] Exception:", e)
    return null
  }
}

// Helper function to check if user is admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.is_admin || false
}

// Shared helper: find profile by user.id, fallback to email
export async function findProfile(userId: string, email?: string | null): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      logger.warn("[findProfile] Error fetching by id:", error.message, error.code)
    }

    if (data) {
      logger.info("[findProfile] Found by id:", data.id, "plan:", data.plan, "is_admin:", data.is_admin)
      return data
    }

    if (email) {
      const { data: byEmail, error: emailErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (emailErr) {
        logger.warn("[findProfile] Error fetching by email:", emailErr.message, emailErr.code)
      }

      if (byEmail) {
        logger.info("[findProfile] Found by email:", byEmail.id, "plan:", byEmail.plan, "is_admin:", byEmail.is_admin)
        return byEmail
      }
    }

    logger.warn("[findProfile] No profile found for userId:", userId, "email:", email)
    return null
  } catch (e) {
    logger.error("[findProfile] Exception:", e)
    return null
  }
}
