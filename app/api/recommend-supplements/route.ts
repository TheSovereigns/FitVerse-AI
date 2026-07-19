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
    const { age, gender, goal, dietaryRestrictions, sleepQuality, stressLevel, activityLevel, locale = "pt-BR" } = body;

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const genderLabel = isEnglish 
      ? (gender === 'male' ? 'Male' : 'Female')
      : (gender === 'male' ? 'Masculino' : 'Feminino')
    
    const goalLabel = isEnglish
      ? (goal === 'lose_weight' ? 'Lose weight' : goal === 'gain_muscle' ? 'Gain muscle mass' : 'Maintain weight')
      : (goal === 'lose_weight' ? 'Perder peso' : goal === 'gain_muscle' ? 'Ganhar massa muscular' : 'Manter peso')

    const restrictionsList = dietaryRestrictions?.length
      ? (isEnglish ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : `Restrições alimentares: ${dietaryRestrictions.join(', ')}`)
      : (isEnglish ? "No dietary restrictions" : "Sem restrições alimentares")

    const sleepInfo = sleepQuality
      ? (isEnglish ? `Sleep quality: ${sleepQuality}` : `Qualidade do sono: ${sleepQuality}`)
      : ""

    const stressInfo = stressLevel
      ? (isEnglish ? `Stress level: ${stressLevel}` : `Nível de estresse: ${stressLevel}`)
      : ""

    const activityInfo = activityLevel
      ? (isEnglish ? `Activity level: ${activityLevel}` : `Nível de atividade: ${activityLevel}`)
      : ""

    const prompt = isEnglish
      ? `Act as a clinical nutritionist and supplement expert. Recommend personalized supplements. All output must be in ${lang}.

USER DATA:
- Age: ${age} years
- Gender: ${genderLabel}
- Goal: ${goalLabel}
- ${restrictionsList}
- ${sleepInfo}
- ${stressInfo}
- ${activityInfo}

Return ONLY a valid JSON with this EXACT structure (no markdown):
{
  "supplements": [
    {
      "name": "Supplement name",
      "dosage": "Recommended dosage (e.g. 1000mg, 2 capsules)",
      "timing": "When to take (e.g. 'Morning with breakfast', 'Before bed')",
      "reason": "Why this supplement is recommended for this user",
      "priority": "essential" or "optional"
    }
  ]
}

Recommend 4-8 supplements based on the user's profile. Prioritize essentials. Consider dietary restrictions (e.g. don't recommend fish oil to vegans). Each recommendation must have a clear reason. The JSON must have ALL fields.`
      : `Atua como um nutricionista clínico e especialista em suplementos. Recomende suplementos personalizados. Toda a saída deve ser em ${lang}.

DADOS DO USUÁRIO:
- Idade: ${age} anos
- Gênero: ${genderLabel}
- Objetivo: ${goalLabel}
- ${restrictionsList}
- ${sleepInfo}
- ${stressInfo}
- ${activityInfo}

Retorne APENAS um JSON válido com esta estrutura EXATA (sem markdown):
{
  "supplements": [
    {
      "name": "Nome do suplemento",
      "dosage": "Dosagem recomendada (ex: 1000mg, 2 cápsulas)",
      "timing": "Quando tomar (ex: 'Manhã com café da manhã', 'Antes de dormir')",
      "reason": "Por que este suplemento é recomendado para este usuário",
      "priority": "essential" ou "optional"
    }
  ]
}

Recomende 4-8 suplementos com base no perfil do usuário. Priorize os essenciais. Considere restrições alimentares (ex: não recomende óleo de peixe para veganos). Cada recomendação deve ter um motivo claro. O JSON deve ter TODOS os campos.`

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
    console.error("Erro na rota recommend-supplements:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500, headers });
  }
}
