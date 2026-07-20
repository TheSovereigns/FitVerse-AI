import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit"
import { getCorsHeaders } from "@/lib/auth-helpers"
import { generateContentWithFallback } from "@/lib/ai-fallback"

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin()
  const headers = getCorsHeaders()

  const rlKey = getRateLimitKey(req, "generate")
  const rl = await checkRateLimit(rlKey, RATE_LIMITS.generate)
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
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.6,
      },
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
      ? gender === "male" ? "Male" : "Female"
      : gender === "male" ? "Masculino" : "Feminino"

    const goalLabel = isEnglish
      ? goal === "lose_weight" ? "Lose weight"
        : goal === "gain_muscle" ? "Gain muscle mass"
          : goal === "improve_health" ? "Improve overall health"
            : "Maintain weight"
      : goal === "lose_weight" ? "Perder peso"
        : goal === "gain_muscle" ? "Ganhar massa muscular"
          : goal === "improve_health" ? "Melhorar saude geral"
            : "Manter peso"

    const activityMultipliers: Record<string, string> = {
      sedentary: isEnglish ? "1.2 (sedentary)" : "1.2 (sedentario)",
      light: isEnglish ? "1.375 (light activity)" : "1.375 (atividade leve)",
      moderate: isEnglish ? "1.55 (moderate activity)" : "1.55 (atividade moderada)",
      active: isEnglish ? "1.725 (very active)" : "1.725 (muito ativo)",
      very_active: isEnglish ? "1.9 (extremely active)" : "1.9 (extremamente ativo)",
    }

    const activityMultiplier = activityMultipliers[activityLevel] || activityMultipliers.moderate

    const bmr = gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161
    const tdee = bmr * parseFloat(activityMultipliers[activityLevel] || "1.55")

    const prompt = `Generate a comprehensive personalized metabolic and performance plan. All text in ${lang}. JSON keys in English.

USER: ${weight}kg, ${height}cm, ${age}y, ${genderLabel}, activity: ${activityLevel}, goal: ${goalLabel}, sleep: ${sleepHours}h (${sleepQuality}), stress: ${stressLevel}, injuries: ${injuries?.length ? injuries.join(", ") : "none"}, equipment: ${equipment?.length ? equipment.join(", ") : "bodyweight only"}, diet restrictions: ${dietaryRestrictions?.length ? dietaryRestrictions.join(", ") : "none"}, experience: ${experience}, training frequency: ${workoutsPerWeek}x/week.

BMR=${bmr.toFixed(0)} kcal/day, TDEE=${tdee.toFixed(0)} kcal/day.

CALORIC CALCULATION:
- Protein: ${goal === "lose_weight" ? "2.2-2.6 g/kg" : goal === "gain_muscle" ? "1.8-2.2 g/kg" : "1.4-1.8 g/kg"}
- Fat: 0.8-1.2 g/kg (25-35% of calories)
- Carbs: remaining calories

DIET PLAN:
1. Macro periodization: training days (45-55% carbs) vs rest days (30-40% carbs), same protein.
2. Meal timing: pre-workout (complex carbs + protein), post-workout (fast protein + high GI carbs). Each meal needs a "timing" field: "pre-workout", "intra-workout", "post-workout", "morning", "midday", "afternoon", "evening", or "pre-bed".
3. Hydration: ${weight * 0.035}-${weight * 0.04} L/day.
4. Supplements with dosages and timing (Vitamin D3, Omega-3, Magnesium, Creatine, Protein powder, goal-specific).

TRAINING PLAN:
- ${workoutsPerWeek}-day split for ${experience} level.
- Each exercise: name, sets, reps, rest, weight_suggestion, muscle_group, secondary_muscles, safety_tip, substitute_exercises, estimated_calories_burned.
- Warmup (dynamic stretches) and cooldown (static stretches).
- Respect injuries: ${injuries?.length ? injuries.join(", ") : "none"} and equipment: ${equipment?.length ? equipment.join(", ") : "bodyweight"}.
- 4-week progression in "progression" field.

HEALTH & RECOVERY:
- Sleep optimization (based on ${sleepHours}h, ${sleepQuality}): bedtime routine, nutritional support, environment.
- Stress management (level: ${stressLevel}): breathing, meditation, training balance.
- Injury prevention: joint stability, mobility, recovery protocols.
- Weekly progression: W1 foundation → W2 +5-10% volume → W3 +5-10% intensity → W4 deload -40-50%.
- Habit stacking: morning, pre-workout, post-workout, evening routines with "After [X], I will [Y]" format.

OUTPUT JSON (no markdown, no text outside JSON):
{
  "bmrCalculation": {"formula": "Mifflin-St Jeor", "equation": "...", "bmr": ${bmr.toFixed(0)}, "tdee": ${tdee.toFixed(0)}, "activityMultiplier": ${parseFloat(activityMultipliers[activityLevel]?.split(" ")[0] || "1.55")}, "activityDescription": "${activityLevel}"},
  "macros": {"calories": number, "proteinGrams": number, "proteinPercentage": number, "carbsGrams": number, "carbsPercentage": number, "fatGrams": number, "fatPercentage": number, "fiberGrams": number, "macroPeriodization": {"trainingDay": {same macro fields}, "restDay": {same macro fields}}},
  "diet": {"title": string, "summary": string, "trainingDayNote": string, "restDayNote": string, "meals": [{"name": string, "time": string, "timing": string, "items": ["Food — portion"], "calories": number, "protein": number, "carbs": number, "fat": number}], "dailySchedule": {"firstMeal": string, "lastMeal": string, "eatingWindow": string}, "hydration": {"dailyMinimum": "${(weight * 0.035).toFixed(1)}L", "trainingDays": "${(weight * 0.04).toFixed(1)}L", "schedule": [string]}, "supplements": [{"name": string, "dosage": string, "timing": string, "rationale": string}]}},
  "workout": {"name": string, "philosophy": string, "daysPerWeek": ${workoutsPerWeek}, "weeklySchedule": [{"day": string, "focus": string, "duration": string, "sessionType": "strength | hypertrophy | endurance | deload", "estimatedCaloriesBurned": number, "exercises": [{"name": string, "sets": number, "reps": string, "rest": string, "weight_suggestion": string, "muscle_group": string, "secondary_muscles": [string], "safety_tip": string, "substitute_exercises": [string], "estimated_calories_burned": number}], "notes": string}], "warmup": {"duration": "5-10 minutes", "exercises": [string]}, "cooldown": {"duration": "5-10 minutes", "exercises": [string]}, "progression": {"week1": string, "week2": string, "week3": string, "week4": string, "markers": string}},
  "healthInsights": {"sleepOptimization": {"currentAssessment": string, "bedtimeRoutine": [string], "nutritionalSupport": [string], "environmentOptimization": [string], "targetSleepWindow": string}, "stressManagement": {"currentAssessment": string, "dailyPractices": [string], "nutritionalSupport": [string], "trainingBalance": string}, "injuryPrevention": {"currentConcerns": [string], "prehabilitation": [string], "mobilityWork": [string], "warningSignals": [string]}, "longevityTips": [string]},
  "prediction": {"weeks": number, "explanation": string, "milestones": [string]},
  "dailyHabits": {"morning": {"routine": [string], "stackingAnchor": string}, "preWorkout": {"routine": [string], "stackingAnchor": string}, "postWorkout": {"routine": [string], "stackingAnchor": string}, "evening": {"routine": [string], "stackingAnchor": string}}
}

RULES: All text in ${lang}. Only JSON keys in English. Macros must sum to calories ±5%. Meal calories sum to daily target. All supplements have dosages and timing. Respect injuries/equipment. Actionable, specific plan. No repeated meals.`

    let data: any = null;

    try {
      const responseText = await generateContentWithFallback({
        geminiCall: async () => {
          const result = await model.generateContent(prompt);
          return result.response.text();
        },
        prompt,
        generationConfig: { temperature: 0.6 },
      });

      const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("AI generation failed:", parseError);
      return NextResponse.json(
        { error: "AI generated invalid JSON after multiple attempts. Please try again." },
        { status: 500, headers }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Failed to generate plan" }, { status: 500, headers })
    }

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
  } catch (error: any) {
    console.error("generate-initial-plan error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500, headers })
  }
}
