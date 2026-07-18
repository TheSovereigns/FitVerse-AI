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

  const body = await req.json()
  const { increment } = body

  const { data: participant } = await supabaseAdmin
    .from("challenge_participants")
    .select("id, current_value, completed")
    .eq("challenge_id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!participant) return NextResponse.json({ error: "Not a participant" }, { status: 400 })
  if (participant.completed) return NextResponse.json({ error: "Already completed" }, { status: 400 })

  const { data: challenge } = await supabaseAdmin
    .from("challenges")
    .select("target_value")
    .eq("id", params.id)
    .single()

  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 })

  const newValue = participant.current_value + (increment || 1)
  const isCompleted = newValue >= challenge.target_value

  const updateData: any = { current_value: newValue }
  if (isCompleted) {
    updateData.completed = true
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabaseAdmin
    .from("challenge_participants")
    .update(updateData)
    .eq("id", participant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (isCompleted) {
    await supabaseAdmin.rpc("log_event", {
      p_type: "challenge_completed",
      p_user_id: user.id,
      p_metadata: { challenge_id: params.id },
    })
  }

  return NextResponse.json({ currentValue: newValue, completed: isCompleted })
}
