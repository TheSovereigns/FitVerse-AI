import { NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { PLAN_LIMITS, type Plan } from "@/lib/plan-limits"
import { getCorsHeaders } from "@/lib/auth-helpers"

function getGoogle() {
  return createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  })
}

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
  tempo: z.string().describe("Rep tempo in eccentric-pause-concentric format, e.g. '3-1-2'"),
  rpe: z.number().min(1).max(10),
  rest: z.string(),
  substitutions: z.array(z.string()),
  breathingCue: z.string(),
  muscleActivation: z.string(),
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
  duration: z.string(),
  instructions: z.string(),
  breathingCue: z.string(),
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
  warmup: z.array(warmupCooldownExerciseSchema).min(3),
  cooldown: z.array(warmupCooldownExerciseSchema).min(2),
  progressiveOverload: z.object({
    week1: z.string(),
    week2: z.string(),
    week3: z.string(),
    week4: z.string(),
  }),
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
      ? `Generate a ${level} workout focused on ${focus}, max ${duration} min. Biotype: ${biotype || "not specified"}.

Structure: warmup (3-5 dynamic exercises, 5-8 min) → main exercises → cooldown (2-4 stretches, 3-5 min).

For EACH exercise provide ALL fields:
- name, sets, reps
- tempo: eccentric-pause-concentric format (e.g. "3-1-2")
- rpe: 1-10 (beginners 5-7, intermediate 6-8, advanced 7-9)
- rest: compounds 90-180s, isolation 45-90s, HIIT 15-30s
- substitutions: 2-3 alternatives
- breathingCue: e.g. "Inhale during eccentric, exhale during concentric"
- muscleActivation: mind-muscle cue (e.g. "Squeeze glutes at top")
- safetyTips: 3-4 form cues
- commonMistakes: 2-3 errors with fixes
- benefits: 1-2 sentences
- images: {initial, execution, final} image URLs

Progressive overload (4 weeks): W1 foundation → W2 +10-15% volume → W3 +5-10% intensity → W4 deload -40-50%.

Output: name, category, duration, difficulty, equipment, muscleGroups, calories, aiVerdict (2-3 sentences on why optimal for this goal/biotype).
ALL output in ${lang}. Technical, specific, results-focused.`
      : `Gere um treino de nível ${level} focado em ${focus}, duração máxima ${duration} min. Biotipo: ${biotype || "não especificado"}.

Estrutura: aquecimento (3-5 exercícios dinâmicos, 5-8 min) → exercícios principais → volta à calma (2-4 alongamentos, 3-5 min).

Para CADA exercício forneça TODOS os campos:
- name, sets, reps
- tempo: formato excêntrico-pausa-concêntrico (ex: "3-1-2")
- rpe: 1-10 (iniciantes 5-7, intermediários 6-8, avançados 7-9)
- rest: compostos 90-180s, isolamento 45-90s, HIIT 15-30s
- substitutions: 2-3 alternativas
- breathingCue: ex: "Inspire no excêntrico, expire no concêntrico"
- muscleActivation: dica mente-músculo (ex: "Contraia glúteos no topo")
- safetyTips: 3-4 dicas de forma
- commonMistakes: 2-3 erros com correções
- benefits: 1-2 frases
- images: {initial, execution, final} URLs de imagens

Sobrecarga progressiva (4 semanas): S1 fundação → S2 +10-15% volume → S3 +5-10% intensidade → S4 deload -40-50%.

Saída: name, category, duration, difficulty, equipment, muscleGroups, calories, aiVerdict (2-3 frases).
TODA saída em ${lang}. Técnico, específico, focado em resultados.`

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { object } = await generateObject({
          model: getGoogle()("gemini-3.5-flash"),
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
