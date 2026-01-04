import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: data.user?.id,
        name: data.user?.user_metadata?.name,
        email: data.user?.email,
        subscription: "free",
      },
      session: data.session,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 })
  }
}