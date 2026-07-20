import { NextRequest, NextResponse } from "next/server"
import { authUser, getCorsHeaders } from "@/lib/auth-helpers"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  const user = await authUser(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders() })
  }

  try {
    const { subscription } = await req.json()
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400, headers: getCorsHeaders() })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: "Server config error" }, { status: 500, headers: getCorsHeaders() })
    }

    // Upsert subscription
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        user_id: user.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || "",
        auth: subscription.keys?.auth || "",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

    if (error) throw error

    return NextResponse.json({ success: true }, { headers: getCorsHeaders() })
  } catch (error) {
    console.error("[Push] Subscribe error:", error)
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500, headers: getCorsHeaders() })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await authUser(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders() })
  }

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: "Server config error" }, { status: 500, headers: getCorsHeaders() })
    }

    await supabase.from("push_subscriptions").delete().eq("user_id", user.userId)

    return NextResponse.json({ success: true }, { headers: getCorsHeaders() })
  } catch (error) {
    console.error("[Push] Unsubscribe error:", error)
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500, headers: getCorsHeaders() })
  }
}
