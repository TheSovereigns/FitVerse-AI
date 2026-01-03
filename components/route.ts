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
    const criteria = await req.json();

    // Simulação de resposta da IA para evitar erros
    const mockWorkout = {
      name: `Treino Simulado ${criteria.focus || 'Geral'}`,
      category: criteria.focus || 'Full Body',
      duration: criteria.duration || '60 min',
      calories: "400",
      difficulty: criteria.level || 'Intermediário',
      aiVerdict: "Este é um treino simulado gerado offline para garantir a funcionalidade. Para um plano real, conecte a API.",
      exercises: [
        { name: "Supino Reto", sets: "4", reps: "10", rest: "60s" },
        { name: "Agachamento Livre", sets: "4", reps: "12", rest: "90s" },
        { name: "Remada Curvada", sets: "3", reps: "12", rest: "60s" },
        { name: "Desenvolvimento Militar", sets: "3", reps: "10", rest: "60s" },
        { name: "Prancha", sets: "3", reps: "60s", rest: "45s" },
      ],
      criteria: criteria
    };

    return NextResponse.json({ workouts: [mockWorkout] }, { headers });

  } catch (error) {
    console.error('Erro ao gerar treino (simulado):', error);
    return NextResponse.json({ error: 'Erro ao gerar treino' }, { status: 500, headers });
  }
}