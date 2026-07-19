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
      ? (isEnglish ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : `Restrições alimentares: ${dietaryRestrictions.join(', ')}`)
      : (isEnglish ? "No dietary restrictions" : "Sem restrições alimentares")

    const reasonInfo = reason
      ? (isEnglish ? `Reason for substitution: ${reason}` : `Motivo da substituição: ${reason}`)
      : ""

    const prompt = isEnglish
      ? `Act as a world-class sports nutritionist and food scientist with deep expertise in macro/micronutrient analysis, glycemic response, and culinary applications. Your task is to provide comprehensive, evidence-based food substitutions.

ORIGINAL FOOD: ${food}
${reasonInfo}
${restrictionsList}

ANALYSIS REQUIREMENTS:
For each substitution, provide a thorough comparison:

1. MACRONUTRIENT PROFILE:
   - Exact values per 100g: calories, protein (g), carbs (g), fat (g)
   - Calculate protein-to-calorie ratio (protein grams × 4 / total calories × 100)
   - Calculate carb-to-fat ratio
   - Note if macros are higher/lower/similar to original

2. MICRONUTRIENTS (brief):
   - Key vitamins and minerals present (e.g., "rich in iron, B12, zinc")
   - Note any significant nutritional advantages over original

3. GLYCEMIC INDEX:
   - Estimated GI value (low: <55, medium: 55-69, high: >70)
   - Impact on blood sugar compared to original

4. TASTE & TEXTURE:
   - Taste similarity score (1-10, where 10 is identical)
   - Texture match description
   - Flavor profile notes

5. PRACTICAL FACTORS:
   - Cost comparison: "cheaper", "similar", or "pricier"
   - Availability: "common" (most supermarkets), "moderate" (health stores/specialty), "rare" (online/specialty only)
   - Preparation difficulty: "easy" (ready to use), "moderate" (some prep), "complex" (specialized prep)

6. USE CASES:
   - Best specific application for this substitute (e.g., "ideal for smoothies", "great in stir-fries", "perfect for baking")
   - When to choose this substitute over others

7. ALLERGEN CONSIDERATIONS:
   - Common allergens present (gluten, dairy, nuts, soy, eggs, shellfish)
   - Cross-contamination risks
   - Safe alternatives for specific allergen restrictions

8. SEASONAL AVAILABILITY:
   - Peak season months
   - Year-round availability status

Return ONLY a valid JSON with this EXACT structure (no markdown, no extra text):
{
  "substitutions": [
    {
      "name": "Substitute food name",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "matchPercent": number (0-100, how well macros match original),
      "reason": "Why this is a good substitute (2-3 sentences explaining nutritional and practical benefits)",
      "micronutrients": "Brief summary of key micronutrients (e.g., 'High in iron, B12, zinc; good source of selenium')",
      "glycemicIndex": number or "unknown" if not applicable,
      "tasteSimilarity": number (1-10),
      "costComparison": "cheaper" | "similar" | "pricier",
      "availability": "common" | "moderate" | "rare",
      "bestFor": "Specific best use case (e.g., 'smoothies and protein shakes')",
      "allergenNote": "Allergen information (e.g., 'Contains soy; gluten-free, dairy-free')"
    }
  ]
}

Provide 3-5 alternatives. Prioritize substitutions that:
- Have similar macronutrient ratios (not just individual values)
- Fit the user's dietary restrictions
- Are realistic and commonly available
- Offer unique benefits (e.g., one for taste, one for nutrition, one for budget)

The JSON must have ALL fields for EVERY substitution. No field can be missing or null.`
      : `Atua como um nutricionista esportivo e cientista alimentar de classe mundial com profunda expertise em análise macro/micronutriente, resposta glicêmica e aplicações culinárias. Sua tarefa é fornecer substituições de alimentos abrangentes e baseadas em evidências.

ALIMENTO ORIGINAL: ${food}
${reasonInfo}
${restrictionsList}

REQUISITOS DE ANÁLISE:
Para cada substituição, forneça uma comparação completa:

1. PERFIL DE MACRONUTRIENTES:
   - Valores exatos por 100g: calorias, proteína (g), carboidratos (g), gordura (g)
   - Calcular proporção proteína/caloria (gramas de proteína × 4 / calorias totais × 100)
   - Calcular proporção carboidrato/gordura
   - Indicar se macros são maiores/menores/similares ao original

2. MICRONUTRIENTES (breve):
   - Vitaminas e minerais chave presentes (ex: "rico em ferro, B12, zinco")
   - Destacar vantagens nutricionais significativas sobre o original

3. ÍNDICE GLICÊMICO:
   - Valor estimado do IG (baixo: <55, médio: 55-70, alto: >70)
   - Impacto na glicose sanguínea comparado ao original

4. SABOR E TEXTURA:
   - Pontuação de similaridade de sabor (1-10, onde 10 é idêntico)
   - Descrição da correspondência de textura
   - Notas do perfil de sabor

5. FATORES PRÁTICOS:
   - Comparação de custo: "mais barato", "similar" ou "mais caro"
   - Disponibilidade: "comum" (maioria dos supermercados), "moderada" (lojas de saúde/especializadas), "rara" (online/especializadas)
   - Dificuldade de preparo: "fácil" (pronto para uso), "moderada" (algum preparo), "complexa" (preparo especializado)

6. CASOS DE USO:
   - Melhor aplicação específica para este substituto (ex: "ideal para smoothies", "ótimo para stir-fries", "perfeito para assar")
   - Quando escolher este substituto sobre outros

7. CONSIDERAÇÕES DE ALÉRGENOS:
   - Alérgenos comuns presentes (glúten, laticínios, nozes, soja, ovos, frutos do mar)
   - Riscos de contaminação cruzada
   - Alternativas seguras para restrições específicas de alérgenos

8. DISPONIBILIDADE SAZONAL:
   - Meses de pico
   - Status de disponibilidade durante o ano

Retorne APENAS um JSON válido com esta estrutura EXATA (sem markdown, sem texto extra):
{
  "substitutions": [
    {
      "name": "Nome do alimento substituto",
      "calories": número,
      "protein": número,
      "carbs": número,
      "fat": número,
      "matchPercent": número (0-100, quão bem as macros combinam com o original),
      "reason": "Por que esta é uma boa substituição (2-3 frases explicando benefícios nutricionais e práticos)",
      "micronutrients": "Resumo breve dos micronutrientes chave (ex: 'Alto em ferro, B12, zinco; boa fonte de selênio')",
      "glycemicIndex": número ou "desconhecido" se não aplicável,
      "tasteSimilarity": número (1-10),
      "costComparison": "mais barato" | "similar" | "mais caro",
      "availability": "comum" | "moderada" | "rara",
      "bestFor": "Melhor caso de uso específico (ex: 'smoothies e shakes de proteína')",
      "allergenNote": "Informação sobre alérgenos (ex: 'Contém soja; sem glúten, sem laticínios')"
    }
  ]
}

Forneça 3-5 alternativas. Priorize substituições que:
- Tenham proporções de macronutrientes similares (não apenas valores individuais)
- Respeitem as restrições alimentares do usuário
- Sejam realistas e comumente disponíveis
- Ofereçam benefícios únicos (ex: uma para sabor, outra para nutrição, outra para economia)

O JSON deve ter TODOS os campos para CADA substituição. Nenhum campo pode estar faltando ou nulo.`

    let lastError: Error | null = null;
    let data: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        data = JSON.parse(cleanedText);

        if (data.substitutions && Array.isArray(data.substitutions) && data.substitutions.length > 0) {
          const firstSub = data.substitutions[0];
          if (
            typeof firstSub.name === "string" &&
            typeof firstSub.calories === "number" &&
            typeof firstSub.protein === "number" &&
            typeof firstSub.carbs === "number" &&
            typeof firstSub.fat === "number" &&
            typeof firstSub.matchPercent === "number" &&
            typeof firstSub.reason === "string" &&
            typeof firstSub.micronutrients === "string" &&
            (typeof firstSub.glycemicIndex === "number" || firstSub.glycemicIndex === "unknown") &&
            typeof firstSub.tasteSimilarity === "number" &&
            typeof firstSub.costComparison === "string" &&
            typeof firstSub.availability === "string" &&
            typeof firstSub.bestFor === "string" &&
            typeof firstSub.allergenNote === "string"
          ) {
            break;
          }
        }

        throw new Error("JSON structure validation failed: missing or invalid fields");
      } catch (parseError: any) {
        lastError = parseError;
        console.error(`Tentativa ${attempt}/3 falhou:`, parseError.message);
        if (attempt === 3) {
          console.error("Resposta da IA após 3 tentativas:", lastError?.message);
          return NextResponse.json({ error: "A IA retornou um formato inválido após 3 tentativas." }, { status: 500, headers });
        }
      }
    }

    return NextResponse.json(data, { headers });

  } catch (error: any) {
    console.error("Erro na rota food-substitutions:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500, headers });
  }
}
