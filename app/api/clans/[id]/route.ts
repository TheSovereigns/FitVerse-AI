import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, authUser } from "@/lib/supabase-server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authUser(req)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const clanId = params.id

  const { data: membership } = await supabase
    .from("clan_members")
    .select("role")
    .eq("clan_id", clanId)
    .eq("user_id", auth.userId)
    .single()

  const { data: clan } = await supabase
    .from("clans")
    .select("*")
    .eq("id", clanId)
    .single()

  if (!clan) return NextResponse.json({ error: "Clan not found" }, { status: 404 })

  if (!clan.is_public && !membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const { count: memberCount } = await supabase
    .from("clan_members")
    .select("*", { count: "exact", head: true })
    .eq("clan_id", clanId)

  const { data: owner } = await supabase
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
  const auth = await authUser(req)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const { data: membership } = await supabase
    .from("clan_members")
    .select("role")
    .eq("clan_id", params.id)
    .eq("user_id", auth.userId)
    .single()

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only owner can delete" }, { status: 403 })
  }

  const { error } = await supabase.from("clans").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authUser(req)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const { data: membership } = await supabase
    .from("clan_members")
    .select("role")
    .eq("clan_id", params.id)
    .eq("user_id", auth.userId)
    .single()

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only owner can edit" }, { status: 403 })
  }

  const body = await req.json()
  const updates: Record<string, any> = {}

  if (body.name !== undefined) {
    if (body.name.trim().length < 3) {
      return NextResponse.json({ error: "Name must be at least 3 characters" }, { status: 400 })
    }
    const { data: existing } = await supabase
      .from("clans")
      .select("id")
      .eq("name", body.name.trim())
      .neq("id", params.id)
      .single()
    if (existing) {
      return NextResponse.json({ error: "Clan name already taken" }, { status: 409 })
    }
    updates.name = body.name.trim()
  }

  if (body.description !== undefined) updates.description = body.description.trim()
  if (body.is_public !== undefined) updates.is_public = body.is_public

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 })
  }

  const { error } = await supabase.from("clans").update(updates).eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
