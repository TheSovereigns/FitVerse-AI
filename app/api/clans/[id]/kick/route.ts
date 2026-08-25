import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, authUser } from "@/lib/supabase-server"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authUser(req)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const clanId = params.id
  const body = await req.json()
  const { userId } = body

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const { data: callerMembership } = await supabase
    .from("clan_members")
    .select("role")
    .eq("clan_id", clanId)
    .eq("user_id", auth.userId)
    .single()

  if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
    return NextResponse.json({ error: "Only owners/admins can kick members" }, { status: 403 })
  }

  if (userId === auth.userId) {
    return NextResponse.json({ error: "Cannot kick yourself" }, { status: 400 })
  }

  const { data: targetMembership } = await supabase
    .from("clan_members")
    .select("role")
    .eq("clan_id", clanId)
    .eq("user_id", userId)
    .single()

  if (!targetMembership) {
    return NextResponse.json({ error: "User not in this clan" }, { status: 404 })
  }

  if (targetMembership.role === "owner") {
    return NextResponse.json({ error: "Cannot kick the owner" }, { status: 403 })
  }

  if (callerMembership.role === "admin" && targetMembership.role === "admin") {
    return NextResponse.json({ error: "Admins cannot kick other admins" }, { status: 403 })
  }

  const { error } = await supabase
    .from("clan_members")
    .delete()
    .eq("clan_id", clanId)
    .eq("user_id", userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
