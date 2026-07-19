"use client"

const cache = new Map<string, { data: unknown; timestamp: number }>()
const DEFAULT_TTL = 5 * 60 * 1000

export function getCached<T>(key: string, ttl: number = DEFAULT_TTL): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options?.body || "")}`
  const cached = getCached<T>(cacheKey, ttl)
  if (cached) return cached

  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const data = await response.json() as T
  setCache(cacheKey, data)
  return data
}
