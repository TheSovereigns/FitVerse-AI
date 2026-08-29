/**
 * Barrel re-export for convenience.
 * Prefer direct imports:
 *   - Client:  "@/lib/supabase/client"
 *   - Server:  "@/lib/supabase/server"
 *   - Middleware: "@/lib/supabase/middleware"
 */

export { supabase, getSupabaseClient, getSupabase } from "./client"
export { getSupabaseAdmin, authUser, getTokenFromRequest, getCorsHeaders } from "./server"
