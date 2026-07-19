import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCorsHeaders } from "@/lib/auth-helpers";

const MAX_RETRIES = 3;

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
      ? `You are an elite meal planning expert and certified nutritionist. Create a comprehensive, practical 7-day meal plan. All output MUST be in ${lang}.

USER PROFILE:
- ${macrosInfo}
- ${restrictionsList}
- ${budgetInfo}

CRITICAL INSTRUCTIONS — Follow every rule exactly:

1. MEAL STRUCTURE: Each day must have exactly 4 meals: Breakfast, Lunch, Dinner, Snack. Each meal object must contain ALL of the following fields:
   - "name": the meal category name (e.g. "Breakfast", "Lunch", "Dinner", "Snack")
   - "items": an array of strings, each formatted as "Food Item — portion size" (e.g. "Grilled chicken breast — 150g", "Brown rice — 1 cup cooked"). Every item MUST include a specific portion/weight/volume.
   - "calories": total kcal for that meal (number)
   - "protein": grams of protein for that meal (number)
   - "carbs": grams of carbohydrates for that meal (number)
   - "fat": grams of fat for that meal (number)
   - "prepTime": estimated preparation + cooking time in minutes (number)
   - "time": suggested eating time in 24h format (e.g. "07:00", "12:00", "19:00", "15:00")

2. MACRO ACCURACY: The sum of protein, carbs, and fat across all 4 meals each day must closely match the daily target. Each gram of protein = 4 kcal, each gram of carbs = 4 kcal, each gram of fat = 9 kcal. Distribute macros across meals realistically (e.g. protein-heavy at lunch/dinner, lighter at breakfast/snack).

3. VARIETY ENFORCEMENT: NO meal may be repeated across the entire 7-day plan. Every breakfast, lunch, dinner, and snack must be completely different from every other one. Use diverse cuisines (Mediterranean, Asian, Latin American, Middle Eastern, etc.) and diverse cooking methods (grilled, baked, sautéed, steamed, raw, slow-cooked, etc.).

4. LEFTOVER STRATEGY (Cook Once, Eat Twice): At least 2 meals per week should be designed as double-batch recipes. When a meal is suitable for leftovers, add a note in the item description such as "(cook double batch)" or "(save portion for [day])". This helps the user save time and reduce food waste.

5. SEASONAL AND BUDGET-FRIENDLY: Prefer ingredients that are:
   - In season (fresh and affordable)
   - Budget-friendly staples (rice, beans, oats, eggs, seasonal vegetables, frozen vegetables, canned fish)
   - Whole foods over processed foods
   - Locally available in most grocery stores

6. HYDRATION REMINDERS: Include a "hydration" field at the day level with an object containing "dailyTargetLiters": 2.5 and "tips": an array of 3 practical hydration tips tailored to the meals (e.g. "Drink a glass of water before each meal", "Carry a reusable water bottle").

7. SHOPPING LIST: Organize ALL ingredients into a shoppingList array. Each category object must have:
   - "category": category name (e.g. "Proteins", "Grains & Carbs", "Vegetables", "Fruits", "Dairy & Eggs", "Pantry & Condiments", "Oils & Fats")
   - "items": an array of objects, each with:
     - "name": the ingredient name
     - "quantity": exact total quantity needed for the entire week (e.g. "2kg", "500g", "6 units", "1 liter")
   - "estimatedCost": estimated cost for that category in the user's currency (number). Sum all category costs for a weekly total.

8. WEEKLY SUMMARY: Include a "weeklySummary" object with:
   - "totalEstimatedCost": sum of all category costs (number)
   - "dailyTotals": an array of 7 objects, one per day, each containing:
     - "day": day name in ${lang} (e.g. "Monday" or "Segunda-feira")
     - "calories": total daily kcal (number)
     - "protein": total daily protein in grams (number)
     - "carbs": total daily carbs in grams (number)
     - "fat": total daily fat in grams (number)
   - "weeklyAverages": object with average calories, protein, carbs, fat per day
   - "uniqueIngredientCount": approximate number of unique ingredients used

Return ONLY valid JSON with this EXACT structure (no markdown, no explanation, no code fences):

{
  "week": [
    {
      "day": "Monday",
      "meals": [
        {
          "name": "Breakfast",
          "items": ["Oatmeal with banana — 80g oats + 1 medium banana", "Scrambled eggs — 2 large eggs"],
          "calories": 450,
          "protein": 25,
          "carbs": 55,
          "fat": 15,
          "prepTime": 10,
          "time": "07:00"
        },
        {
          "name": "Lunch",
          "items": ["Grilled chicken breast — 150g", "Brown rice — 1 cup cooked", "Steamed broccoli — 1 cup"],
          "calories": 650,
          "protein": 45,
          "carbs": 60,
          "fat": 18,
          "prepTime": 25,
          "time": "12:00"
        },
        {
          "name": "Dinner",
          "items": ["Baked salmon fillet — 180g", "Sweet potato mash — 1 medium potato", "Mixed green salad — 2 cups with olive oil dressing"],
          "calories": 600,
          "protein": 40,
          "carbs": 45,
          "fat": 22,
          "prepTime": 30,
          "time": "19:00"
        },
        {
          "name": "Snack",
          "items": ["Greek yogurt — 150g", "Mixed nuts — 30g", "Apple slices — 1 medium apple"],
          "calories": 300,
          "protein": 15,
          "carbs": 30,
          "fat": 14,
          "prepTime": 5,
          "time": "15:00"
        }
      ],
      "hydration": {
        "dailyTargetLiters": 2.5,
        "tips": ["Drink 500ml of water upon waking", "Have a glass of water 30 minutes before lunch", "Sip water throughout your afternoon snack"]
      }
    }
  ],
  "shoppingList": [
    {
      "category": "Proteins",
      "items": [
        { "name": "Chicken breast", "quantity": "1.5kg" },
        { "name": "Salmon fillets", "quantity": "1.2kg" }
      ],
      "estimatedCost": 45.00
    },
    {
      "category": "Grains & Carbs",
      "items": [
        { "name": "Brown rice", "quantity": "1kg" },
        { "name": "Rolled oats", "quantity": "500g" }
      ],
      "estimatedCost": 8.00
    }
  ],
  "weeklySummary": {
    "totalEstimatedCost": 120.00,
    "dailyTotals": [
      { "day": "Monday", "calories": 2050, "protein": 125, "carbs": 190, "fat": 69 },
      { "day": "Tuesday", "calories": 2020, "protein": 130, "carbs": 185, "fat": 65 }
    ],
    "weeklyAverages": { "calories": 2035, "protein": 127.5, "carbs": 187.5, "fat": 67 },
    "uniqueIngredientCount": 35
  }
}

Include ALL 7 days (Monday through Sunday). Each day must have exactly 4 meals. Every single field shown above is MANDATORY — do not omit any field. The JSON must be valid and parseable.`
      : `Você é um especialista elite em planejamento alimentar e nutricionista certificado. Crie um plano de refeições completo e prático para 7 dias. Toda a saída DEVE ser em ${lang}.

PERFIL DO USUÁRIO:
- ${macrosInfo}
- ${restrictionsList}
- ${budgetInfo}

INSTRUÇÕES CRÍTICAS — Siga cada regra exatamente:

1. ESTRUTURA DE REFEIÇÕES: Cada dia deve ter exatamente 4 refeições: Café da Manhã, Almoço, Jantar, Lanche. Cada objeto de refeição deve conter TODOS os seguintes campos:
   - "name": nome da categoria da refeição (ex. "Café da Manhã", "Almoço", "Jantar", "Lanche")
   - "items": um array de strings, cada uma formatada como "Alimento — quantidade/peso" (ex. "Peito de frango grelhado — 150g", "Arroz integral — 1 xícara cozido"). Cada item DEVE incluir uma porção/peso/volume específico.
   - "calories": total de kcal para essa refeição (número)
   - "protein": gramas de proteína para essa refeição (número)
   - "carbs": gramas de carboidratos para essa refeição (número)
   - "fat": gramas de gordura para essa refeição (número)
   - "prepTime": tempo estimado de preparo + cozimento em minutos (número)
   - "time": horário sugerido de consumo no formato 24h (ex. "07:00", "12:00", "19:00", "15:00")

2. PRECISÃO DOS MACROS: A soma de proteína, carboidratos e gordura ao longo das 4 refeições de cada dia deve se aproximar do alvo diário. Cada grama de proteína = 4 kcal, cada grama de carboidrato = 4 kcal, cada grama de gordura = 9 kcal. Distribua os macros de forma realista entre as refeições (ex. mais proteína no almoço/jantar, mais leve no café da manhã/lanche).

3. EXIGÊNCIA DE VARIEDADE: NENHUMA refeição pode ser repetida ao longo de todo o plano de 7 dias. Cada café da manhã, almoço, jantar e lanche deve ser completamente diferente de todos os outros. Use cozinhas diversas (Mediterrânea, Asiática, Latino-americana, etc.) e métodos de cozimento variados (grelhado, assado, refogado, ao vapor, cru, etc.).

4. ESTRATÉGIA DE SOBRAS (Cozinhe uma vez, coma duas vezes): Pelo menos 2 refeições por semana devem ser projetadas como receitas de porção dupla. Quando uma refeição for adequada para sobras, adicione uma nota na descrição do item como "(cozinhe porção dupla)" ou "(reserve uma porção para [dia])". Isso ajuda o usuário a economizar tempo e reduzir desperdício.

5. SAZONAL E ECONÔMICO: Prefira ingredientes que sejam:
   - De temporada (frescos e acessíveis)
   - Básicos econômicos (arroz, feijues, aveia, ovos, legumes da estação, legumes congelados, enlatados de peixe)
   - Alimentos integrais em vez de processados
   - Facilmente disponíveis em supermercados

6. LEMBRETES DE HIDRATAÇÃO: Inclua um campo "hydration" no nível do dia com um objeto contendo "dailyTargetLiters": 2.5 e "tips": um array de 3 dicas práticas de hidratação relacionadas às refeições (ex. "Beba um copo de água antes de cada refeição", "Carregue uma garrafa de água reutilizável").

7. LISTA DE COMPRAS: Organize TODOS os ingredientes em um array shoppingList. Cada objeto de categoria deve ter:
   - "category": nome da categoria (ex. "Proteínas", "Grãos & Carboidratos", "Legumes", "Frutas", "Laticínios & Ovos", "Despensa & Condimentos", "Óleos & Gorduras")
   - "items": um array de objetos, cada um com:
     - "name": nome do ingrediente
     - "quantity": quantidade total exata necessária para toda a semana (ex. "2kg", "500g", "6 unidades", "1 litro")
   - "estimatedCost": custo estimado para essa categoria na moeda do usuário (número). Some todos os custos das categorias para um total semanal.

8. RESUMO SEMANAL: Inclua um objeto "weeklySummary" com:
   - "totalEstimatedCost": soma de todos os custos das categorias (número)
   - "dailyTotals": um array de 7 objetos, um por dia, cada um contendo:
     - "day": nome do dia em ${lang} (ex. "Segunda-feira")
     - "calories": total de kcal diário (número)
     - "protein": total de proteína diária em gramas (número)
     - "carbs": total de carboidratos diários em gramas (número)
     - "fat": total de gordura diária em gramas (número)
   - "weeklyAverages": objeto com médias semanais de calorias, proteína, carboidratos, gordura por dia
   - "uniqueIngredientCount": número aproximado de ingredientes únicos utilizados

Retorne APENAS JSON válido com esta estrutura EXATA (sem markdown, sem explicação, sem cercas de código):

{
  "week": [
    {
      "day": "Segunda-feira",
      "meals": [
        {
          "name": "Café da Manhã",
          "items": ["Aveia com banana — 80g de aveia + 1 banana média", "Ovos mexidos — 2 ovos grandes"],
          "calories": 450,
          "protein": 25,
          "carbs": 55,
          "fat": 15,
          "prepTime": 10,
          "time": "07:00"
        },
        {
          "name": "Almoço",
          "items": ["Peito de frango grelhado — 150g", "Arroz integral — 1 xícara cozido", "Bróflis no vapor — 1 xícara"],
          "calories": 650,
          "protein": 45,
          "carbs": 60,
          "fat": 18,
          "prepTime": 25,
          "time": "12:00"
        },
        {
          "name": "Jantar",
          "items": ["Salmão assado — 180g", "Purê de batata-doce — 1 batata média", "Salada verde mista — 2 xícaras com molho de azeite"],
          "calories": 600,
          "protein": 40,
          "carbs": 45,
          "fat": 22,
          "prepTime": 30,
          "time": "19:00"
        },
        {
          "name": "Lanche",
          "items": ["Iogurte grego — 150g", "Mix de castanhas — 30g", "Fatias de maçã — 1 maçã média"],
          "calories": 300,
          "protein": 15,
          "carbs": 30,
          "fat": 14,
          "prepTime": 5,
          "time": "15:00"
        }
      ],
      "hydration": {
        "dailyTargetLiters": 2.5,
        "tips": ["Beba 500ml de água ao acordar", "Tome um copo de água 30 minutos antes do almoço", "Beba água ao longo do lanche da tarde"]
      }
    }
  ],
  "shoppingList": [
    {
      "category": "Proteínas",
      "items": [
        { "name": "Peito de frango", "quantity": "1.5kg" },
        { "name": "Filés de salmão", "quantity": "1.2kg" }
      ],
      "estimatedCost": 45.00
    },
    {
      "category": "Grãos & Carboidratos",
      "items": [
        { "name": "Arroz integral", "quantity": "1kg" },
        { "name": "Aveia em flocos", "quantity": "500g" }
      ],
      "estimatedCost": 8.00
    }
  ],
  "weeklySummary": {
    "totalEstimatedCost": 120.00,
    "dailyTotals": [
      { "day": "Segunda-feira", "calories": 2050, "protein": 125, "carbs": 190, "fat": 69 },
      { "day": "Terça-feira", "calories": 2020, "protein": 130, "carbs": 185, "fat": 65 }
    ],
    "weeklyAverages": { "calories": 2035, "protein": 127.5, "carbs": 187.5, "fat": 67 },
    "uniqueIngredientCount": 35
  }
}

Inclua TODOS os 7 dias (Segunda-feira through Domingo). Cada dia deve ter exatamente 4 refeições. Cada campo mostrado acima é OBRIGATÓRIO — não omita nenhum campo. O JSON deve ser válido e parseável.`;

    let lastError: unknown = null;
    let data: Record<string, unknown> | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedText = responseText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        data = JSON.parse(cleanedText) as Record<string, unknown>;
        break;
      } catch (parseError) {
        lastError = parseError;
        console.error(
          `Tentativa ${attempt}/${MAX_RETRIES} falhou ao parsear JSON da IA:`,
          parseError
        );
        if (attempt === MAX_RETRIES) {
          return NextResponse.json(
            {
              error:
                "A IA retornou um formato inválido após múltiplas tentativas.",
            },
            { status: 500, headers }
          );
        }
      }
    }

    return NextResponse.json(data, { headers });
  } catch (error: any) {
    console.error("Erro na rota generate-weekly-meals:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500, headers }
    );
  }
}
