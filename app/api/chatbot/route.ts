import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from '@google/generative-ai';

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

const generationConfig = {
  temperature: 0.8,
  topK: 1,
  topP: 0.95,
  maxOutputTokens: 2048,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const MAX_HISTORY_LENGTH = 20;

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!apiKey || !model) {
    return NextResponse.json({ reply: "Erro: Chave de API do Gemini não configurada." }, { status: 500, headers });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400, headers });
    }

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

    const limitedHistory = (history || []).slice(-MAX_HISTORY_LENGTH);

    // Mapeamento robusto do histórico para evitar erros de formato
    const chatHistory: Content[] = limitedHistory.map((msg: any) => {
      let parts = [];
      if (Array.isArray(msg.parts)) {
        parts = msg.parts.map((part: any) => ({ text: part.text || '' }));
      } else if (typeof msg.parts === 'string') {
        parts = [{ text: msg.parts }];
      } else {
        parts = [{ text: '' }];
      }
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: parts,
      };
    });

    const chat = model.startChat({ generationConfig, safetySettings, history: chatHistory });
    const fullMessage = `${systemPrompt}\n\nPERGUNTA: ${message}`;
    
    const result = await chat.sendMessage(fullMessage);
    const response = result.response;
    const reply = response.text();

    return NextResponse.json({ reply }, { headers });

  } catch (error) {
    console.error('Erro detalhado no chatbot:', error);
    return NextResponse.json({ error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` }, { status: 500, headers });
  }
}