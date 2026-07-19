import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit"
import { getCorsHeaders } from "@/lib/auth-helpers"

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin()
  const headers = getCorsHeaders()

  const rlKey = getRateLimitKey(req, "generate")
  const rl = checkRateLimit(rlKey, RATE_LIMITS.generate)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers })
  }

  try {

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
    if (!supabase) return NextResponse.json({ error: "Server config incomplete" }, { status: 500, headers })

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)
    if (!user || authError) return NextResponse.json({ error: "Invalid token" }, { status: 401, headers })

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "API Key not configured" }, { status: 500, headers })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    })

    const body = await req.json()
    const {
      weight, height, age, gender, activityLevel = "moderate", goal,
      sleepHours = 7, sleepQuality = "good", stressLevel = "moderate",
      injuries = [], equipment = [], dietaryRestrictions = [],
      experience = "beginner", workoutsPerWeek = 3, locale = "pt-BR",
    } = body

    const isEnglish = locale === "en-US"
    const lang = isEnglish ? "English" : "Portuguese"

    const genderLabel = isEnglish
      ? gender === "male"
        ? "Male"
        : "Female"
      : gender === "male"
        ? "Masculino"
        : "Feminino"

    const goalLabel = isEnglish
      ? goal === "lose_weight"
        ? "Lose weight"
        : goal === "gain_muscle"
          ? "Gain muscle mass"
          : goal === "improve_health"
            ? "Improve overall health"
            : "Maintain weight"
      : goal === "lose_weight"
        ? "Perder peso"
        : goal === "gain_muscle"
          ? "Ganhar massa muscular"
          : goal === "improve_health"
            ? "Melhorar saude geral"
            : "Manter peso"

    const prompt = `Act as an elite sports nutritionist and biohacking expert. Create a COMPREHENSIVE personalized metabolic plan. All output in ${lang}.

USER PROFILE:
- Weight: ${weight}kg | Height: ${height}cm | Age: ${age} years | Gender: ${genderLabel}
- Activity Level: ${activityLevel} | Goal: ${goalLabel}
- Sleep: ${sleepHours}h/night, quality: ${sleepQuality}
- Stress Level: ${stressLevel}
- Injuries: ${injuries?.length > 0 ? injuries.join(", ") : "None"}
- Available Equipment: ${equipment?.length > 0 ? equipment.join(", ") : "None"}
- Dietary Restrictions: ${dietaryRestrictions?.length > 0 ? dietaryRestrictions.join(", ") : "None"}
- Training Experience: ${experience}
- Workouts per Week: ${workoutsPerWeek}

Return ONLY a valid JSON with this EXACT structure (no markdown):
{
  "macros": {
    "calories": number,
    "protein": number (percentage),
    "proteinGrams": number,
    "carbs": number (percentage),
    "carbsGrams": number,
    "fat": number (percentage),
    "fatGrams": number
  },
  "diet": {
    "title": "Diet name",
    "summary": "Summary in 1 sentence",
    "meals": [
      {"name": "Breakfast", "items": ["item1 with portion", "item2 with portion"], "time": "7:00", "calories": 400},
      {"name": "Morning Snack", "items": ["item1"], "time": "10:00", "calories": 200},
      {"name": "Lunch", "items": ["item1", "item2", "item3"], "time": "12:00", "calories": 600},
      {"name": "Afternoon Snack", "items": ["item1"], "time": "15:00", "calories": 200},
      {"name": "Dinner", "items": ["item1", "item2"], "time": "19:00", "calories": 500},
      {"name": "Pre-bed (optional)", "items": ["item1"], "time": "21:00", "calories": 150}
    ],
    "hydration": "water intake recommendation",
    "supplements": ["supplement1 with dosage", "supplement2 with dosage"]
  },
  "workout": {
    "name": "Workout plan name",
    "daysPerWeek": ${workoutsPerWeek || 3},
    "weeklySchedule": [
      {
        "day": "Monday",
        "focus": "Chest & Triceps",
        "duration": "45 min",
        "exercises": [
          {
            "name": "Exercise name",
            "sets": "3-4",
            "reps": "8-12",
            "rest": "60-90s",
            "muscle_group": "primary muscle",
            "safety_tip": "form cue",
            "calories": 50
          }
        ]
      }
    ],
    "warmup": ["warmup exercise 1", "warmup exercise 2"],
    "cooldown": ["cooldown exercise 1", "cooldown exercise 2"],
    "progression": "how to progress week by week"
  },
  "healthInsights": {
    "sleepOptimization": "personalized sleep advice based on their sleep data",
    "stressManagement": "stress reduction techniques based on their stress level",
    "injuryPrevention": "specific advice for their injuries/limitations",
    "longevityTips": ["tip1", "tip2", "tip3"]
  },
  "prediction": {
    "weeks": number,
    "explanation": "Detailed explanation of expected timeline"
  },
  "dailyHabits": {
    "morning": ["habit1", "habit2"],
    "preWorkout": ["habit1"],
    "postWorkout": ["habit1"],
    "evening": ["habit1", "habit2"]
  }
}

Calculate macros using TDEE (Mifflin-St Jeor) and adjust for their goal. The workout must respect their injuries and available equipment. Make the diet respect dietary restrictions. Be specific with portions and timing.`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim()

    try {
      const data = JSON.parse(cleanedText)

      if (supabase) {
        await supabase.from("metabolic_plans").insert({
          user_id: user.id,
          perfil: { weight, height, age, gender, activityLevel, goal, sleepHours, sleepQuality, stressLevel, injuries, equipment, dietaryRestrictions, experience, workoutsPerWeek },
          macros: data.macros,
          meals: data.diet?.meals || [],
        }).then(() => {})

        await supabase.from("workouts").insert({
          user_id: user.id,
          name: data.workout?.name || "Plano de Treino",
          exercises: data.workout?.weeklySchedule || [],
          duration_minutes: 45,
          completed: false,
        }).then(() => {})
      }

      return NextResponse.json(data, { headers })
    } catch (parseError) {
      console.error("JSON parse error:", cleanedText)
      return NextResponse.json({ error: "Invalid AI format" }, { status: 500, headers })
    }
  } catch (error: any) {
    console.error("generate-initial-plan error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500, headers })
  }
}