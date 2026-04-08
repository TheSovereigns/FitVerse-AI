import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(req: Request) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
    }

    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabase!.auth.getUser(token)
      if (user && !authError) {
        userId = user.id
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const body = await req.json();
    const { weight, height, age, gender, activityLevel, goal, locale = "pt-BR" } = body;

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const genderLabel = isEnglish 
      ? (gender === 'male' ? 'Male' : 'Female')
      : (gender === 'male' ? 'Masculino' : 'Feminino')
    
    const goalLabel = isEnglish
      ? (goal === 'lose_weight' ? 'Lose weight' : goal === 'gain_muscle' ? 'Gain muscle mass' : 'Maintain weight')
      : (goal === 'lose_weight' ? 'Perder peso' : goal === 'gain_muscle' ? 'Ganhar massa muscular' : 'Manter peso')

    const prompt = isEnglish
      ? `Act as a sports nutritionist and biohacking expert. Create a personalized metabolic plan based on user data. All output must be in ${lang}.

USER DATA:
- Weight: ${weight}kg
- Height: ${height}cm  
- Age: ${age} years
- Gender: ${genderLabel}
- Activity Level: ${activityLevel}
- Goal: ${goalLabel}

Return ONLY a valid JSON with this EXACT structure (no markdown):
{
  "macros": {
    "calories": number,
    "protein": number (percentage),
    "proteinGrams": number,
    "carbs": number (percentage),
    "carbsGrams": number,
    "fat": number (percentage),
    "fatGrams": number
  },
  "diet": {
    "title": "Diet name",
    "summary": "Summary in 1 sentence",
    "meals": [
      {"name": "Breakfast", "items": ["item1", "item2"]},
      {"name": "Lunch", "items": ["item1", "item2"]},
      {"name": "Dinner", "items": ["item1", "item2"]}
    ]
  },
  "prediction": {
    "weeks": number,
    "explanation": "Brief explanation"
  }
}

Calculate macros using TDEE and basal metabolism formulas. The JSON must have ALL fields.`
      : `Atua como um nutricionista esportivo e especialista em biohacking.

Crie um plano metabólico personalizado baseado nos dados do usuário:

DADOS DO USUÁRIO:
- Peso: ${weight}kg
- Altura: ${height}cm  
- Idade: ${age} anos
- Gênero: ${genderLabel}
- Nível de atividade: ${activityLevel}
- Objetivo: ${goalLabel}

Retorne APENAS um JSON válido com esta estrutura EXATA (sem markdown):
{
  "macros": {
    "calories": número,
    "protein": número (porcentagem),
    "proteinGrams": número,
    "carbs": número (porcentagem),
    "carbsGrams": número,
    "fat": número (porcentagem),
    "fatGrams": número
  },
  "diet": {
    "title": "Nome da dieta",
    "summary": "Resumo em 1 frase",
    "meals": [
      {"name": "Café da Manhã", "items": ["item1", "item2"]},
      {"name": "Almoço", "items": ["item1", "item2"]},
      {"name": "Jantar", "items": ["item1", "item2"]}
    ]
  },
  "prediction": {
    "weeks": número,
    "explanation": "Explicação breve"
  }
}

Calcule as macros usando fórmulas de TDEE e metabolismo basal. OJSON deve ter TODOS os campos.`

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const data = JSON.parse(cleanedText);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error("Erro ao processar JSON da IA:", cleanedText);
      return NextResponse.json({ error: "A IA retornou um formato inválido." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Erro na rota generate-metabolic-plan:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 });
  }
}
