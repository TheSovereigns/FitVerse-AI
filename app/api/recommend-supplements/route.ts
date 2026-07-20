import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCorsHeaders } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitKey, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const MAX_RETRIES = 3;

async function generateWithRetry(model: any, prompt: string): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
      const parsed = JSON.parse(cleanedText);
      if (parsed && Array.isArray(parsed.supplements) && parsed.supplements.length > 0) {
        return cleanedText;
      }
      lastError = new Error("Parsed JSON missing 'supplements' array.");
    } catch (e: any) {
      lastError = e;
      console.warn(`Retry ${attempt}/${MAX_RETRIES}: JSON parse failed — ${e.message}`);
    }
  }
  throw lastError;
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const headers = getCorsHeaders();
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 401, headers });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Configuracao do servidor incompleta." }, { status: 500, headers });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (!user || authError) {
      return NextResponse.json({ error: "Token invalido." }, { status: 401, headers });
    }

    const rlKey = getRateLimitKey(req, "recommend-supplements")
    const rl = await checkRateLimit(rlKey, RATE_LIMITS.generate)
    if (!rl.allowed) return rateLimitResponse()

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500, headers });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const body = await req.json();
    const {
      age, gender, goal, dietaryRestrictions, sleepQuality,
      stressLevel, activityLevel, medicalConditions, medications,
      locale = "pt-BR",
    } = body;

    const isEnglish = locale === "en-US";
    const lang = isEnglish ? "English" : "Portuguese";

    const genderLabel = isEnglish
      ? gender === "male" ? "Male" : "Female"
      : gender === "male" ? "Masculino" : "Feminino";

    const goalLabel = isEnglish
      ? goal === "lose_weight" ? "Lose weight"
        : goal === "gain_muscle" ? "Gain muscle mass"
          : "Maintain weight"
      : goal === "lose_weight" ? "Perder peso"
        : goal === "gain_muscle" ? "Ganhar massa muscular"
          : "Manter peso";

    const restrictionsList = dietaryRestrictions?.length
      ? isEnglish ? `Diet restrictions: ${dietaryRestrictions.join(", ")}` : `Restrições: ${dietaryRestrictions.join(", ")}`
      : isEnglish ? "No restrictions" : "Sem restrições";

    const sleepInfo = sleepQuality ? (isEnglish ? `Sleep: ${sleepQuality}` : `Sono: ${sleepQuality}`) : "";
    const stressInfo = stressLevel ? (isEnglish ? `Stress: ${stressLevel}` : `Estresse: ${stressLevel}`) : "";
    const activityInfo = activityLevel ? (isEnglish ? `Activity: ${activityLevel}` : `Atividade: ${activityLevel}`) : "";
    const medicalInfo = medicalConditions?.length ? (isEnglish ? `Conditions: ${medicalConditions.join(", ")}` : `Condições: ${medicalConditions.join(", ")}`) : "";
    const medicationInfo = medications?.length ? (isEnglish ? `Medications: ${medications.join(", ")}` : `Medicamentos: ${medications.join(", ")}`) : "";

    const prompt = isEnglish
      ? `Create a personalized supplement stack. Output in ${lang}. ONLY valid JSON.

USER: ${age}y ${genderLabel}, goal: ${goalLabel}, ${restrictionsList}, ${sleepInfo}, ${stressInfo}, ${activityInfo}, ${medicalInfo}, ${medicationInfo}.

REQUIREMENTS:
1. Evidence-based: reference effect sizes or study types (e.g. "meta-analysis shows X% improvement").
2. Synergy pairs: explain WHY (e.g. "D3+K2: K2 directs calcium to bones", "Mg+B6: B6 enhances Mg absorption", "Zinc+Copper: long-term Zn depletes Cu").
3. Interaction warnings: flag med/supplement/food interactions (e.g. "Iron competes with calcium — separate", "K2 interacts with warfarin", "St. John's Wort + antidepressants").
4. Bioavailability: specify best form (methylcobalamin > cyanocobalamin, bisglycinate > oxide for Mg), fat-soluble considerations, absorption tips.
5. Timing: morning energizing supplements, lunch fat-solubles, pre-workout creatine/beta-alanine, evening magnesium/melatonin.
6. Quality: preferred form, third-party testing (NSF, USP), what to avoid.
7. Budget alternatives: affordable options, pharmacy vs specialty.
8. Cycling: creatine no cycle needed, ashwagandha 8w on/2w off, melatonin lowest effective dose.
9. Dietary restrictions: vegan → algal DHA, no gelatin/whey; halal/kosher → flag animal-derived; soy-free → check lecithin.
10. Priority: essential (critical gap), important (optimization), optional (nice-to-have).

Recommend 4-8 supplements. Be selective.

Return ONLY valid JSON:
{
  "supplements": [
    {
      "name": string,
      "dosage": string (e.g. "5000 IU", "200mg"),
      "timing": string (e.g. "Morning with breakfast containing fat"),
      "reason": string (clinical rationale for this user),
      "priority": "essential"|"important"|"optional",
      "form": string (e.g. "Magnesium bisglycinate"),
      "synergyWith": [string],
      "interactions": [string] or ["None identified"],
      "bioavailabilityTips": string,
      "researchSupport": string (e.g. "Meta-analysis (2021) showed 23% improvement"),
      "cycleRecommendation": string,
      "budgetAlternative": string
    }
  ]
}

All fields mandatory per supplement. No text outside JSON.`
      : `Crie um stack personalizado de suplementos. Saída em ${lang}. APENAS JSON válido.

USUÁRIO: ${age}a ${genderLabel}, objetivo: ${goalLabel}, ${restrictionsList}, ${sleepInfo}, ${stressInfo}, ${activityInfo}, ${medicalInfo}, ${medicationInfo}.

REQUISITOS:
1. Baseado em evidências: referencie tamanhos de efeito ou tipos de estudos.
2. Pares de sinergia: explique PORQUÊ (ex: "D3+K2: K2 direciona cálcio para ossos").
3. Avisos de interação: sinalize interações med/sup/alimento.
4. Biodisponibilidade: melhor forma (metilcobalamina > cianocobalamina), considerações lipossolúveis.
5. Timing: manhã energizantes, almoço lipossolúveis, pré-treino creatina, noite magnésio/melatonina.
6. Qualidade: forma preferida, testes terceiros (NSF, USP).
7. Alternativas econômicas.
8. Ciclagem: creatina sem ciclo, ashwagandha 8s l/2s dl, melatonina dose mínima.
9. Restrições alimentares: veganos → DHA algal; halal/kosher → sinalizar animal; sem soja → verificar lecitina.
10. Prioridade: essencial, importante, opcional.

Recomende 4-8 suplementos. Seletivo.

Retorne APENAS JSON válido:
{
  "supplements": [
    {
      "name": string,
      "dosage": string,
      "timing": string,
      "reason": string,
      "priority": "essential"|"important"|"optional",
      "form": string,
      "synergyWith": [string],
      "interactions": [string] ou ["Nenhuma identificada"],
      "bioavailabilityTips": string,
      "researchSupport": string,
      "cycleRecommendation": string,
      "budgetAlternative": string
    }
  ]
}

Todos campos obrigatórios por suplemento. Sem texto fora do JSON.`;

    let cleanedText: string;
    try {
      cleanedText = await generateWithRetry(model, prompt);
    } catch (retryError: any) {
      console.error("AI returned invalid JSON after retries:", retryError?.message);
      return NextResponse.json(
        { error: "A IA retornou um formato inválido após múltiplas tentativas." },
        { status: 500, headers }
      );
    }

    const data = JSON.parse(cleanedText);
    return NextResponse.json(data, { headers });
  } catch (error: any) {
    console.error("Erro na rota recommend-supplements:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500, headers }
    );
  }
}
