import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, authUser } from "@/lib/supabase-server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authUser(req)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const { data: member } = await supabase
    .from("clan_members")
    .select("id")
    .eq("clan_id", params.id)
    .eq("user_id", auth.userId)
    .single()

  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100)

  const { data: activities } = await supabase
    .from("clan_activities")
    .select("id, activity_type, activity_data, created_at, user_id, profiles:user_id(name, avatar_url)")
    .eq("clan_id", params.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  return NextResponse.json({ activities: activities || [] })
}
