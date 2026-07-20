import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "./supabase-server"

/*
  Supabase-backed rate limiter.

  Run this SQL in your Supabase SQL Editor to create the table:

  CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_rate_limits_key_window ON rate_limits(key, window_start);
*/

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { allowed: true, remaining: config.maxRequests }

  const windowStart = new Date(Date.now() - config.windowMs).toISOString()

  try {
    // Clean up old entries (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
    await supabase.from('rate_limits').delete().lt('window_start', oneHourAgo)

    // Count requests in current window
    const { count, error: countError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('window_start', windowStart)

    if (countError) {
      console.error('[RateLimit] Count error:', countError)
      return { allowed: true, remaining: config.maxRequests }
    }

    const currentCount = count ?? 0

    if (currentCount >= config.maxRequests) {
      return { allowed: false, remaining: 0 }
    }

    // Insert new request record
    await supabase.from('rate_limits').insert({ key })

    return { allowed: true, remaining: config.maxRequests - currentCount - 1 }
  } catch (error) {
    console.error('[RateLimit] Error:', error)
    return { allowed: true, remaining: config.maxRequests }
  }
}

export function getRateLimitKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || "unknown"
  return `${prefix}:${ip}`
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: "Muitas requisições. Tente novamente em instantes." },
    { status: 429 }
  )
}

export const RATE_LIMITS = {
  login: { windowMs: 60_000, maxRequests: 5 },
  signup: { windowMs: 60_000, maxRequests: 3 },
  chatbot: { windowMs: 60_000, maxRequests: 20 },
  scan: { windowMs: 60_000, maxRequests: 10 },
  generate: { windowMs: 60_000, maxRequests: 5 },
} as const
