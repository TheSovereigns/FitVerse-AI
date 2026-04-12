import { NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const PLAN_LIMITS = {
  free: { workoutsPerMonth: 0 },
  pro: { workoutsPerMonth: 5 },
  premium: { workoutsPerMonth: Infinity },
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export const maxDuration = 30

async function checkWorkoutLimit(userId: string, plan: string): Promise<boolean> {
  if (!supabase) return true;
  
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { count } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.workoutsPerMonth ?? 0
  return (count ?? 0) < limit
}

const workoutsSchema = z.object({
  workouts: z.array(
    z.object({
      name: z.string(),
      category: z.enum(["Cardio", "Força", "Flexibilidade", "HIIT", "Funcional"]),
      duration: z.string(),
      difficulty: z.enum(["Iniciante", "Intermediário", "Avançado"]),
      equipment: z.string(),
      muscleGroups: z.array(z.string()),
      calories: z.number(),
      aiVerdict: z.string(),
      exercises: z.array(
        z.object({
          name: z.string(),
          sets: z.string(),
          reps: z.string(),
          rest: z.string(),
          videoUrl: z.string().optional(),
          images: z.object({
            initial: z.string(),
            execution: z.string(),
            final: z.string(),
          }),
          safetyTips: z.array(z.string()),
          commonMistakes: z.array(z.string()),
          benefits: z.string(),
        }),
      ),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers })
    }

    const token = authHeader.replace('Bearer ', '')
    
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
      ? `Generate a ${level} workout focused on ${focus}, with maximum duration of ${duration}. The user has biotype ${biotype || "not specified"}. List exercises with sets, reps, and rest. All output must be in ${lang}.

For each workout, provide:
- Motivating workout name
- Category (Cardio, Strength, Flexibility, HIIT, Functional)
- Total duration
- Difficulty level
- Required equipment
- Muscle groups worked
- Estimated calories burned
- AI Verdict: Explain in 2-3 sentences WHY this workout is ideal for the person's goal

For each exercise in the workout:
- Exercise name
- Sets and reps (e.g., "3 sets", "12 reps")
- Rest time
- URLs of placeholder images for:
  * Starting position: /placeholder.svg?height=200&width=300&query=exercise+[name]+starting+position
  * Execution: /placeholder.svg?height=200&width=300&query=exercise+[name]+execution
  * Final position: /placeholder.svg?height=200&width=300&query=exercise+[name]+final+position
- List of 3-4 safety tips to avoid injuries
- List of 2-3 common mistakes people make
- Specific benefits of this exercise (1-2 sentences)

Be specific, technical, and focused on results. The workouts must be practical and efficient.`
      : `Gere um treino de ${level} focado em ${focus}, com duração máxima de ${duration}. O usuário possui biotipo ${biotype || "não especificado"}. Liste exercícios com séries, repetições e descanso.

    Além disso, forneça para cada treino:

- Nome motivador do treino
- Categoria (Cardio, Força, Flexibilidade, HIIT, Funcional)
- Duração total
- Nível de dificuldade
- Equipamento necessário
- Grupos musculares trabalhados
- Calorias queimadas estimadas
- Veredito da IA: Explique em 2-3 frases POR QUE este treino é ideal para o objetivo da pessoa

Para cada exercício no treino:
- Nome do exercício
- Séries e repetições (ex: "3 séries", "12 repetições")
- Tempo de descanso
- URLs de imagens placeholders para:
  * Posição inicial: /placeholder.svg?height=200&width=300&query=exercise+[nome]+starting+position
  * Execução: /placeholder.svg?height=200&width=300&query=exercise+[nome]+execution
  * Posição final: /placeholder.svg?height=200&width=300&query=exercise+[nome]+final+position
- Lista de 3-4 dicas de segurança para evitar lesões
- Lista de 2-3 erros comuns que as pessoas cometem
- Benefícios específicos deste exercício (1-2 frases)

Seja específico, técnico e focado em resultados. Os treinos devem ser práticos e eficientes.`

    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: workoutsSchema,
      prompt,
      temperature: 0.7,
    })

    await supabase.from('workouts').insert({
      user_id: user.id,
      name: object.workouts[0]?.name || 'Generated Workout',
      category: object.workouts[0]?.category || 'Força',
      duration: object.workouts[0]?.duration || '30 min',
      difficulty: object.workouts[0]?.difficulty || 'Intermediário',
    })

    return NextResponse.json({ workouts: object.workouts })
  } catch (error) {
    console.error("[Fitverse] Error generating workouts:", error)
    return NextResponse.json(
      { error: "Failed to generate workouts", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
