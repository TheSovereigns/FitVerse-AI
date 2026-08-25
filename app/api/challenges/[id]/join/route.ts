import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, authUser } from "@/lib/supabase-server"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

    const { data: existing } = await supabase
      .from("challenge_participants")
      .select("id")
      .eq("challenge_id", params.id)
      .eq("user_id", auth.userId)
      .single()

    if (existing) return NextResponse.json({ error: "Already joined" }, { status: 409 })

    const { data: challenge } = await supabase
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
      const { data: member } = await supabase
        .from("clan_members")
        .select("id")
        .eq("clan_id", challenge.clan_id)
        .eq("user_id", auth.userId)
        .single()

      if (!member) return NextResponse.json({ error: "Not a clan member" }, { status: 403 })
    }

    const { error } = await supabase
      .from("challenge_participants")
      .insert({ challenge_id: params.id, user_id: auth.userId })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error("[challenge-join]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
