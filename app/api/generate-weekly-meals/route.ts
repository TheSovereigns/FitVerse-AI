import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCorsHeaders } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitKey, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { generateContentWithFallback } from "@/lib/ai-fallback";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const headers = getCorsHeaders();
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Nao autorizado." },
        { status: 401, headers }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta." },
        { status: 500, headers }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Token invalido." },
        { status: 401, headers }
      );
    }

    const rlKey = getRateLimitKey(req, "generate-weekly-meals")
    const rl = await checkRateLimit(rlKey, RATE_LIMITS.generate)
    if (!rl.allowed) return rateLimitResponse()

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key não configurada" },
        { status: 500, headers }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const body = await req.json();
    const { macros, dietaryRestrictions, budget, locale = "pt-BR" } = body;

    const isEnglish = locale === "en-US";
    const lang = isEnglish ? "English" : "Portuguese";

    const restrictionsList = dietaryRestrictions?.length
      ? isEnglish
        ? `Dietary restrictions: ${dietaryRestrictions.join(", ")}`
        : `Restrições alimentares: ${dietaryRestrictions.join(", ")}`
      : isEnglish
        ? "No dietary restrictions"
        : "Sem restrições alimentares";

    const budgetInfo = budget
      ? isEnglish
        ? `Monthly food budget: $${budget}`
        : `Orçamento mensal para alimentos: R$${budget}`
      : isEnglish
        ? "No budget limit"
        : "Sem limite de orçamento";

    const macrosInfo = macros
      ? isEnglish
        ? `Target daily macros: ${macros.calories} kcal total, protein ${macros.proteinGrams}g, carbs ${macros.carbsGrams}g, fat ${macros.fatGrams}g`
        : `Macros diários alvo: ${macros.calories} kcal total, proteína ${macros.proteinGrams}g, carboidratos ${macros.carbsGrams}g, gordura ${macros.fatGrams}g`
      : isEnglish
        ? "Calculate appropriate macros based on general health"
        : "Calcule macros apropriados com base na saúde geral";

    const prompt = isEnglish
      ? `Create a 7-day meal plan. All output in ${lang}.

USER PROFILE:
- ${macrosInfo}
- ${restrictionsList}
- ${budgetInfo}

RULES:
1. Each day: exactly 4 meals (Breakfast, Lunch, Dinner, Snack). Each meal has: name, items (array of "Food — portion"), calories, protein, carbs, fat (numbers), prepTime (minutes), time (24h format).

2. Daily macro sums must match targets. Protein=4kcal/g, carbs=4kcal/g, fat=9kcal/g.

3. NO meal repeated across 7 days. Use diverse cuisines and cooking methods.

4. At least 2 meals/week designed for leftovers — note "(cook double batch)" or "(save for [day])" in item descriptions.

5. Prefer seasonal, budget-friendly whole foods (rice, beans, oats, eggs, seasonal/frozen vegetables).

6. Each day includes hydration: {dailyTargetLiters: 2.5, tips: [3 practical tips]}.

7. shoppingList: categories with items [{name, quantity}] and estimatedCost per category.

8. weeklySummary: totalEstimatedCost, dailyTotals (7 days with day/calories/protein/carbs/fat), weeklyAverages, uniqueIngredientCount.

Return ONLY valid JSON:
{
  "week": [
    {
      "day": "Monday",
      "meals": [
        {"name": "Breakfast", "items": ["Oatmeal — 80g", "Scrambled eggs — 2 large"], "calories": 450, "protein": 25, "carbs": 55, "fat": 15, "prepTime": 10, "time": "07:00"},
        {"name": "Lunch", "items": ["Grilled chicken — 150g", "Brown rice — 1 cup"], "calories": 650, "protein": 45, "carbs": 60, "fat": 18, "prepTime": 25, "time": "12:00"},
        {"name": "Dinner", "items": ["Baked salmon — 180g", "Sweet potato — 1 medium"], "calories": 600, "protein": 40, "carbs": 45, "fat": 22, "prepTime": 30, "time": "19:00"},
        {"name": "Snack", "items": ["Greek yogurt — 150g", "Nuts — 30g"], "calories": 300, "protein": 15, "carbs": 30, "fat": 14, "prepTime": 5, "time": "15:00"}
      ],
      "hydration": {"dailyTargetLiters": 2.5, "tips": ["Drink water before meals", "Carry a bottle", "Sip throughout afternoon"]}
    }
  ],
  "shoppingList": [{"category": "Proteins", "items": [{"name": "Chicken breast", "quantity": "1.5kg"}], "estimatedCost": 45}],
  "weeklySummary": {"totalEstimatedCost": 120, "dailyTotals": [{"day": "Monday", "calories": 2050, "protein": 125, "carbs": 190, "fat": 69}], "weeklyAverages": {"calories": 2035, "protein": 127.5, "carbs": 187.5, "fat": 67}, "uniqueIngredientCount": 35}
}

Include ALL 7 days. Every field above is MANDATORY. Valid, parseable JSON.`
      : `Crie um plano de refeições para 7 dias. Toda saída em ${lang}.

PERFIL:
- ${macrosInfo}
- ${restrictionsList}
- ${budgetInfo}

REGRAS:
1. Cada dia: exatamente 4 refeições (Café da Manhã, Almoço, Jantar, Lanche). Cada refeição tem: name, items (array "Alimento — quantidade"), calories, protein, carbs, fat (números), prepTime (minutos), time (formato 24h).

2. Soma diária dos macros deve bater com alvos. Proteína=4kcal/g, carbs=4kcal/g, gordura=9kcal/g.

3. NENHUMA refeição repetida nos 7 dias. Use cozinhas e métodos variados.

4. Pelo menos 2 refeições/semana para sobras — anote "(cozinhe porção dupla)" ou "(reserve para [dia])".

5. Prefira ingredientes sazonais e econômicos (arroz, feijão, aveia, ovos, legumes da estação/congelados).

6. Cada dia inclui hidratação: {dailyTargetLiters: 2.5, tips: [3 dicas práticas]}.

7. shoppingList: categorias com itens [{name, quantity}] e estimatedCost por categoria.

8. weeklySummary: totalEstimatedCost, dailyTotals (7 dias), weeklyAverages, uniqueIngredientCount.

Retorne APENAS JSON válido:
{
  "week": [
    {
      "day": "Segunda-feira",
      "meals": [
        {"name": "Café da Manhã", "items": ["Aveia — 80g", "Ovos mexidos — 2 unidades"], "calories": 450, "protein": 25, "carbs": 55, "fat": 15, "prepTime": 10, "time": "07:00"},
        {"name": "Almoço", "items": ["Frango grelhado — 150g", "Arroz integral — 1 xícara"], "calories": 650, "protein": 45, "carbs": 60, "fat": 18, "prepTime": 25, "time": "12:00"},
        {"name": "Jantar", "items": ["Salmão assado — 180g", "Batata-doce — 1 unidade"], "calories": 600, "protein": 40, "carbs": 45, "fat": 22, "prepTime": 30, "time": "19:00"},
        {"name": "Lanche", "items": ["Iogurte grego — 150g", "Castanhas — 30g"], "calories": 300, "protein": 15, "carbs": 30, "fat": 14, "prepTime": 5, "time": "15:00"}
      ],
      "hydration": {"dailyTargetLiters": 2.5, "tips": ["Beba água antes das refeições", "Carregue uma garfa", "Beba ao longo da tarde"]}
    }
  ],
  "shoppingList": [{"category": "Proteínas", "items": [{"name": "Peito de frango", "quantity": "1.5kg"}], "estimatedCost": 45}],
  "weeklySummary": {"totalEstimatedCost": 120, "dailyTotals": [{"day": "Segunda-feira", "calories": 2050, "protein": 125, "carbs": 190, "fat": 69}], "weeklyAverages": {"calories": 2035, "protein": 127.5, "carbs": 187.5, "fat": 67}, "uniqueIngredientCount": 35}
}

Inclua TODOS os 7 dias. Cada campo acima é OBRIGATÓRIO. JSON válido e parseável.`;

    const responseText = await generateContentWithFallback({
      geminiCall: async () => {
        const result = await model.generateContent(prompt);
        return result.response.text();
      },
      prompt,
      generationConfig: { temperature: 0.7 },
    });

    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanedText) as Record<string, unknown>;
    return NextResponse.json(data, { headers });
  } catch (error: any) {
    console.error("Erro na rota generate-weekly-meals:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500, headers }
    );
  }
}
