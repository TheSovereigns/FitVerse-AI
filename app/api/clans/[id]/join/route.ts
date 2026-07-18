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

  const clanId = params.id
  const body = await req.json().catch(() => ({}))
  const { inviteCode } = body

  const { data: existingMember } = await supabaseAdmin
    .from("clan_members")
    .select("id")
    .eq("clan_id", clanId)
    .eq("user_id", user.id)
    .single()

  if (existingMember) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 })
  }

  if (inviteCode) {
    const { data: invitation } = await supabaseAdmin
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

    await supabaseAdmin
      .from("clan_invitations")
      .update({ status: "accepted", invited_user_id: user.id })
      .eq("id", invitation.id)
  } else {
    const { data: clan } = await supabaseAdmin
      .from("clans")
      .select("is_public")
      .eq("id", clanId)
      .single()

    if (!clan?.is_public) {
      return NextResponse.json({ error: "This clan requires an invitation" }, { status: 403 })
    }
  }

  const { data: clanInfo } = await supabaseAdmin
    .from("clans")
    .select("max_members")
    .eq("id", clanId)
    .single()

  const { count } = await supabaseAdmin
    .from("clan_members")
    .select("*", { count: "exact", head: true })
    .eq("clan_id", clanId)

  if (clanInfo && count && count >= clanInfo.max_members) {
    return NextResponse.json({ error: "Clan is full" }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from("clan_members").insert({
    clan_id: clanId,
    user_id: user.id,
    role: "member",
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.rpc("log_event", {
    p_type: "clan_joined",
    p_user_id: user.id,
    p_metadata: { clan_id: clanId },
  })

  return NextResponse.json({ success: true })
}
