import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json()

    // Simular criação de assinatura
    // Em produção, integrar com Stripe ou outro gateway de pagamento
    const subscription = {
      id: `sub_${Date.now()}`,
      planId,
      status: "active",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    return NextResponse.json({
      subscription,
      message: "Assinatura criada com sucesso",
    })
  } catch (error) {
    console.error("Subscription creation error:", error)
    return NextResponse.json({ error: "Erro ao criar assinatura" }, { status: 500 })
  }
}
