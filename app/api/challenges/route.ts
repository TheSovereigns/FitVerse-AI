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

  const { searchParams } = new URL(req.url)
  const clanId = searchParams.get("clanId")

  let query = supabaseAdmin
    .from("challenges")
    .select("*, creator:profiles!challenges_created_by_fkey(name, avatar_url), participants:challenge_participants(id, user_id, current_value, completed, profiles:user_id(name, avatar_url))")
    .eq("is_active", true)
    .gt("end_date", new Date().toISOString())
    .order("created_at", { ascending: false })

  if (clanId) {
    query = query.or(`clan_id.is.null,clan_id.eq.${clanId}`)
  } else {
    query = query.is("clan_id", null)
  }

  const { data: challenges } = await query

  return NextResponse.json({ challenges: challenges || [] })
}

export async function POST(req: NextRequest) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, description, challengeType, targetValue, unit, clanId, endDate } = body

  if (!title || !challengeType || !targetValue || !endDate) {
    return NextResponse.json({ error: "title, challengeType, targetValue, endDate required" }, { status: 400 })
  }

  if (clanId) {
    const { data: member } = await supabaseAdmin
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single()

    if (!member) return NextResponse.json({ error: "Not a clan member" }, { status: 403 })
  }

  const { data: challenge, error } = await supabaseAdmin
    .from("challenges")
    .insert({
      title: title.trim(),
      description: description?.trim() || "",
      challenge_type: challengeType,
      target_value: targetValue,
      unit: unit || "",
      clan_id: clanId || null,
      created_by: user.id,
      end_date: endDate,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from("challenge_participants").insert({
    challenge_id: challenge.id,
    user_id: user.id,
  })

  await supabaseAdmin.rpc("log_event", {
    p_type: "challenge_created",
    p_user_id: user.id,
    p_metadata: { challenge_id: challenge.id, title },
  })

  return NextResponse.json({ challenge })
}
