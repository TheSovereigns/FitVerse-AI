import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { error: "Esta rota foi desativada. Use /api/generate-metabolic-plan." },
    { status: 410 }
  )
}
