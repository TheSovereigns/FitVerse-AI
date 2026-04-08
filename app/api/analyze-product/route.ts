import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const PLAN_LIMITS = {
  free: { scansPerDay: 5 },
  pro: { scansPerDay: 50 },
  premium: { scansPerDay: Infinity },
};

async function checkScanLimit(userId: string, plan: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase!
    .from('scans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.scansPerDay ?? 5;
  return (count ?? 0) < limit;
}

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
  model: 'gemini-2.5-flash',
}) : null;

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase!.auth.getUser(token);

  if (!user || authError) {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 401, headers });
  }

  const { data: profile } = await supabase!
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
    const { imageData, locale = "pt-BR" } = body;

    if (!imageData) {
      return NextResponse.json({ error: 'Imagem não fornecida.' }, { status: 400, headers });
    }

    const base64Data = imageData.includes('base64,') 
      ? imageData.split('base64,')[1] 
      : imageData;

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const prompt = isEnglish
      ? `Analyze this food or product image. Return a strict JSON (no markdown) with:
    - productName: product name
    - brand: brand or 'Generic'
    - macros: object with calories, protein, carbs, fat (approximate numbers)
    - longevityScore: score from 0 to 100 based on how healthy it is
    - positivePoints: array of strings with HEALTH BENEFITS (e.g., "Rich in iron - helps with blood oxygen transport", "High in protein - good for muscle building", "Contains vitamin C - boosts immune system", "Good source of fiber - aids digestion")
    - negativePoints: array of strings (e.g., "High sugar content", "Processed ingredients", "High sodium")
    - benefits: object with specific health benefits:
      - vitamins: array of vitamins found (e.g., "Vitamin A - good for vision", "Vitamin C - immune system", "Vitamin D - bone health")
      - minerals: array of minerals (e.g., "Iron - blood health", "Calcium - bones", "Magnesium - muscle function", "Zinc - immunity")
      - proteins: what the protein helps with (e.g., "Muscle building and repair", "Hair and nail health")
      - other: other health benefits (e.g., "Fiber - digestive health", "Antioxidants - cell protection", "Omega-3 - brain health")
    
    If it's not food, return error. All output must be in ${lang}.`
      : `Analise esta imagem de alimento ou produto. 
    Retorne um JSON estrito (sem markdown) com:
    - productName: nome do produto
    - brand: marca ou 'Genérico'
    - macros: objeto com calories, protein, carbs, fat (números aproximados)
    - longevityScore: nota de 0 a 100 baseada em quão saudável é
    - positivePoints: array de strings com BENEFÍCIOS ESPECÍFICOS PARA A SAÚDE (ex: "Rico em ferro - ajuda no transporte de oxigênio no sangue", "Alto teor de proteína - bom para construção muscular", "Contém vitamina C - fortalece o sistema imunológico", "Boa fonte de fibra - auxilia na digestão")
    - negativePoints: array de strings (ex: "Alto teor de açúcar", "Ingredientes processados", "Alto teor de sódio")
    - benefits: objeto com benefícios específicos para a saúde:
      - vitamins: array de vitaminas encontradas (ex: "Vitamina A - boa para a visão", "Vitamina C - sistema imunológico", "Vitamina D - saúde óssea")
      - minerals: array de minerais (ex: "Ferro - saúde do sangue", "Cálcio - ossos", "Magnésio - função muscular", "Zinco - imunidade")
      - proteins: para que a proteína serve (ex: "Construção e reparo muscular", "Saúde de cabelos e unhas")
      - other: outros benefícios (ex: "Fibra - saúde digestiva", "Antioxidantes - proteção celular", "Ômega-3 - saúde cerebral")
    
    Se não for alimento, retorne erro. Todo o saída deve ser em ${lang}.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    let text = response.text();
    
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analysis = JSON.parse(text);

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

    await supabase!.from('scans').insert({
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
