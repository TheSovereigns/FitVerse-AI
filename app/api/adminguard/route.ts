import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { error: "Esta rota foi desativada. Use as rotas /api/admin/* protegidas por token." },
    { status: 410 }
  )
}
