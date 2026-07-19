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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

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
