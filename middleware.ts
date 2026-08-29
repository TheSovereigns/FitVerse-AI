import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Supabase service-role client for admin DB queries (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

// Legacy anon client for fallback when @supabase/ssr is not installed
// TODO: Remove after `npm install @supabase/ssr` and httpOnly migration is verified
function getLegacyAnonClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/stripe/webhook",
]

// Admin routes (API + pages). Server-side protection.
const adminRoutes = ["/api/admin", "/admin-dashboard"]

// API routes that require auth but are not admin-only.
const protectedRoutes = [
  "/api/analyze-product",
  "/api/generate-metabolic-plan",
  "/api/generate-recipes",
  "/api/generate-workouts",
  "/api/calculate-macros",
  "/api/chatbot",
  "/api/biological-age",
  "/api/analyze-sleep",
  "/api/recommend-supplements",
  "/api/food-substitutions",
  "/api/generate-weekly-meals",
  "/api/weekly-report",
  "/api/generate-initial-plan",
  "/api/stripe/checkout",
  "/api/stripe/stats",
  "/api/subscription",
  "/api/clans",
  "/api/challenges",
  "/api/accountability",
]

function matchesRoute(path: string, route: string) {
  if (route === "/") {
    return path === "/"
  }

  return path === route || path.startsWith(`${route}/`)
}

/**
 * httpOnly-first session resolution.
 * 1) Try @supabase/ssr via lib/supabase/middleware.ts (httpOnly cookies, local JWT via getClaims)
 * 2) Fallback: Authorization Bearer header (API clients)
 * 3) Legacy fallback: sb-access-token cookie (non-httpOnly, to be removed)
 */
async function getSession(request: NextRequest, response: NextResponse) {
  // 1) httpOnly SSR path — prefers getClaims (local verify, no network)
  try {
    const { createClient: createSSRClient } = await import("@/lib/supabase/middleware")
    const ssrClient = await createSSRClient(request, response)
    if (ssrClient) {
      // Prefer getClaims for performance (local JWT verify)
      try {
        const maybeGetClaims = (ssrClient.auth as unknown as { getClaims?: () => Promise<any> }).getClaims
        if (typeof maybeGetClaims === "function") {
          const { data, error } = await maybeGetClaims.call(ssrClient.auth)
          if (!error && data?.claims?.sub) {
            return { id: data.claims.sub as string, email: data.claims.email as string | undefined }
          }
        }
      } catch {}
      const { data: { user } } = await ssrClient.auth.getUser()
      if (user) return user
    }
  } catch {
    // @supabase/ssr not installed or SSR client failed — continue to fallback
    // TODO: run `npm install @supabase/ssr`
  }

  // 2) + 3) Legacy fallback (kept working until migration complete)
  const legacyClient = getLegacyAnonClient()
  if (!legacyClient) return null

  try {
    const bearerToken = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (bearerToken) {
      const { data: { user }, error } = await legacyClient.auth.getUser(bearerToken)
      if (!error && user) return user
    }

    // Legacy non-httpOnly cookie — read via NextRequest cookies (more robust than raw header split)
    // TODO: Remove after httpOnly migration: `sb-access-token` should not be set via document.cookie
    const legacyToken = request.cookies.get("sb-access-token")?.value
      || request.headers.get("cookie")?.split("; ").find((row) => row.startsWith("sb-access-token="))?.split("=")[1]
    if (!legacyToken) return null

    const { data: { user }, error } = await legacyClient.auth.getUser(legacyToken)
    if (error || !user) return null

    return user
  } catch (error) {
    console.error("Session verification error:", error)
    return null
  }
}

async function isAdmin(userId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    return false
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle()

    if (error || !data) return false
    return data?.is_admin || false
  } catch (error) {
    console.error("Admin check error:", error)
    return false
  }
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value, c as any)
  })
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const path = request.nextUrl.pathname

  // 1. Security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // 2. CSP (Content Security Policy)
  const isDev = process.env.NODE_ENV === "development"
  const cspHeader = `
    default-src 'self';
    script-src 'self'${isDev ? " 'unsafe-eval'" : ""} 'unsafe-inline' https://js.stripe.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.stripe.com https://*.google.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://*.cartocdn.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
    connect-src 'self' https://api.stripe.com wss://*.supabase.co https://*.supabase.co https://nominatim.openstreetmap.org;
    ${isDev ? "" : "upgrade-insecure-requests;"}
  `
  response.headers.set(
    "Content-Security-Policy",
    cspHeader.replace(/\s{2,}/g, " ").trim()
  )

  // 3. Additional security headers
  if (!isDev) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  }
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), interest-cohort=()"
  )

  // 3b. Landing → App redirect for authed users
  if (path === "/") {
    const user = await getSession(request, response)
    if (user) {
      const redirectRes = NextResponse.redirect(new URL("/app", request.url))
      copyCookies(response, redirectRes)
      // Preserve security headers on redirect
      redirectRes.headers.set("X-Frame-Options", response.headers.get("X-Frame-Options") || "DENY")
      return redirectRes
    }
    return response
  }

  // 3c. Check if route is public
  const isPublicRoute = publicRoutes.some((route) => matchesRoute(path, route))
  if (isPublicRoute) {
    return response
  }

  // 4. Check authentication for protected routes
  const isAppRoute = path === "/app" || path.startsWith("/app/")
  const isProtectedRoute = protectedRoutes.some((route) =>
    matchesRoute(path, route)
  )
  const isAdminRoute = adminRoutes.some((route) => matchesRoute(path, route))

  if (isAppRoute || isProtectedRoute || isAdminRoute) {
    const user = await getSession(request, response)

    // Not authenticated
    if (!user) {
      // API routes get 401 JSON, pages get redirect
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirect", path)
      const redirectRes = NextResponse.redirect(redirectUrl)
      copyCookies(response, redirectRes)
      return redirectRes
    }

    // Admin route - check if user is admin
    if (isAdminRoute) {
      const admin = await isAdmin(user.id)
      if (!admin) {
        if (path.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const redirectRes = NextResponse.redirect(new URL("/app", request.url))
        copyCookies(response, redirectRes)
        return redirectRes
      }
    }

    // Add user ID to headers for API routes
    if (path.startsWith("/api/")) {
      response.headers.set("x-user-id", user.id)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
