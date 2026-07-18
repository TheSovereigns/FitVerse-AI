import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

async function authUser(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const token = auth.slice(7)
  const { data } = await supabaseAdmin.auth.getUser(token)
  return data.user ?? null
}

export async function GET(req: NextRequest) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: pairs } = await supabaseAdmin
    .from("accountability_pairs")
    .select("*, user_a:profiles!accountability_pairs_user_a_id_fkey(id, name, avatar_url), user_b:profiles!accountability_pairs_user_b_id_fkey(id, name, avatar_url)")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const result = (pairs || []).map((pair: any) => {
    const partner = pair.user_a_id === user.id ? pair.user_b : pair.user_a
    const myId = user.id
    return {
      ...pair,
      partner,
      myId,
      isUserA: pair.user_a_id === user.id,
    }
  })

  return NextResponse.json({ pairs: result })
}

export async function POST(req: NextRequest) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { partnerId, clanId } = body

  if (!partnerId) return NextResponse.json({ error: "partnerId required" }, { status: 400 })
  if (partnerId === user.id) return NextResponse.json({ error: "Cannot pair with yourself" }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from("accountability_pairs")
    .select("id")
    .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${partnerId}),and(user_a_id.eq.${partnerId},user_b_id.eq.${user.id})`)
    .eq("status", "active")
    .single()

  if (existing) return NextResponse.json({ error: "Already paired" }, { status: 409 })

  const { data: pair, error } = await supabaseAdmin
    .from("accountability_pairs")
    .insert({
      user_a_id: user.id,
      user_b_id: partnerId,
      clan_id: clanId || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pair })
}

export async function DELETE(req: NextRequest) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const pairId = searchParams.get("pairId")
  if (!pairId) return NextResponse.json({ error: "pairId required" }, { status: 400 })

  const { error } = await supabaseAdmin
    .from("accountability_pairs")
    .update({ status: "ended" })
    .eq("id", pairId)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
