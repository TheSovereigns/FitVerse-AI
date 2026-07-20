import { supabase } from "./supabase"

export async function getAuthToken(): Promise<string> {
  // Try localStorage first (fast path)
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('sb-') && key.includes('-auth-token')) {
          const stored = localStorage.getItem(key)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed?.access_token) return parsed.access_token
          }
        }
      }
    } catch {}
  }

  // Fallback to Supabase client
  try {
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Session timeout')), 8000)
    )
    const { data } = await Promise.race([sessionPromise, timeoutPromise])
    return data.session?.access_token || ''
  } catch {
    return ''
  }
}
