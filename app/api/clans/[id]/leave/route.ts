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

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 400 })
  }

  if (membership.role === "owner") {
    const { count } = await supabaseAdmin
      .from("clan_members")
      .select("*", { count: "exact", head: true })
      .eq("clan_id", clanId)

    if (count && count > 1) {
      return NextResponse.json({ error: "Transfer ownership before leaving" }, { status: 400 })
    }
  }

  const { error } = await supabaseAdmin
    .from("clan_members")
    .delete()
    .eq("clan_id", clanId)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
