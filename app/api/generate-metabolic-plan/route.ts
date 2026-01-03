import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400, headers });
    }

    const { weight, height, age, gender, goal, activityLevel } = body;

    // Validação básica
    if (!weight || !height || !age || !gender || !goal || !activityLevel) {
      return NextResponse.json(
        { error: 'Dados incompletos para cálculo.' },
        { status: 400, headers }
      );
    }

    // Cálculo TMB (Taxa Metabólica Basal) - Fórmula de Harris-Benedict Revisada
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * Number(weight)) + (4.799 * Number(height)) - (5.677 * Number(age));
    } else {
      bmr = 447.593 + (9.247 * Number(weight)) + (3.098 * Number(height)) - (4.330 * Number(age));
    }

    // Fator de atividade
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    const multiplier = activityMultipliers[activityLevel] || 1.2;
    let tdee = bmr * multiplier;

    // Ajuste pelo objetivo
    if (goal === 'lose_weight') tdee -= 500;
    else if (goal === 'gain_muscle') tdee += 300;

    // Distribuição de Macros (Exemplo: 30% P / 40% C / 30% G)
    const protein = (tdee * 0.3) / 4;
    const carbs = (tdee * 0.4) / 4;
    const fat = (tdee * 0.3) / 9;

    let dietPlan = {
      title: "Plano Básico Calculado",
      meals: [
        { name: "Café da Manhã", calories: Math.round(tdee * 0.25), description: "Opção balanceada com proteínas e fibras." },
        { name: "Almoço", calories: Math.round(tdee * 0.35), description: "Carboidratos complexos, vegetais e proteína magra." },
        { name: "Lanche", calories: Math.round(tdee * 0.15), description: "Fruta ou oleaginosas." },
        { name: "Jantar", calories: Math.round(tdee * 0.25), description: "Refeição leve com foco em proteínas." }
      ]
    };

    // Tenta enriquecer o plano com IA se disponível
    if (model) {
      try {
        const prompt = `Atue como um nutricionista esportivo de elite. Crie um plano alimentar diário detalhado e profissional para um paciente com as seguintes necessidades calóricas e de macronutrientes calculadas:
        
        - Calorias Totais: ${Math.round(tdee)} kcal
        - Proteína: ${Math.round(protein)}g
        - Carboidratos: ${Math.round(carbs)}g
        - Gordura: ${Math.round(fat)}g
        - Objetivo: ${goal === 'lose_weight' ? 'Perder gordura corporal' : 'Ganhar massa muscular magra'}
        
        Diretrizes do Plano:
        1. Priorize alimentos naturais, densos em nutrientes e de alto valor biológico.
        2. Distribua os macronutrientes estrategicamente ao longo do dia para otimizar energia e recuperação.
        3. Inclua descrições apetitosas e instruções breves de preparo.
        4. Mantenha um tom profissional, motivador e prescritivo.
        
        Retorne APENAS um JSON estrito com a seguinte estrutura (sem markdown, sem explicações adicionais):
        {
          "title": "Nome Profissional do Protocolo (ex: Protocolo de Hipertrofia Metabólica)",
          "meals": [
            { "name": "Desjejum", "calories": 0, "description": "Descrição detalhada dos alimentos e quantidades (ex: 3 ovos inteiros mexidos com espinafre...)" },
            { "name": "Almoço", "calories": 0, "description": "Descrição detalhada" },
            { "name": "Lanche da Tarde", "calories": 0, "description": "Descrição detalhada" },
            { "name": "Jantar", "calories": 0, "description": "Descrição detalhada" }
          ]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        dietPlan = JSON.parse(text);
      } catch (aiError) {
        console.error("Erro ao gerar dieta com IA (usando fallback):", aiError);
      }
    }

    const plan = {
      macros: {
        calories: Math.round(tdee),
        proteinGrams: Math.round(protein),
        carbsGrams: Math.round(carbs),
        fatGrams: Math.round(fat),
      },
      diet: dietPlan
    };

    return NextResponse.json(plan, { headers });
  } catch (error) {
    console.error('Erro ao gerar plano:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500, headers });
  }
}