import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from '@google/generative-ai';
import { getSupabaseAdmin, getCorsHeaders, authUser } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { detectCategory, detectLanguage } from '@/lib/chat-helpers';
import { createStreamingFallback } from '@/lib/ai-fallback';
import { isFeatureLocked, type Plan } from '@/lib/plan-limits';

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

const MAX_HISTORY_LENGTH = 10;

function buildSystemPrompt(category: string, userPlan: Record<string, unknown> | null): string {
  const lang = 'Responda na mesma língua da pergunta.'
  const plan = userPlan ? `\nDados do usuário: ${JSON.stringify(userPlan)}` : ''

  const categoryPrompts: Record<string, string> = {
    workout: `Coach VyseFit. Treinos: séries, reps, dicas práticas. Markdown. Tom motivador. ${lang}${plan}`,
    nutrition: `Nutricionista VyseFit. Dietas: refeições com macros. Tabelas Markdown. ${lang}${plan}`,
    motivation: `Coach VyseFit. Mensagens curtas e motivadoras. Max 5 linhas. ${lang}`,
    recovery: `Fisioterapeuta VyseFit. Exercícios seguros. Aviso: consulte profissional. ${lang}${plan}`,
    supplement: `Nutricionista VyseFit. Suplementação: dosagem, timing, eficácia. ${lang}${plan}`,
    general: `Coach VyseFit. Responda direto. Markdown. Máx 200 palavras. ${lang}${plan}`,
  }

  return categoryPrompts[category] || categoryPrompts.general
}

// GET: Load conversation history from Supabase
export async function GET(req: Request) {
  const headers = getCorsHeaders();
  const supabaseAdmin = getSupabaseAdmin();

  const auth = await authUser(req);
  if (!auth || !supabaseAdmin) {
    return NextResponse.json({ messages: [] }, { headers });
  }

  try {
    // Get the latest conversation and its messages
    const { data: conv } = await supabaseAdmin
      .from('ai_conversations')
      .select('id')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!conv) {
      return NextResponse.json({ messages: [] }, { headers });
    }

    const { data: msgs } = await supabaseAdmin
      .from('ai_messages')
      .select('user_message, ai_response, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
      .limit(50);

    const messages = (msgs || []).flatMap((m) => [
      { role: 'user', content: m.user_message, timestamp: m.created_at },
      { role: 'assistant', content: m.ai_response, timestamp: m.created_at },
    ]);

    return NextResponse.json({ messages }, { headers });
  } catch (error) {
    logger.error('[Chatbot] Failed to load history:', error);
    return NextResponse.json({ messages: [] }, { headers });
  }
}

// POST: Send message (streaming via SSE)
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

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400, headers });
    }

    const { message, history, userMetabolicPlan, userContext } = body;
    let authenticatedUserId: string | null = null;

    const auth = await authUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401, headers });
    }
    authenticatedUserId = auth.userId;

    const admin = getSupabaseAdmin()
    if (admin) {
      const { data: profile } = await admin.from("profiles").select("plan").eq("id", auth.userId).single()
      const plan = (profile?.plan as Plan) || "free"
      if (isFeatureLocked(plan, "aiCoach")) {
        return NextResponse.json({ error: "Recurso Pro/Premium. Faça upgrade." }, { status: 403, headers })
      }
    }

    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400, headers });
    }

    const { category } = detectCategory(message);
    let userPlan: Record<string, unknown> | null = null;
    try { userPlan = userMetabolicPlan ? JSON.parse(userMetabolicPlan) : null } catch { userPlan = null }
    const systemPrompt = buildSystemPrompt(category, userPlan);

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

    const stream = new ReadableStream({
      async start(controller) {
        let fullReply = '';

        const geminiStreamCall = () => chat.sendMessageStream(fullMessage).then((r) => r.stream);

        await createStreamingFallback({
          geminiStreamCall,
          prompt: fullMessage,
          systemPrompt,
          onChunk: (text) => {
            fullReply += text;
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
          },
          onError: (error) => {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error })}\n\n`));
            controller.close();
          },
          onDone: (responseTimeMs) => {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true, responseTimeMs })}\n\n`));
            controller.close();

            // Save to dataset — non-blocking
            if (supabaseAdmin && authenticatedUserId) {
              const userMessageLang = detectLanguage(message);
              const aiResponseLang = detectLanguage(fullReply);
              const { category, subcategory } = detectCategory(message);

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
                    await supabaseAdmin.from('ai_messages').insert({
                      conversation_id: conversationId,
                      user_id: authenticatedUserId,
                      user_message: message,
                      user_message_lang: userMessageLang,
                      user_context: userContext || {},
                      ai_response: fullReply,
                      ai_response_lang: aiResponseLang,
                      model_used: 'gemini-3.1-flash-lite',
                      tokens_used: null,
                      response_time_ms: responseTimeMs,
                      category,
                      subcategory,
                      training_status: 'raw',
                    });
                  }
                } catch (error) {
                  console.error('Failed to save AI message to dataset:', error);
                }
              })();
            }
          },
        });
      },
    });

    return new Response(stream, {
      headers: {
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Erro detalhado no chatbot:', error);
    return NextResponse.json({ error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` }, { status: 500, headers });
  }
}
