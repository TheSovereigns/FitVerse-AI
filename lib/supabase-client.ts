import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '⚠️ Supabase environment variables are missing!\n' +
      'Please add the following to your .env.local file:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key'
    )
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null
          try {
            return localStorage.getItem(key)
          } catch {
            return null
          }
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return
          try {
            localStorage.setItem(key, value)
          } catch {}
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return
          try {
            localStorage.removeItem(key)
          } catch {}
        },
      },
    },
  })

  return _supabase
}

export function getSupabase(): SupabaseClient {
  return getSupabaseClient()
}

// Legacy export - lazy getter
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (client as any)[prop]
    if (typeof val === 'function') {
      return val.bind(client)
    }
    return val
  },
})
