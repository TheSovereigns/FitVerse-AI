import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, authUser } from "@/lib/supabase-server"
import { checkRateLimit, getRateLimitKey, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"

const XP_VALUES: Record<string, number> = {
  scan: 10,
  workout: 20,
  diet: 15,
  streak: 5,
  badge: 25,
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authUser(req)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rl = await checkRateLimit(getRateLimitKey(req, "clan-share"), RATE_LIMITS.chatbot)
  if (!rl.allowed) return rateLimitResponse()

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const { data: member } = await supabase
    .from("clan_members")
    .select("id")
    .eq("clan_id", params.id)
    .eq("user_id", auth.userId)
    .single()

  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const body = await req.json()
  const { activityType, activityData } = body

  if (!activityType || !activityData) {
    return NextResponse.json({ error: "activityType and activityData required" }, { status: 400 })
  }

  const validTypes = ["scan", "workout", "diet", "streak", "badge"]
  if (!validTypes.includes(activityType)) {
    return NextResponse.json({ error: "Invalid activity type" }, { status: 400 })
  }

  const { data: activity, error } = await supabase
    .from("clan_activities")
    .insert({
      clan_id: params.id,
      user_id: auth.userId,
      activity_type: activityType,
      activity_data: activityData,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Add XP to the clan
  const xpAmount = XP_VALUES[activityType] || 10
  await supabase.rpc("add_clan_xp", {
    p_clan_id: params.id,
    p_user_id: auth.userId,
    p_xp_amount: xpAmount,
    p_source: activityType,
    p_metadata: activityData,
  })

  return NextResponse.json({ activity, xp_added: xpAmount })
}
