import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCorsHeaders } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const headers = getCorsHeaders();
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Nao autorizado." },
        { status: 401, headers }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta." },
        { status: 500, headers }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Token invalido." },
        { status: 401, headers }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key não configurada" },
        { status: 500, headers }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const body = await req.json();
    const {
      age,
      bmi,
      sleepQuality,
      stressLevel,
      activityLevel,
      smokingStatus,
      locale = "pt-BR",
    } = body;

    const isEnglish = locale === "en-US";
    const lang = isEnglish ? "English" : "Portuguese";

    const sleepInfo = sleepQuality
      ? isEnglish
        ? `Sleep quality: ${sleepQuality}`
        : `Qualidade do sono: ${sleepQuality}`
      : isEnglish
        ? "Not provided"
        : "Não informado";

    const stressInfo = stressLevel
      ? isEnglish
        ? `Stress level: ${stressLevel}`
        : `Nível de estresse: ${stressLevel}`
      : isEnglish
        ? "Not provided"
        : "Não informado";

    const activityInfo = activityLevel
      ? isEnglish
        ? `Activity level: ${activityLevel}`
        : `Nível de atividade: ${activityLevel}`
      : isEnglish
        ? "Not provided"
        : "Não informado";

    const smokingLabel = smokingStatus
      ? isEnglish
        ? smokingStatus === "never"
          ? "Never smoked"
          : smokingStatus === "former"
            ? "Former smoker"
            : "Current smoker"
        : smokingStatus === "never"
          ? "Nunca fumou"
          : smokingStatus === "former"
            ? "Ex-fumante"
            : "Fumante atual"
      : isEnglish
        ? "Not provided"
        : "Não informado";

    const prompt = isEnglish
      ? `You are a world-class anti-aging medicine expert, gerontologist, and longevity researcher. Calculate the user's biological age using multi-dimensional aging markers. All output MUST be in ${lang}. Use ONLY valid JSON with NO markdown fencing.

USER DATA:
- Chronological age: ${age} years
- BMI: ${bmi}
- ${sleepInfo}
- ${stressInfo}
- ${activityInfo}
- Smoking status: ${smokingLabel}

AGING ANALYSIS FRAMEWORK:
Consider these scientific aging mechanisms when calculating biological age:

1. TELOMERE LENGTH: Estimate telomere attrition rate based on lifestyle factors. Smoking accelerates telomere shortening by 4-6 years. Chronic stress reduces telomerase activity. Exercise preserves telomere length.

2. OXIDATIVE STRESS: Assess ROS (reactive oxygen species) production vs antioxidant capacity. Poor diet, smoking, UV exposure increase oxidative damage. Exercise and antioxidants mitigate it.

3. CHRONIC INFLAMMATION (Inflammaging): Evaluate systemic inflammation markers (CRP, IL-6, TNF-alpha equivalents). Obesity (BMI>30) increases inflammatory cytokines. Sleep deprivation elevates NF-κB activity.

4. EPIGENETIC AGE: Consider DNA methylation patterns influenced by diet (methyl donors like folate, B12), stress (cortisol-mediated methylation), exercise (epigenetic reprogramming), and environmental exposures.

5. HORMETIC RESPONSES: Assess beneficial stress from exercise (mitochondrial biogenesis, autophagy), cold exposure, and fasting vs. maladaptive chronic stress.

6. CELLULAR SENESCENCE: Evaluate senescence burden from poor sleep, obesity, sedentary behavior, and smoking which increase SASP (senescence-associated secretory phenotype).

Return ONLY a valid JSON with this EXACT structure (no markdown, no code blocks):
{
  "biologicalAge": number (estimated biological age in years, precise to one decimal),
  "difference": number (biological age minus chronological age, negative = younger than chronological),
  "agingScore": number (0-100, where 100 = optimal biological aging),
  "factors": [
    {
      "name": "Factor name",
      "impact": number (positive = accelerates aging, negative = decelerates aging, in years),
      "description": "Detailed scientific explanation of how this factor affects the user's biological age, referencing specific mechanisms"
    }
  ],
  "biomarkers": [
    {
      "name": "Biomarker name (e.g., HbA1c, CRP, Telomere Length, Vitamin D, Insulin Sensitivity)",
      "currentStatus": "Estimated current status based on user data (e.g., 'elevated', 'optimal', 'suboptimal')",
      "targetStatus": "Target healthy status (e.g., 'optimal range <5.7%')",
      "priority": "high" | "medium" | "low"
    }
  ],
  "riskAssessment": {
    "cardiovascular": {
      "riskLevel": "low" | "moderate" | "high" | "very_high",
      "details": "Specific cardiovascular risk factors and estimated risk percentage or category"
    },
    "metabolic": {
      "riskLevel": "low" | "moderate" | "high" | "very_high",
      "details": "Metabolic syndrome risk, insulin resistance potential, diabetes risk"
    },
    "cognitive": {
      "riskLevel": "low" | "moderate" | "high" | "very_high",
      "details": "Neurodegenerative disease risk, cognitive decline factors"
    }
  },
  "populationComparison": "Detailed comparison string explaining how this biological age compares to population averages for the user's chronological age group (e.g., 'Your biological age of 42.3 is 4.7 years younger than the average 47-year-old, placing you in the top 25% of your age group for biological aging markers')",
  "recommendations": [
    {
      "action": "Specific actionable recommendation",
      "timeframe": "Implementation timeframe (e.g., 'Start within 2 weeks', 'Ongoing daily habit')",
      "expectedImpact": "Expected biological age reduction in years or months (e.g., '-1.2 years over 6 months')"
    }
  ],
  "improvementPlan": [
    {
      "action": "Detailed step-by-step action item",
      "timeframe": "Specific deadline or duration (e.g., 'Week 1-2: Initial phase', 'Month 1-3: Building phase')",
      "expectedImpact": "Measurable expected outcome (e.g., 'Reduce fasting glucose by 10mg/dL', 'Improve sleep quality score by 30%')"
    }
  ]
}

Include at least 6 factors, 5 biomarkers, 3 lifestyle recommendations with timeframes, and 4 improvement plan steps. Each recommendation must be specific and actionable (not generic). Base calculations on peer-reviewed longevity research including Horvath epigenetic clock, Framingham Risk Score methodology, and established biomarker reference ranges. The JSON must have ALL fields.`
      : `Você é um renomado especialista em medicina antienvelhecimento, gerontologista e pesquisador de longevidade. Calcule a idade biológica do usuário usando marcadores de envelhecimento multidimensionais. Toda a saída DEVE ser em ${lang}. Use APENAS JSON válido SEM formatação markdown.

DADOS DO USUÁRIO:
- Idade cronológica: ${age} anos
- IMC: ${bmi}
- ${sleepInfo}
- ${stressInfo}
- ${activityInfo}
- Status de fumo: ${smokingLabel}

FRAMEWORK DE ANÁLISE DE ENVELHECIMENTO:
Considere estes mecanismos científicos de envelhecimento ao calcular a idade biológica:

1. COMPRIMENTO DOS TELEÔMEROS: Estime a taxa de erosão dos telômeros com base nos fatores de estilo de vida. O tabagismo acelera o encurtamento dos telômeros em 4-6 anos. O estresse crônico reduz a atividade da telomerase. O exercício preserva o comprimento dos telômeros.

2. ESTRESSE OXIDATIVO: Avalie a produção de ERO (espécies reativas de oxigênio) versus a capacidade antioxidante. Dieta ruim, tabagismo e exposição UV aumentam o dano oxidativo. Exercício e antioxidantes atenuam.

3. INFLAMAÇÃO CRÔNICA (Inflamaging): Avalie marcadores de inflamação sistêmica (CRP, IL-6, TNF-alfa equivalentes). Obesidade (IMC>30) aumenta citocinas inflamatórias. Privação do sono eleva a atividade do NF-κB.

4. IDADE EPIGENÉTICA: Considere padrões de metilação de DNA influenciados por dieta (doadores de metil como folato, B12), estresse (metilação mediada por cortisol), exercício (reprogramação epigenética) e exposições ambientais.

5. RESPOSTAS HORMÉTICAS: Avalie o estresse benéfico de exercício (biogênese mitocondrial, autofagia), exposição ao frio e jejum versus estresse crônico mal-adaptativo.

6. SENESCÊNCIA CELULAR: Avalie a carga de senescência de sono ruim, obesidade, comportamento sedentário e tabagismo que aumentam o SASP (fenótipo secretor associado à senescência).

Retorne APENAS um JSON válido com esta estrutura EXATA (sem markdown, sem blocos de código):
{
  "biologicalAge": número (idade biológica estimada em anos, preciso a uma casa decimal),
  "difference": número (idade biológica menos idade cronológica, negativo = mais jovem que a cronológica),
  "agingScore": número (0-100, onde 100 = envelhecimento biológico ideal),
  "factors": [
    {
      "name": "Nome do fator",
      "impact": número (positivo = acelera envelhecimento, negativo = desacelera envelhecimento, em anos),
      "description": "Explicação científica detalhada de como este fator afeta a idade biológica do usuário, referenciando mecanismos específicos"
    }
  ],
  "biomarkers": [
    {
      "name": "Nome do biomarcador (ex: HbA1c, CRP, Comprimento dos Telômeros, Vitamina D, Sensibilidade à Insulina)",
      "currentStatus": "Status estimado atual com base nos dados do usuário (ex: 'elevado', 'ótimo', 'subótimo')",
      "targetStatus": "Status saudável alvo (ex: 'faixa ótima <5.7%')",
      "priority": "high" | "medium" | "low"
    }
  ],
  "riskAssessment": {
    "cardiovascular": {
      "riskLevel": "low" | "moderate" | "high" | "very_high",
      "details": "Fatores de risco cardiovascular específicos e porcentagem ou categoria de risco estimada"
    },
    "metabolic": {
      "riskLevel": "low" | "moderate" | "high" | "very_high",
      "details": "Risco de síndrome metabólica, potencial de resistência à insulina, risco de diabetes"
    },
    "cognitive": {
      "riskLevel": "low" | "moderate" | "high" | "very_high",
      "details": "Risco de doenças neurodegenerativas, fatores de declínio cognitivo"
    }
  },
  "populationComparison": "String detalhada comparando como esta idade biológica se compara às médias populacionais para o grupo etário cronológico do usuário (ex: 'Sua idade biológica de 42,3 é 4,7 anos menor que a média de uma pessoa de 47 anos, colocando você no top 25% do seu grupo etário para marcadores de envelhecimento biológico')",
  "recommendations": [
    {
      "action": "Recomendação prática e específica",
      "timeframe": "Prazo de implementação (ex: 'Iniciar em 2 semanas', 'Hábito diário contínuo')",
      "expectedImpact": "Redução esperada na idade biológica em anos ou meses (ex: '-1,2 anos ao longo de 6 meses')"
    }
  ],
  "improvementPlan": [
    {
      "action": "Item de ação passo a passo detalhado",
      "timeframe": "Prazo específico ou duração (ex: 'Semana 1-2: Fase inicial', 'Mês 1-3: Fase de construção')",
      "expectedImpact": "Resultado esperado mensurável (ex: 'Reduzir glicose de jejum em 10mg/dL', 'Melhorar pontuação de qualidade do sono em 30%')"
    }
  ]
}

Inclua pelo menos 6 fatores, 5 biomarcadores, 3 recomendações de estilo de vida com prazos e 4 etapas do plano de melhoria. Cada recomendação deve ser específica e prática (não genérica). Baseie os cálculos em pesquisas revisadas por pares sobre longevidade, incluindo o relógio epigenético de Horvath, a metodologia do Framingham Risk Score e faixas de referência de biomarcadores estabelecidas. O JSON deve ter TODOS os campos.`;

    const MAX_RETRIES = 3;
    let parsedData: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedText = responseText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        parsedData = JSON.parse(cleanedText);

        if (
          parsedData &&
          typeof parsedData.biologicalAge === "number" &&
          Array.isArray(parsedData.factors) &&
          Array.isArray(parsedData.biomarkers) &&
          parsedData.riskAssessment
        ) {
          break;
        }

        if (attempt < MAX_RETRIES) {
          console.warn(
            `Attempt ${attempt}: AI returned invalid structure, retrying...`
          );
          continue;
        }

        return NextResponse.json(
          {
            error:
              "A IA retornou um formato inválido após várias tentativas.",
          },
          { status: 500, headers }
        );
      } catch (parseError) {
        console.warn(
          `Attempt ${attempt}: JSON parse failed -`,
          parseError
        );
        if (attempt === MAX_RETRIES) {
          return NextResponse.json(
            {
              error:
                "A IA retornou um formato inválido após várias tentativas.",
            },
            { status: 500, headers }
          );
        }
      }
    }

    return NextResponse.json(parsedData, { headers });
  } catch (error: any) {
    console.error("Erro na rota biological-age:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500, headers }
    );
  }
}
