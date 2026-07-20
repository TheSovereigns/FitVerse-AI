import { NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { PLAN_LIMITS, type Plan } from "@/lib/plan-limits"
import { getCorsHeaders } from "@/lib/auth-helpers"
import { checkRateLimit, getRateLimitKey, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"
import { generateObjectWithFallback } from "@/lib/ai-fallback"

function getGoogle() {
  return createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  })
}

export const maxDuration = 30

async function checkDietLimit(userId: string, plan: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return true;
  
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { count } = await supabase
    .from('diets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const planLimits = PLAN_LIMITS[(plan as Plan) || 'free'];
  const limit = typeof planLimits.dietsPerMonth === 'number' ? planLimits.dietsPerMonth : 999;
  return (count ?? 0) < limit
}

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
      biohackingTips: z.array(z.string()),
      costPerServing: z.string(),
      storageInstructions: z.string(),
      allergenWarnings: z.array(z.string()),
      antiInflammatory: z.boolean(),
      gutHealthScore: z.number().min(0).max(10),
    }),
  ),
})

export async function POST(req: Request) {
  const headers = getCorsHeaders();
  try {

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers })
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500, headers })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (!user || authError) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401, headers })
    }

    const rlKey = getRateLimitKey(req, "generate-recipes")
    const rl = await checkRateLimit(rlKey, RATE_LIMITS.generate)
    if (!rl.allowed) return rateLimitResponse()

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const userPlan = profile?.plan || 'free'
    const canProceed = await checkDietLimit(user.id, userPlan)

    if (!canProceed) {
      return NextResponse.json({ 
        error: 'Limite mensal de receitas/dietas atingido. Atualize para um plano superior.' 
      }, { status: 403, headers })
    }

    const { productName, dietProfile, locale = "pt-BR" } = await req.json()

    if (!productName) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400, headers })
    }

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"
    
    const dietRestrictions = dietProfile
      ? isEnglish
        ? `\nDiet restrictions: ${Array.isArray(dietProfile) ? dietProfile.join(", ") : dietProfile}. All recipes MUST respect these.\n`
        : `\nRestrições de dieta: ${Array.isArray(dietProfile) ? dietProfile.join(", ") : dietProfile}. Todas as receitas DEVEM respeitar estas.\n`
      : ""

    const prompt = isEnglish
      ? `Create 3 complete recipes using "${productName}" as main ingredient. All output in ${lang}.

${dietRestrictions}

Each recipe must justify ingredient choices with nutritional science (micronutrients, compounds, daily values, cooking method effects on nutrient retention).

Bioavailability tips: vitamin C + iron pairing, fat-soluble vitamins with fats, curcumin + pepper, avoid calcium + iron together, lycopene with olive oil, post-workout timing.

Anti-inflammatory: prioritize turmeric, ginger, fatty fish, berries, leafy greens. Set antiInflammatory=true if 3+ anti-inflammatory ingredients. Explain mechanism (e.g. "omega-3s inhibit COX-2").

Gut health: include prebiotics (garlic, onions, oats) and probiotics (yogurt, kefir). Rate gutHealthScore 0-10.

For each recipe provide:
- Creative name, description (3-4 sentences), prep time, difficulty (Fácil/Médio/Difícil), servings
- Macros: calories, protein, carbs, fat (grams)
- Ingredients: exact quantities (e.g. "200g of...")
- Instructions: numbered steps with times, temperatures (Celsius), visual cues
- biohackingTips: 2-3 absorption tips
- costPerServing: estimate (e.g. "~R$8.50")
- storageInstructions: fridge/freezer life, reheating
- allergenWarnings: all potential allergens
- antiInflammatory: boolean
- gutHealthScore: 0-10

Max 30 min total. Use supermarket-accessible ingredients. Each recipe: unique cooking approach. No deep frying — prefer grill/steam/sauté/raw.`
      : `Crie 3 receitas COMPLETAS usando "${productName}" como ingrediente principal. Toda saída em ${lang}.

${dietRestrictions}

Cada receita deve justificar escolhas com ciência nutricional (micronutrientes, compostos, valores diários, efeito de métodos de cozimento na retenção de nutrientes).

Dicas de biodisponibilidade: vitamina C + ferro, vitaminas lipossolúveis com gorduras, cúrcuma + pimenta, evitar cálcio + ferro juntos, licopeno com azeite, timing pós-treino.

Anti-inflamatório: priorizar cúrcuma, gengibre, peixes gordos, bagas, folhas verdes. Defina antiInflammatory=true se 3+ ingredientes anti-inflamatórios. Explique o mecanismo.

Saúde intestinal: inclua prebióticos (alho, cebolas, aveia) e probióticos (iogurte, kefir). Avalie gutHealthScore 0-10.

Para cada receita forneça:
- Nome criativo, descrição (3-4 frases), tempo de preparo, dificuldade (Fácil/Médio/Difícil), porções
- Macros: calorias, proteína, carboidratos, gordura (gramas)
- Ingredientes: quantidades exatas
- Instruções: passos numerados com tempos, temperaturas (Celsius), pistas visuais
- biohackingTips: 2-3 dicas de absorção
- costPerServing: estimativa (ex: "~R$8,50")
- storageInstructions: vida útil, reaquecimento
- allergenWarnings: todos alérgenos potenciais
- antiInflammatory: booleano
- gutHealthScore: 0-10

Máximo 30 min. Ingredientes de supermercado. Cada receita: abordagem única. Sem fritura — grelhar/vapor/refogar/cru.`

    const object = await generateObjectWithFallback({
      geminiCall: () =>
        generateObject({
          model: getGoogle()("gemini-3.5-flash"),
          schema: recipesSchema,
          prompt,
          temperature: 0.8,
        }).then((r) => r.object),
      prompt,
      schemaName: "recipes",
    })

    await supabase.from('diets').insert({
      user_id: user.id,
      name: object.recipes[0]?.name || 'Generated Diet',
      calories: object.recipes[0]?.macros?.calories || 0,
      protein: object.recipes[0]?.macros?.protein || 0,
      carbs: object.recipes[0]?.macros?.carbs || 0,
      fat: object.recipes[0]?.macros?.fat || 0,
    })

    return NextResponse.json({ recipes: object.recipes }, { headers })
  } catch (error) {
    console.error("[Fitverse] Error generating recipes:", error)
    return NextResponse.json(
      { error: "Failed to generate recipes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers },
    )
  }
}
