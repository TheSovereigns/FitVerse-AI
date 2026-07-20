import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase admin client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

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
  "/api/auth/reset-password",
  "/api/stripe/webhook",
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
]

// Admin routes (API + pages). Server-side protection.
const adminRoutes = ["/api/admin", "/admin-dashboard"]

// API routes that require auth but are not admin-only.
const protectedRoutes: string[] = []

function matchesRoute(path: string, route: string) {
  if (route === "/") {
    return path === "/"
  }

  return path === route || path.startsWith(`${route}/`)
}

async function getSession(request: NextRequest) {
  if (!supabaseAdmin) return null

  try {
    const bearerToken = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (bearerToken) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(bearerToken)
      if (error || !user) return null
      return user
    }

    // Fallback for deployments that store Supabase auth in cookies.
    const cookieHeader = request.headers.get("cookie") || ""
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("sb-access-token="))
      ?.split("=")[1]

    if (!token) return null

    // Verify the token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return null

    return user
  } catch (error) {
    console.error("Session verification error:", error)
    return null
  }
}

async function isAdmin(userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single()

    if (error) return false
    return data?.is_admin || false
  } catch (error) {
    console.error("Admin check error:", error)
    return false
  }
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
    img-src 'self' blob: data: https://*.stripe.com https://*.google.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
    connect-src 'self' https://api.stripe.com wss://*.supabase.co https://*.supabase.co;
    worker-src 'self';
    manifest-src 'self';
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
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  )

  // 3. Check if route is public
  const isPublicRoute = publicRoutes.some((route) => matchesRoute(path, route))
  if (isPublicRoute) {
    return response
  }

  // 4. Check authentication for protected routes
  const isProtectedRoute = protectedRoutes.some((route) =>
    matchesRoute(path, route)
  )
  const isAdminRoute = adminRoutes.some((route) => matchesRoute(path, route))

  if (isProtectedRoute || isAdminRoute) {
    const user = await getSession(request)

    // Not authenticated - redirect to login
    if (!user) {
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirect", path)
      return NextResponse.redirect(redirectUrl)
    }

    // Admin route - check if user is admin
    if (isAdminRoute) {
      const admin = await isAdmin(user.id)
      if (!admin) {
        // User is not admin - redirect to home
        return NextResponse.redirect(new URL("/", request.url))
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
