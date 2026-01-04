import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Tipos para o perfil do usuário e o plano metabólico
interface BioPerfil {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_weight' | 'maintain' | 'gain_muscle';
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as BioPerfil;

    // Log de acesso para o Aplicativo/Site
    console.log("Solicitação de plano metabólico recebida via Aplicativo/Site.");

    // Validação básica dos dados recebidos
    if (!body.age || !body.gender || !body.weight || !body.height || !body.goal || !body.activityLevel) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    // Inicializa o Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY não configurada.");
      return NextResponse.json({ error: 'Configuração de API ausente.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Correção: Alterado para o modelo correto e adicionado o modo de resposta JSON
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Atue como um nutricionista esportivo de elite. Crie um plano metabólico e de dieta personalizado em JSON (Português do Brasil) para este perfil:
      - Peso: ${body.weight}kg
      - Altura: ${body.height}cm
      - Idade: ${body.age} anos
      - Gênero: ${body.gender}
      - Nível de Atividade: ${body.activityLevel}
      - Objetivo: ${body.goal}

      Retorne APENAS um objeto JSON válido (sem markdown, sem blocos de código) seguindo estritamente esta estrutura:
      {
        "macros": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "proteinGrams": 0, "carbsGrams": 0, "fatGrams": 0 },
        "diet": {
          "title": "Nome criativo do plano",
          "summary": "Resumo motivacional de 1 frase",
          "meals": [ { "name": "Nome da Refeição (ex: Café da Manhã)", "items": ["Item 1 com quantidade", "Item 2 com quantidade"] } ]
        },
        "prediction": {
          "weeks": 0,
          "explanation": "Explicação breve da previsão de resultados",
          "macroTips": ["Dica prática 1", "Dica prática 2"]
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpa a resposta caso a IA inclua blocos de código markdown (```json ... ```)
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let plan;
    try {
      plan = JSON.parse(cleanedText);
    } catch (jsonError) {
      console.error("Erro ao parsear JSON do Gemini:", cleanedText);
      // Lança um erro mais específico que será pego pelo catch principal
      throw new Error("A resposta da IA não retornou um JSON válido.");
    }

    return NextResponse.json(plan, { status: 200 });

  } catch (error: any) {
    console.error("Erro na rota /api/generate-metabolic-plan:", error);
    // Melhoria: Retorna uma mensagem de erro mais detalhada em ambiente de desenvolvimento.
    const errorMessage = process.env.NODE_ENV === 'development' 
        ? error.message || 'Ocorreu um erro desconhecido.'
        : 'Erro interno do servidor.';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}