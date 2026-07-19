import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

async function authUser(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const token = auth.slice(7)
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  const { data } = await supabase.auth.getUser(token)
  return data.user ?? null
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

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
      user_id: user.id,
      activity_type: activityType,
      activity_data: activityData,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ activity })
}
