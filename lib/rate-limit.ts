import { NextResponse } from "next/server"

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1 }
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: config.maxRequests - entry.count }
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
