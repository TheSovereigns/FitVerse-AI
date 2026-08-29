import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-helpers';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { PLAN_LIMITS, type Plan } from '@/lib/plan-limits';
import { getCorsHeaders } from "@/lib/auth-helpers";
import { getCached, setCached, hashImage } from "@/lib/ai-cache";

// JS fallback limit check (non-atomic). Reads count then checks - vulnerable to race
// under concurrent requests. For strict atomicity, use the DB function from
// supabase/atomic-plan-limits.sql (idempotent, CREATE OR REPLACE):
//   const { data: allowed } = await supabaseAdmin.rpc('check_and_increment_scan', { p_user_id: auth.userId });
//   if (allowed === false) return 403; // limit reached
// Keep this JS check as fallback for free tier when DB function is not deployed;
// for premium/pro strict enforcement, prefer the RPC above.
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

function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || null;
}

function getGroqApiKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

function isRetryableError(status: number): boolean {
  return status === 503 || status === 502 || status === 429;
}

async function callGemini(imageBase64: string, mimeType: string, prompt: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: imageBase64 } },
            ],
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[analyze-product] Gemini API error ${res.status}:`, errBody);
      throw new Error(`Gemini API returned ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('[analyze-product] No text in Gemini response:', JSON.stringify(data).slice(0, 500));
      throw new Error('Empty response from Gemini');
    }
    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function callGroqVision(imageBase64: string, mimeType: string, prompt: string, apiKey: string): Promise<string> {
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.2-90b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[analyze-product] Groq API error ${res.status}:`, errBody);
    throw new Error(`Groq API returned ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq');
  return text;
}

function buildPrompt(lang: string, metabolicPlan?: string) {
  const plan = metabolicPlan ? ` User plan: ${metabolicPlan}` : '';

  if (lang === "English") {
    return `Nutritionist: analyze this food image. Return STRICT JSON only:
{"productName":"","brand":"","category":"beverage|dairy|meat|seafood|grain|vegetable|fruit|snack|condiment|supplement|processed|ready-meal|dessert|other","servingSize":"","macros":{"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0},"micros":{"vitamins":["Vitamin X - Xmg"],"minerals":["Mineral X - Xmg"]},"ingredients":[""],"ingredientDetails":[{"name":"","estimatedGrams":0,"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0}],"allergens":["gluten","dairy","soy","nuts","eggs"]|[],"novaClassification":{"group":1-4,"label":"Unprocessed|Culinary|Processed|Ultra-processed","description":""},"glycemicIndex":{"value":null,"category":"Low|Medium|High|null","note":""},"healthScore":{"overall":0-100,"nutrientDensity":0-100,"processingLevel":0-100,"additiveRisk":0-100},"positivePoints":[""],"negativePoints":[""],"alerts":[{"title":"","description":"","severity":"high|medium|low"}],"fitnessAlignment":[{"goal":"Muscle Gain|Fat Loss|Endurance|General Health","suitability":"Excellent|Good|Neutral|Poor","justification":""}],"recommendations":{"bestFor":"","avoidIf":"","alternatives":""},"aiConfidence":0-100}
Rules: read label if visible. Estimate per serving or 100g. ingredientDetails = each visible food item. NOVA 1-4 scale. If not food: {"error":"Not food product."}${plan}`;
  }

  return `Nutricionista: analise esta imagem de alimento. Retorne APENAS JSON:
{"productName":"","brand":"","category":"bebida|laticínio|carne|frutos do mar|grão|vegetal|fruta|snack|condimento|suplemento|processado|refeição pronta|sobremesa|outro","servingSize":"","macros":{"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0},"micros":{"vitamins":["Vitamina X - Xmg"],"minerals":["Mineral X - Xmg"]},"ingredients":[""],"ingredientDetails":[{"name":"","estimatedGrams":0,"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0}],"allergens":["glúten","lacticínios","soja","nozes","ovos"]|[],"novaClassification":{"group":1-4,"label":"Não processado|Culinary|Processado|Ultra-processado","description":""},"glycemicIndex":{"value":null,"category":"Baixo|Médio|Alto|null","note":""},"healthScore":{"overall":0-100,"nutrientDensity":0-100,"processingLevel":0-100,"additiveRisk":0-100},"positivePoints":[""],"negativePoints":[""],"alerts":[{"title":"","description":"","severity":"high|medium|low"}],"fitnessAlignment":[{"goal":"Ganho Muscular|Perda de Gordura|Resistência|Saúde Geral","suitability":"Excelente|Bom|Neutro|Ruim","justification":""}],"recommendations":{"bestFor":"","avoidIf":"","alternatives":""},"aiConfidence":0-100}
Regras: leia rótulo se visível. Estime por porção ou 100g. ingredientDetails = cada item visível. NOVA 1-4. Se não for alimento: {"error":"Não é produto alimentício."}${plan}`;
}

