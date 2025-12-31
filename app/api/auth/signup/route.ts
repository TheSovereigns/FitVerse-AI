import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // O armazenamento real acontece no client-side (localStorage)
    // Em produção, use banco de dados real (Supabase, Neon) com hash de senha
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      subscription: "free",
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        subscription: newUser.subscription,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 })
  }
}
