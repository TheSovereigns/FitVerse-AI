import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, authUser } from "@/lib/supabase-server"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authUser(req)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const clanId = params.id
  const body = await req.json().catch(() => ({}))
  const { inviteCode } = body

  const { data: existingMember } = await supabase
    .from("clan_members")
    .select("id")
    .eq("clan_id", clanId)
    .eq("user_id", auth.userId)
    .single()

  if (existingMember) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 })
  }

  if (inviteCode) {
    const { data: invitation } = await supabase
      .from("clan_invitations")
      .select("id")
      .eq("clan_id", clanId)
      .eq("invite_code", inviteCode)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .single()

    if (!invitation) {
      return NextResponse.json({ error: "Invalid or expired invite code" }, { status: 400 })
    }

    await supabase
      .from("clan_invitations")
      .update({ status: "accepted", invited_user_id: auth.userId })
      .eq("id", invitation.id)
  } else {
    const { data: clan } = await supabase
      .from("clans")
      .select("is_public")
      .eq("id", clanId)
      .single()

    if (!clan?.is_public) {
      return NextResponse.json({ error: "This clan requires an invitation" }, { status: 403 })
    }
  }

  const { data: clanInfo } = await supabase
    .from("clans")
    .select("max_members")
    .eq("id", clanId)
    .single()

  const { count } = await supabase
    .from("clan_members")
    .select("*", { count: "exact", head: true })
    .eq("clan_id", clanId)

  if (clanInfo && count && count >= clanInfo.max_members) {
    return NextResponse.json({ error: "Clan is full" }, { status: 400 })
  }

  const { error } = await supabase.from("clan_members").insert({
    clan_id: clanId,
    user_id: auth.userId,
    role: "member",
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.rpc("log_event", {
    p_type: "clan_joined",
    p_user_id: auth.userId,
    p_metadata: { clan_id: clanId },
  })

  return NextResponse.json({ success: true })
}
