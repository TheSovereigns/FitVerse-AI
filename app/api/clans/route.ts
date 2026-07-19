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

export async function GET(req: NextRequest) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const view = searchParams.get("view") || "my"

  if (view === "my") {
    const { data: memberships } = await supabase
      .from("clan_members")
      .select("clan_id, role")
      .eq("user_id", user.id)

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ clans: [], userClan: null })
    }

    const clanIds = memberships.map((m) => m.clan_id)
    const { data: clans } = await supabase
      .from("clans")
      .select("*")
      .in("id", clanIds)

    const userMembership = memberships[0]!
    const userClan = clans?.find((c) => c.id === userMembership.clan_id) || null

    const { count: memberCount } = await supabase
      .from("clan_members")
      .select("*", { count: "exact", head: true })
      .eq("clan_id", userMembership.clan_id)

    return NextResponse.json({
      clans: clans || [],
      userClan: userClan ? { ...userClan, role: userMembership.role, memberCount: memberCount || 0 } : null,
    })
  }

  if (view === "discover") {
    const { data: myMemberships } = await supabase
      .from("clan_members")
      .select("clan_id")
      .eq("user_id", user.id)

    const myClanIds = myMemberships?.map((m) => m.clan_id) || []

    let query = supabase
      .from("clans")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50)

    if (myClanIds.length > 0) {
      query = query.not("id", "in", `(${myClanIds.join(",")})`)
    }

    const { data: clans } = await query

    const clanIds = clans?.map((c) => c.id) || []
    const counts: Record<string, number> = {}

    if (clanIds.length > 0) {
      const { data: members } = await supabase
        .from("clan_members")
        .select("clan_id")
        .in("clan_id", clanIds)

      members?.forEach((m) => {
        counts[m.clan_id] = (counts[m.clan_id] || 0) + 1
      })
    }

    const enriched = (clans || []).map((c) => ({
      ...c,
      memberCount: counts[c.id] || 0,
    }))

    return NextResponse.json({ clans: enriched })
  }

  return NextResponse.json({ error: "Invalid view" }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const body = await req.json()
  const { name, description, isPublic } = body

  if (!name || name.trim().length < 3) {
    return NextResponse.json({ error: "Name must be at least 3 characters" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("clans")
    .select("id")
    .eq("name", name.trim())
    .single()

  if (existing) {
    return NextResponse.json({ error: "Clan name already taken" }, { status: 409 })
  }

  const { data: clan, error: clanError } = await supabase
    .from("clans")
    .insert({
      name: name.trim(),
      description: description?.trim() || "",
      is_public: isPublic !== false,
      owner_id: user.id,
    })
    .select()
    .single()

  if (clanError) {
    return NextResponse.json({ error: clanError.message }, { status: 500 })
  }

  const { error: memberError } = await supabase
    .from("clan_members")
    .insert({
      clan_id: clan.id,
      user_id: user.id,
      role: "owner",
    })

  if (memberError) {
    await supabase.from("clans").delete().eq("id", clan.id)
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  await supabase.rpc("log_event", {
    p_type: "clan_created",
    p_user_id: user.id,
    p_metadata: { clan_id: clan.id, clan_name: clan.name },
  })

  return NextResponse.json({ clan: { ...clan, role: "owner", memberCount: 1 } })
}
