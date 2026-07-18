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
    const { age, bmi, sleepQuality, stressLevel, activityLevel, smokingStatus, locale = "pt-BR" } = body;

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const sleepInfo = sleepQuality
      ? (isEnglish ? `Sleep quality: ${sleepQuality}` : `Qualidade do sono: ${sleepQuality}`)
      : (isEnglish ? "Not provided" : "Não informado")

    const stressInfo = stressLevel
      ? (isEnglish ? `Stress level: ${stressLevel}` : `Nível de estresse: ${stressLevel}`)
      : (isEnglish ? "Not provided" : "Não informado")

    const activityInfo = activityLevel
      ? (isEnglish ? `Activity level: ${activityLevel}` : `Nível de atividade: ${activityLevel}`)
      : (isEnglish ? "Not provided" : "Não informado")

    const smokingLabel = smokingStatus
      ? (isEnglish
          ? (smokingStatus === 'never' ? 'Never smoked' : smokingStatus === 'former' ? 'Former smoker' : 'Current smoker')
          : (smokingStatus === 'never' ? 'Nunca fumou' : smokingStatus === 'former' ? 'Ex-fumante' : 'Fumante atual'))
      : (isEnglish ? "Not provided" : "Não informado")

    const prompt = isEnglish
      ? `Act as an anti-aging medicine expert and longevity specialist. Calculate the user's biological age based on lifestyle factors. All output must be in ${lang}.

USER DATA:
- Chronological age: ${age} years
- BMI: ${bmi}
- ${sleepInfo}
- ${stressInfo}
- ${activityInfo}
- Smoking status: ${smokingLabel}

Return ONLY a valid JSON with this EXACT structure (no markdown):
{
  "biologicalAge": number (estimated biological age in years),
  "difference": number (biological age minus chronological age, can be negative if younger),
  "factors": [
    {
      "name": "Factor name (e.g. Sleep, Stress, BMI, Smoking, Activity)",
      "impact": number (positive = aging, negative = rejuvenating),
      "description": "How this factor affects biological age"
    }
  ],
  "recommendations": [
    "Specific recommendation 1 to improve biological age",
    "Specific recommendation 2",
    "Specific recommendation 3"
  ]
}

Base the calculation on established research about how lifestyle factors affect aging. Include at least 5 factors and 5 recommendations. The JSON must have ALL fields.`
      : `Atua como um especialista em medicina antienvelhecimento e longevidade. Calcule a idade biológica do usuário com base em fatores de estilo de vida. Toda a saída deve ser em ${lang}.

DADOS DO USUÁRIO:
- Idade cronológica: ${age} anos
- IMC: ${bmi}
- ${sleepInfo}
- ${stressInfo}
- ${activityInfo}
- Status de fumo: ${smokingLabel}

Retorne APENAS um JSON válido com esta estrutura EXATA (sem markdown):
{
  "biologicalAge": número (idade biológica estimada em anos),
  "difference": número (idade biológica menos idade cronológica, pode ser negativo se for mais jovem),
  "factors": [
    {
      "name": "Nome do fator (ex: Sono, Estresse, IMC, Fumo, Atividade)",
      "impact": número (positivo = envelhecimento, negativo = rejuvenescimento),
      "description": "Como este fator afeta a idade biológica"
    }
  ],
  "recommendations": [
    "Recomendação específica 1 para melhorar a idade biológica",
    "Recomendação específica 2",
    "Recomendação específica 3"
  ]
}

Base o cálculo em pesquisas estabelecidas sobre como fatores de estilo de vida afetam o envelhecimento. Inclua pelo menos 5 fatores e 5 recomendações. O JSON deve ter TODOS os campos.`

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
    console.error("Erro na rota biological-age:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 });
  }
}
