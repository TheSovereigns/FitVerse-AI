import { NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const PLAN_LIMITS = {
  free: { dietsPerMonth: 0 },
  pro: { dietsPerMonth: 5 },
  premium: { dietsPerMonth: Infinity },
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export const maxDuration = 30

async function checkDietLimit(userId: string, plan: string): Promise<boolean> {
  if (!supabase) return true;
  
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { count } = await supabase
    .from('diets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.dietsPerMonth ?? 0
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
      biohackingTips: z.array(z.string()).optional(),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers })
    }

    const token = authHeader.replace('Bearer ', '')
    
    if (!supabase) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500, headers })
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (!user || authError) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401, headers })
    }

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

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Requisição inválida. Dados JSON mal formatados.' }, { status: 400, headers });
    }

    const { productName, dietProfile, locale = "pt-BR" } = body;

    if (!productName) {
      return NextResponse.json({ error: "Nome do ingrediente é obrigatório." }, { status: 400, headers })
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

    await supabase.from('diets').insert({
      user_id: user.id,
      name: object.recipes[0]?.name || 'Generated Diet',
      calories: object.recipes[0]?.macros?.calories || 0,
      protein: object.recipes[0]?.macros?.protein || 0,
      carbs: object.recipes[0]?.macros?.carbs || 0,
      fat: object.recipes[0]?.macros?.fat || 0,
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
