import { supabase } from "@/lib/supabase/client"

export async function getToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token || null
}

// Backward-compatible alias: some callers expect "" instead of null
export async function getAuthToken(): Promise<string> {
  const token = await getToken()
  return token || ""
}
