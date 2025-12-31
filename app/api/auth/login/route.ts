import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Em produção real, você usaria um banco de dados como Supabase ou Neon

    // Retorna sucesso para fins de demonstração
    // O client-side irá validar contra localStorage
    return NextResponse.json({
      user: {
        id: Date.now().toString(),
        email: email,
        subscription: "free",
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 })
  }
}
