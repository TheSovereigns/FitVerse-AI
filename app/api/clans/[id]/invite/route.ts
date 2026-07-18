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

  const { data: membership } = await supabaseAdmin
    .from("clan_members")
    .select("role")
    .eq("clan_id", clanId)
    .eq("user_id", user.id)
    .single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners/admins can create invites" }, { status: 403 })
  }

  const code = Math.random().toString(36).substring(2, 10).toUpperCase()

  const { data: invite, error } = await supabaseAdmin
    .from("clan_invitations")
    .insert({
      clan_id: clanId,
      invited_by: user.id,
      invite_code: code,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invite })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: membership } = await supabaseAdmin
    .from("clan_members")
    .select("role")
    .eq("clan_id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const { data: invites } = await supabaseAdmin
    .from("clan_invitations")
    .select("id, invite_code, status, expires_at, created_at")
    .eq("clan_id", params.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10)

  return NextResponse.json({ invites: invites || [] })
}
