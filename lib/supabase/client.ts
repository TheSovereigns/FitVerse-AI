import { createClient, SupabaseClient } from "@supabase/supabase-js"

type GlobalWithSupabase = typeof globalThis & { __vysefit_supabase?: SupabaseClient }

/**
 * Custom Navigator LockManager wrapper.
 *
 * Default @supabase/auth-js lock tries to acquire the storage lock with
 * `ifAvailable: true` (acquireTimeout 0) and throws
 * "Acquiring an exclusive Navigator LockManager lock immediately failed"
 * when another tab/operation holds it (e.g. signIn racing refreshSession).
 * Waiting for the lock instead of failing immediately fixes login.
 */
async function supabaseLock<T>(name: string, acquireTimeout: number, fn: () => Promise<T>): Promise<T> {
  if (typeof window === "undefined" || !("locks" in navigator) || typeof (navigator as any).locks?.request !== "function") {
    return fn()
  }
  // Always wait (up to timeout) instead of failing immediately.
  const timeout = acquireTimeout > 0 ? acquireTimeout : 5000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    return await (navigator as any).locks.request(
      name,
      { mode: "exclusive", signal: controller.signal },
      async () => fn()
    )
  } catch (e: any) {
    // If we timed out waiting, run without the lock as last resort
    // instead of surfacing "immediately failed" to the user.
    if (e?.name === "AbortError") {
      return fn()
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export function getSupabaseClient(): SupabaseClient {
  const g = globalThis as GlobalWithSupabase
  if (g.__vysefit_supabase) return g.__vysefit_supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "⚠️ Supabase environment variables are missing!\n" +
        "Please add the following to your .env.local file:\n" +
        "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\n" +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    )
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      lock: supabaseLock,
      storage: {
        getItem: (key: string) => {
          if (typeof window === "undefined") return null
          try {
            return localStorage.getItem(key)
          } catch {
            return null
          }
        },
        setItem: (key: string, value: string) => {
          if (typeof window === "undefined") return
          try {
            localStorage.setItem(key, value)
          } catch {}
        },
        removeItem: (key: string) => {
          if (typeof window === "undefined") return
          try {
            localStorage.removeItem(key)
          } catch {}
        },
      },
    },
  })

  g.__vysefit_supabase = client
  return client
}

export function getSupabase(): SupabaseClient {
  return getSupabaseClient()
}

// Legacy direct export - avoids Proxy pattern that breaks JWT header attachment
export const supabase: SupabaseClient = getSupabaseClient()
