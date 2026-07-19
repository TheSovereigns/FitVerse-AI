import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCorsHeaders } from "@/lib/auth-helpers";

const MAX_RETRIES = 3;

function cleanJson(text: string): string {
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

function getActivityMultiplier(level: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return multipliers[level] || 1.55;
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

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500, headers });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: { temperature: 0.6, responseMimeType: "application/json" },
    });

    const body = await req.json();
    const { weight, height, age, gender, activityLevel, goal, locale = "pt-BR" } = body;

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

    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = bmr * getActivityMultiplier(activityLevel);
    const goalCalories =
      goal === "lose_weight" ? tdee - 500 : goal === "gain_muscle" ? tdee + 300 : tdee;

    const prompt = isEnglish
      ? `Create a personalized metabolic plan. Output in ${lang}.

USER: ${weight}kg, ${height}cm, ${age}y, ${genderLabel}, activity: ${activityLevel}, goal: ${goalLabel}.
BMR: ${bmr.toFixed(0)} kcal/day, TDEE: ${tdee.toFixed(0)} kcal/day, Target: ${goalCalories.toFixed(0)} kcal/day.

TASKS:
1. Refine macro split based on goal. Target: protein ${goal === "lose_weight" ? "≥2.0g/kg" : goal === "gain_muscle" ? "≥1.6g/kg" : "1.4-1.8g/kg"}.
2. Design 4-6 meals/day (breakfast, snack, lunch, pre-workout, post-workout, dinner) with 3+ items each, portions, and macros per meal.
3. Supplement stack with dosages and timing (e.g. "Creatine: 5g post-workout").
4. Hydration protocol: total daily water + timing.
5. Sleep optimization: 5 evidence-based tips.
6. Stress management: 4 recommendations.
7. 12-week progressive plan with weekly adjustments.
8. All food must be practical and easy to prepare.

Return ONLY valid JSON:
{
  "macros": {"calories": number, "protein": number (pct), "proteinGrams": number, "carbs": number (pct), "carbsGrams": number, "fat": number (pct), "fatGrams": number},
  "bmrTdee": {"bmr": number, "tdee": number, "method": "Mifflin-St Jeor", "note": string},
  "diet": {
    "title": string,
    "summary": string,
    "meals": [{"name": string, "time": string, "items": ["Food — portion"], "macros": {"calories": number, "protein": number, "carbs": number, "fat": number}}]
  },
  "supplements": [{"name": string, "dosage": string, "timing": string, "purpose": string}],
  "hydration": {"dailyTarget": string, "protocol": [string], "tips": [string]},
  "sleepOptimization": [string],
  "stressManagement": [string],
  "weeklyProgression": [{"week": string, "focus": string, "adjustments": string, "expectedOutcome": string}],
  "prediction": {"weeks": number, "explanation": string}
}

Rules: All fields mandatory. Meal macros sum to daily total. Protein ≥1.6g/kg (gain) or ≥2.0g/kg (loss). No text outside JSON.`
      : `Crie um plano metabólico personalizado. Saída em ${lang}.

USUÁRIO: ${weight}kg, ${height}cm, ${age}a, ${genderLabel}, atividade: ${activityLevel}, objetivo: ${goalLabel}.
BMR: ${bmr.toFixed(0)} kcal/dia, TDEE: ${tdee.toFixed(0)} kcal/dia, Alvo: ${goalCalories.toFixed(0)} kcal/dia.

TAREFAS:
1. Refine macros conforme objetivo. Meta: proteína ${goal === "lose_weight" ? "≥2,0g/kg" : goal === "gain_muscle" ? "≥1,6g/kg" : "1,4-1,8g/kg"}.
2. Projete 4-6 refeições/dia (café da manhã, lanche, almoço, pré-treino, pós-treino, jantar) com 3+ itens cada, porções e macros.
3. Stack de suplementos com dosagens e timing (ex: "Creatina: 5g pós-treino").
4. Protocolo de hidratação: ingestão total + timing.
5. Otimização do sono: 5 dicas baseadas em evidências.
6. Gerenciamento de estresse: 4 recomendações.
7. Plano progressivo de 12 semanas com ajustes semanais.
8. Comida prática e fácil de preparar.

Retorne APENAS JSON válido:
{
  "macros": {"calories": número, "protein": número (pct), "proteinGrams": número, "carbs": número (pct), "carbsGrams": número, "fat": número (pct), "fatGrams": número},
  "bmrTdee": {"bmr": número, "tdee": número, "method": "Mifflin-St Jeor", "note": string},
  "diet": {
    "title": string,
    "summary": string,
    "meals": [{"name": string, "time": string, "items": ["Alimento — porção"], "macros": {"calories": número, "protein": número, "carbs": número, "fat": número}}]
  },
  "supplements": [{"name": string, "dosage": string, "timing": string, "purpose": string}],
  "hydration": {"dailyTarget": string, "protocol": [string], "tips": [string]},
  "sleepOptimization": [string],
  "stressManagement": [string],
  "weeklyProgression": [{"week": string, "focus": string, "adjustments": string, "expectedOutcome": string}],
  "prediction": {"weeks": número, "explanation": string}
}

Regras: Todos campos obrigatórios. Macros das refeições somam ao total diário. Proteína ≥1,6g/kg (ganho) ou ≥2,0g/kg (perda). Sem texto fora do JSON.`;

    let lastError: string = "";

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedText = cleanJson(responseText);
        const data = JSON.parse(cleanedText);

        if (!data.macros || !data.diet || !data.prediction) {
          throw new Error("Incomplete JSON structure from AI");
        }

        return NextResponse.json(data, { headers });
      } catch (parseError: any) {
        lastError = parseError.message || "JSON parse failed";
        console.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, lastError);

        if (attempt === MAX_RETRIES) {
          return NextResponse.json(
            { error: "A IA retornou um formato inválido após várias tentativas." },
            { status: 500, headers }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "A IA retornou um formato inválido." },
      { status: 500, headers }
    );
  } catch (error: any) {
    console.error("Erro na rota generate-metabolic-plan:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500, headers }
    );
  }
}
