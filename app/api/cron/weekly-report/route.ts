import { NextRequest, NextResponse } from "next/server"

// Vercel Cron — free tier (2 crons). Gera weekly report stub sem pg_cron.
// Mantém dados em localStorage no client; este endpoint só mantém function warm
// e pode ser expandido para gerar reports no DB quando migrar do free.

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets Authorization: Bearer <CRON_SECRET> if configured)
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow Vercel cron without secret in dev, block only if secret is set and mismatched
    const isVercelCron = request.headers.get("x-vercel-cron") === "1"
    if (!isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // Free-tier: no DB heavy work. Just return ok for cron health check.
  // Future: when on Pro, generate reports for all users via pg:
  // SELECT user_id FROM profiles; for each, aggregate scans/workouts and insert into reports table.

  return NextResponse.json({ ok: true, message: "weekly-report cron ok (free-tier stub)", timestamp: new Date().toISOString() })
}
