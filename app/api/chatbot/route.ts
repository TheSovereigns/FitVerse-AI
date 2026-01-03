import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from '@google/generative-ai';

// Validação da chave de API
if (!process.env.GEMINI_API_KEY) {
  throw new Error('A variável de ambiente GEMINI_API_KEY não está definida.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  // Usando o modelo gemini-1.5-flash, o mais recente e rápido disponível
  model: 'gemini-1.5-flash',
});

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

// Define um limite para o número de mensagens no histórico para evitar exceder o limite de tokens.
const MAX_HISTORY_LENGTH = 20; // Mantém as últimas 10 trocas de mensagens (usuário + modelo)

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
  try {
    const body = await req.json();
    // O frontend deve enviar a mensagem atual, o histórico da conversa e o plano do usuário
    const { message, history, userMetabolicPlan } = body;

    if (!message) {
      return NextResponse.json({ error: 'A mensagem não pode estar vazia.' }, { status: 400 });
    }

    // Constrói o prompt do sistema com o contexto do usuário
    const systemPrompt = `Você é o FitVerse AI, um assistente especializado EXCLUSIVAMENTE em fitness, nutrição, saúde, emagrecimento, academia e uso da plataforma FitVerse.
    
    Seu objetivo é fornecer conselhos seguros, motivadores e baseados em evidências dentro dessas áreas.
    
    REGRAS RÍGIDAS:
    1. Se o usuário perguntar sobre qualquer assunto que NÃO seja relacionado a saúde, fitness, nutrição, emagrecimento, academia ou sobre o site FitVerse, você deve recusar educadamente responder, dizendo que só pode ajudar com tópicos de saúde e fitness.
    2. NUNCA forneça conselhos médicos. Se a pergunta parecer de natureza médica (diagnóstico, tratamento de doenças, etc.), recomende ao usuário que consulte um profissional de saúde.
    3. Sempre que possível, personalize as respostas com base nos dados do usuário fornecidos abaixo.
    
    ${userMetabolicPlan ? `Aqui estão os dados do plano metabólico do usuário para contextualizar suas respostas: ${JSON.stringify(userMetabolicPlan, null, 2)}` : ''}
    `;

    // Limita o tamanho do histórico de chat para evitar exceder o limite de tokens
    const limitedHistory = (history || []).slice(-MAX_HISTORY_LENGTH);

    // Formata o histórico para a API do Gemini
    const chatHistory: Content[] = limitedHistory.map((msg: { role: 'user' | 'model'; parts: { text: string }[] }) => ({
      role: msg.role,
      parts: msg.parts.map(part => ({ text: part.text })),
    }));

    const chat = model.startChat({ generationConfig, safetySettings, history: chatHistory });
    const fullMessage = `${systemPrompt}\n\nPERGUNTA: ${message}`;
    
    // Inicia a geração de resposta em streaming
    const result = await chat.sendMessageStream(fullMessage);

    // Converte o stream do Gemini para um ReadableStream da Web API
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(encoder.encode(chunkText));
        }
        controller.close();
      },
    });

    // Retorna a resposta em streaming
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Erro na API do chatbot:', error);
    return NextResponse.json(
      { error: 'Falha ao se comunicar com a IA. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}