async function parseAIResponse(text: string) {
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

  // Extract JSON by finding matching braces (non-greedy approach)
  const startIdx = cleaned.indexOf('{');
  if (startIdx === -1) {
    throw new Error('No JSON object found in response');
  }

  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++;
    else if (cleaned[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx === -1) {
    // Fallback: try greedy regex
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in response');
    cleaned = jsonMatch[0];
  } else {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  // Fix common JSON issues from AI responses
  cleaned = cleaned
    .replace(/,\s*}/g, '}')       // trailing commas
    .replace(/,\s*]/g, ']')       // trailing commas in arrays
    .replace(/'/g, '"')           // single quotes to double quotes
    .replace(/\n/g, ' ')          // remove newlines inside strings can break things, keep as-is
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('[analyze-product] JSON parse failed. Raw text (first 500):', text.slice(0, 500));
    console.error('[analyze-product] Cleaned JSON (first 500):', cleaned.slice(0, 500));
    throw e;
  }

  // Normalize healthScore fields
  if (parsed.healthScore) {
    if (typeof parsed.healthScore === 'number') {
      parsed.healthScore = {
        overall: parsed.healthScore,
        nutrientDensity: parsed.healthScore,
        processingLevel: 50,
        additiveRisk: 50,
      };
    }
    // Ensure all sub-scores exist
    parsed.healthScore.overall = parsed.healthScore.overall ?? 50;
    parsed.healthScore.nutrientDensity = parsed.healthScore.nutrientDensity ?? 50;
    parsed.healthScore.processingLevel = parsed.healthScore.processingLevel ?? 50;
    parsed.healthScore.additiveRisk = parsed.healthScore.additiveRisk ?? 50;
  }

  // Normalize alerts
  if (parsed.alerts && Array.isArray(parsed.alerts)) {
    parsed.alerts = parsed.alerts.map((a: Record<string, unknown>) => ({
      title: a.title || 'Alerta',
      description: a.description || a.title || '',
      severity: a.severity || 'medium',
    }));
  }

  // Normalize fitnessAlignment
  if (parsed.fitnessAlignment && Array.isArray(parsed.fitnessAlignment)) {
    parsed.fitnessAlignment = parsed.fitnessAlignment.map((f: Record<string, unknown>) => ({
      goal: f.goal || 'Saúde Geral',
      suitability: f.suitability || 'Neutro',
      justification: f.justification || '',
    }));
  }

  // Normalize ingredientDetails
  if (parsed.ingredientDetails && Array.isArray(parsed.ingredientDetails)) {
    parsed.ingredientDetails = parsed.ingredientDetails.map((ing: Record<string, unknown>) => ({
      name: String(ing.name || ''),
      estimatedGrams: Number(ing.estimatedGrams) || 0,
      calories: Number(ing.calories) || 0,
      protein: Number(ing.protein) || 0,
      carbs: Number(ing.carbs) || 0,
      fat: Number(ing.fat) || 0,
      fiber: Number(ing.fiber) || 0,
    }));
  } else {
    parsed.ingredientDetails = [];
  }

  return parsed;
}

