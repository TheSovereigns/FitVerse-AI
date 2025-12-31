import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export const maxDuration = 30

const workoutsSchema = z.object({
  workouts: z.array(
    z.object({
      name: z.string(),
      category: z.enum(["Cardio", "Força", "Flexibilidade", "HIIT", "Funcional"]),
      duration: z.string(),
      difficulty: z.enum(["Iniciante", "Intermediário", "Avançado"]),
      equipment: z.string(),
      muscleGroups: z.array(z.string()),
      calories: z.number(),
      aiVerdict: z.string(),
      exercises: z.array(
        z.object({
          name: z.string(),
          sets: z.string(),
          reps: z.string(),
          rest: z.string(),
          videoUrl: z.string().optional(),
          images: z.object({
            initial: z.string(),
            execution: z.string(),
            final: z.string(),
          }),
          safetyTips: z.array(z.string()),
          commonMistakes: z.array(z.string()),
          benefits: z.string(),
        }),
      ),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const { level, duration, focus, biotype } = await req.json()

    const prompt = `Gere um treino de ${level} focado em ${focus}, com duração máxima de ${duration}. O usuário possui biotipo ${biotype || "não especificado"}. Liste exercícios com séries, repetições e descanso.

    Além disso, forneça para cada treino:

- Nome motivador do treino
- Categoria (Cardio, Força, Flexibilidade, HIIT, Funcional)
- Duração total
- Nível de dificuldade
- Equipamento necessário
- Grupos musculares trabalhados
- Calorias queimadas estimadas
- Veredito da IA: Explique em 2-3 frases POR QUE este treino é ideal para o objetivo da pessoa

Para cada exercício no treino:
- Nome do exercício
- Séries e repetições (ex: "3 séries", "12 repetições")
- Tempo de descanso
- URLs de imagens placeholders para:
  * Posição inicial: /placeholder.svg?height=200&width=300&query=exercise+[nome]+starting+position
  * Execução: /placeholder.svg?height=200&width=300&query=exercise+[nome]+execution
  * Posição final: /placeholder.svg?height=200&width=300&query=exercise+[nome]+final+position
- Lista de 3-4 dicas de segurança para evitar lesões
- Lista de 2-3 erros comuns que as pessoas cometem
- Benefícios específicos deste exercício (1-2 frases)

Seja específico, técnico e focado em resultados. Os treinos devem ser práticos e eficientes.`

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: workoutsSchema,
      prompt,
      temperature: 0.7,
    })

    return Response.json({ workouts: object.workouts })
  } catch (error) {
    console.error("[Fitverse] Error generating workouts:", error)
    return Response.json(
      { error: "Failed to generate workouts", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
