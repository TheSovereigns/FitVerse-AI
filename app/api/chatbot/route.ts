import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

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
    if (!weight || !height || !age || !gender) {
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

    return NextResponse.json({
      macros: {
        calories: Math.round(tdee),
        proteinGrams: Math.round(protein),
        carbsGrams: Math.round(carbs),
        fatGrams: Math.round(fat),
      },
      diet: {
        title: "Plano Sugerido",
        meals: [
          { name: "Café da Manhã", calories: Math.round(tdee * 0.25), description: "Sugestão baseada nos seus macros." },
          { name: "Almoço", calories: Math.round(tdee * 0.35), description: "Refeição balanceada com proteínas e carboidratos." },
          { name: "Jantar", calories: Math.round(tdee * 0.25), description: "Opção mais leve para a noite." },
          { name: "Lanche", calories: Math.round(tdee * 0.15), description: "Snack rápido para manter a energia." }
        ]
      }
    }, { headers });
  } catch (error) {
    console.error('Erro ao gerar plano:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500, headers });
  }
}