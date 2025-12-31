import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export const maxDuration = 30

const productAnalysisSchema = z.object({
  productName: z.string(),
  brand: z.string().optional().default("Desconhecida"),
  longevityScore: z.number().min(0).max(100),
  alerts: z.array(
    z.object({
      severity: z.enum(["high", "medium", "low"]),
      title: z.string(),
      description: z.string(),
    }),
  ).default([]),
  insights: z.array(
    z.object({
      type: z.enum(["good", "neutral", "bad"]),
      title: z.string(),
      description: z.string(),
    }),
  ).default([]),
  dietFilters: z.object({
    lowCarb: z.boolean().default(false),
    glutenFree: z.boolean().default(false),
    lactoseFree: z.boolean().default(false),
    vegan: z.boolean().default(false),
    vegetarian: z.boolean().default(false),
    keto: z.boolean().default(false),
  }),
  macros: z.object({
    calories: z.number().default(0),
    protein: z.number().default(0),
    carbs: z.number().default(0),
    fat: z.number().default(0),
    fiber: z.number().optional().default(0),
    sugar: z.number().optional().default(0),
  }).default({ calories: 0, protein: 0, carbs: 0, fat: 0 }),
  ingredients: z.array(z.string()).optional().default([]),
  fitnessAlignment: z.array(
    z.object({
      goal: z.string(),
      suitability: z.enum(["Excelente", "Bom", "Neutro", "Ruim"]),
      justification: z.string(),
    })
  ).optional().default([]),
})

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return Response.json({ error: "Chave de API do Google (Gemini) não configurada no servidor." }, { status: 500 })
    }

    const { imageData, productUrl } = await req.json()

    if (!imageData && !productUrl) {
      return Response.json({ error: "Image data or product URL is required" }, { status: 400 })
    }

    // ✅ PROMPT OTIMIZADO PARA RETORNAR DADOS REAIS E NÃO ZERADOS
    const prompt = `Atue como um especialista em Biohacking e Nutrição Esportiva. Analise a imagem do rótulo deste produto.
    Sua resposta DEVE ser um objeto JSON que siga o schema definido.
    - Extraia o nome real, marca e valores nutricionais (macros) exatos da imagem.
    - Calcule um 'longevityScore' de 0 a 100, baseado na qualidade dos ingredientes, presença de aditivos, açúcares, gorduras saudáveis, etc. Seja rigoroso.
    - Identifique 'alerts' (pontos de atenção) como aditivos químicos, alto teor de sódio, açúcar, etc.
    - Forneça 'insights' (benefícios) como "fonte de proteína de alta qualidade", "rico em fibras", etc.
    - Analise o 'fitnessAlignment': avalie a adequação do produto para os objetivos 'Ganho de Massa Muscular' e 'Emagrecimento'. Para cada um, forneça 'suitability' ('Excelente', 'Bom', 'Neutro', 'Ruim') e uma 'justification' curta e objetiva baseada nos macros e ingredientes.`

    const messages = imageData
      ? [
          {
            role: "user" as const,
            content: [
              { type: "text" as const, text: prompt },
              { type: "image" as const, image: imageData },
            ],
          },
        ]
      : [
          {
            role: "user" as const,
            content: `${prompt}\n\nProduto: ${productUrl}`,
          },
        ]

    const { object } = await generateObject({
      // ✅ CORREÇÃO: Modelo da IA ajustado para a versão correta.
      model: google("gemini-2.5-flash"),
      schema: productAnalysisSchema,
      messages,
      temperature: 0.1, // Menor temperatura = mais precisão nos dados
    })

    // ✅ GARANTE QUE A RESPOSTA VÁ NO FORMATO QUE O FRONT-END ESPERA (objeto plano)
    return Response.json(object)
  } catch (error) {
    console.error("[Fitverse] Error analyzing product:", error)
    // ✅ Retorna o erro real para o frontend exibir e facilitar o debug
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido na análise da IA"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
