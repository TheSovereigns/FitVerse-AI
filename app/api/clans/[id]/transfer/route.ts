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

  if (!callerMembership || callerMembership.role !== "owner") {
    return NextResponse.json({ error: "Only owner can transfer ownership" }, { status: 403 })
  }

  if (userId === auth.userId) {
    return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 })
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

  // Transfer ownership: update clan owner_id
  const { error: clanError } = await supabase
    .from("clans")
    .update({ owner_id: userId })
    .eq("id", clanId)

  if (clanError) return NextResponse.json({ error: clanError.message }, { status: 500 })

  // Update roles
  await supabase
    .from("clan_members")
    .update({ role: "owner" })
    .eq("clan_id", clanId)
    .eq("user_id", userId)

  await supabase
    .from("clan_members")
    .update({ role: "admin" })
    .eq("clan_id", clanId)
    .eq("user_id", auth.userId)

  return NextResponse.json({ success: true })
}
