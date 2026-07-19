import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCorsHeaders } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const headers = getCorsHeaders();
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401, headers });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Configuracao do servidor incompleta.' }, { status: 500, headers });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!user || authError) {
      return NextResponse.json({ error: 'Token invalido.' }, { status: 401, headers });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500, headers });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const body = await req.json();
    const { sleepData, currentSleep, currentQuality, locale = "pt-BR" } = body;

    const isEnglish = locale === "en-US";
    const lang = isEnglish ? "English" : "Portuguese";

    const sleepDataFormatted = sleepData?.length
      ? sleepData.map((d: any) =>
          `${d.date}: ${d.duration}h, quality ${d.quality}${d.notes ? `, notes: ${d.notes}` : ""}${d.bedtime ? `, bedtime: ${d.bedtime}` : ""}${d.wakeTime ? `, wake time: ${d.wakeTime}` : ""}`
        ).join('\n')
      : (isEnglish ? "No historical sleep data available" : "Dados históricos de sono não disponíveis");

    const currentSleepInfo = currentSleep
      ? (isEnglish ? `Current sleep duration: ${currentSleep} hours` : `Duração atual do sono: ${currentSleep} horas`)
      : "";

    const currentQualityInfo = currentQuality
      ? (isEnglish ? `Current sleep quality: ${currentQuality}` : `Qualidade atual do sono: ${currentQuality}`)
      : "";

    const prompt = isEnglish
      ? `You are a world-class sleep scientist, circadian rhythm researcher, and certified sleep health coach with 20+ years of clinical experience. Analyze the following sleep data with extreme precision and provide a comprehensive sleep optimization report.

SLEEP HISTORY (recent days):
${sleepDataFormatted}

${currentSleepInfo}
${currentQualityInfo}

IMPORTANT: Your entire response must be in ${lang}. You MUST return ONLY a valid JSON object with the following EXACT structure. No markdown, no code blocks, no explanations outside the JSON.

{
  "score": number (0-100, overall sleep quality score calculated from: sleep duration 25%, consistency 20%, quality rating 25%, efficiency 15%, environment 15%),
  "analysis": "A thorough 3-5 sentence analysis covering: sleep pattern regularity, quality trends over time, deviation from optimal 7-9 hour range, any red flags like extreme variability or chronic deprivation, and comparison to healthy adult benchmarks",
  "sleepStages": {
    "deep": number (estimated percentage of deep sleep based on total duration - optimal is 13-23% for adults),
    "rem": number (estimated REM percentage - optimal is 20-25%, based on sleep quality and duration patterns),
    "light": number (remaining percentage of light sleep - typically 50-60%),
    "assessment": "Detailed analysis of likely sleep stage distribution and what it means for recovery, memory consolidation, and physical restoration"
  },
  "circadianRhythm": {
    "assessment": "Evaluation of circadian alignment based on bedtime/wake time consistency, identification of potential delayed or advanced sleep phase, social jetlag detection, and whether the sleep schedule aligns with natural light-dark cycles",
    "recommendations": [
      "Specific circadian rhythm optimization recommendation 1",
      "Specific circadian rhythm optimization recommendation 2",
      "Specific circadian rhythm optimization recommendation 3"
    ],
    "optimalBedtime": "Recommended optimal bedtime based on sleep patterns",
    "optimalWakeTime": "Recommended optimal wake time based on sleep patterns"
  },
  "sleepEfficiency": number (percentage of time in bed actually spent sleeping - calculate from duration vs time in bed, optimal is 85%+),
  "environmentalFactors": [
    {
      "factor": "Environmental factor category (e.g., room temperature, noise, light exposure, mattress quality, bedroom air quality)",
      "impact": "high/medium/low",
      "recommendation": "Specific actionable improvement for this factor"
    }
  ],
  "nutritionalImpact": [
    {
      "nutrient": "Nutrient or dietary factor (e.g., caffeine, alcohol, magnesium, melatonin, sugar, heavy meals, hydration)",
      "effect": "How this affects sleep quality, onset latency, and sleep architecture",
      "recommendation": "Specific timing and dosage guidance"
    }
  ],
  "exerciseImpact": [
    {
      "type": "Exercise type (e.g., aerobic, strength training, yoga, HIIT)",
      "timing": "Optimal timing relative to bedtime",
      "effect": "How this exercise type affects sleep quality and sleep stages",
      "recommendation": "Specific exercise timing and intensity recommendation"
    }
  ],
  "stressAndCortisol": {
    "assessment": "Evaluation of likely cortisol patterns based on sleep data, identification of elevated evening cortisol indicators, HPA axis dysregulation signs, and stress-sleep feedback loops",
    "recommendations": [
      "Specific stress management technique for better sleep 1",
      "Specific stress management technique for better sleep 2",
      "Specific stress management technique for better sleep 3"
    ]
  },
  "screenTimeImpact": {
    "assessment": "Analysis of how screen exposure and blue light may be affecting melatonin production and sleep onset latency",
    "recommendations": [
      "Specific blue light reduction strategy 1",
      "Specific blue light reduction strategy 2",
      "Specific blue light reduction strategy 3"
    ]
  },
  "tips": [
    "High-impact sleep improvement tip 1 with specific timing or dosage",
    "High-impact sleep improvement tip 2 with specific timing or dosage",
    "High-impact sleep improvement tip 3 with specific timing or dosage",
    "High-impact sleep improvement tip 4 with specific timing or dosage",
    "High-impact sleep improvement tip 5 with specific timing or dosage"
  ],
  "sleepProtocol": [
    {
      "timing": "Specific time (e.g., '60 minutes before bed', '9:00 PM', 'immediately upon waking')",
      "action": "Precise action to take",
      "reason": "Scientific reasoning behind this recommendation"
    }
  ],
  "sleepHygieneChecklist": [
    {
      "item": "Specific sleep hygiene practice",
      "importance": "high/medium/low",
      "currentStatus": "assessed as likely followed/not followed based on data",
      "action": "What to do if not currently following this practice"
    }
  ],
  "debt": number (estimated sleep debt in hours - calculate as sum of deficits below 8 hours over the past 7 days, 0 if consistently meeting 7-9 hours)
}

ANALYSIS REQUIREMENTS:
1. Calculate sleep efficiency: (total sleep time / time in bed) × 100. If time in bed data is unavailable, estimate conservatively.
2. Sleep debt: For each day, if sleep < 7 hours, add the deficit. Sum all deficits. If sleep is consistently 7-9 hours, debt = 0.
3. Score calculation: Weight duration (25%), consistency (20%), quality rating (25%), efficiency (15%), and environment (15%).
4. Sleep stages: Estimate based on sleep duration and quality. Short sleep (<6h) reduces deep sleep. Poor quality reduces REM. Use established sleep science ratios.
5. Environmental factors: Cover at minimum room temperature (optimal 65-68°F/18-20°C), noise levels, light exposure, mattress/pillow quality, and bedroom air quality.
6. Nutritional impact: Address caffeine (half-life 5-7 hours), alcohol (disrupts REM), magnesium (promotes deep sleep), melatonin timing, sugar intake, meal timing, and hydration.
7. Exercise impact: Cover aerobic exercise (improves deep sleep but timing matters), strength training (can increase cortisol if late), yoga/stretching (promotes relaxation), and HIIT (avoid within 2 hours of bed).
8. Screen time: Address blue light suppression of melatonin (peak sensitivity 460-480nm), recommended screen curfew timing, and alternative pre-bed activities.
9. Stress/cortisol: Discuss cortisol's natural rhythm (high AM, low PM), how chronic stress flattens this curve, and specific interventions like breathing exercises, progressive muscle relaxation, or journaling.
10. The sleepProtocol array must have at least 5 entries covering: evening wind-down routine, bedroom environment setup, nutrition timing, exercise timing, and morning light exposure.
11. The sleepHygieneChecklist array must have at least 8 entries covering: consistent sleep/wake times, dark/cool/quiet room, caffeine curfew, alcohol limitations, screen curfew, regular exercise, stress management, and pre-bed routine.
12. All tips must be specific and actionable with exact times, durations, or dosages where applicable.

The JSON must have ALL fields. Do not omit any field. Every array must have at least the minimum number of entries specified.`
      : `Você é um cientista do sono de classe mundial, pesquisador de ritmos circadianos e coach certificado de saúde do sono com mais de 20 anos de experiência clínica. Analise os seguintes dados de sono com precisão extrema e forneça um relatório abrangente de otimização do sono.

HISTÓRICO DE SONO (dias recentes):
${sleepDataFormatted}

${currentSleepInfo}
${currentQualityInfo}

IMPORTANTE: Sua resposta inteira deve ser em ${lang}. Você DEVE retornar APENAS um objeto JSON válido com a seguinte estrutura EXATA. Sem markdown, sem blocos de código, sem explicações fora do JSON.

{
  "score": número (0-100, pontuação geral de qualidade do sono calculada a partir de: duração do sono 25%, consistência 20%, classificação de qualidade 25%, eficiência 15%, ambiente 15%),
  "analysis": "Uma análise aprofundada de 3-5 frases cobrindo: regularidade dos padrões de sono, tendências de qualidade ao longo do tempo, desvio da faixa ideal de 7-9 horas, quaisquer sinais de alerta como variabilidade extrema ou privação crônica, e comparação com benchmarks saudáveis para adultos",
  "sleepStages": {
    "deep": número (porcentagem estimada de sono profundo baseada na duração total - ideal é 13-23% para adultos),
    "rem": número (porcentagem estimada de REM - ideal é 20-25%, baseado na qualidade e padrões de duração do sono),
    "light": número (porcentagem restante de sono leve - tipicamente 50-60%),
    "assessment": "Análise detalhada da provável distribuição de estágios de sono e o que isso significa para recuperação, consolidação de memória e restauração física"
  },
  "circadianRhythm": {
    "assessment": "Avaliação do alinhamento circadiano baseada na consistência de horários de dormir/acordar, identificação de potencial atraso ou adiantamento da fase do sono, detecção de jetlag social, e se o horário de sono se alinha com os ciclos naturais de luz-escuridão",
    "recommendations": [
      "Recomendação específica de otimização do ritmo circadiano 1",
      "Recomendação específica de otimização do ritmo circadiano 2",
      "Recomendação específica de otimização do ritmo circadiano 3"
    ],
    "optimalBedtime": "Horário ideal de dormir baseado nos padrões de sono",
    "optimalWakeTime": "Horário ideal de acordar baseado nos padrões de sono"
  },
  "sleepEfficiency": número (porcentagem do tempo na cama realmente passado dormindo - calcule a partir da duração vs tempo na cama, ideal é 85%+),
  "environmentalFactors": [
    {
      "factor": "Categoria de fator ambiental (ex: temperatura do quarto, ruído, exposição à luz, qualidade do colchão, qualidade do ar do quarto)",
      "impact": "alto/médio/baixo",
      "recommendation": "Melhoria específica e prática para este fator"
    }
  ],
  "nutritionalImpact": [
    {
      "nutrient": "Nutriente ou fator dietético (ex: cafeína, álcool, magnésio, melatonina, açúcar, refeições pesadas, hidratação)",
      "effect": "Como isso afeta a qualidade do sono, latência de início e arquitetura do sono",
      "recommendation": "Orientação específica de timing e dosagem"
    }
  ],
  "exerciseImpact": [
    {
      "type": "Tipo de exercício (ex: aeróbico, treinamento de força, yoga, HIIT)",
      "timing": "Timing ideal em relação ao horário de dormir",
      "effect": "Como este tipo de exercício afeta a qualidade do sono e os estágios do sono",
      "recommendation": "Recomendação específica de timing e intensidade do exercício"
    }
  ],
  "stressAndCortisol": {
    "assessment": "Avaliação dos prováveis padrões de cortisol baseada nos dados de sono, identificação de indicadores de cortisol elevado à noite, sinais de desregulação do eixo HPA, e loops de feedback estresse-sono",
    "recommendations": [
      "Técnica específica de gerenciamento de estresse para melhor sono 1",
      "Técnica específica de gerenciamento de estresse para melhor sono 2",
      "Técnica específica de gerenciamento de estresse para melhor sono 3"
    ]
  },
  "screenTimeImpact": {
    "assessment": "Análise de como a exposição a telas e luz azul pode estar afetando a produção de melatonina e a latência de início do sono",
    "recommendations": [
      "Estratégia específica de redução de luz azul 1",
      "Estratégia específica de redução de luz azul 2",
      "Estratégia específica de redução de luz azul 3"
    ]
  },
  "tips": [
    "Dica de alta influência para melhorar o sono 1 com timing ou dosagem específica",
    "Dica de alta influência para melhorar o sono 2 com timing ou dosagem específica",
    "Dica de alta influência para melhorar o sono 3 com timing ou dosagem específica",
    "Dica de alta influência para melhorar o sono 4 com timing ou dosagem específica",
    "Dica de alta influência para melhorar o sono 5 com timing ou dosagem específica"
  ],
  "sleepProtocol": [
    {
      "timing": "Horário específico (ex: '60 minutos antes de dormir', '21:00', 'imediatamente ao acordar')",
      "action": "Ação precisa a ser tomada",
      "reason": "Justificativa científica para esta recomendação"
    }
  ],
  "sleepHygieneChecklist": [
    {
      "item": "Prática específica de higiene do sono",
      "importance": "alto/médio/baixo",
      "currentStatus": "avaliado como provavelmente seguido/não seguido baseado nos dados",
      "action": "O que fazer se não estiver seguindo esta prática atualmente"
    }
  ],
  "debt": número (débito de sono estimado em horas - calcule como a soma dos déficits abaixo de 8 horas nos últimos 7 dias, 0 se consistentemente atendendo 7-9 horas)
}

REQUISITOS DE ANÁLISE:
1. Calcule a eficiência do sono: (tempo total de sono / tempo na cama) × 100. Se os dados de tempo na cama não estiverem disponíveis, estime conservadoramente.
2. Débito de sono: Para cada dia, se o sono < 7 horas, adicione o défит. Some todos os défits. Se o sono for consistentemente 7-9 horas, débito = 0.
3. Cálculo da pontuação: Pese duração (25%), consistência (20%), classificação de qualidade (25%), eficiência (15%) e ambiente (15%).
4. Estágios do sono: Estime com base na duração e qualidade do sono. Sono curto (<6h) reduz o sono profundo. Qualidade ruim reduz o REM. Use ratios estabelecidos de ciência do sono.
5. Fatores ambientais: Cubra no mínimo temperatura do quarto (ideal 18-20°C), níveis de ruído, exposição à luz, qualidade do colchão/travesseiro e qualidade do ar do quarto.
6. Impacto nutricional: Aborde cafeína (meia-vida de 5-7 horas), álcool (distorce o REM), magnésio (promove sono profundo), timing da melatonina, ingestão de açúcar, timing de refeições e hidratação.
7. Impacto do exercício: Cubra exercício aeróbico (melhora o sono profundo mas o timing importa), treinamento de força (pode aumentar cortisol se tardio), yoga/stretching (promove relaxamento) e HIIT (evite dentro de 2 horas de dormir).
8. Tempo de tela: Aborde supressão da melatonina pela luz azul (sensibilidade máxima 460-480nm), timing recomendado de curfew de telas e atividades alternativas pré-cama.
9. Estresse/cortisol: Discuta o ritmo natural do cortisol (alto pela manhã, baixo à noite), como o estresse crônico achata essa curva e intervenções específicas como exercícios de respiração, relaxamento muscular progressivo ou journaling.
10. O array sleepProtocol deve ter pelo menos 5 entradas cobrindo: rotina de relaxamento noturno, configuração do ambiente do quarto, timing de nutrição, timing de exercício e exposição à luz matinal.
11. O array sleepHygieneChecklist deve ter pelo menos 8 entradas cobrindo: horários consistentes de dormir/acordar, quarto escuro/frio/silencioso, curfew de cafeína, limitações de álcool, curfew de telas, exercício regular, gerenciamento de estresse e rotina pré-cama.
12. Todas as dicas devem ser específicas e práticas com horários, durações ou dosagens exatas quando aplicável.

O JSON deve ter TODOS os campos. Não omita nenhum campo. Todo array deve ter pelo menos o número mínimo de entradas especificado.`;

    const maxRetries = 3;
    let lastParseError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(cleanedText);
        return NextResponse.json(data, { headers });
      } catch (parseError) {
        lastParseError = parseError;
        console.error(`Tentativa ${attempt}/${maxRetries} - Erro ao processar JSON da IA:`, parseError);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    console.error("Todas as tentativas de parsing falharam:", lastParseError);
    return NextResponse.json({ error: "A IA retornou um formato inválido após múltiplas tentativas." }, { status: 500, headers });

  } catch (error: any) {
    console.error("Erro na rota analyze-sleep:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500, headers });
  }
}
