import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCorsHeaders } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const headers = getCorsHeaders();
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401, headers });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Configuracao do servidor incompleta.' }, { status: 500, headers });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!user || authError) {
      return NextResponse.json({ error: 'Token invalido.' }, { status: 401, headers });
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
        temperature: 0.5,
      },
    });

    const body = await req.json();
    const { sleepData, currentSleep, currentQuality, locale = "pt-BR" } = body;

    const isEnglish = locale === "en-US";
    const lang = isEnglish ? "English" : "Portuguese";

    const sleepDataFormatted = sleepData?.length
      ? sleepData.map((d: any) =>
          `${d.date}: ${d.duration}h, quality ${d.quality}${d.notes ? `, notes: ${d.notes}` : ""}${d.bedtime ? `, bedtime: ${d.bedtime}` : ""}${d.wakeTime ? `, wake time: ${d.wakeTime}` : ""}`
        ).join('\n')
      : (isEnglish ? "No historical sleep data" : "Sem dados históricos de sono");

    const currentSleepInfo = currentSleep
      ? (isEnglish ? `Current sleep: ${currentSleep}h` : `Sono atual: ${currentSleep}h`)
      : "";

    const currentQualityInfo = currentQuality
      ? (isEnglish ? `Quality: ${currentQuality}` : `Qualidade: ${currentQuality}`)
      : "";

    const prompt = isEnglish
      ? `Analyze sleep data and provide optimization report. Output in ${lang}. ONLY valid JSON.

SLEEP HISTORY:
${sleepDataFormatted}
${currentSleepInfo}
${currentQualityInfo}

Return ONLY valid JSON:
{
  "score": number (0-100, weighted: duration 25%, consistency 20%, quality 25%, efficiency 15%, environment 15%),
  "analysis": "3-5 sentence analysis: pattern regularity, quality trends, deviation from 7-9h range, red flags",
  "sleepStages": {"deep": number (%), "rem": number (%), "light": number (%), "assessment": string},
  "circadianRhythm": {"assessment": string, "recommendations": [3 tips], "optimalBedtime": string, "optimalWakeTime": string},
  "sleepEfficiency": number (% of time in bed actually sleeping),
  "environmentalFactors": [{"factor": string, "impact": "high"|"medium"|"low", "recommendation": string}],
  "nutritionalImpact": [{"nutrient": string, "effect": string, "recommendation": string}],
  "exerciseImpact": [{"type": string, "timing": string, "effect": string, "recommendation": string}],
  "stressAndCortisol": {"assessment": string, "recommendations": [3 tips]},
  "screenTimeImpact": {"assessment": string, "recommendations": [3 tips]},
  "tips": [5 high-impact tips with specific times/dosages],
  "sleepProtocol": [{"timing": string, "action": string, "reason": string}],
  "sleepHygieneChecklist": [{"item": string, "importance": "high"|"medium"|"low", "currentStatus": string, "action": string}],
  "debt": number (hours of sleep debt from past 7 days)
}

Analysis rules: Sleep efficiency = (sleep time / time in bed) × 100. Debt = sum of deficits below 7h. Estimate stages from duration/quality. Environmental: cover temp (18-20°C), noise, light, mattress, air. Nutritional: caffeine (5-7h half-life), alcohol, magnesium, melatonin, sugar, meal timing. Exercise: aerobic (improves deep sleep), strength (cortisol if late), yoga, HIIT (avoid 2h pre-bed). Screen: blue light, melatonin suppression. Stress: cortisol rhythm, HPA axis. Protocol: 5+ entries. Checklist: 8+ entries. All fields mandatory.`
      : `Analise dados de sono e forneça relatório de otimização. Saída em ${lang}. APENAS JSON válido.

HISTÓRICO DE SONO:
${sleepDataFormatted}
${currentSleepInfo}
${currentQualityInfo}

Retorne APENAS JSON válido:
{
  "score": número (0-100, ponderado: duração 25%, consistência 20%, qualidade 25%, eficiência 15%, ambiente 15%),
  "analysis": "Análise de 3-5 frases: regularidade, tendências, desvio de 7-9h, sinais de alerta",
  "sleepStages": {"deep": número (%), "rem": número (%), "light": número (%), "assessment": string},
  "circadianRhythm": {"assessment": string, "recommendations": [3 dicas], "optimalBedtime": string, "optimalWakeTime": string},
  "sleepEfficiency": number (%),
  "environmentalFactors": [{"factor": string, "impact": "high"|"medium"|"low", "recommendation": string}],
  "nutritionalImpact": [{"nutrient": string, "effect": string, "recommendation": string}],
  "exerciseImpact": [{"type": string, "timing": string, "effect": string, "recommendation": string}],
  "stressAndCortisol": {"assessment": string, "recommendations": [3 dicas]},
  "screenTimeImpact": {"assessment": string, "recommendations": [3 dicas]},
  "tips": [5 dicas de alto impacto com tempos/dosagens],
  "sleepProtocol": [{"timing": string, "action": string, "reason": string}],
  "sleepHygieneChecklist": [{"item": string, "importance": "high"|"medium"|"low", "currentStatus": string, "action": string}],
  "debt": number (horas de débito de sono)
}

Regras: Eficiência = (sono / tempo na cama) × 100. Débito = soma dos déficits abaixo de 7h. Estime estágios de duração/qualidade. Ambiental: temp (18-20°C), ruído, luz, colchão, ar. Nutricional: cafeína, álcool, magnésio, melatonina, açúcar. Exercício: aeróbico, força, yoga, HIIT. Tela: luz azul, melatonina. Estresse: ritmo do cortisol. Protocolo: 5+ entradas. Checklist: 8+ entradas. Todos campos obrigatórios.`;

    const maxRetries = 3;
    let lastParseError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(cleanedText);
        return NextResponse.json(data, { headers });
      } catch (parseError) {
        lastParseError = parseError;
        console.error(`Tentativa ${attempt}/${maxRetries} - Erro ao processar JSON da IA:`, parseError);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    console.error("Todas as tentativas de parsing falharam:", lastParseError);
    return NextResponse.json({ error: "A IA retornou um formato inválido após múltiplas tentativas." }, { status: 500, headers });

  } catch (error: any) {
    console.error("Erro na rota analyze-sleep:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500, headers });
  }
}
