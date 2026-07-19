import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCorsHeaders } from "@/lib/auth-helpers";

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
        temperature: 0.5,
      },
    });

    const body = await req.json();
    const {
      age,
      bmi,
      sleepQuality,
      stressLevel,
      activityLevel,
      smokingStatus,
      locale = "pt-BR",
    } = body;

    const isEnglish = locale === "en-US";
    const lang = isEnglish ? "English" : "Portuguese";

    const sleepInfo = sleepQuality
      ? isEnglish ? `Sleep: ${sleepQuality}` : `Sono: ${sleepQuality}`
      : isEnglish ? "Not provided" : "Não informado";

    const stressInfo = stressLevel
      ? isEnglish ? `Stress: ${stressLevel}` : `Estresse: ${stressLevel}`
      : isEnglish ? "Not provided" : "Não informado";

    const activityInfo = activityLevel
      ? isEnglish ? `Activity: ${activityLevel}` : `Atividade: ${activityLevel}`
      : isEnglish ? "Not provided" : "Não informado";

    const smokingLabel = smokingStatus
      ? isEnglish
        ? smokingStatus === "never" ? "Never smoked" : smokingStatus === "former" ? "Former smoker" : "Current smoker"
        : smokingStatus === "never" ? "Nunca fumou" : smokingStatus === "former" ? "Ex-fumante" : "Fumante atual"
      : isEnglish ? "Not provided" : "Não informado";

    const prompt = isEnglish
      ? `Calculate biological age using multi-dimensional aging markers. Output in ${lang}. ONLY valid JSON, no markdown.

USER: ${age} years, BMI ${bmi}, ${sleepInfo}, ${stressInfo}, ${activityInfo}, smoking: ${smokingLabel}.

Consider: telomere length, oxidative stress, chronic inflammation, epigenetic age, hormetic responses, cellular senescence.

Return ONLY valid JSON:
{
  "biologicalAge": number (to 1 decimal),
  "difference": number (bio - chrono age),
  "agingScore": number (0-100, 100=optimal),
  "factors": [{"name": string, "impact": number (+ = accelerates aging), "description": string}],
  "biomarkers": [{"name": string, "currentStatus": string, "targetStatus": string, "priority": "high"|"medium"|"low"}],
  "riskAssessment": {
    "cardiovascular": {"riskLevel": "low"|"moderate"|"high"|"very_high", "details": string},
    "metabolic": {"riskLevel": "low"|"moderate"|"high"|"very_high", "details": string},
    "cognitive": {"riskLevel": "low"|"moderate"|"high"|"very_high", "details": string}
  },
  "populationComparison": string,
  "recommendations": [{"action": string, "timeframe": string, "expectedImpact": string}],
  "improvementPlan": [{"action": string, "timeframe": string, "expectedImpact": string}]
}

Include 6+ factors, 5+ biomarkers, 3+ recommendations, 4+ improvement steps. Base on peer-reviewed longevity research. All fields mandatory.`
      : `Calcule a idade biológica usando marcadores multidimensionais de envelhecimento. Saída em ${lang}. APENAS JSON válido.

USUÁRIO: ${age} anos, IMC ${bmi}, ${sleepInfo}, ${stressInfo}, ${activityInfo}, tabagismo: ${smokingLabel}.

Considere: comprimento dos telômeros, estresse oxidativo, inflamação crônica, idade epigenética, respostas horméticas, senescência celular.

Retorne APENAS JSON válido:
{
  "biologicalAge": número (1 casa decimal),
  "difference": number (bio - cronológica),
  "agingScore": número (0-100, 100=ideal),
  "factors": [{"name": string, "impact": number (+ = acelera envelhecimento), "description": string}],
  "biomarkers": [{"name": string, "currentStatus": string, "targetStatus": string, "priority": "high"|"medium"|"low"}],
  "riskAssessment": {
    "cardiovascular": {"riskLevel": "low"|"moderate"|"high"|"very_high", "details": string},
    "metabolic": {"riskLevel": "low"|"moderate"|"high"|"very_high", "details": string},
    "cognitive": {"riskLevel": "low"|"moderate"|"high"|"very_high", "details": string}
  },
  "populationComparison": string,
  "recommendations": [{"action": string, "timeframe": string, "expectedImpact": string}],
  "improvementPlan": [{"action": string, "timeframe": string, "expectedImpact": string}]
}

Inclua 6+ fatores, 5+ biomarcadores, 3+ recomendações, 4+ etapas. Baseado em pesquisa revisada por pares. Todos campos obrigatórios.`;

    const MAX_RETRIES = 3;
    let parsedData: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedText = responseText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        parsedData = JSON.parse(cleanedText);

        if (
          parsedData &&
          typeof parsedData.biologicalAge === "number" &&
          Array.isArray(parsedData.factors) &&
          Array.isArray(parsedData.biomarkers) &&
          parsedData.riskAssessment
        ) {
          break;
        }

        if (attempt < MAX_RETRIES) {
          console.warn(
            `Attempt ${attempt}: AI returned invalid structure, retrying...`
          );
          continue;
        }

        return NextResponse.json(
          {
            error:
              "A IA retornou um formato inválido após várias tentativas.",
          },
          { status: 500, headers }
        );
      } catch (parseError) {
        console.warn(
          `Attempt ${attempt}: JSON parse failed -`,
          parseError
        );
        if (attempt === MAX_RETRIES) {
          return NextResponse.json(
            {
              error:
                "A IA retornou um formato inválido após várias tentativas.",
            },
            { status: 500, headers }
          );
        }
      }
    }

    return NextResponse.json(parsedData, { headers });
  } catch (error: any) {
    console.error("Erro na rota biological-age:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500, headers }
    );
  }
}
