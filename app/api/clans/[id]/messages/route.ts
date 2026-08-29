import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, authUser } from "@/lib/supabase-server"
import { checkRateLimit, getRateLimitKey, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

async function verifyClanMembership(supabase: any, clanId: string, userId: string) {
  const { data } = await supabase
    .from("clan_members")
    .select("id")
    .eq("clan_id", clanId)
    .eq("user_id", userId)
    .single()
  return !!data
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

    if (!await verifyClanMembership(supabase, params.id, auth.userId)) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")
    const afterId = searchParams.get("after")

    // Incremental poll: return only messages after last known id (avoids full 100 re-fetch)
    if (afterId) {
      const { data: afterMsg } = await supabase
        .from("clan_messages")
        .select("created_at")
        .eq("id", afterId)
        .eq("clan_id", params.id)
        .maybeSingle()

      if (afterMsg?.created_at) {
        const { data: incremental } = await supabase
          .from("clan_messages")
          .select("id, content, message_type, metadata, created_at, user_id, profiles:user_id(name, avatar_url)")
          .eq("clan_id", params.id)
          .gt("created_at", afterMsg.created_at)
          .order("created_at", { ascending: true })
          .limit(limit)

        return NextResponse.json({ messages: incremental || [] })
      }
      // if afterId not found (e.g. deleted), fall through to full fetch
    }

    const { data: messages } = await supabase
      .from("clan_messages")
      .select("id, content, message_type, metadata, created_at, user_id, profiles:user_id(name, avatar_url)")
      .eq("clan_id", params.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    return NextResponse.json({ messages: (messages || []).reverse() })
  } catch (e) {
    logger.error("[clan-messages-get]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await checkRateLimit(getRateLimitKey(req, "clan-message"), RATE_LIMITS.chatbot)
    if (!rl.allowed) return rateLimitResponse()

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

    if (!await verifyClanMembership(supabase, params.id, auth.userId)) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const body = await req.json()
    const { content, messageType, metadata } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 })
    }

    const { data: message, error } = await supabase
      .from("clan_messages")
      .insert({
        clan_id: params.id,
        user_id: auth.userId,
        content: content.trim(),
        message_type: messageType || "text",
        metadata: metadata || null,
      })
      .select("id, content, message_type, metadata, created_at, user_id")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message })
  } catch (e) {
    logger.error("[clan-messages-post]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
