import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder'))
  ? createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const model = genAI ? genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
}) : null;

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

const WORKOUT_KEYWORDS = ['treino', 'exercício', 'exercicio', 'série', 'serie', 'repetição', 'repeticao', 'musculação', 'musculacao', 'academia', 'peso', 'hipertrofia', 'workout', 'exercise', 'set', 'rep', 'gym', 'lifting', 'strength'];
const NUTRITION_KEYWORDS = ['dieta', 'caloria', 'proteína', 'proteina', 'refeição', 'refeicao', 'carboidrato', 'gordura', 'macro', 'nutrição', 'nutricao', 'comida', 'alimentação', 'alimentacao', 'vitamina', 'suplemento', 'whey', 'creatina', 'nutrition', 'diet', 'calorie', 'protein', 'meal', 'carb', 'fat', 'food', 'eat'];
const MOTIVATION_KEYWORDS = ['motivação', 'motivacao', 'desânimo', 'desanimo', 'cansado', 'preguiça', 'preguica', 'desistir', 'motivation', 'tired', 'lazy', 'give up', 'depressed', 'sad', 'ansioso', 'ansiedade', 'anxiety'];
const RECOVERY_KEYWORDS = ['dor', 'lesão', 'lesao', 'recuperação', 'recuperacao', 'descanso', 'alongamento', 'stretching', 'pain', 'injury', 'injured', 'sore', 'rest', 'sleep', 'sono', 'dormir', 'cãibra', 'caimbra', 'cramp', 'inflammation', 'inflamação', 'inflamacao'];
const SUPPLEMENT_KEYWORDS = ['suplemento', 'suplementação', 'suplementacao', 'creatina', 'whey', 'bcaa', 'beta-alanine', 'glutamina', 'multivitaminico', 'omega 3', 'pre-workout', 'supplement', 'creatine', 'vitamin', 'mineral'];

function detectCategory(message: string): { category: string; subcategory: string } {
  const lower = message.toLowerCase();
  if (SUPPLEMENT_KEYWORDS.some(kw => lower.includes(kw))) return { category: 'supplement', subcategory: 'general' };
  if (WORKOUT_KEYWORDS.some(kw => lower.includes(kw))) {
    if (lower.includes('peito') || lower.includes('chest')) return { category: 'workout', subcategory: 'chest_workout' };
    if (lower.includes('costa') || lower.includes('back')) return { category: 'workout', subcategory: 'back_workout' };
    if (lower.includes('perna') || lower.includes('leg') || lower.includes('quadríceps') || lower.includes('glúteo')) return { category: 'workout', subcategory: 'leg_workout' };
    if (lower.includes('ombro') || lower.includes('shoulder')) return { category: 'workout', subcategory: 'shoulder_workout' };
    if (lower.includes('braço') || lower.includes('bíceps') || lower.includes('tríceps') || lower.includes('arm')) return { category: 'workout', subcategory: 'arm_workout' };
    if (lower.includes('abdômen') || lower.includes('abdominal') || lower.includes('core')) return { category: 'workout', subcategory: 'core_workout' };
    return { category: 'workout', subcategory: 'general' };
  }
  if (NUTRITION_KEYWORDS.some(kw => lower.includes(kw))) {
    if (lower.includes('proteína') || lower.includes('protein')) return { category: 'nutrition', subcategory: 'protein_intake' };
    if (lower.includes('caloria') || lower.includes('calorie')) return { category: 'nutrition', subcategory: 'calorie_tracking' };
    if (lower.includes('receita') || lower.includes('recipe') || lower.includes('cozinhar') || lower.includes('cook')) return { category: 'nutrition', subcategory: 'recipes' };
    return { category: 'nutrition', subcategory: 'general' };
  }
  if (MOTIVATION_KEYWORDS.some(kw => lower.includes(kw))) return { category: 'motivation', subcategory: 'general' };
  if (RECOVERY_KEYWORDS.some(kw => lower.includes(kw))) {
    if (lower.includes('dor') || lower.includes('pain') || lower.includes('lesão') || lower.includes('injury')) return { category: 'recovery', subcategory: 'injury_pain' };
    if (lower.includes('sono') || lower.includes('sleep') || lower.includes('dormir') || lower.includes('rest') || lower.includes('descanso')) return { category: 'recovery', subcategory: 'sleep_rest' };
    return { category: 'recovery', subcategory: 'general' };
  }
  return { category: 'general', subcategory: 'general' };
}

function detectLanguage(text: string): 'pt' | 'en' {
  const ptWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'sem', 'que', 'e', 'ou', 'mas', 'como', 'não', 'sim', 'muito', 'mais', 'menos', 'é', 'são', 'foi', 'ser', 'estar', 'ter', 'fazer', 'poder', 'deve', 'precisa', 'quer', 'treino', 'dieta', 'exercício', 'academia', 'proteína', 'caloria', 'saúde'];
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let ptCount = 0;
  let enCount = 0;
  for (const word of words) {
    if (ptWords.includes(word)) ptCount++;
  }
  if (lower.includes(' the ') || lower.includes(' is ') || lower.includes(' are ') || lower.includes(' was ') || lower.includes(' were ') || lower.includes(' have ') || lower.includes(' has ') || lower.includes(' will ') || lower.includes(' would ') || lower.includes(' could ') || lower.includes(' should ')) {
    enCount += 2;
  }
  return ptCount >= enCount ? 'pt' : 'en';
}

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!apiKey || !model) {
    return NextResponse.json({ reply: "Erro: Chave de API do Gemini não configurada." }, { status: 500, headers });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase não configurado. Configure as chaves no .env.local.' }, { status: 500, headers });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400, headers });
    }

    const { message, history, userMetabolicPlan, userId, userContext } = body;

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

    if (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
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
    const savePromise = (async () => {
      try {
        let conversationId: string | null = null;

        if (userId) {
          const { data: existingConv } = await supabaseAdmin
            .from('ai_conversations')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (existingConv) {
            conversationId = existingConv.id;
          } else {
            const { data: newConv } = await supabaseAdmin
              .from('ai_conversations')
              .insert({ user_id: userId, session_id: crypto.randomUUID() })
              .select('id')
              .single();
            if (newConv) conversationId = newConv.id;
          }
        }

        if (conversationId) {
          const { data: inserted } = await supabaseAdmin
            .from('ai_messages')
            .insert({
              conversation_id: conversationId,
              user_id: userId,
              user_message: message,
              user_message_lang: userMessageLang,
              user_context: userContext || {},
              ai_response: reply,
              ai_response_lang: aiResponseLang,
              model_used: 'gemini-2.5-flash',
              tokens_used: tokensUsed,
              response_time_ms: responseTimeMs,
              category,
              subcategory,
              training_status: 'raw',
            })
            .select('id')
            .single();

          return inserted?.id ?? null;
        }
      } catch (error) {
        console.error('Failed to save AI message to dataset:', error);
      }
      return null;
    })();

    const messageId = await savePromise;

    return NextResponse.json({ reply, messageId, tokensUsed, responseTimeMs }, { headers });

  } catch (error) {
    console.error('Erro detalhado no chatbot:', error);
    return NextResponse.json({ error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` }, { status: 500, headers });
  }
}
