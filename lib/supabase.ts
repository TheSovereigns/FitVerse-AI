/**
 * @deprecated This is a compatibility shim. Prefer direct imports:
 *   - Client: `import { supabase } from "@/lib/supabase/client"`
 *   - Server: `import { getSupabaseAdmin } from "@/lib/supabase/server"`
 * This file re-exports the canonical browser client and retains profile helpers.
 */
import { supabase } from "./supabase/client"
import { logger } from "./logger"
export { supabase } from "./supabase/client"
export { getSupabase, getSupabaseClient } from "./supabase/client"

// Re-export server utilities from canonical server module
export { getSupabaseAdmin, authUser, getCorsHeaders } from "./supabase/server"

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

// Helper function to get user profile
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (data) {
      return data
    }

    if (error) {
      logger.warn("[getUserProfile] Error by id:", error.message, error.code)
      if (error.code === "PGRST301" || error.message?.includes("JWT")) {
        await supabase.auth.refreshSession()
        const { data: retry } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
        if (retry) return retry
      }
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
        return existingByEmail
      }
    }

    return null
  } catch (e) {
    logger.error("[getUserProfile] Exception:", e)
    return null
  }
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
      if (error.code === "PGRST301" || error.message?.includes("JWT")) {
        await supabase.auth.refreshSession()
        const { data: retry } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
        if (retry) return retry
      }
    }

    if (data) {
      return data
    }

    if (email) {
      const { data: byEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (byEmail) {
        return byEmail
      }
    }

    return null
  } catch (e) {
    logger.error("[findProfile] Exception:", e)
    return null
  }
}
