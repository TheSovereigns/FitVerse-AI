import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

async function authUser(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const token = auth.slice(7)
  const { data } = await supabaseAdmin.auth.getUser(token)
  return data.user ?? null
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: existing } = await supabaseAdmin
    .from("challenge_participants")
    .select("id")
    .eq("challenge_id", params.id)
    .eq("user_id", user.id)
    .single()

  if (existing) return NextResponse.json({ error: "Already joined" }, { status: 409 })

  const { data: challenge } = await supabaseAdmin
    .from("challenges")
    .select("clan_id, is_active, end_date")
    .eq("id", params.id)
    .single()

  if (!challenge || !challenge.is_active) {
    return NextResponse.json({ error: "Challenge not available" }, { status: 400 })
  }

  if (new Date(challenge.end_date) < new Date()) {
    return NextResponse.json({ error: "Challenge ended" }, { status: 400 })
  }

  if (challenge.clan_id) {
    const { data: member } = await supabaseAdmin
      .from("clan_members")
      .select("id")
      .eq("clan_id", challenge.clan_id)
      .eq("user_id", user.id)
      .single()

    if (!member) return NextResponse.json({ error: "Not a clan member" }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from("challenge_participants")
    .insert({ challenge_id: params.id, user_id: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
