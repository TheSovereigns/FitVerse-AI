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

  const { data: clan } = await supabase
    .from("clans")
    .select("total_xp, achievements, streak_days")
    .eq("id", params.id)
    .single()

  const { count: memberCount } = await supabase
    .from("clan_members")
    .select("*", { count: "exact", head: true })
    .eq("clan_id", params.id)

  const { count: activityCount } = await supabase
    .from("clan_activities")
    .select("*", { count: "exact", head: true })
    .eq("clan_id", params.id)

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const { count: workoutsThisWeek } = await supabase
    .from("clan_activities")
    .select("*", { count: "exact", head: true })
    .eq("clan_id", params.id)
    .eq("activity_type", "workout")
    .gte("created_at", weekStart.toISOString())

  const { count: scansThisWeek } = await supabase
    .from("clan_activities")
    .select("*", { count: "exact", head: true })
    .eq("clan_id", params.id)
    .eq("activity_type", "scan")
    .gte("created_at", weekStart.toISOString())

  return NextResponse.json({
    stats: {
      total_xp: clan?.total_xp || 0,
      achievements: clan?.achievements || [],
      streak_days: clan?.streak_days || 0,
      member_count: memberCount || 0,
      activity_count: activityCount || 0,
      workouts_this_week: workoutsThisWeek || 0,
      scans_this_week: scansThisWeek || 0,
    },
  })
}
