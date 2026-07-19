import { NextRequest, NextResponse } from "next/server"
import { authUser, getCorsHeaders } from "@/lib/auth-helpers"

export async function POST(req: NextRequest) {
  const user = await authUser(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders() })
  }

  const body = await req.json()
  const { totalScans, totalWorkouts, totalDiets, avgScore, daysActive, currentStreak, scanTrend, workoutTrend } = body

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        insight: generateFallbackInsight(body),
      })
    }

    const prompt = `Voce e um analista de fitness e nutricao. Gere um insight personalizado e motivacional em portugues (maximo 3 frases curtas) baseado nos dados:

- Scans esta semana: ${totalScans} (${scanTrend > 0 ? "+" : ""}${scanTrend}% vs semana anterior)
- Treinos: ${totalWorkouts} (${workoutTrend > 0 ? "+" : ""}${workoutTrend}% vs anterior)
- Dietas geradas: ${totalDiets}
- Score medio: ${avgScore}/100
- Dias ativos: ${daysActive}/7
- Streak atual: ${currentStreak} dias

Seja positivo, motivacional, e de uma dica practica. Responda APENAS o insight, sem formatacao extra.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
        }),
      }
    )

    const data = await response.json()
    const insight = data.candidates?.[0]?.content?.parts?.[0]?.text

    return NextResponse.json({ insight: insight || generateFallbackInsight(body) })
  } catch (e) {
    console.error("[weekly-report] Error generating insight:", e)
    return NextResponse.json({ insight: generateFallbackInsight(body) })
  }
}

function generateFallbackInsight(data: Record<string, unknown>): string {
  const totalScans = (data.totalScans as number) || 0
  const totalWorkouts = (data.totalWorkouts as number) || 0
  const daysActive = (data.daysActive as number) || 0
  const avgScore = (data.avgScore as number) || 0
  const currentStreak = (data.currentStreak as number) || 0

  if (daysActive === 0) {
    return "Semana tranquila! Que tal comecar escaneando seu primeiro alimento hoje? Cada passo conta!"
  }
  if (totalScans > 10 && avgScore > 70) {
    return `Excelente semana! ${totalScans} alimentos analisados com score medio de ${avgScore}. Sua consistencia esta fazendo diferenca!`
  }
  if (totalWorkouts > 3) {
    return `Voce dominou esta semana com ${totalWorkouts} treinos! Seu corpo agradece. Mantenha o ritmo!`
  }
  if (currentStreak > 5) {
    return `${currentStreak} dias seguidos ativo! Sua disciplina e inspiradora. Nao para agora!`
  }
  return `Boa semana com ${daysActive} dias ativos. Continue escaneando e treinando para melhorar seus resultados!`
}
