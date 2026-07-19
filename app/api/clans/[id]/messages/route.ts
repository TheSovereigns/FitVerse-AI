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

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")

  const { data: messages } = await supabase
    .from("clan_messages")
    .select("id, content, message_type, metadata, created_at, user_id, profiles:user_id(name, avatar_url)")
    .eq("clan_id", params.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  return NextResponse.json({ messages: (messages || []).reverse() })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 })

  const body = await req.json()
  const { content, messageType, metadata } = body

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 })
  }

  const { data: message, error } = await supabase
    .from("clan_messages")
    .insert({
      clan_id: params.id,
      user_id: user.id,
      content: content.trim(),
      message_type: messageType || "text",
      metadata: metadata || null,
    })
    .select("id, content, message_type, metadata, created_at, user_id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message })
}
