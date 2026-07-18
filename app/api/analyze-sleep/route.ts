import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(req: Request) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
    }

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
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const body = await req.json();
    const { sleepData, currentSleep, currentQuality, locale = "pt-BR" } = body;

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const sleepDataFormatted = sleepData?.length
      ? sleepData.map((d: any) => `${d.date}: ${d.duration}h, quality ${d.quality}`).join('\n')
      : (isEnglish ? "No historical sleep data available" : "Dados históricos de sono não disponíveis")

    const currentSleepInfo = currentSleep
      ? (isEnglish ? `Current sleep duration: ${currentSleep} hours` : `Duração atual do sono: ${currentSleep} horas`)
      : ""

    const currentQualityInfo = currentQuality
      ? (isEnglish ? `Current sleep quality: ${currentQuality}` : `Qualidade atual do sono: ${currentQuality}`)
      : ""

    const prompt = isEnglish
      ? `Act as a sleep science expert and health coach. Analyze the user's sleep patterns and provide recommendations. All output must be in ${lang}.

SLEEP DATA (recent days):
${sleepDataFormatted}

${currentSleepInfo}
${currentQualityInfo}

Return ONLY a valid JSON with this EXACT structure (no markdown):
{
  "score": number (0-100, overall sleep score),
  "analysis": "Detailed analysis of sleep patterns, trends, and issues found",
  "tips": [
    "Specific actionable tip 1",
    "Specific actionable tip 2",
    "Specific actionable tip 3"
  ],
  "debt": number (estimated sleep debt in hours, 0 if none)
}

Analyze duration consistency, quality trends, and provide at least 5 specific tips. Calculate sleep debt if the user has been sleeping less than 7-8 hours. The JSON must have ALL fields.`
      : `Atua como um especialista em ciência do sono e coach de saúde. Analise os padrões de sono do usuário e forneça recomendações. Toda a saída deve ser em ${lang}.

DADOS DE SONO (dias recentes):
${sleepDataFormatted}

${currentSleepInfo}
${currentQualityInfo}

Retorne APENAS um JSON válido com esta estrutura EXATA (sem markdown):
{
  "score": número (0-100, pontuação geral do sono),
  "analysis": "Análise detalhada dos padrões de sono, tendências e problemas encontrados",
  "tips": [
    "Dica específica e prática 1",
    "Dica específica e prática 2",
    "Dica específica e prática 3"
  ],
  "debt": número (débito de sono estimado em horas, 0 se não houver)
}

Analise a consistência da duração, tendências de qualidade e forneça pelo menos 5 dicas específicas. Calcule o débito de sono se o usuário estiver dormindo menos de 7-8 horas. O JSON deve ter TODOS os campos.`

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
    console.error("Erro na rota analyze-sleep:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 });
  }
}
