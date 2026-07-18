import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      error: "Esta rota mockada foi desativada. O dashboard admin deve buscar dados reais nas tabelas do Supabase.",
    },
    { status: 410 }
  )
}
