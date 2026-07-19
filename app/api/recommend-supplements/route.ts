import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCorsHeaders } from "@/lib/auth-helpers";

const MAX_RETRIES = 3;

async function generateWithRetry(model: any, prompt: string): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
      const parsed = JSON.parse(cleanedText);
      if (parsed && Array.isArray(parsed.supplements) && parsed.supplements.length > 0) {
        return cleanedText;
      }
      lastError = new Error("Parsed JSON missing 'supplements' array.");
    } catch (e: any) {
      lastError = e;
      console.warn(`Retry ${attempt}/${MAX_RETRIES}: JSON parse failed — ${e.message}`);
    }
  }
  throw lastError;
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const headers = getCorsHeaders();
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 401, headers });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Configuracao do servidor incompleta." }, { status: 500, headers });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (!user || authError) {
      return NextResponse.json({ error: "Token invalido." }, { status: 401, headers });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500, headers });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const body = await req.json();
    const {
      age,
      gender,
      goal,
      dietaryRestrictions,
      sleepQuality,
      stressLevel,
      activityLevel,
      medicalConditions,
      medications,
      locale = "pt-BR",
    } = body;

    const isEnglish = locale === "en-US";

    const genderLabel = isEnglish
      ? gender === "male"
        ? "Male"
        : "Female"
      : gender === "male"
        ? "Masculino"
        : "Feminino";

    const goalLabel = isEnglish
      ? goal === "lose_weight"
        ? "Lose weight"
        : goal === "gain_muscle"
          ? "Gain muscle mass"
          : "Maintain weight"
      : goal === "lose_weight"
        ? "Perder peso"
        : goal === "gain_muscle"
          ? "Ganhar massa muscular"
          : "Manter peso";

    const restrictionsList = dietaryRestrictions?.length
      ? isEnglish
        ? `Dietary restrictions: ${dietaryRestrictions.join(", ")}`
        : `Restrições alimentares: ${dietaryRestrictions.join(", ")}`
      : isEnglish
        ? "No dietary restrictions"
        : "Sem restrições alimentares";

    const sleepInfo = sleepQuality
      ? isEnglish
        ? `Sleep quality: ${sleepQuality}`
        : `Qualidade do sono: ${sleepQuality}`
      : "";

    const stressInfo = stressLevel
      ? isEnglish
        ? `Stress level: ${stressLevel}`
        : `Nível de estresse: ${stressLevel}`
      : "";

    const activityInfo = activityLevel
      ? isEnglish
        ? `Activity level: ${activityLevel}`
        : `Nível de atividade: ${activityLevel}`
      : "";

    const medicalInfo = medicalConditions?.length
      ? isEnglish
        ? `Medical conditions: ${medicalConditions.join(", ")}`
        : `Condições médicas: ${medicalConditions.join(", ")}`
      : "";

    const medicationInfo = medications?.length
      ? isEnglish
        ? `Current medications: ${medications.join(", ")}`
        : `Medicamentos atuais: ${medications.join(", ")}`
      : "";

    const systemPreamble = isEnglish
      ? `You are a world-class clinical nutritionist, functional medicine practitioner, and supplement research expert with deep knowledge of biochemistry, pharmacology, and evidence-based nutrition. You recommend supplements grounded in peer-reviewed research, clinical trials, and mechanistic biochemistry. You must account for realistic constraints: budget, accessibility, dietary restrictions, medication interactions, and individual physiology.`
      : `Você é um nutricionista clínico de classe mundial, praticante de medicina funcional e especialista em pesquisa de suplementos com profundo conhecimento de bioquímica, farmacologia e nutrição baseada em evidências. Você recomenda suplementos fundamentados em pesquisas revisadas por pares, ensaios clínicos e bioquímica mecanicista. Você deve considerar restrições realistas: orçamento, acessibilidade, restrições alimentares, interações medicamentosas e fisiologia individual.`;

    const detailedPromptEnglish = `${systemPreamble}

USER PROFILE:
- Age: ${age} years
- Gender: ${genderLabel}
- Goal: ${goalLabel}
- ${restrictionsList}
- ${sleepInfo}
- ${stressInfo}
- ${activityInfo}
- ${medicalInfo}
- ${medicationInfo}

INSTRUCTIONS — Create a personalized supplement stack with clinical precision:

1. EVIDENCE-BASED RECOMMENDATIONS: Every supplement must have a clear mechanistic rationale. Reference approximate effect sizes or study types when possible (e.g., "meta-analysis shows 15% reduction in inflammatory markers" or "RCT demonstrated improved sleep latency"). Do NOT recommend supplements with no meaningful evidence.

2. SYNERGY EFFECTS: Identify and leverage synergy pairs between supplements. For each supplement, specify which other recommended supplements it synergizes with and explain WHY. Examples:
   - Vitamin D3 + K2: K2 directs calcium to bones, preventing arterial calcification when supplementing D3
   - Magnesium + Vitamin B6: B6 enhances intracellular magnesium absorption
   - Iron + Vitamin C: Vitamin C reduces ferric iron to ferrous form, increasing absorption 2-3x
   - Omega-3 + Vitamin E: Vitamin E prevents peroxidation of polyunsaturated fatty acids
   - Zinc + Copper: Long-term zinc supplementation depletes copper; co-supplementation prevents imbalance
   - Curcumin + Piperine: Piperine increases curcumin bioavailability by 2000%

3. INTERACTION WARNINGS: For each supplement, list any known negative interactions with medications, other supplements, or food. Examples:
   - Iron competes with calcium, zinc, and copper for absorption — separate dosing times
   - Vitamin K2 interacts with anticoagulant medications (warfarin) — flag if user is on blood thinners
   - St. John's Wort interacts with antidepressants, birth control, and immunosuppressants
   - High-dose Vitamin E may increase bleeding risk with anticoagulants
   - NAC may interact with nitroglycerin and blood pressure medications
   If no interactions, state "None identified."

4. BIOAVAILABILITY OPTIMIZATION: For each supplement, specify:
   - The most bioavailable form (e.g., methylcobalamin vs cyanocobalamin for B12, bisglycinate vs oxide for magnesium, methylfolate vs folic acid)
   - Fat-soluble vs water-soluble considerations
   - Whether it should be taken with fat, on empty stomach, or with specific foods
   - Chelation or delivery mechanisms that enhance absorption (e.g., threonate for magnesium crosses BBB, PQQ for CoQ10 uptake)

5. TIMING OPTIMIZATION: Specify exact timing with rationale:
   - Morning (with breakfast): energizing supplements, B-complex, iron (with vitamin C, away from calcium)
   - Lunch/Afternoon: CoQ10, fat-soluble vitamins with lunch fat
   - Pre-workout: creatine, beta-alanine, citrulline (timing relative to exercise)
   - Evening/Before bed: magnesium glycinate, melatonin, calming adaptogens (ashwagandha)
   - Separation rules: calcium/iron 2+ hours apart, fat-solubles together

6. QUALITY MARKERS: For each supplement recommend, specify:
   - Preferred form (e.g., "magnesium bisglycinate" not "magnesium oxide")
   - Third-party testing to look for (NSF, USP, Informed Sport, ConsumerLab)
   - What to avoid (magnesium oxide is poorly absorbed, cyanocobalamin is inferior, etc.)
   - Synthetic vs natural distinction where relevant

7. BUDGET ALTERNATIVES: For each essential supplement, provide a budget-friendly alternative or generic option. Indicate if the supplement is commonly available at pharmacies vs specialty stores.

8. CYCLE RECOMMENDATIONS: Specify cycling protocols where applicable:
   - Creatine: loading phase (20g/day × 5-7 days) then maintenance (3-5g/day), no need to cycle off
   - Ashwagandha: 8 weeks on, 2 weeks off to prevent tolerance
   - Melatonin: use lowest effective dose (0.3-1mg), avoid long-term dependence
   - NAC: 3 months on, 1 month off for long-term use
   - Adaptogens generally: cycle on/off to maintain sensitivity

9. DIETARY RESTRICTION AWARENESS: STRICTLY avoid recommending any supplement derived from restricted foods. Examples:
   - Vegan: no fish oil (use algal DHA/EPA), no gelatin capsules, no whey, no collagen from animal sources
   - Halal/Kosher: flag any animal-derived supplements
   - Soy-free: check for soy-based lecithin in softgels
   - Gluten-free: some supplement capsules contain gluten

10. PRIORITIZATION: Rank supplements by priority:
    - "essential": directly addresses a critical gap or the user's primary goal
    - "important": supports overall health optimization
    - "optional": nice-to-have but not critical

RECOMMEND 4-8 supplements total. Be selective — quality over quantity. If the user already gets sufficient nutrients from their diet, acknowledge that rather than recommending redundant supplements.

Return ONLY valid JSON with this EXACT structure (no markdown, no commentary):
{
  "supplements": [
    {
      "name": "Supplement name",
      "dosage": "Precise dosage (e.g. '5000 IU', '200mg elemental magnesium')",
      "timing": "Specific timing with rationale (e.g. 'Morning with breakfast containing fat — fat-soluble vitamin requiring dietary fat for absorption')",
      "reason": "Clinical rationale for this specific user profile, referencing their goals and any deficiencies implied by their lifestyle",
      "priority": "essential" | "important" | "optional",
      "form": "Specific bioavailable form (e.g. 'Magnesium bisglycinate chelate', 'Methylcobalamin', 'Ubiquinol CoQ10')",
      "synergyWith": ["Names of other recommended supplements this pairs with"],
      "interactions": ["Any medication or supplement interactions to be aware of, or 'None identified'"],
      "bioavailabilityTips": "How to maximize absorption (e.g. 'Take with 5g of fat, avoid taking with calcium-rich foods')",
      "researchSupport": "Brief citation of key evidence (e.g. 'Meta-analysis (2021, n=1200) showed 23% improvement in sleep quality')",
      "cycleRecommendation": "Cycling protocol (e.g. 'Continuous use, no cycling needed' or '8 weeks on / 2 weeks off')",
      "budgetAlternative": "More affordable equivalent option"
    }
  ]
}`;

    const detailedPromptPortuguese = `${systemPreamble}

PERFIL DO USUÁRIO:
- Idade: ${age} anos
- Gênero: ${genderLabel}
- Objetivo: ${goalLabel}
- ${restrictionsList}
- ${sleepInfo}
- ${stressInfo}
- ${activityInfo}
- ${medicalInfo}
- ${medicationInfo}

INSTRUÇÕES — Crie um stack de suplementos personalizado com precisão clínica:

1. RECOMENDAÇÕES BASEADAS EM EVIDÊNCIAS: Cada suplemento deve ter uma justificativa mecanística clara. Referencie tamanhos de efeito aproximados ou tipos de estudos quando possível (por exemplo, "meta-análise mostra redução de 15% nos marcadores inflamatórios" ou "ensaio clínico demonstrou melhoria na latência do sono"). NÃO recomende suplementos sem evidências significativas.

2. EFEITOS DE SINERGIA: Identifique e aproveite pares de sinergia entre suplementos. Para cada suplemento, especifique com quais outros suplementos recomendados ele tem sinergia e explique o PORQUÊ. Exemplos:
   - Vitamina D3 + K2: K2 direciona o cálcio para os ossos, prevenindo calcificação arterial ao suplementar D3
   - Magnésio + Vitamina B6: B6 melhora a absorção intracelular de magnésio
   - Ferro + Vitamina C: Vitamina C reduz ferro férrico para ferroso, aumentando a absorção em 2-3x
   - Ômega-3 + Vitamina E: Vitamina E previne a peroxidação de ácidos graxos poli-insaturados
   - Zinco + Cobre: A suplementação prolongada de zinco depleta cobre; co-suplementação previne desequilíbrio
   - Curcumina + Piperina: Piperina aumenta a biodisponibilidade da curcumina em 2000%

3. AVISOS DE INTERAÇÃO: Para cada suplemento, liste quaisquer interações negativas conhecidas com medicamentos, outros suplementos ou alimentos. Exemplos:
   - Ferro compete com cálcio, zinco e cobre pela absorção — separar horários de administração
   - Vitamina K2 interage com medicamentos anticoagulantes (varfarina) — sinalizar se o usuário toma anticoagulantes
   - Hipericão interage com antidepressivos, anticoncepcionais e imunossupressores
   - Vitamina E em altas doses pode aumentar o risco de sangramento com anticoagulantes
   - NAC pode interagir com nitroglicerina e medicamentos para pressão arterial
   Se não houver interações, declare "Nenhuma identificada."

4. OTIMIZAÇÃO DA BIODISPONIBILIDADE: Para cada suplemento, especifique:
   - A forma mais biodisponível (por exemplo, metilcobalamina vs cianocobalamina para B12, bisglicinato vs óxido para magnésio, metilfolato vs ácido fólico)
   - Considerações de solúveis em gordura vs solúveis em água
   - Se deve ser tomado com gordura, em jejum ou com alimentos específicos
   - Mecanismos de quelatação ou entrega que aumentam a absorção (por exemplo, treonato para magnésio cruza a barreira hematoencefálica, PQQ para absorção de CoQ10)

5. OTIMIZAÇÃO DO HORÁRIO: Especifique o horário exato com justificativa:
   - Manhã (com café da manhã): suplementos energizantes, complexo B, ferro (com vitamina C, longe do cálcio)
   - Almoço/Tarde: CoQ10, vitaminas solúveis em gordura com a gordura do almoço
   - Pré-treino: creatina, beta-alanina, citrulina (tempo em relação ao exercício)
   - Noite/Antes de dormir: magnésio glicinato, melatonina, adaptógenos calmantes (ashwagandha)
   - Regras de separação: cálcio/ferro 2+ horas de distância

6. MARCADORES DE QUALIDADE: Para cada suplemento recomendado, especifique:
   - Forma preferida (por exemplo, "magnésio bisglicinato" não "magnésio óxido")
   - Testes de terceiros a procurar (NSF, USP, Informed Sport, ConsumerLab)
   - O que evitar (magnésio óxido é mal absorvido, cianocobalamina é inferior, etc.)
   - Distinguir sintético vs natural quando relevante

7. ALTERNATIVAS ECONÔMICAS: Para cada suplemento essencial, forneça uma alternativa econômica ou genérica. Indique se o suplemento é comumente disponível em farmácias vs lojas especializadas.

8. RECOMENDAÇÕES DE CICLAGEM: Especifique protocolos de ciclagem quando aplicável:
   - Creatina: fase de carga (20g/dia × 5-7 dias) depois manutenção (3-5g/dia), não precisa ciclar
   - Ashwagandha: 8 semanas ligado, 2 semanas desligado para prevenir tolerância
   - Melatonina: usar a menor dose eficaz (0,3-1mg), evitar dependência a longo prazo
   - NAC: 3 meses ligado, 1 mês desligado para uso contínuo
   - Adaptógenos geralmente: ciclar ligado/desligado para manter sensibilidade

9. CONSCIÊNCIA DE RESTRIÇÕES ALIMENTARES: EVITE ESTRICTAMENTE recomendar qualquer suplemento derivado de alimentos restritos. Exemplos:
   - Vegano: sem óleo de peixe (use DHA/EPA algal), sem cápsulas de gelatina, sem whey, sem colágeno de origem animal
   - Halal/Kosher: sinalizar qualquer suplemento de origem animal
   - Sem soja: verificar se há lecitina de soja em cápsulas moles
   - Sem glúten: algumas cápsulas de suplementos contêm glúten

10. PRIORIZAÇÃO: Classifique suplementos por prioridade:
    - "essencial": aborda diretamente uma lacuna crítica ou o objetivo principal do usuário
    - "importante": apoia a otimização geral da saúde
    - "opcional": bom ter mas não é crítico

RECOMENDE 4-8 suplementos no total. Seja seletivo — qualidade sobre quantidade. Se o usuário já obtém nutrientes suficientes de sua dieta, reconheça isso em vez de recomendar suplementos redundantes.

Retorne APENAS JSON válido com esta estrutura EXATA (sem markdown, sem comentários):
{
  "supplements": [
    {
      "name": "Nome do suplemento",
      "dosage": "Dosagem precisa (ex: '5000 UI', '200mg de magnésio elementar')",
      "timing": "Horário específico com justificativa (ex: 'Manhã com café da manhã contendo gordura — vitamina solúvel em gordura que requer gordura dietética para absorção')",
      "reason": "Justificativa clínica para este perfil específico de usuário, referenciando seus objetivos e quais deficiências implícitas por seu estilo de vida",
      "priority": "essencial" | "importante" | "opcional",
      "form": "Forma biodisponível específica (ex: 'Bisglicinato de magnésio quelado', 'Metilcobalamina', 'Ubiquinol CoQ10')",
      "synergyWith": ["Nomes dos outros suplementos recomendados que se combinam"],
      "interactions": ["Quaisquer interações com medicamentos ou suplementos a ter em mente, ou 'Nenhuma identificada'"],
      "bioavailabilityTips": "Como maximizar a absorção (ex: 'Tomar com 5g de gordura, evitar tomar com alimentos ricos em cálcio')",
      "researchSupport": "Breve citação da evidência-chave (ex: 'Meta-análise (2021, n=1200) mostrou melhoria de 23% na qualidade do sono')",
      "cycleRecommendation": "Protocolo de ciclagem (ex: 'Uso contínuo, ciclagem desnecessária' ou '8 semanas ligado / 2 semanas desligado')",
      "budgetAlternative": "Opção equivalente mais acessível"
    }
  ]
}`;

    const prompt = isEnglish ? detailedPromptEnglish : detailedPromptPortuguese;

    let cleanedText: string;
    try {
      cleanedText = await generateWithRetry(model, prompt);
    } catch (retryError: any) {
      console.error("AI returned invalid JSON after retries:", retryError?.message);
      return NextResponse.json(
        { error: "A IA retornou um formato inválido após múltiplas tentativas." },
        { status: 500, headers }
      );
    }

    const data = JSON.parse(cleanedText);
    return NextResponse.json(data, { headers });
  } catch (error: any) {
    console.error("Erro na rota recommend-supplements:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500, headers }
    );
  }
}
