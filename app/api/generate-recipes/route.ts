import { NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export const maxDuration = 30

const recipesSchema = z.object({
  recipes: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      prepTime: z.string(),
      difficulty: z.enum(["Fácil", "Médio", "Difícil"]),
      servings: z.number(),
      macros: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
      }),
      ingredients: z.array(z.string()),
      instructions: z.array(z.string()),
      biohackingTips: z.array(z.string()).optional(),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const { productName, dietProfile, locale = "pt-BR" } = await req.json()

    if (!productName) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"
    
    const dietRestrictions = dietProfile
      ? isEnglish
        ? `\nUser diet profile: ${Array.isArray(dietProfile) ? dietProfile.join(", ") : dietProfile}\nAll recipes MUST respect these restrictions.\n`
        : `\nPerfil de dieta do usuário: ${Array.isArray(dietProfile) ? dietProfile.join(", ") : dietProfile}\nTodas as receitas DEVEM respeitar estas restrições.\n`
      : ""

    const prompt = isEnglish
      ? `Create 3 COMPLETE, detailed, and healthy recipes using ${productName} as the main ingredient. All output must be in ${lang}.

${dietRestrictions}

For each recipe, provide:
- Creative and appetizing name
- Brief description explaining WHY this recipe is good for health and longevity (2-3 sentences)
- Realistic prep time
- Difficulty level
- Servings
- Estimated macros (calories, protein, carbs, fat)
- INGREDIENTS: Complete list with exact quantities for each item (e.g., "200g of...", "1 cup of...").
- INSTRUCTIONS: Numbered and DETAILED step by step. Explain exactly how to prepare, cooking times, temperatures, and assembly. Be didactic so anyone can make it.
- Biohacking tips when applicable (consumption timing, combinations for better absorption, etc)

The recipes must be:
- Practical and quick (maximum 30 minutes)
- Focused on longevity and health
- With accessible ingredients
- Nutritionally balanced

In the description, ALWAYS explain the specific nutritional benefits and why this recipe promotes health.
Be creative but practical. Prioritize recipes that people would really make in their daily lives.`
      : `Crie 3 receitas COMPLETAS, detalhadas e saudáveis usando ${productName} como ingrediente principal.

${dietRestrictions}

Para cada receita, forneça:
- Nome criativo e apetitoso
- Descrição breve que explique POR QUE esta receita é boa para saúde e longevidade (2-3 frases)
- Tempo de preparo realista
- Nível de dificuldade
- Porções
- Macros estimados (calorias, proteína, carboidratos, gordura)
- INGREDIENTES: Lista completa com quantidades exatas para cada item (ex: "200g de...", "1 xícara de...").
- INSTRUÇÕES: Passo a passo NUMERADO e DETALHADO. Explique exatamente como preparar, tempos de cozimento, temperaturas e montagem. Seja didático para que qualquer pessoa consiga fazer.
- Dicas de biohacking quando aplicável (timing de consumo, combinações para melhor absorção, etc)

As receitas devem ser:
- Práticas e rápidas (máximo 30 minutos)
- Focadas em longevidade e saúde
- Com ingredientes acessíveis
- Balanceadas nutricionalmente

Na descrição, SEMPRE explique os benefícios nutricionais específicos e por que esta receita promove saúde.
Seja criativo mas prático. Priorize receitas que realmente as pessoas fariam no dia a dia.`

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: recipesSchema,
      prompt,
      temperature: 0.8,
    })

    return NextResponse.json({ recipes: object.recipes })
  } catch (error) {
    console.error("[Fitverse] Error generating recipes:", error)
    return NextResponse.json(
      { error: "Failed to generate recipes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