export async function POST(req: Request) {
  const headers = getCorsHeaders();

  const rlKey = getRateLimitKey(req, "scan")
  const rl = await checkRateLimit(rlKey, RATE_LIMITS.scan)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers })
  }

  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500, headers });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', auth.userId)
    .single();

  const userPlan = profile?.plan || 'free';
  // Fallback JS limit check; for strict race-free enforcement optionally call:
  // const { data: atomicAllowed } = await supabaseAdmin.rpc('check_and_increment_scan', { p_user_id: auth.userId });
  // if (atomicAllowed === false) return 403; // handled atomically via pg_advisory_xact_lock + SELECT FOR UPDATE (see supabase/atomic-plan-limits.sql)
  const canProceed = await checkScanLimit(auth.userId, userPlan);

  if (!canProceed) {
    return NextResponse.json({ 
      error: 'Limite diário de scans atingido. Atualize para um plano superior.' 
    }, { status: 403, headers });
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: 'Chave de API do Gemini não configurada.' }, { status: 500, headers });
  }

  try {
    const body = await req.json();
    const { imageData, mimeType = "image/jpeg", locale = "pt-BR", metabolicPlan } = body;

    if (!imageData) {
      return NextResponse.json({ error: 'Imagem não fornecida.' }, { status: 400, headers });
    }

    if (typeof mimeType !== "string" || !mimeType.startsWith("image/")) {
      return NextResponse.json({ error: 'Formato de imagem inválido.' }, { status: 400, headers });
    }

    const base64Data = imageData.includes('base64,') 
      ? imageData.split('base64,')[1] 
      : imageData;

    // Reject images larger than 1MB base64 (~750KB raw)
    if (base64Data.length > 1_400_000) {
      return NextResponse.json({ 
        error: 'Imagem muito grande. Tira uma foto mais nítida ou menor.' 
      }, { status: 400, headers });
    }

    // AI cache: check after plan limit but before AI call (saves tokens)
    const cacheKey = await hashImage(base64Data)
    const cached = getCached(cacheKey)
    if (cached) {
      // Still insert into scans for limit tracking
      try {
        await supabaseAdmin.from('scans').insert({
          user_id: auth.userId,
          product_name: cached.productName || 'Cached',
          score: cached.longevityScore ?? cached.healthScore?.overall ?? 50,
        })
      } catch {}
      const cachedScanId = (globalThis.crypto as any)?.randomUUID?.() ?? crypto.randomUUID()
      return NextResponse.json({ ...cached, cached: true, scanId: cachedScanId, scannedAt: new Date().toISOString() }, { headers })
    }

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const prompt = buildPrompt(lang, metabolicPlan);

    let analysis;
    let lastError: unknown = null;
    const groqApiKey = getGroqApiKey();

    // Try Gemini 2x, then fallback to Groq vision
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const text = await callGemini(base64Data, mimeType, prompt, apiKey);
        console.log(`[analyze-product] Gemini attempt ${attempt}/2 - response length: ${text.length}`);
        analysis = await parseAIResponse(text);
        break;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[analyze-product] Gemini attempt ${attempt}/2 failed:`, msg);

        if (attempt < 2) {
          const delay = Math.min(2000 * Math.pow(2, attempt - 1), 15000);
          console.log(`[analyze-product] Retrying Gemini in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    // Fallback to Groq vision if Gemini failed
    if (!analysis && groqApiKey) {
      try {
        console.log('[analyze-product] Falling back to Groq vision');
        const text = await callGroqVision(base64Data, mimeType, prompt, groqApiKey);
        console.log(`[analyze-product] Groq vision response length: ${text.length}`);
        analysis = await parseAIResponse(text);
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[analyze-product] Groq vision failed:`, msg);
      }
    }

    if (!analysis) {
      const errMsg = lastError instanceof Error ? lastError.message : '';
      const status = errMsg.includes('503') ? 503 : errMsg.includes('429') ? 429 : 502;
      const userMsg = status === 503
        ? 'Serviço de IA temporariamente indisponível. Tente novamente em alguns instantes.'
        : status === 429
        ? 'Muitas requisições. Aguarde um momento e tente novamente.'
        : 'A IA retornou uma resposta inválida. Tente uma foto mais nítida do alimento ou rótulo.';
      return NextResponse.json({ error: userMsg }, { status, headers });
    }

    if (analysis.error) {
      return NextResponse.json(
        { error: typeof analysis.error === 'string' ? analysis.error : 'A imagem não parece ser um alimento.' },
        { status: 422, headers }
      );
    }

    if (!analysis.productName || typeof analysis.healthScore?.overall !== 'number') {
      return NextResponse.json(
        { error: 'Não foi possível identificar o alimento. Tente uma foto mais clara.' },
        { status: 422, headers }
      );
    }

    // Build transformed response with backward compatibility
    const transformed = {
      productName: analysis.productName,
      brand: analysis.brand || 'Genérico',
      category: analysis.category || 'other',
      servingSize: analysis.servingSize || '100g',
      macros: analysis.macros || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
      micros: analysis.micros || { vitamins: [], minerals: [] },
      ingredients: analysis.ingredients || [],
      ingredientDetails: analysis.ingredientDetails?.map((ing: Record<string, unknown>) => ({
        name: String(ing.name || ''),
        estimatedGrams: Number(ing.estimatedGrams) || 0,
        calories: Number(ing.calories) || 0,
        protein: Number(ing.protein) || 0,
        carbs: Number(ing.carbs) || 0,
        fat: Number(ing.fat) || 0,
        fiber: Number(ing.fiber) || 0,
      })) || [],
      allergens: analysis.allergens || [],
      novaClassification: analysis.novaClassification || { group: 4, label: 'Ultra-processado', description: 'Não foi possível classificar' },
      glycemicIndex: analysis.glycemicIndex || { value: null, category: null, note: null },
      healthScore: analysis.healthScore || { overall: 50, nutrientDensity: 50, processingLevel: 50, additiveRisk: 50 },
      longevityScore: analysis.healthScore?.overall ?? analysis.longevityScore ?? 50,
      positivePoints: analysis.positivePoints || [],
      negativePoints: analysis.negativePoints || [],
      alerts: analysis.alerts?.map((a: Record<string, unknown>) => ({
        title: String(a.title || 'Alerta'),
        description: String(a.description || ''),
        severity: (a.severity as string) || 'medium',
      })) || [],
      insights: analysis.positivePoints?.map((desc: string) => ({
        description: desc
      })) || [],
      benefits: {
        vitamins: analysis.micros?.vitamins || analysis.benefits?.vitamins || [],
        minerals: analysis.micros?.minerals || analysis.benefits?.minerals || [],
        proteins: analysis.benefits?.proteins || [],
        other: analysis.benefits?.other || [],
      },
      fitnessAlignment: analysis.fitnessAlignment || [],
      recommendations: analysis.recommendations || { bestFor: '', avoidIf: '', alternatives: '' },
      aiConfidence: analysis.aiConfidence ?? 70,
    };

    // Cache the result for future identical scans (7-day TTL, LRU 200)
    try { setCached(cacheKey, transformed) } catch {}

    // Save scan to database (minimal - for limit tracking only)
    const { data: scanRecord } = await supabaseAdmin.from('scans').insert({
      user_id: auth.userId,
      product_name: transformed.productName,
      score: transformed.longevityScore,
    }).select('id, created_at').single();

    return NextResponse.json({
      ...transformed,
      scanId: scanRecord?.id || null,
      scannedAt: scanRecord?.created_at || new Date().toISOString(),
    }, { headers });

  } catch (error) {
    console.error('Erro na análise de produto:', error);
    return NextResponse.json({ error: 'Falha ao analisar imagem.' }, { status: 500, headers });
  }
}
