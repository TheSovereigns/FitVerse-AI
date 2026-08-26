import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "./supabase-server"
import { checkMemoryRateLimit } from "./rate-limit-memory"

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
  // 1. Memory LRU first — free, instant, no DB cost
  const mem = checkMemoryRateLimit(key, config.windowMs, config.maxRequests)
  if (!mem.allowed) return mem

  // 2. Supabase fallback for cross-instance consistency (optional)
  // Skip DB if MEMORY_ONLY or if we already have memory allow (saves 3 DB ops)
  if (process.env.RATE_LIMIT_MEMORY_ONLY === "true") {
    return mem
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return mem

  const windowStart = new Date(Date.now() - config.windowMs).toISOString()

  try {
    // Clean up old entries (older than 1 hour) — best effort, don't block
    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
    supabase.from('rate_limits').delete().lt('window_start', oneHourAgo).then(() => {}, () => {})

    // Count requests in current window
    const { count, error: countError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('window_start', windowStart)

    if (countError) {
      console.error('[RateLimit] Count error:', countError)
      return mem
    }

    const currentCount = count ?? 0

    if (currentCount >= config.maxRequests) {
      return { allowed: false, remaining: 0 }
    }

    // Insert new request record — best effort
    supabase.from('rate_limits').insert({ key }).then(() => {}, () => {})

    return { allowed: true, remaining: Math.min(mem.remaining, config.maxRequests - currentCount - 1) }
  } catch (error) {
    console.error('[RateLimit] Error:', error)
    return mem
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
