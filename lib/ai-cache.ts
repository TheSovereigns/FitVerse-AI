/**
 * Simple in-memory LRU cache with TTL for AI results.
 * Free-tier friendly — no external deps.
 * Used by analyze-product to avoid duplicate AI calls for identical images.
 */

const cache = new Map<string, { data: any; expires: number }>()

export function getCached(key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  return entry.data
}

export function setCached(key: string, data: any, ttlMs = 7 * 24 * 3600_000) {
  cache.set(key, { data, expires: Date.now() + ttlMs })
  if (cache.size > 200) {
    const first = cache.keys().next().value as string | undefined
    if (first) cache.delete(first)
  }
}

export async function hashImage(data: string): Promise<string> {
  const slice = data.slice(0, 20000)
  // Try Web Crypto (Edge + modern Node)
  try {
    const subtle = (globalThis as any)?.crypto?.subtle
    if (subtle) {
      const encoder = new TextEncoder()
      const buf = await subtle.digest("SHA-256", encoder.encode(slice))
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 32)
    }
  } catch {}
  // Fallback to Node crypto
  try {
    const { createHash } = await import("crypto")
    return createHash("sha256").update(slice).digest("hex").slice(0, 32)
  } catch {}
  // Last resort: djb2-like simple hash (sync, no deps)
  let hash = 5381
  for (let i = 0; i < slice.length; i++) {
    hash = ((hash << 5) + hash + slice.charCodeAt(i)) >>> 0
  }
  return Math.abs(hash).toString(16).padStart(8, "0").slice(0, 32)
}
