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
      model: "gemini-3.1-flash-lite",
      generationConfig: { responseMimeType: "application/json" }
    });

    const body = await req.json();
    const { food, reason, dietaryRestrictions, locale = "pt-BR" } = body;

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const restrictionsList = dietaryRestrictions?.length
      ? (isEnglish ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : `Restrições alimentares: ${dietaryRestrictions.join(', ')}`)
      : (isEnglish ? "No dietary restrictions" : "Sem restrições alimentares")

    const reasonInfo = reason
      ? (isEnglish ? `Reason for substitution: ${reason}` : `Motivo da substituição: ${reason}`)
      : ""

    const prompt = isEnglish
      ? `Act as a sports nutritionist and food science expert. Find smart food substitutions. All output must be in ${lang}.

ORIGINAL FOOD: ${food}
${reasonInfo}
${restrictionsList}

Return ONLY a valid JSON with this EXACT structure (no markdown):
{
  "substitutions": [
    {
      "name": "Substitute food name",
      "calories": number (per 100g),
      "protein": number (grams per 100g),
      "carbs": number (grams per 100g),
      "fat": number (grams per 100g),
      "matchPercent": number (0-100, how similar the macros are),
      "reason": "Why this is a good substitute"
    }
  ]
}

Provide 3-5 alternatives with similar macronutrient profiles. Consider the user's dietary restrictions. Each substitution must be realistic and commonly available. The JSON must have ALL fields.`
      : `Atua como um nutricionista esportivo e especialista em ciência alimentar. Encontre substituições inteligentes de alimentos. Toda a saída deve ser em ${lang}.

ALIMENTO ORIGINAL: ${food}
${reasonInfo}
${restrictionsList}

Retorne APENAS um JSON válido com esta estrutura EXATA (sem markdown):
{
  "substitutions": [
    {
      "name": "Nome do alimento substituto",
      "calories": número (por 100g),
      "protein": número (gramas por 100g),
      "carbs": número (gramas por 100g),
      "fat": número (gramas por 100g),
      "matchPercent": número (0-100, quão semelhantes são as macros),
      "reason": "Por que esta é uma boa substituição"
    }
  ]
}

Forneça 3-5 alternativas com perfis de macronutrientes semelhantes. Considere as restrições alimentares do usuário. Cada substituição deve ser realista e comumente disponível. O JSON deve ter TODOS os campos.`

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
    console.error("Erro na rota food-substitutions:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500, headers });
  }
}
