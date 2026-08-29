import { supabase } from "@/lib/supabase/client"

let cachedToken: string | null = null
let cachedAt = 0
const CACHE_TTL = 60000

export async function getToken(): Promise<string | null> {
  if (cachedToken && Date.now() - cachedAt < CACHE_TTL) {
    return cachedToken
  }
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token || null
  if (token) {
    cachedToken = token
    cachedAt = Date.now()
  }
  return token
}

// Backward-compatible alias: some callers expect "" instead of null
export async function getAuthToken(): Promise<string> {
  const token = await getToken()
  return token || ""
}
