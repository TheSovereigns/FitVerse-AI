import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, authUser } from "@/lib/supabase-server"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const auth = await authUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

    const { data: pairs } = await supabase
      .from("accountability_pairs")
      .select("*, user_a:profiles!accountability_pairs_user_a_id_fkey(id, name, avatar_url), user_b:profiles!accountability_pairs_user_b_id_fkey(id, name, avatar_url)")
      .or(`user_a_id.eq.${auth.userId},user_b_id.eq.${auth.userId}`)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    const result = (pairs || []).map((pair: any) => {
      const partner = pair.user_a_id === auth.userId ? pair.user_b : pair.user_a
      return { ...pair, partner, myId: auth.userId, isUserA: pair.user_a_id === auth.userId }
    })

    return NextResponse.json({ pairs: result })
  } catch (e) {
    logger.error("[accountability/GET]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

    const body = await req.json()
    const { partnerId, clanId } = body

    if (!partnerId) return NextResponse.json({ error: "partnerId required" }, { status: 400 })
    if (partnerId === auth.userId) return NextResponse.json({ error: "Cannot pair with yourself" }, { status: 400 })

    const { data: existing } = await supabase
      .from("accountability_pairs")
      .select("id")
      .or(`and(user_a_id.eq.${auth.userId},user_b_id.eq.${partnerId}),and(user_a_id.eq.${partnerId},user_b_id.eq.${auth.userId})`)
      .eq("status", "active")
      .single()

    if (existing) return NextResponse.json({ error: "Already paired" }, { status: 409 })

    const { data: pair, error } = await supabase
      .from("accountability_pairs")
      .insert({ user_a_id: auth.userId, user_b_id: partnerId, clan_id: clanId || null })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ pair })
  } catch (e) {
    logger.error("[accountability/POST]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const pairId = searchParams.get("pairId")
    if (!pairId) return NextResponse.json({ error: "pairId required" }, { status: 400 })

    const { error } = await supabase
      .from("accountability_pairs")
      .update({ status: "ended" })
      .eq("id", pairId)
      .or(`user_a_id.eq.${auth.userId},user_b_id.eq.${auth.userId}`)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error("[accountability/DELETE]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
