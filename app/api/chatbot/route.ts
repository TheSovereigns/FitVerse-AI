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

const model = genAI ? genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
}) : null;

export async function POST(req: Request) {
  const headers = {
    'Access-control-allow-origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!apiKey || !model) {
    return NextResponse.json({ error: 'Chave de API do Gemini não configurada.' }, { status: 500, headers });
  }

  try {
    const criteria = await req.json();

    const prompt = `
      Crie um plano de treino baseado nos seguintes critérios:
      - Foco: ${criteria.focus}
      - Nível: ${criteria.level}
      - Duração: ${criteria.duration}
      - Local: ${criteria.location}
      - Objetivo do usuário: ${criteria.goal}

      Retorne um array JSON chamado "workouts" contendo um único objeto de treino.
      O objeto de treino deve ter a seguinte estrutura:
      {
        "name": "Nome do Treino (ex: Hipertrofia de Peito e Tríceps)",
        "category": "${criteria.focus}",
        "duration": "${criteria.duration}",
        "calories": "Estimativa de calorias queimadas (ex: 350-500)",
        "difficulty": "${criteria.level}",
        "aiVerdict": "Um breve veredito da IA sobre o treino, em português.",
        "exercises": [
          { "name": "Nome do Exercício 1", "sets": "3", "reps": "10-12", "rest": "60s" },
          { "name": "Nome do Exercício 2", "sets": "4", "reps": "8-10", "rest": "90s" }
        ]
      }
      Gere de 5 a 7 exercícios. O JSON deve ser estrito, sem markdown.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpeza de markdown se houver
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const workoutPlan = JSON.parse(text);

    return NextResponse.json(workoutPlan, { headers });

  } catch (error) {
    console.error('Erro ao gerar treino com IA:', error);
    return NextResponse.json({ error: 'Falha ao gerar treino com a IA.' }, { status: 500, headers });
  }
}