import { NextResponse } from 'next/server';
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
  const planContext = metabolicPlan
    ? `\nThe user has a metabolic plan: ${metabolicPlan}. Use this to give personalized fitness alignment advice.`
    : '';

  if (lang === "English") {
    return `You are a world-class nutritionist and food scientist. Analyze this food/product image with extreme precision.

Return STRICT JSON only (no markdown, no explanation, no backticks). Use this exact structure:

{
  "productName": "exact product name as shown on label",
  "brand": "brand name or 'Generic'",
  "category": "one of: beverage, dairy, meat, seafood, grain, vegetable, fruit, snack, condiment, supplement, processed, ready-meal, dessert, other",
  "servingSize": "e.g. '100g', '1 can (330ml)', '1 cup (240ml)'",
  "macros": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "sodium": number
  },
  "micros": {
    "vitamins": ["Vitamin C - 45mg (50% DV)", "Vitamin D - 2mcg (10% DV)"],
    "minerals": ["Iron - 2.5mg (14% DV)", "Calcium - 200mg (15% DV)"]
  },
  "ingredients": ["first ingredient", "second ingredient", "..."],
  "allergens": ["gluten", "dairy", "soy", "nuts", "eggs", "shellfish", "peanuts", "sesame"] or [],
  "novaClassification": {
    "group": number 1-4,
    "label": "Unprocessed" | "Processed culinary ingredients" | "Processed foods" | "Ultra-processed",
    "description": "brief explanation"
  },
  "glycemicIndex": {
    "value": number or null,
    "category": "Low" | "Medium" | "High" or null,
    "note": "brief explanation" or null
  },
  "healthScore": {
    "overall": number 0-100,
    "nutrientDensity": number 0-100,
    "processingLevel": number 0-100 (100 = unprocessed),
    "additiveRisk": number 0-100 (100 = no additives)
  },
  "positivePoints": ["specific benefit 1", "specific benefit 2", "..."],
  "negativePoints": ["specific concern 1", "specific concern 2", "..."],
  "alerts": [
    {"title": "alert title", "description": "detailed explanation", "severity": "high" | "medium" | "low"}
  ],
  "fitnessAlignment": [
    {
      "goal": "Muscle Gain" | "Fat Loss" | "Endurance" | "General Health",
      "suitability": "Excellent" | "Good" | "Neutral" | "Poor",
      "justification": "detailed explanation"
    }
  ],
  "recommendations": {
    "bestFor": "when and how to consume this product",
    "avoidIf": "who should avoid this and why",
    "alternatives": "healthier alternatives if applicable"
  },
  "aiConfidence": number 0-100 (how confident you are in the analysis)
}

Guidelines:
- Read the actual nutrition label if visible. If not visible, estimate based on the product type.
- For macros, use per serving as shown on label. If no label, estimate per 100g.
- NOVA Group 1 = unprocessed, Group 2 = processed culinary, Group 3 = processed, Group 4 = ultra-processed.
- Glycemic Index: estimate based on ingredients and product type.
- allergens: detect from ingredients list if visible.
- Be specific, not generic. Name actual vitamins/minerals with amounts if visible.
- If the image is NOT food, return {"error": "This does not appear to be a food product."}
${planContext}`;
  }

  return `Você é um nutricionista e cientista de alimentos de classe mundial. Analise esta imagem de alimento/produto com extrema precisão.

Retorne APENAS JSON estrito (sem markdown, sem explicação, sem crases). Use esta estrutura exata:

{
  "productName": "nome exato do produto como aparece no rótulo",
  "brand": "marca ou 'Genérico'",
  "category": "uma das: bebida, laticínio, carne, frutos do mar, grão, vegetal, fruta, snack, condimento, suplemento, processado, refeição pronta, sobremesa, outro",
  "servingSize": "ex: '100g', '1 lata (330ml)', '1 xícara (240ml)'",
  "macros": {
    "calories": número,
    "protein": número,
    "carbs": número,
    "fat": número,
    "fiber": número,
    "sugar": número,
    "sodium": número
  },
  "micros": {
    "vitamins": ["Vitamina C - 45mg (50% VD)", "Vitamina D - 2mcg (10% VD)"],
    "minerals": ["Ferro - 2.5mg (14% VD)", "Cálcio - 200mg (15% VD)"]
  },
  "ingredients": ["primeiro ingrediente", "segundo ingrediente", "..."],
  "allergens": ["glúten", "lacticínios", "soja", "nozes", "ovos", "crustáceos", "amendoim", "gergelim"] ou [],
  "novaClassification": {
    "group": número 1-4,
    "label": "Não processado" | "Ingredientes culinários processados" | "Alimentos processados" | "Ultra-processados",
    "description": "breve explicação"
  },
  "glycemicIndex": {
    "value": número ou null,
    "category": "Baixo" | "Médio" | "Alto" ou null,
    "note": "breve explicação" ou null
  },
  "healthScore": {
    "overall": número 0-100,
    "nutrientDensity": número 0-100,
    "processingLevel": número 0-100 (100 = não processado),
    "additiveRisk": número 0-100 (100 = sem aditivos)
  },
  "positivePoints": ["benefício específico 1", "benefício específico 2", "..."],
  "negativePoints": ["preocupação específica 1", "preocupação específica 2", "..."],
  "alerts": [
    {"title": "título do alerta", "description": "explicação detalhada", "severity": "high" | "medium" | "low"}
  ],
  "fitnessAlignment": [
    {
      "goal": "Ganho Muscular" | "Perda de Gordura" | "Resistência" | "Saúde Geral",
      "suitability": "Excelente" | "Bom" | "Neutro" | "Ruim",
      "justification": "explicação detalhada"
    }
  ],
  "recommendations": {
    "bestFor": "quando e como consumir este produto",
    "avoidIf": "quem deve evitar e por quê",
    "alternatives": "alternativas mais saudáveis se aplicável"
  },
  "aiConfidence": número 0-100 (confiança na análise)
}

Diretrizes:
- Leia o rótulo de nutrição real se estiver visível. Se não estiver, estime com base no tipo de produto.
- Para macros, use por porção conforme o rótulo. Se não houver rótulo, estime por 100g.
- NOVA Grupo 1 = não processado, Grupo 2 = ingredientes culinários, Grupo 3 = processado, Grupo 4 = ultra-processado.
- Índice Glicêmico: estime com base nos ingredientes e tipo de produto.
- allergens: detecte da lista de ingredientes se visível.
- Seja específico, não genérico. Nomeie vitaminas/minerais reais com quantidades se visíveis.
- Se a imagem NÃO for alimento, retorne {"error": "Isto não parece ser um produto alimentício."}
${planContext}`;
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

  return parsed;
}

export async function POST(req: Request) {
  const headers = getCorsHeaders();

  const rlKey = getRateLimitKey(req, "scan")
  const rl = await checkRateLimit(rlKey, RATE_LIMITS.scan)
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

    // Save scan to database
    await supabaseAdmin.from('scans').insert({
      user_id: user.id,
      product_name: transformed.productName,
      score: transformed.longevityScore,
      image_url: null,
    });

    return NextResponse.json(transformed, { headers });

  } catch (error) {
    console.error('Erro na análise de produto:', error);
    return NextResponse.json({ error: 'Falha ao analisar imagem.' }, { status: 500, headers });
  }
}
