import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

async function authUser(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const token = auth.slice(7)
  const { data } = await supabaseAdmin.auth.getUser(token)
  return data.user ?? null
}

export async function POST(req: NextRequest) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { pairId, activityType, activityData } = body

  if (!pairId || !activityType) {
    return NextResponse.json({ error: "pairId and activityType required" }, { status: 400 })
  }

  const today = new Date().toISOString().split("T")[0]

  const { data: existing } = await supabaseAdmin
    .from("accountability_checkins")
    .select("id")
    .eq("pair_id", pairId)
    .eq("user_id", user.id)
    .eq("checkin_date", today)
    .single()

  if (existing) {
    return NextResponse.json({ error: "Already checked in today" }, { status: 409 })
  }

  const { data: checkin, error } = await supabaseAdmin
    .from("accountability_checkins")
    .insert({
      pair_id: pairId,
      user_id: user.id,
      activity_type: activityType,
      activity_data: activityData || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: pair } = await supabaseAdmin
    .from("accountability_pairs")
    .select("user_a_id, user_b_id")
    .eq("id", pairId)
    .single()

  if (pair) {
    const todayA = await supabaseAdmin
      .from("accountability_checkins")
      .select("id")
      .eq("pair_id", pairId)
      .eq("user_id", pair.user_a_id)
      .eq("checkin_date", today)
      .single()

    const todayB = await supabaseAdmin
      .from("accountability_checkins")
      .select("id")
      .eq("pair_id", pairId)
      .eq("user_id", pair.user_b_id)
      .eq("checkin_date", today)
      .single()

    if (todayA.data && todayB.data) {
      await supabaseAdmin.rpc("log_event", {
        p_type: "accountability_checkin",
        p_user_id: user.id,
        p_metadata: { pair_id: pairId, both_checked_in: true },
      })
    }
  }

  return NextResponse.json({ checkin })
}
