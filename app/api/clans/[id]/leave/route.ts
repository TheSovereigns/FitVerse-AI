import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, authUser } from "@/lib/supabase-server"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 400 })
  }

  if (membership.role === "owner") {
    const { count } = await supabase
      .from("clan_members")
      .select("*", { count: "exact", head: true })
      .eq("clan_id", clanId)

    if (count && count > 1) {
      return NextResponse.json({ error: "Transfer ownership before leaving" }, { status: 400 })
    }
  }

  const { error } = await supabase
    .from("clan_members")
    .delete()
    .eq("clan_id", clanId)
    .eq("user_id", auth.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
