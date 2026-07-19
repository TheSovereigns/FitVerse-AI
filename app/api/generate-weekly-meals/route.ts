import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCorsHeaders } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const headers = getCorsHeaders();
  try {

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401, headers })
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Configuracao do servidor incompleta.' }, { status: 500, headers })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (!user || authError) {
      return NextResponse.json({ error: 'Token invalido.' }, { status: 401, headers })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500, headers });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const body = await req.json();
    const { macros, dietaryRestrictions, budget, locale = "pt-BR" } = body;

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const restrictionsList = dietaryRestrictions?.length
      ? (isEnglish ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : `Restrições alimentares: ${dietaryRestrictions.join(', ')}`)
      : (isEnglish ? "No dietary restrictions" : "Sem restrições alimentares")

    const budgetInfo = budget
      ? (isEnglish ? `Monthly food budget: $${budget}` : `Orçamento mensal para alimentos: R$${budget}`)
      : (isEnglish ? "No budget limit" : "Sem limite de orçamento")

    const macrosInfo = macros
      ? (isEnglish
          ? `Target macros: ${macros.calories} kcal, protein ${macros.proteinGrams}g, carbs ${macros.carbsGrams}g, fat ${macros.fatGrams}g`
          : `Macros alvo: ${macros.calories} kcal, proteína ${macros.proteinGrams}g, carboidratos ${macros.carbsGrams}g, gordura ${macros.fatGrams}g`)
      : (isEnglish ? "Calculate appropriate macros based on general health" : "Calcule macros apropriados com base na saúde geral")

    const prompt = isEnglish
      ? `Act as a meal planning expert and nutritionist. Create a complete 7-day meal plan. All output must be in ${lang}.

USER DATA:
- ${macrosInfo}
- ${restrictionsList}
- ${budgetInfo}

Return ONLY a valid JSON with this EXACT structure (no markdown):
{
  "week": [
    {
      "day": "Monday",
      "meals": [
        {
          "name": "Breakfast",
          "items": ["item1", "item2"],
          "calories": number,
          "time": "07:00"
        },
        {
          "name": "Lunch",
          "items": ["item1", "item2"],
          "calories": number,
          "time": "12:00"
        },
        {
          "name": "Dinner",
          "items": ["item1", "item2"],
          "calories": number,
          "time": "19:00"
        },
        {
          "name": "Snacks",
          "items": ["item1", "item2"],
          "calories": number,
          "time": "15:00"
        }
      ]
    }
  ],
  "shoppingList": [
    {
      "category": "Proteins",
      "items": ["item1 (quantity)", "item2 (quantity)"]
    }
  ]
}

Include all 7 days (Monday through Sunday). The shoppingList should organize items by category (Proteins, Carbohydrates, Vegetables, Fruits, Dairy, Condiments, etc). Each day must have breakfast, lunch, dinner, and snacks. The JSON must have ALL fields.`
      : `Atua como um especialista em planejamento alimentar e nutricionista. Crie um plano de refeições completo para 7 dias. Toda a saída deve ser em ${lang}.

DADOS DO USUÁRIO:
- ${macrosInfo}
- ${restrictionsList}
- ${budgetInfo}

Retorne APENAS um JSON válido com esta estrutura EXATA (sem markdown):
{
  "week": [
    {
      "day": "Segunda-feira",
      "meals": [
        {
          "name": "Café da Manhã",
          "items": ["item1", "item2"],
          "calories": número,
          "time": "07:00"
        },
        {
          "name": "Almoço",
          "items": ["item1", "item2"],
          "calories": número,
          "time": "12:00"
        },
        {
          "name": "Jantar",
          "items": ["item1", "item2"],
          "calories": número,
          "time": "19:00"
        },
        {
          "name": "Lanches",
          "items": ["item1", "item2"],
          "calories": número,
          "time": "15:00"
        }
      ]
    }
  ],
  "shoppingList": [
    {
      "category": "Proteínas",
      "items": ["item1 (quantidade)", "item2 (quantidade)"]
    }
  ]
}

Inclua todos os 7 dias (Segunda-feira Domingo). A shoppingList deve organizar os itens por categoria (Proteínas, Carboidratos, Legumes, Frutas, Laticínios, Condimentos, etc). Cada dia deve ter café da manhã, almoço, jantar e lanches. O JSON deve ter TODOS os campos.`

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const data = JSON.parse(cleanedText);
      return NextResponse.json(data, { headers });
    } catch (parseError) {
      console.error("Erro ao processar JSON da IA:", cleanedText);
      return NextResponse.json({ error: "A IA retornou um formato inválido." }, { status: 500, headers });
    }

  } catch (error: any) {
    console.error("Erro na rota generate-weekly-meals:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500, headers });
  }
}
