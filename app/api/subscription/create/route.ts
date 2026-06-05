import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Esta rota de assinatura demo foi desativada. Use /api/stripe/checkout e o webhook do Stripe.",
    },
    { status: 410 }
  )
}
