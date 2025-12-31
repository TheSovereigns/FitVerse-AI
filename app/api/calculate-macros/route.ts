import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { NextResponse } from "next/server"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

interface BioPerfil {
  age: number
  weight: number
  height: number
  gender: "male" | "female"
  activityLevel: "sedentary" | "moderate" | "active" | "athlete"
  goal: "lose_weight" | "gain_muscle" | "maintenance"
}

function calculateBMR(perfil: BioPerfil): number {
  // Mifflin-St Jeor Equation
  if (perfil.gender === "male") {
    return 10 * perfil.weight + 6.25 * perfil.height - 5 * perfil.age + 5
  } else {
    return 10 * perfil.weight + 6.25 * perfil.height - 5 * perfil.age - 161
  }
}

function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers = {
    sedentary: 1.2,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  }
  return bmr * multipliers[activityLevel as keyof typeof multipliers]
}

function calculateMacros(tdee: number, goal: string) {
  let calories = tdee

  if (goal === "lose_weight") {
    calories = tdee * 0.8 // 20% deficit
  } else if (goal === "gain_muscle") {
    calories = tdee * 1.15 // 15% surplus
  }

  let proteinPercent = 30
  let carbsPercent = 40
  let fatPercent = 30

  if (goal === "gain_muscle") {
    proteinPercent = 35
    carbsPercent = 45
    fatPercent = 20
  } else if (goal === "lose_weight") {
    proteinPercent = 35
    carbsPercent = 30
    fatPercent = 35
  }

  const proteinGrams = Math.round((calories * (proteinPercent / 100)) / 4)
  const carbsGrams = Math.round((calories * (carbsPercent / 100)) / 4)
  const fatGrams = Math.round((calories * (fatPercent / 100)) / 9)

  return {
    calories,
    protein: proteinPercent,
    carbs: carbsPercent,
    fat: fatPercent,
    proteinGrams,
    carbsGrams,
    fatGrams,
  }
}

export async function POST(request: Request) {
  try {
    const perfil: BioPerfil = await request.json()

    const bmr = calculateBMR(perfil)
    const tdee = calculateTDEE(bmr, perfil.activityLevel)
    const macros = calculateMacros(tdee, perfil.goal)

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Você é um nutricionista especialista em longevidade e performance. Analise este perfil:

DADOS DO USUÁRIO:
- Idade: ${perfil.age} anos
- Peso: ${perfil.weight}kg
- Altura: ${perfil.height}cm
- Sexo: ${perfil.gender === "male" ? "Masculino" : "Feminino"}
- Nível de Atividade: ${perfil.activityLevel}
- Objetivo: ${perfil.goal === "lose_weight" ? "Emagrecer" : perfil.goal === "gain_muscle" ? "Ganhar Massa Muscular" : "Manutenção/Longevidade"}

CÁLCULOS:
- TDEE (Gasto Calórico Diário): ${Math.round(tdee)} kcal
- Calorias Alvo: ${Math.round(macros.calories)} kcal
- Proteína: ${macros.proteinGrams}g (${macros.protein}%)
- Carboidratos: ${macros.carbsGrams}g (${macros.carbs}%)
- Gordura: ${macros.fatGrams}g (${macros.fat}%)

Forneça:
1. WEEKS: [número realista de semanas para atingir o objetivo]
2. EXPLANATION: Uma explicação científica de 3-4 frases explicando:
   - POR QUE esta distribuição de macros é ideal para o objetivo
   - QUANTO tempo levará e por quê (use 0.5-1kg/semana para perda, 0.25-0.5kg/semana para ganho muscular)
   - Quais macros priorizar e em que momentos do dia
3. MACRO_TIPS: 2-3 dicas práticas de como atingir esses macros no dia a dia

Formato:
WEEKS: [número]
EXPLANATION: [explicação detalhada]
MACRO_TIPS: [dica 1] | [dica 2] | [dica 3]

Seja científico mas acessível. Foque em resultados realistas e sustentáveis.`,
    })

    const weeksMatch = text.match(/WEEKS:\s*(\d+)/)
    const explanationMatch = text.match(/EXPLANATION:\s*(.+?)(?=MACRO_TIPS:|$)/s)
    const tipsMatch = text.match(/MACRO_TIPS:\s*(.+)/s)

    const weeks = weeksMatch ? Number.parseInt(weeksMatch[1]) : 12
    const explanation =
      explanationMatch?.[1]?.trim() ||
      "Com base no seu perfil, seguindo consistentemente este plano, deverá alcançar resultados visíveis progressivamente."

    const macroTips =
      tipsMatch?.[1]
        ?.trim()
        .split("|")
        .map((tip) => tip.trim())
        .filter(Boolean) || []

    return NextResponse.json({
      plan: {
        macros,
        prediction: {
          weeks,
          explanation,
          macroTips,
        },
      },
    })
  } catch (error) {
    console.error("[Fitverse] Error calculating macros:", error)
    return NextResponse.json({ error: "Failed to calculate macros" }, { status: 500 })
  }
}
