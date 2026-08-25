import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, authUser } from "@/lib/supabase-server"
import { checkRateLimit, getRateLimitKey, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const auth = await authUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await checkRateLimit(getRateLimitKey(req, "accountability-checkin"), RATE_LIMITS.scan)
    if (!rl.allowed) return rateLimitResponse()

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

    const body = await req.json()
    const { pairId, activityType, activityData } = body

    if (!pairId || !activityType) {
      return NextResponse.json({ error: "pairId and activityType required" }, { status: 400 })
    }

    const { data: pair } = await supabase
      .from("accountability_pairs")
      .select("id, user_a_id, user_b_id, status")
      .eq("id", pairId)
      .single()

    if (!pair) return NextResponse.json({ error: "Pair not found" }, { status: 404 })
    if (pair.status !== "active") return NextResponse.json({ error: "Pair not active" }, { status: 400 })
    if (pair.user_a_id !== auth.userId && pair.user_b_id !== auth.userId) {
      return NextResponse.json({ error: "Not part of this pair" }, { status: 403 })
    }

    const today = new Date().toISOString().split("T")[0]

    const { data: existing } = await supabase
      .from("accountability_checkins")
      .select("id")
      .eq("pair_id", pairId)
      .eq("user_id", auth.userId)
      .eq("checkin_date", today)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Already checked in today" }, { status: 409 })
    }

    const { data: checkin, error } = await supabase
      .from("accountability_checkins")
      .insert({
        pair_id: pairId,
        user_id: auth.userId,
        activity_type: activityType,
        activity_data: activityData || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const todayA = await supabase
      .from("accountability_checkins")
      .select("id")
      .eq("pair_id", pairId)
      .eq("user_id", pair.user_a_id)
      .eq("checkin_date", today)
      .single()

    const todayB = await supabase
      .from("accountability_checkins")
      .select("id")
      .eq("pair_id", pairId)
      .eq("user_id", pair.user_b_id)
      .eq("checkin_date", today)
      .single()

    if (todayA.data && todayB.data) {
      await supabase.rpc("log_event", {
        p_type: "accountability_checkin",
        p_user_id: auth.userId,
        p_metadata: { pair_id: pairId, both_checked_in: true },
      })
    }

    return NextResponse.json({ checkin })
  } catch (e) {
    logger.error("[accountability-checkin]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
