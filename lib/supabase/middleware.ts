/**
 * Supabase SSR middleware — httpOnly cookie handling
 *
 * Requires: npm install @supabase/ssr
 * TODO: After installation, this becomes the primary auth path and the
 * legacy `sb-access-token` fallback in `middleware.ts` can be removed.
 *
 * Pattern requested in task:
 * ```ts
 * import { createServerClient } from '@supabase/ssr'
 * export function createClient(request, response) {
 *   return createServerClient(url, key, {
 *     cookies: {
 *       get(name) { return request.cookies.get(name)?.value },
 *       set(name, value, options) { response.cookies.set({ name, value, ...options }) },
 *       remove(name, options) { response.cookies.set({ name, value: '', ...options }) }
 *     }
 *   })
 * }
 * ```
 *
 * This file uses dynamic import() so the build does NOT break when
 * @supabase/ssr is not yet installed (fallback to legacy logic in middleware.ts).
 */

import { NextResponse, type NextRequest } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Create a Supabase client that reads/writes httpOnly cookies via
 * @supabase/ssr. Uses dynamic import so it safely returns null when
 * the package is not installed (caller should fallback).
 *
 * Covers both the legacy `cookies.get/set/remove` API and the newer
 * `getAll/setAll` API (supabase/ssr >= 0.5).
 */
export async function createClient(
  request: NextRequest,
  response: NextResponse
): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  try {
    // @ts-ignore — @supabase/ssr not yet installed; requires `npm install @supabase/ssr`
    const { createServerClient } = await import("@supabase/ssr")
    return createServerClient(url, key, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...(options as any) })
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: "", ...(options as any) })
        },
        // New API (preferred): getAll/setAll
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as any)
          )
        },
      },
    } as any) as SupabaseClient
  } catch {
    // @supabase/ssr not installed — caller should use legacy fallback
    // TODO: run `npm install @supabase/ssr` and remove legacy path
    return null
  }
}

/**
 * Convenience: refresh session via httpOnly cookies and return user.
 * Prefers `getClaims()` (local JWT verify, no network) then falls back to `getUser()`.
 */
export async function getUserFromSSR(
  request: NextRequest,
  response: NextResponse
): Promise<{ id: string; email?: string } | null> {
  const supabase = await createClient(request, response)
  if (!supabase) return null

  // Prefer getClaims — local verify, no network round-trip
  try {
    const maybeGetClaims = (supabase.auth as unknown as { getClaims?: () => Promise<any> }).getClaims
    if (typeof maybeGetClaims === "function") {
      const { data, error } = await maybeGetClaims.call(supabase.auth)
      if (!error && data?.claims?.sub) {
        return { id: data.claims.sub as string, email: data.claims.email as string | undefined }
      }
    }
  } catch {
    // fall through to getUser
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user as unknown as { id: string; email?: string }
  } catch {}
  return null
}

/**
 * Full updateSession helper for middleware.ts (optional).
 * Creates the SSR client, refreshes session, and returns the mutated response.
 * Caller can inspect `supabase.auth.getClaims()` / `getUser()` via the returned supabase.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request })
  const supabase = await createClient(request, response)
  if (!supabase) return response
  // Trigger refresh — Supabase SSR will set/refresh cookies on `response` automatically
  try {
    const maybeGetClaims = (supabase.auth as unknown as { getClaims?: () => Promise<any> }).getClaims
    if (typeof maybeGetClaims === "function") {
      await maybeGetClaims.call(supabase.auth)
    } else {
      await supabase.auth.getUser()
    }
  } catch {}
  return response
}
