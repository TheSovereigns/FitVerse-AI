import { NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { PLAN_LIMITS, type Plan } from "@/lib/plan-limits"
import { getCorsHeaders } from "@/lib/auth-helpers"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export const maxDuration = 30

async function checkWorkoutLimit(userId: string, plan: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return true;
  
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { count } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const planLimits = PLAN_LIMITS[(plan as Plan) || 'free'];
  const limit = typeof planLimits.workoutsPerMonth === 'number' ? planLimits.workoutsPerMonth : 999;
  return (count ?? 0) < limit
}

const exerciseSchema = z.object({
  name: z.string(),
  sets: z.string(),
  reps: z.string(),
  tempo: z.string().describe("Rep tempo in eccentric-pause-concentric format, e.g. '3-1-2' means 3s eccentric, 1s pause, 2s concentric"),
  rpe: z.number().min(1).max(10).describe("Rate of Perceived Exertion from 1-10"),
  rest: z.string().describe("Recovery time between sets"),
  substitutions: z.array(z.string()).describe("Alternative exercises if primary equipment is unavailable"),
  breathingCue: z.string().describe("Specific breathing instruction, e.g. 'Inhale during eccentric, exhale during concentric'"),
  muscleActivation: z.string().describe("Mind-muscle connection cue, e.g. 'Squeeze glutes at the top'"),
  videoUrl: z.string().optional(),
  images: z.object({
    initial: z.string(),
    execution: z.string(),
    final: z.string(),
  }),
  safetyTips: z.array(z.string()),
  commonMistakes: z.array(z.string()),
  benefits: z.string(),
})

const warmupCooldownExerciseSchema = z.object({
  name: z.string(),
  duration: z.string().describe("Duration for this warmup/cooldown activity, e.g. '2 min' or '30 seconds'"),
  instructions: z.string().describe("Brief instruction for the warmup/cooldown movement"),
  breathingCue: z.string().describe("Breathing instruction for this phase"),
})

const workoutSchema = z.object({
  name: z.string(),
  category: z.enum(["Cardio", "Força", "Flexibilidade", "HIIT", "Funcional"]),
  duration: z.string(),
  difficulty: z.enum(["Iniciante", "Intermediário", "Avançado"]),
  equipment: z.string(),
  muscleGroups: z.array(z.string()),
  calories: z.number(),
  aiVerdict: z.string(),
  warmup: z.array(warmupCooldownExerciseSchema).min(3).describe("Warmup phase with 3-5 preparatory exercises"),
  cooldown: z.array(warmupCooldownExerciseSchema).min(2).describe("Cooldown phase with 2-4 recovery exercises"),
  progressiveOverload: z.object({
    week1: z.string().describe("Starting volume/load for week 1"),
    week2: z.string().describe("Progression for week 2"),
    week3: z.string().describe("Progression for week 3"),
    week4: z.string().describe("Deload or peak week"),
  }).describe("4-week progressive overload plan"),
  exercises: z.array(exerciseSchema),
})

const MAX_RETRIES = 3

export async function POST(req: Request) {
  const headers = getCorsHeaders();
  try {

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers })
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500, headers })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (!user || authError) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401, headers })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const userPlan = profile?.plan || 'free'
    const canProceed = await checkWorkoutLimit(user.id, userPlan)

    if (!canProceed) {
      return NextResponse.json({ 
        error: 'Limite mensal de treinos atingido. Atualize para um plano superior.' 
      }, { status: 403, headers })
    }

    const { level, duration, focus, biotype, locale = "pt-BR" } = await req.json()

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const prompt = isEnglish
      ? `You are an elite certified personal trainer and sports scientist. Generate a highly detailed ${level} workout program focused on ${focus}, with a maximum duration of ${duration} minutes. The user's biotype is ${biotype || "not specified"}.

## WORKOUT STRUCTURE (CRITICAL - Follow this exact structure)

Each workout MUST include these phases IN ORDER:
1. **WARMUP PHASE** (5-8 minutes): 3-5 dynamic warmup exercises specific to the muscle groups being trained. Include mobility work, dynamic stretching, and activation drills.
2. **MAIN WORKOUT**: The core exercises with full technical specifications.
3. **COOLDOWN PHASE** (3-5 minutes): 2-4 static stretches or recovery movements for the worked muscle groups.

## EXERCISE REQUIREMENTS (EVERY exercise MUST have ALL of these):

For EACH exercise, you MUST provide:

- **name**: Exercise name
- **sets**: Number of sets (e.g., "3 séries" / "3 sets")
- **reps**: Repetition count (e.g., "12 repetições" / "12 reps")
- **tempo**: EXACT rep tempo in eccentric-pause-concentric format
  * Example: "3-1-2" = 3 seconds lowering (eccentric), 1 second pause at bottom, 2 seconds lifting (concentric)
  * Example: "4-2-1" = 4 seconds lowering, 2 second pause, 1 second explosive lift
  * Always include the tempo - it controls time under tension
- **rpe**: Rate of Perceived Exertion from 1-10 scale
  * Beginners: aim for RPE 5-7
  * Intermediate: aim for RPE 6-8
  * Advanced: aim for RPE 7-9
  * RPE 10 = absolute failure, avoid this for main compounds
- **rest**: Recovery time between sets
  * Compound lifts: 90-180 seconds
  * Isolation exercises: 45-90 seconds
  * HIIT rest: 15-30 seconds
- **substitutions**: Array of 2-3 alternative exercises if the primary equipment is unavailable
- **breathingCue**: EXACT breathing instruction
  * Example: "Inhale deeply through nose during the eccentric (lowering) phase, exhale forcefully through mouth during the concentric (lifting) phase"
  * Example: "Brace core and hold breath (Valsalva) during the concentric, exhale at the top"
- **muscleActivation**: Mind-muscle connection cue
  * Example: "Focus on squeezing the glutes at the peak contraction for 2 seconds"
  * Example: "Imagine pulling the weight with your elbow, not your hand, to maximize lat engagement"
- **safetyTips**: 3-4 specific form cues to prevent injury
- **commonMistakes**: 2-3 frequent errors with correction tips
- **benefits**: Specific benefits in 1-2 sentences

## PROGRESSIVE OVERLOAD GUIDANCE

Include a 4-week progressive overload plan for this workout:
- Week 1: Foundation week - establish baseline volume and form
- Week 2: Build week - increase volume by 10-15% OR add 1 set to compound movements
- Week 3: Peak week - increase intensity by 5-10% OR add 2 reps per set
- Week 4: Deload week - reduce volume by 40-50% for recovery

## FORM TECHNIQUE GUIDELINES

For each exercise, include specific form cues:
- Joint alignment and positioning
- Range of motion targets
- Key checkpoints during the movement
- How to identify and fix common form breakdowns

## OUTPUT FORMAT

Provide:
- Motivating workout name that reflects the training focus
- Category (Cardio, Strength, Flexibility, HIIT, Functional)
- Total duration (should not exceed ${duration} minutes)
- Difficulty level: ${level}
- Required equipment
- Muscle groups worked
- Estimated calories burned
- AI Verdict: 2-3 sentences explaining WHY this workout structure is optimal for the user's goal and biotype

ALL output must be in ${lang}. Be technical, specific, and results-focused.`
      : `Você é um personal trainer elite certificado e cientista do esporte. Gere um programa de treino altamente detalhado de nível ${level} focado em ${focus}, com duração máxima de ${duration} minutos. O biotipo do usuário é ${biotype || "não especificado"}.

## ESTRUTURA DO TREINO (CRÍTICO - Siga esta estrutura exata)

Cada treino DEVE incluir estas fases NA ORDEM:
1. **FASE DE AQUECIMENTO** (5-8 minutos): 3-5 exercícios dinâmicos de aquecimento específicos para os grupos musculares que serão treinados. Inclua trabalho de mobilidade, alongamento dinâmico e exercícios de ativação.
2. **TREINO PRINCIPAL**: Os exercícios centrais com especificações técnicas completas.
3. **FASE DE VOLTA À CALMA** (3-5 minutos): 2-4 alongamentos estáticos ou movimentos de recuperação para os músculos trabalhados.

## REQUISITOS DOS EXERCÍCIOS (CADA exercício DEVE ter TODOS estes elementos):

Para CADA exercício, você DEVE fornecer:

- **name**: Nome do exercício
- **sets**: Número de séries (ex: "3 séries")
- **reps**: Contagem de repetições (ex: "12 repetições")
- **tempo**: Tempo EXATO de repetição no formato excêntrico-pausa-concêntrico
  * Exemplo: "3-1-2" = 3 segundos descendo (excêntrico), 1 segundo pausa na parte inferior, 2 segundos subindo (concêntrico)
  * Exemplo: "4-2-1" = 4 segundos descendo, 2 segundos pausa, 1 segundo subida explosiva
  * SEMPRE inclua o tempo - ele controla a tensão temporal
- **rpe**: Taxa de Esforço Percebido na escala de 1-10
  * Iniciantes: mirar em RPE 5-7
  * Intermediários: mirar em RPE 6-8
  * Avançados: mirar em RPE 7-9
  * RPE 10 = falha absoluta, evite isso em compostos principais
- **rest**: Tempo de recuperação entre séries
  * Exercícios compostos: 90-180 segundos
  * Exercícios de isolamento: 45-90 segundos
  * Descanso HIIT: 15-30 segundos
- **substitutions**: Array de 2-3 exercícios alternativos se o equipamento primário não estiver disponível
- **breathingCue**: Instrução EXATA de respiração
  * Exemplo: "Inspire profundamente pelo nariz durante a fase excêntrica (descida), expire vigorosamente pela boca durante a fase concêntrica (subida)"
  * Exemplo: "Trave o core e segure a respiração (Valsalva) durante a concêntrica, expire no topo"
- **muscleActivation**: Dica de conexão mente-músculo
  * Exemplo: "Foque em contrair os glúteos no ponto de contração máxima por 2 segundos"
  * Exemplo: "Imagine puxar o peso com o cotovelo, não com a mão, para maximizar o engajamento dorsal"
- **safetyTips**: 3-4 dicas específicas de forma para prevenir lesões
- **commonMistakes**: 2-3 erros frequentes com dicas de correção
- **benefits**: Benefícios específicos em 1-2 frases

## ORIENTAÇÃO DE SOBRECARGA PROGRESSIVA

Inclua um plano de sobrecarga progressiva de 4 semanas para este treino:
- Semana 1: Semana de fundação - estabelecer volume e forma basais
- Semana 2: Semana de construção - aumentar volume em 10-15% OU adicionar 1 série aos compostos
- Semana 3: Semana de pico - aumentar intensidade em 5-10% OU adicionar 2 repetições por série
- Semana 4: Semana de deload - reduzir volume em 40-50% para recuperação

## DIRETRIZES DE TÉCNICA E FORMA

Para cada exercício, inclua dicas específicas de forma:
- Alinhamento e posicionamento articulares
- Metas de amplitude de movimento
- Pontos de verificação-chave durante o movimento
- Como identificar e corrigir falhas comuns na forma

## FORMATO DE SAÍDA

Forneça:
- Nome motivador do treino que reflita o foco do treinamento
- Categoria (Cardio, Força, Flexibilidade, HIIT, Funcional)
- Duração total (não deve exceder ${duration} minutos)
- Nível de dificuldade: ${level}
- Equipamento necessário
- Grupos musculares trabalhados
- Calorias queimadas estimadas
- Veredito da IA: 2-3 frases explicando POR QUE a estrutura deste treino é ideal para o objetivo e biotipo do usuário

TODA a saída deve ser em ${lang}. Seja técnico, específico e focado em resultados.`

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { object } = await generateObject({
          model: google("gemini-3.5-flash"),
          schema: workoutSchema,
          prompt,
          temperature: 0.7,
        })

        await supabase.from('workouts').insert({
          user_id: user.id,
          name: object.name || 'Generated Workout',
          category: object.category || 'Força',
          duration: object.duration || '30 min',
          difficulty: object.difficulty || 'Intermediário',
        })

        return NextResponse.json({ workouts: [object] }, { headers })
      } catch (parseError) {
        lastError = parseError instanceof Error ? parseError : new Error(String(parseError))
        console.error(`[Fitverse] Attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message)
        
        if (attempt === MAX_RETRIES) break
      }
    }

    return NextResponse.json(
      { error: "Failed to generate valid workout after retries", details: lastError?.message || "Unknown error" },
      { status: 500, headers },
    )
  } catch (error) {
    console.error("[Fitverse] Error generating workouts:", error)
    return NextResponse.json(
      { error: "Failed to generate workouts", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers },
    )
  }
}
