import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, authUser } from "@/lib/supabase-server"
import { checkRateLimit, getRateLimitKey, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authUser(req)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rl = await checkRateLimit(getRateLimitKey(req, "challenge-progress"), RATE_LIMITS.scan)
  if (!rl.allowed) return rateLimitResponse()

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const body = await req.json()
  const { increment } = body

  const inc = Number(increment)
  if (!inc || inc < 0 || inc > 100 || !Number.isInteger(inc)) {
    return NextResponse.json({ error: "Invalid increment (must be integer 1-100)" }, { status: 400 })
  }

  const { data: participant } = await supabase
    .from("challenge_participants")
    .select("id, current_value, completed")
    .eq("challenge_id", params.id)
    .eq("user_id", auth.userId)
    .single()

  if (!participant) return NextResponse.json({ error: "Not a participant" }, { status: 400 })
  if (participant.completed) return NextResponse.json({ error: "Already completed" }, { status: 400 })

  const { data: challenge } = await supabase
    .from("challenges")
    .select("target_value")
    .eq("id", params.id)
    .single()

  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 })

  const newValue = participant.current_value + inc
  const isCompleted = newValue >= challenge.target_value

  const updateData: any = { current_value: newValue }
  if (isCompleted) {
    updateData.completed = true
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from("challenge_participants")
    .update(updateData)
    .eq("id", participant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (isCompleted) {
    await supabase.rpc("log_event", {
      p_type: "challenge_completed",
      p_user_id: auth.userId,
      p_metadata: { challenge_id: params.id },
    })
  }

  return NextResponse.json({ currentValue: newValue, completed: isCompleted })
}
