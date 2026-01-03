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
    const body = await req.json();
    const { message, history, userMetabolicPlan } = body;

    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400, headers });
    }

    const systemPrompt = `Você é o FitVerse AI, um assistente especializado EXCLUSIVAMENTE em fitness, nutrição, saúde, emagrecimento, academia e uso da plataforma FitVerse.
    
    Seu objetivo é fornecer conselhos seguros, motivadores e baseados em evidências dentro dessas áreas.
    
    REGRAS RÍGIDAS:
    1. Se o usuário perguntar sobre qualquer assunto que NÃO seja relacionado a saúde, fitness, nutrição, emagrecimento, academia ou sobre o site FitVerse, você deve recusar educadamente responder, dizendo que só pode ajudar com tópicos de saúde e fitness.
    2. NUNCA forneça conselhos médicos. Se a pergunta parecer de natureza médica (diagnóstico, tratamento de doenças, etc.), recomende ao usuário que consulte um profissional de saúde.
    3. Sempre que possível, personalize as respostas com base nos dados do usuário fornecidos abaixo.
    
    ${userMetabolicPlan ? `Aqui estão os dados do plano metabólico do usuário para contextualizar suas respostas: ${JSON.stringify(userMetabolicPlan, null, 2)}` : ''}
    `;

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(`${systemPrompt}\n\nUser: ${message}`);
    const response = await result.response;
    const reply = response.text();

    return NextResponse.json({ reply }, { headers });
  } catch (error) {
    console.error('Erro no chatbot:', error);
    return NextResponse.json({ error: 'Falha ao processar mensagem.' }, { status: 500, headers });
  }
}