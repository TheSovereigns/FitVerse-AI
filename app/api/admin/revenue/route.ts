import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/auth-helpers'
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: subs, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 })
    }

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('plan')

    return NextResponse.json({ subscriptions: subs || [], profiles: profiles || [] })
  } catch (e) {
    logger.error("[admin-revenue]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
