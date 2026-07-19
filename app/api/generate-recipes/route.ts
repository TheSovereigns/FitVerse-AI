import { NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { PLAN_LIMITS, type Plan } from "@/lib/plan-limits"
import { getCorsHeaders } from "@/lib/auth-helpers"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

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
        ? `\nUser diet profile: ${Array.isArray(dietProfile) ? dietProfile.join(", ") : dietProfile}\nAll recipes MUST respect these restrictions.\n`
        : `\nPerfil de dieta do usuário: ${Array.isArray(dietProfile) ? dietProfile.join(", ") : dietProfile}\nTodas as receitas DEVEM respeitar estas restrições.\n`
      : ""

    const prompt = isEnglish
      ? `You are an expert nutritionist, biochemist, and culinary scientist. Create 3 COMPLETE, detailed, and scientifically-backed recipes using "${productName}" as the main ingredient. All output must be in ${lang}.

${dietRestrictions}

## NUTRITIONAL SCIENCE REQUIREMENTS
For each recipe, you MUST justify ingredient choices with specific nutritional science:
- Explain which micronutrients are present and their physiological roles
- Reference specific compounds (e.g., "quercetin in onions reduces oxidative stress")
- Mention recommended daily values where relevant
- Explain how cooking methods affect nutrient retention (e.g., "steaming preserves 90% of vitamin C vs boiling which loses 50%")

## BIOAVAILABILITY OPTIMIZATION
Include specific bioavailability tips in the biohackingTips field:
- Vitamin C + iron pairing (e.g., "squeeze lemon on spinach to increase iron absorption by 6x")
- Fat-soluble vitamins (A, D, E, K) consumed with healthy fats
- Curcumin + black pepper (piperine increases absorption by 2000%)
- Avoid calcium + iron in same meal (competition for absorption)
- Lycopene in tomatoes is more bioavailable when cooked with olive oil
- Mention optimal consumption timing (e.g., "eat within 30 minutes post-workout for muscle protein synthesis")

## ANTI-INFLAMMATORY FOCUS
- Prioritize ingredients with proven anti-inflammatory properties (turmeric, ginger, fatty fish, berries, leafy greens, nuts)
- Set antiInflammatory to true if the recipe contains 3+ anti-inflammatory ingredients
- Explain the mechanism (e.g., "omega-3s inhibit COX-2 enzyme reducing prostaglandin production")

## GUT HEALTH
- Include prebiotic foods (garlic, onions, leeks, asparagus, oats, bananas)
- Include probiotic foods when applicable (yogurt, kefir, kimchi, sauerkraut)
- Use whole grains over refined grains for fiber content
- Rate gutHealthScore from 0-10 based on prebiotic/probiotic fiber content
- Explain how each ingredient supports the gut microbiome

## FOR EACH RECIPE, PROVIDE:
- Creative and appetizing name
- Detailed description (3-4 sentences) explaining the nutritional science and health benefits
- Realistic prep time
- Difficulty level: "Fácil", "Médio", or "Difícil"
- Servings
- Estimated macros (calories, protein, carbs, fat in grams)
- INGREDIENTS: Complete list with exact quantities (e.g., "200g of...", "1 cup of...", "1/2 tsp of...")
- INSTRUCTIONS: Numbered, DETAILED step-by-step. Include cooking times, temperatures (in Celsius), techniques, and visual/doneness cues
- BiohackingTips: 2-3 specific, actionable tips for optimal nutrient absorption
- CostPerServing: Estimate in local currency (e.g., "~R$8.50" or "~$3.20")
- StorageInstructions: How to store leftovers, shelf life in fridge/freezer, reheating instructions
- AllergenWarnings: List ALL potential allergens present (gluten, dairy, soy, nuts, shellfish, eggs, etc.) even in trace amounts
- AntiInflammatory: boolean (true if 3+ anti-inflammatory ingredients)
- GutHealthScore: number 0-10 (based on fiber, prebiotics, probiotics)

## RECIPE QUALITY REQUIREMENTS
- Maximum 30 minutes total time
- Prioritize accessibility: ingredients available in regular supermarkets
- Nutritionally balanced macros appropriate for a healthy adult
- Include seasonal ingredient suggestions when applicable (e.g., "use summer tomatoes for peak flavor and nutrition")
- Be creative but realistic — recipes people will actually make daily
- Each recipe should have a unique cooking approach (e.g., one stir-fry, one salad, one soup)
- NEVER suggest deep frying — prefer grilling, steaming, sautéing, or raw preparation`
      : `Você é um nutricionista especialista, bioquímico e cientista culinário. Crie 3 receitas COMPLETAS, detalhadas e cientificamente fundamentadas usando "${productName}" como ingrediente principal. Toda a saída deve ser em ${lang}.

${dietRestrictions}

## REQUISITOS DE CIÊNCIA NUTRICIONAL
Para cada receita, você DEVE justificar as escolhas de ingredientes com ciência nutricional específica:
- Explique quais micronutrientes estão presentes e seus papéis fisiológicos
- Mencione compostos específicos (ex: "a quercetina em cebolas reduz o estresse oxidativo")
- Referencie valores diários recomendados quando relevante
- Explique como métodos de cozimento afetam a retenção de nutrientes (ex: "o vapor preserva 90% da vitamina C vs. fervura que perde 50%")

## OTIMIZAÇÃO DE BIOVIDISPOABILIDADE
Inclua dicas específicas de biodisponibilidade no campo biohackingTips:
- Combinação vitamina C + ferro (ex: "esprema limão sobre espinafre para aumentar a absorção de ferro em 6x")
- Vitaminas lipossolúveis (A, D, E, K) consumidas com gorduras saudáveis
- Cúrcuma + pimenta do reino (a piperina aumenta a absorção em 2000%)
- Evitar cálcio + ferro na mesma refeição (competição por absorção)
- Licopeno em tomates é mais biodisponível quando cozido com azeite de oliva
- Mencione timing de consumo ideal (ex: "coma dentro de 30 minutos após o treino para síntese proteica muscular")

## FOCO ANTI-INFLAMATÓRIO
- Priorize ingredientes com propriedades anti-inflamatórias comprovadas (cúrcuma, gengibre, peixes gordos, bagas, folhas verdes, nozes)
- Defina antiInflammatory como true se a receita contiver 3+ ingredientes anti-inflamatórios
- Explique o mecanismo (ex: "ômega-3 inibe a enzima COX-2 reduzindo a produção de prostaglandinas")

## SAÚDE INTESTINAL
- Inclua alimentos prebióticos (alho, cebolas, alho-poró, espargos, aveia, bananas)
- Inclua alimentos probióticos quando aplicável (iogurte, kefir, kimchi, chucrute)
- Use grãos integrais em vez de refinados para conteúdo de fibra
- Avalie gutHealthScore de 0-10 baseado no conteúdo de fibra prebiótica/probiótica
- Explique como cada ingrediente suporta o microbioma intestinal

## PARA CADA RECEITA, FORNEÇA:
- Nome criativo e apetitoso
- Descrição detalhada (3-4 frases) explicando a ciência nutricional e benefícios à saúde
- Tempo de preparo realista
- Nível de dificuldade: "Fácil", "Médio" ou "Difícil"
- Porções
- Macros estimados (calorias, proteína, carboidratos, gordura em gramas)
- INGREDIENTES: Lista completa com quantidades exatas (ex: "200g de...", "1 xícara de...", "1/2 colher de chá de...")
- INSTRUÇÕES: Passo a passo NUMERADO e DETALHADO. Inclua tempos de cozimento, temperaturas (em Celsius), técnicas e pistas visuais de ponto
- BiohackingTips: 2-3 dicas específicas e acionáveis para absorção ideal de nutrientes
- CostPerServing: Estimativa na moeda local (ex: "~R$8,50")
- StorageInstructions: Como armazenar sobras, vida útil na geladeira/congelador, instruções de aquecimento
- AllergenWarnings: Liste TODOS os alérgenos potenciais presentes (glúten, laticínios, soja, frutos do mar, ovos, etc.) mesmo em traços
- AntiInflammatory: booleano (true se contiver 3+ ingredientes anti-inflamatórios)
- GutHealthScore: número 0-10 (baseado em fibra, prebióticos, probióticos)

## REQUISITOS DE QUALIDADE DAS RECEITAS
- Máximo de 30 minutos no total
- Priorize acessibilidade: ingredientes disponíveis em supermercados comuns
- Macros nutricionalmente equilibrados para um adulto saudável
- Inclua sugestões de ingredientes sazonais quando aplicável (ex: "use tomates de verão para sabor e nutrição ideais")
- Seja criativo mas realista — receitas que as pessoas realmente farão no dia a dia
- Cada receita deve ter uma abordagem de cozimento única (ex: um stir-fry, uma salada, uma sopa)
- NUNCA sugira fritura — prefira grelhar, cozinhar no vapor, refogar ou preparação crua`

    const { object } = await generateObject({
      model: google("gemini-3.5-flash"),
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

    return NextResponse.json({ recipes: object.recipes }, { headers })
  } catch (error) {
    console.error("[Fitverse] Error generating recipes:", error)
    return NextResponse.json(
      { error: "Failed to generate recipes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers },
    )
  }
}
