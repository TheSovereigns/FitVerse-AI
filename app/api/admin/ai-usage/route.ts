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

    const { data: messages, error } = await supabaseAdmin
      .from('ai_messages')
      .select('user_id, user_message, created_at, tokens_used')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (e) {
    logger.error("[admin-ai-usage]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
