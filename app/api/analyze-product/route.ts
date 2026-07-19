import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { PLAN_LIMITS, type Plan } from '@/lib/plan-limits';
import { getCorsHeaders } from "@/lib/auth-helpers";

async function checkScanLimit(userId: string, plan: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return true;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('scans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  const planLimits = PLAN_LIMITS[(plan as Plan) || 'free'];
  const limit = typeof planLimits.scansPerDay === 'number' ? planLimits.scansPerDay : 999;
  return (count ?? 0) < limit;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: getCorsHeaders() });
}

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const model = genAI ? genAI.getGenerativeModel({
  model: 'gemini-3.5-flash',
}) : null;

export async function POST(req: Request) {
  const headers = getCorsHeaders();

  const rlKey = getRateLimitKey(req, "scan")
  const rl = checkRateLimit(rlKey, RATE_LIMITS.scan)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers })
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers });
  }

  const token = authHeader.replace('Bearer ', '');
  
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500, headers });
  }
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (!user || authError) {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 401, headers });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const userPlan = profile?.plan || 'free';
  const canProceed = await checkScanLimit(user.id, userPlan);

  if (!canProceed) {
    return NextResponse.json({ 
      error: 'Limite diário de scans atingido. Atualize para um plano superior.' 
    }, { status: 403, headers });
  }

  if (!apiKey || !model) {
    return NextResponse.json({ error: 'Chave de API do Gemini não configurada.' }, { status: 500, headers });
  }

  try {
    const body = await req.json();
    const { imageData, mimeType = "image/jpeg", locale = "pt-BR" } = body;

    if (!imageData) {
      return NextResponse.json({ error: 'Imagem não fornecida.' }, { status: 400, headers });
    }

    if (typeof mimeType !== "string" || !mimeType.startsWith("image/")) {
      return NextResponse.json({ error: 'Formato de imagem invalido.' }, { status: 400, headers });
    }

    const base64Data = imageData.includes('base64,') 
      ? imageData.split('base64,')[1] 
      : imageData;

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const testMode = false;
    
    if (testMode) {
      return NextResponse.json({
        productName: "Food Item",
        brand: "Generic",
        macros: { calories: 200, protein: 10, carbs: 25, fat: 8 },
        longevityScore: 75,
        positivePoints: ["Good protein source", "Contains vitamins"],
        negativePoints: ["Moderate sugar"],
        alerts: [{ title: "Sugar", description: "Contains moderate sugar" }],
        insights: [{ description: "Good for muscle building" }],
        benefits: {
          vitamins: ["Vitamina C"],
          minerals: ["Ferro"],
          proteins: ["Muscle building"],
          other: ["Fiber"]
        }
      }, { headers });
    }

    const prompt = isEnglish
      ? `Analyze this food or product image. Return a strict JSON (no markdown) with:
    - productName: product name
    - brand: brand or 'Generic'
    - macros: object with calories, protein, carbs, fat (approximate numbers)
    - longevityScore: score from 0 to 100 based on how healthy it is
    - positivePoints: array of strings with HEALTH BENEFITS
    - negativePoints: array of strings with health concerns
    - benefits: object with vitamins, minerals, proteins, other
    
    If it's not food, return error. All output must be in ${lang}.`
      : `Analise esta imagem de alimento ou produto. 
    Retorne um JSON estrito (sem markdown) com:
    - productName: nome do produto
    - brand: marca ou 'Genérico'
    - macros: objeto com calories, protein, carbs, fat (números aproximados)
    - longevityScore: nota de 0 a 100 baseada em quão saudável é
    - positivePoints: array de strings com BENEFÍCIOS ESPECÍFICOS PARA A SAÚDE
    - negativePoints: array de strings com preocupações de saúde
    - benefits: objeto com vitaminas, minerais, proteínas, outros
    
    Se não for alimento, retorne erro. Todo o saída deve ser em ${lang}.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ]);
    
    const response = await result.response;
    let text = response.text();
    
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      console.error('Resposta invalida da IA:', text);
      return NextResponse.json(
        { error: 'A IA retornou uma resposta invalida. Tente uma foto mais nitida do alimento ou rotulo.' },
        { status: 502, headers }
      );
    }

    if (analysis.error) {
      return NextResponse.json(
        { error: typeof analysis.error === 'string' ? analysis.error : 'A imagem nao parece ser um alimento.' },
        { status: 422, headers }
      );
    }

    if (!analysis.productName || typeof analysis.longevityScore !== 'number') {
      return NextResponse.json(
        { error: 'Nao foi possivel identificar o alimento. Tente uma foto mais clara.' },
        { status: 422, headers }
      );
    }

    const transformed = {
      ...analysis,
      alerts: analysis.negativePoints?.map((desc: string) => ({
        title: desc.split(' - ')[0] || desc,
        description: desc.split(' - ').slice(1).join(' - ') || desc
      })) || [],
      insights: analysis.positivePoints?.map((desc: string) => ({
        description: desc
      })) || []
    };

    await supabaseAdmin.from('scans').insert({
      user_id: user.id,
      product_name: analysis.productName,
      score: analysis.longevityScore,
      image_url: null,
    });

    return NextResponse.json(transformed, { headers });

  } catch (error) {
    console.error('Erro na análise de produto:', error);
    return NextResponse.json({ error: 'Falha ao analisar imagem.' }, { status: 500, headers });
  }
}
