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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const { data: membership } = await supabase
    .from("clan_members")
    .select("role")
    .eq("clan_id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const { data: members } = await supabase
    .from("clan_members")
    .select("*, profiles:user_id(id, name, avatar_url, plan)")
    .eq("clan_id", params.id)

  return NextResponse.json({ members: members || [] })
}
