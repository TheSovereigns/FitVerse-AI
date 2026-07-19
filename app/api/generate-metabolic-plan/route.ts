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
      ? gender === "male"
        ? "Male"
        : "Female"
      : gender === "male"
        ? "Masculino"
        : "Feminino";

    const goalLabel = isEnglish
      ? goal === "lose_weight"
        ? "Lose weight"
        : goal === "gain_muscle"
          ? "Gain muscle mass"
          : "Maintain weight"
      : goal === "lose_weight"
        ? "Perder peso"
        : goal === "gain_muscle"
          ? "Ganhar massa muscular"
          : "Manter peso";

    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = bmr * getActivityMultiplier(activityLevel);
    const goalCalories =
      goal === "lose_weight" ? tdee - 500 : goal === "gain_muscle" ? tdee + 300 : tdee;

    const prompt = isEnglish
      ? `You are an elite sports nutritionist, biohacking expert, and metabolic optimization specialist. Create a comprehensive, personalized metabolic plan.

USER DATA:
- Weight: ${weight}kg
- Height: ${height}cm
- Age: ${age} years
- Gender: ${genderLabel}
- Activity Level: ${activityLevel}
- Goal: ${goalLabel}
- Calculated BMR (Mifflin-St Jeor): ${bmr.toFixed(0)} kcal/day
- Calculated TDEE: ${tdee.toFixed(0)} kcal/day
- Target Calories: ${goalCalories.toFixed(0)} kcal/day

TASKS:
1. Verify and refine the macro split based on the user's specific goal and training schedule.
2. Design a detailed daily meal plan with exact portions, meal names, food items, and approximate macros per meal.
3. The meal plan MUST include 4-6 meals (breakfast, mid-morning snack, lunch, pre-workout, post-workout, dinner). Each meal needs at least 3 specific food items with portion sizes.
4. Include a supplement stack with exact dosages and specific timing (e.g., "Creatine Monohydrate: 5g with post-workout shake").
5. Create a hydration protocol specifying total daily water intake and timing around meals/training.
6. Provide a sleep optimization protocol with 5 specific, evidence-based tips.
7. Provide a stress management protocol with 4 specific recommendations.
8. Create a detailed weekly progression plan with specific weekly adjustments for 12 weeks to ensure continuous progress.
9. All food recommendations must be practical and easy to prepare.

Return ONLY a valid JSON with this EXACT structure (no markdown, no extra text):
{
  "macros": {
    "calories": number,
    "protein": number (percentage),
    "proteinGrams": number,
    "carbs": number (percentage),
    "carbsGrams": number,
    "fat": number (percentage),
    "fatGrams": number
  },
  "bmrTdee": {
    "bmr": number,
    "tdee": number,
    "method": "Mifflin-St Jeor",
    "note": "Explanation of how TDEE was adjusted for the goal"
  },
  "diet": {
    "title": "Diet name",
    "summary": "Summary in 1-2 sentences explaining the nutritional strategy",
    "meals": [
      {
        "name": "Breakfast",
        "time": "7:00 AM",
        "items": ["100g oats with 200ml almond milk", "2 whole eggs + 3 egg whites scrambled", "100g Greek yogurt with 15g walnuts"],
        "macros": { "calories": number, "protein": number, "carbs": number, "fat": number }
      },
      {
        "name": "Lunch",
        "time": "12:30 PM",
        "items": ["200g grilled chicken breast", "150g brown rice", "200g mixed green vegetables with 10ml olive oil"],
        "macros": { "calories": number, "protein": number, "carbs": number, "fat": number }
      },
      {
        "name": "Snack",
        "time": "3:30 PM",
        "items": ["1 scoop whey protein with 200ml water", "1 medium banana", "20g almonds"],
        "macros": { "calories": number, "protein": number, "carbs": number, "fat": number }
      },
      {
        "name": "Dinner",
        "time": "7:00 PM",
        "items": ["200g salmon fillet", "200g sweet potato", "250g steamed broccoli with 5ml lemon juice"],
        "macros": { "calories": number, "protein": number, "carbs": number, "fat": number }
      }
    ]
  },
  "supplements": [
    {
      "name": "Creatine Monohydrate",
      "dosage": "5g",
      "timing": "Post-workout with shake or morning on rest days",
      "purpose": "Enhances ATP regeneration and muscle recovery"
    },
    {
      "name": "Whey Protein Isolate",
      "dosage": "25-30g",
      "timing": "Within 30 minutes post-workout",
      "purpose": "Fast-absorbing protein for muscle protein synthesis"
    },
    {
      "name": "Omega-3 Fish Oil",
      "dosage": "2-3g EPA/DHA",
      "timing": "With a fat-containing meal",
      "purpose": "Anti-inflammatory support and cardiovascular health"
    }
  ],
  "hydration": {
    "dailyTarget": "Number in liters (typically 3-4L for active individuals)",
    "protocol": [
      "Drink 500ml immediately upon waking",
      "Consume 250ml with each meal",
      "Drink 500-750ml during workout session",
      "Drink 500ml post-workout",
      "Remaining intake spread throughout the day"
    ],
    "tips": ["Add electrolytes on heavy training days", "Monitor urine color for hydration status"]
  },
  "sleepOptimization": [
    "Maintain consistent sleep and wake times (even weekends)",
    "Avoid screens 1 hour before bed (blue light disrupts melatonin)",
    "Keep bedroom temperature at 18-19°C (65°F)",
    "Avoid caffeine after 2:00 PM",
    "Consider magnesium glycinate (400mg) before bed"
  ],
  "stressManagement": [
    "Practice 10 minutes of daily meditation or deep breathing exercises",
    "Limit high-intensity training to 4-5 days per week to avoid overtraining",
    "Spend 20 minutes outdoors daily for natural cortisol regulation",
    "Maintain social connections and schedule regular downtime"
  ],
  "weeklyProgression": [
    {
      "week": "1-2",
      "focus": "Foundation",
      "adjustments": "Establish meal timing and portion consistency. Start at baseline calories.",
      "expectedOutcome": "Body adapts to new eating schedule, initial water weight changes."
    },
    {
      "week": "3-4",
      "focus": "Optimization",
      "adjustments": "Fine-tune carb timing around workouts. Increase protein by 10% if strength gains plateau.",
      "expectedOutcome": "Measurable body composition changes, improved energy during training."
    },
    {
      "week": "5-8",
      "focus": "Progressive Overload",
      "adjustments": "Adjust calories by ±200 based on progress. Rotate carb sources to prevent metabolic adaptation.",
      "expectedOutcome": "Consistent weekly progress, visible changes in muscle definition or fat loss."
    },
    {
      "week": "9-12",
      "focus": "Peak Phase",
      "adjustments": "Implement refeed days every 10-14 days. Consider diet breaks if fat loss stalls.",
      "expectedOutcome": "Sustained progress with minimized metabolic adaptation."
    }
  ],
  "prediction": {
    "weeks": number,
    "explanation": "Detailed explanation of expected timeline based on the specific goal and calculations"
  }
}

IMPORTANT RULES:
- All fields in the JSON structure MUST be present.
- Meal macros MUST sum approximately to the daily total.
- Protein must be at least 1.6g per kg bodyweight for muscle gain goals, or 2.0g per kg for weight loss goals to preserve lean mass.
- All numbers must be realistic and based on the provided TDEE calculations.
- Do NOT output any text outside the JSON object.`
      : `Você é um nutricionista esportivo de elite, especialista em biohacking e otimização metabólica. Crie um plano metabólico abrangente e personalizado.

DADOS DO USUÁRIO:
- Peso: ${weight}kg
- Altura: ${height}cm
- Idade: ${age} anos
- Gênero: ${genderLabel}
- Nível de atividade: ${activityLevel}
- Objetivo: ${goalLabel}
- BMR Calculado (Mifflin-St Jeor): ${bmr.toFixed(0)} kcal/dia
- TDEE Calculado: ${tdee.toFixed(0)} kcal/dia
- Calorias Alvo: ${goalCalories.toFixed(0)} kcal/dia

TAREFAS:
1. Verifique e refina a divisão de macros com base no objetivo específico e no treinamento do usuário.
2. Projete um plano de refeições diário detalhado com porções exatas, nomes das refeições, itens alimentares e macros aproximados por refeição.
3. O plano de refeições DEVE incluir 4-6 refeições (café da manhã, lanche da manhã, almoço, pré-treino, pós-treino, jantar). Cada refeição deve ter pelo menos 3 itens específicos com tamanhos de porção.
4. Inclua um protocolo de suplementação com dosagens exatas e timing específico (ex: "Creatina Monohidratada: 5g com shake pós-treino").
5. Crie um protocolo de hidratação especificando a ingestão total diária de água e o timing em torno das refeições/treinos.
6. Forneça um protocolo de otimização do sono com 5 dicas específicas baseadas em evidências.
7. Forneça um protocolo de gerenciamento de estresse com 4 recomendações específicas.
8. Crie um plano de progressão semanal detalhado com ajustes semanais específicos por 12 semanas para garantir progresso contínuo.
9. Todas as recomendações alimentares devem ser práticas e fáceis de preparar.

Retorne APENAS um JSON válido com esta estrutura EXATA (sem markdown, sem texto extra):
{
  "macros": {
    "calories": número,
    "protein": número (porcentagem),
    "proteinGrams": número,
    "carbs": número (porcentagem),
    "carbsGrams": número,
    "fat": número (porcentagem),
    "fatGrams": número
  },
  "bmrTdee": {
    "bmr": número,
    "tdee": número,
    "method": "Mifflin-St Jeor",
    "note": "Explicação de como o TDEE foi ajustado para o objetivo"
  },
  "diet": {
    "title": "Nome da dieta",
    "summary": "Resumo em 1-2 frases explicando a estratégia nutricional",
    "meals": [
      {
        "name": "Café da Manhã",
        "time": "7:00",
        "items": ["100g de aveia com 200ml de leite de amêndoa", "2 ovos inteiros + 3 claras mexidos", "100g de iogurte grego com 15g de nozes"],
        "macros": { "calories": número, "protein": número, "carbs": número, "fat": número }
      },
      {
        "name": "Almoço",
        "time": "12:30",
        "items": ["200g de peito de frango grelhado", "150g de arroz integral", "200g de vegetais verdes mistos com 10ml de azeite de oliva"],
        "macros": { "calories": número, "protein": número, "carbs": número, "fat": número }
      },
      {
        "name": "Lanche",
        "time": "15:30",
        "items": ["1 scoop de whey com 200ml de água", "1 banana média", "20g de amêndoas"],
        "macros": { "calories": número, "protein": número, "carbs": número, "fat": número }
      },
      {
        "name": "Jantar",
        "time": "19:00",
        "items": ["200g de filé de salmão", "200g de batata-doce", "250g de brócolis no vapor com 5ml de suco de limão"],
        "macros": { "calories": número, "protein": número, "carbs": número, "fat": número }
      }
    ]
  },
  "supplements": [
    {
      "name": "Creatina Monohidratada",
      "dosage": "5g",
      "timing": "Pós-treino com shake ou pela manhã nos dias de descanso",
      "purpose": "Aumenta a regeneração de ATP e a recuperação muscular"
    },
    {
      "name": "Whey Protein Isolado",
      "dosage": "25-30g",
      "timing": "Dentro de 30 minutos após o treino",
      "purpose": "Proteína de absorção rápida para síntese proteica muscular"
    },
    {
      "name": "Ômega-3 Óleo de Peixe",
      "dosage": "2-3g EPA/DHA",
      "timing": "Com uma refeição contendo gordura",
      "purpose": "Suporte anti-inflamatório e saúde cardiovascular"
    }
  ],
  "hydration": {
    "dailyTarget": "Número em litros (tipicamente 3-4L para indivíduos ativos)",
    "protocol": [
      "Beba 500ml imediatamente ao acordar",
      "Consuma 250ml com cada refeição",
      "Beba 500-750ml durante a sessão de treino",
      "Beba 500ml pós-treino",
      "A ingestão restante é distribuída ao longo do dia"
    ],
    "tips": ["Adicione eletrólitos nos dias de treino intenso", "Monitore a cor da urina para verificar o estado de hidratação"]
  },
  "sleepOptimization": [
    "Mantenha horários consistentes de sono e despertar (mesmo nos fins de semana)",
    "Evite telas 1 hora antes de dormir (a luz azul interrompe a melatonina)",
    "Mantenha a temperatura do quarto entre 18-19°C",
    "Evite cafeína após as 14:00",
    "Considere magnésio glicinato (400mg) antes de dormir"
  ],
  "stressManagement": [
    "Pratique 10 minutos de meditação diária ou exercícios de respiração profunda",
    "Limite o treino de alta intensidade a 4-5 dias por semana para evitar overtraining",
    "Passe 20 minutos ao ar livre diariamente para regulação natural do cortisol",
    "Mantenha conexões sociais e agende tempo regular de descanso"
  ],
  "weeklyProgression": [
    {
      "week": "1-2",
      "focus": "Fundação",
      "adjustments": "Estabeleça consistência no timing e porções das refeições. Comece com calorias baseline.",
      "expectedOutcome": "O corpo se adapta ao novo cronograma alimentar, mudanças iniciais de água."
    },
    {
      "week": "3-4",
      "focus": "Otimização",
      "adjustments": "Ajuste o timing dos carboidratos ao redor dos treinos. Aumente a proteína em 10% se os ganhos de força estagnarem.",
      "expectedOutcome": "Mudanças mensuráveis na composição corporal, energia melhorada durante o treino."
    },
    {
      "week": "5-8",
      "focus": "Sobrecarga Progressiva",
      "adjustments": "Ajuste as calorias em ±200 com base no progresso. Rote fontes de carboidratos para prevenir adaptação metabólica.",
      "expectedOutcome": "Progresso semanal consistente, mudanças visíveis na definição muscular ou perda de gordura."
    },
    {
      "week": "9-12",
      "focus": "Fase de Pico",
      "adjustments": "Implemente dias de recarga a cada 10-14 dias. Considere pausas na dieta se a perda de gordura estagnar.",
      "expectedOutcome": "Progresso sustentado com minimização da adaptação metabólica."
    }
  ],
  "prediction": {
    "weeks": número,
    "explanation": "Explicação detalhada do cronograma esperado com base no objetivo específico e nos cálculos"
  }
}

REGRAS IMPORTANTES:
- Todos os campos no JSON devem estar presentes.
- Os macros das refeições DEVEM somar aproximadamente ao total diário.
- A proteína deve ser de pelo menos 1,6g por kg de peso corporal para objetivos de ganho muscular, ou 2,0g por kg para objetivos de perda de peso para preservar massa magra.
- Todos os números devem ser realistas e baseados nos cálculos de TDEE fornecidos.
- NÃO produza nenhum texto fora do objeto JSON.`;

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
