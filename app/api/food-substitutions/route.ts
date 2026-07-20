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

    const rlKey = getRateLimitKey(req, "food-substitutions")
    const rl = await checkRateLimit(rlKey, RATE_LIMITS.generate)
    if (!rl.allowed) return rateLimitResponse()

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500, headers });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.5
      }
    });

    const body = await req.json();
    const { food, reason, dietaryRestrictions, locale = "pt-BR" } = body;

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const restrictionsList = dietaryRestrictions?.length
      ? (isEnglish ? `Diet restrictions: ${dietaryRestrictions.join(', ')}` : `Restrições: ${dietaryRestrictions.join(', ')}`)
      : (isEnglish ? "No restrictions" : "Sem restrições")

    const reasonInfo = reason
      ? (isEnglish ? `Reason: ${reason}` : `Motivo: ${reason}`)
      : ""

    const prompt = isEnglish
      ? `Provide 3-5 food substitutions for "${food}". Output in ${lang}. ONLY valid JSON.

${reasonInfo}
${restrictionsList}

For each substitution provide:
- Macros per 100g: calories, protein, carbs, fat
- matchPercent (0-100): how well macros match original
- reason (2-3 sentences): nutritional and practical benefits
- micronutrients: key vitamins/minerals summary
- glycemicIndex: estimated value or "unknown"
- tasteSimilarity: 1-10 scale
- costComparison: "cheaper"|"similar"|"pricier"
- availability: "common"|"moderate"|"rare"
- bestFor: best specific use case
- allergenNote: allergen info

Prioritize: similar macro ratios, dietary restriction compliance, realistic availability, unique benefits.

Return ONLY valid JSON:
{
  "substitutions": [
    {
      "name": string,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "matchPercent": number,
      "reason": string,
      "micronutrients": string,
      "glycemicIndex": number|"unknown",
      "tasteSimilarity": number,
      "costComparison": "cheaper"|"similar"|"pricier",
      "availability": "common"|"moderate"|"rare",
      "bestFor": string,
      "allergenNote": string
    }
  ]
}

All fields mandatory per substitution. No text outside JSON.`
      : `Forneça 3-5 substituições para "${food}". Saída em ${lang}. APENAS JSON válido.

${reasonInfo}
${restrictionsList}

Para cada substituição forneça:
- Macros por 100g: calorias, proteína, carboidratos, gordura
- matchPercent (0-100): similaridade com original
- reason (2-3 frases): benefícios nutricionais e práticos
- micronutrients: resumo de vitaminas/minerais
- glycemicIndex: valor estimado ou "desconhecido"
- tasteSimilarity: escala 1-10
- costComparison: "mais barato"|"similar"|"mais caro"
- availability: "comum"|"moderada"|"rara"
- bestFor: melhor caso de uso
- allergenNote: informação de alérgenos

Priorize: proporções similares de macros, respeito a restrições, disponibilidade realista, benefícios únicos.

Retorne APENAS JSON válido:
{
  "substitutions": [
    {
      "name": string,
      "calories": número,
      "protein": número,
      "carbs": número,
      "fat": número,
      "matchPercent": número,
      "reason": string,
      "micronutrients": string,
      "glycemicIndex": número|"desconhecido",
      "tasteSimilarity": número,
      "costComparison": "mais barato"|"similar"|"mais caro",
      "availability": "comum"|"moderada"|"rara",
      "bestFor": string,
      "allergenNote": string
    }
  ]
}

Todos campos obrigatórios por substituição. Sem texto fora do JSON.`

    const responseText = await generateContentWithFallback({
      geminiCall: async () => {
        const result = await model.generateContent(prompt);
        return result.response.text();
      },
      prompt,
      generationConfig: { temperature: 0.5 },
    });

    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    if (data.substitutions && Array.isArray(data.substitutions) && data.substitutions.length > 0) {
      return NextResponse.json(data, { headers });
    }

    return NextResponse.json({ error: "A IA retornou um formato inválido." }, { status: 500, headers });

  } catch (error: any) {
    console.error("Erro na rota food-substitutions:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500, headers });
  }
}
