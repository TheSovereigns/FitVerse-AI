// In-memory LRU rate limiter — free-tier friendly, no DB cost
// Falls back to this when Supabase/Upstash not available or to reduce DB ops

const store = new Map<string, number[]>()

function prune(key: string, windowMs: number) {
  const now = Date.now()
  const arr = store.get(key) || []
  const filtered = arr.filter(t => now - t < windowMs)
  if (filtered.length !== arr.length) store.set(key, filtered)
  return filtered
}

export function checkMemoryRateLimit(key: string, windowMs: number, maxRequests: number): { allowed: boolean; remaining: number } {
  const arr = prune(key, windowMs)
  if (arr.length >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }
  arr.push(Date.now())
  store.set(key, arr)
  // Cleanup old keys periodically (prevent memory leak)
  if (store.size > 5000) {
    const oldest = store.keys().next().value as string
    store.delete(oldest)
  }
  return { allowed: true, remaining: maxRequests - arr.length }
}

export function isUpstashConfigured(): boolean {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN
}
