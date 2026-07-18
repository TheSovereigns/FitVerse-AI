import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

async function authUser(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const token = auth.slice(7)
  const { data } = await supabaseAdmin.auth.getUser(token)
  return data.user ?? null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clanId = params.id

  const { data: membership } = await supabaseAdmin
    .from("clan_members")
    .select("role")
    .eq("clan_id", clanId)
    .eq("user_id", user.id)
    .single()

  const { data: clan } = await supabaseAdmin
    .from("clans")
    .select("*")
    .eq("id", clanId)
    .single()

  if (!clan) return NextResponse.json({ error: "Clan not found" }, { status: 404 })

  if (!clan.is_public && !membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const { count: memberCount } = await supabaseAdmin
    .from("clan_members")
    .select("*", { count: "exact", head: true })
    .eq("clan_id", clanId)

  const { data: owner } = await supabaseAdmin
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", clan.owner_id)
    .single()

  return NextResponse.json({
    clan: {
      ...clan,
      memberCount: memberCount || 0,
      ownerName: owner?.name || "Unknown",
      ownerAvatar: owner?.avatar_url,
      userRole: membership?.role || null,
      isMember: !!membership,
    },
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: membership } = await supabaseAdmin
    .from("clan_members")
    .select("role")
    .eq("clan_id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only owner can delete" }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from("clans").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
