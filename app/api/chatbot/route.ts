import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from '@google/generative-ai';
import { getSupabaseAdmin, getCorsHeaders } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { detectCategory, detectLanguage } from '@/lib/chat-helpers';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: getCorsHeaders() });
}

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 0.95,
  maxOutputTokens: 500,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const MAX_HISTORY_LENGTH = 20;

export async function POST(req: Request) {
  const headers = getCorsHeaders();
  const supabaseAdmin = getSupabaseAdmin();

  const rlKey = getRateLimitKey(req, "chatbot")
  const rl = await checkRateLimit(rlKey, RATE_LIMITS.chatbot)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers })
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: "Erro: Chave de API do Gemini não configurada." }, { status: 500, headers });
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  logger.info('[Chatbot] Supabase admin configured:', !!supabaseAdmin);

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400, headers });
    }

    const { message, history, userMetabolicPlan, userContext } = body;
    let authenticatedUserId: string | null = null;

    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401, headers });
    }

    if (supabaseAdmin) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return NextResponse.json({ error: 'Token invalido.' }, { status: 401, headers });
      }
      authenticatedUserId = user.id;
    }

    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400, headers });
    }

    const systemPrompt = `Você é o motor de inteligência artificial do FitverseAI, um personal trainer e nutritionist digital de elite. Sua tarefa é gerar um plano de saúde altamente personalizado baseado nos dados do usuário.

Diretrizes de Resposta:

Estrutura Visual: Use Markdown rigoroso. Utilize tabelas para dietas e listas numeradas para treinos.

Tom de Voz: Motivador, profissional e técnico, mas acessível.

Seções Obrigatórias:

Resumo do Perfil: Uma análise rápida do IMC ou biotipo com base nos dados fornecidos.

Plano de Treino: Nome do exercício, séries, repetições e um breve 'dica do pro' para a execução.

Plano Alimentar: Dividido por refeições (Café, Almoço, Lanche, Jantar) com macros aproximados (Proteínas, Carbos, Gorduras).

Ajuste de Segurança: Adicione sempre um aviso de que os resultados devem ser validados por profissionais de saúde.

Restrições:

Se o usuário mencionou lesões, adapte os exercícios imediatamente.

Se o usuário for iniciante, foque em exercícios compostos e técnica.

${userMetabolicPlan ? `Contexto do usuário: ${JSON.stringify(userMetabolicPlan, null, 2)}` : ''}

Responda em português ou inglês conforme a pergunta.`;

    const limitedHistory = (history || []).slice(-MAX_HISTORY_LENGTH);

    const chatHistory: Content[] = limitedHistory.map((msg: Record<string, unknown>) => {
      let parts: Array<{ text: string }> = [];
      if (Array.isArray(msg.parts)) {
        parts = (msg.parts as Array<Record<string, unknown>>).map((part: Record<string, unknown>) => ({ text: (part.text as string) || '' }));
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

    if (chatHistory.length > 0 && chatHistory[0]?.role !== 'user') {
      chatHistory.shift();
    }

    const startTime = Date.now();
    const chat = model.startChat({ generationConfig, safetySettings, history: chatHistory });
    const fullMessage = `${systemPrompt}

PERGUNTA: ${message}`;
    
    const result = await chat.sendMessage(fullMessage);
    const response = result.response;
    const reply = response.text();
    const responseTimeMs = Date.now() - startTime;

    const usageMetadata = response.usageMetadata;
    const tokensUsed = usageMetadata ? usageMetadata.totalTokenCount : null;

    const userMessageLang = detectLanguage(message);
    const aiResponseLang = detectLanguage(reply);
    const { category, subcategory } = detectCategory(message);

    // Save to dataset — non-blocking, never break the chat
    if (supabaseAdmin && authenticatedUserId) {
      (async () => {
        try {
          let conversationId: string | null = null;

          const { data: existingConv } = await supabaseAdmin
            .from('ai_conversations')
            .select('id')
            .eq('user_id', authenticatedUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (existingConv) {
            conversationId = existingConv.id;
          } else {
            const { data: newConv } = await supabaseAdmin
              .from('ai_conversations')
              .insert({ user_id: authenticatedUserId, session_id: crypto.randomUUID() })
              .select('id')
              .single();
            if (newConv) conversationId = newConv.id;
          }

          if (conversationId) {
            await supabaseAdmin
              .from('ai_messages')
              .insert({
                conversation_id: conversationId,
                user_id: authenticatedUserId,
                user_message: message,
                user_message_lang: userMessageLang,
                user_context: userContext || {},
                ai_response: reply,
                ai_response_lang: aiResponseLang,
                model_used: 'gemini-3.1-flash-lite',
                tokens_used: tokensUsed,
                response_time_ms: responseTimeMs,
                category,
                subcategory,
                training_status: 'raw',
              })
          }
        } catch (error) {
          console.error('Failed to save AI message to dataset:', error);
        }
      })();
    }

    return NextResponse.json({ reply, tokensUsed, responseTimeMs }, { headers });

  } catch (error) {
    console.error('Erro detalhado no chatbot:', error);
    return NextResponse.json({ error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` }, { status: 500, headers });
  }
}
