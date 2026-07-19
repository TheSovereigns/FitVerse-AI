import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit"
import { getCorsHeaders } from "@/lib/auth-helpers"

const MAX_PARSE_ATTEMPTS = 3

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
      sedentary: isEnglish ? "1.2 (sedentary — desk job, little to no exercise)" : "1.2 (sedentario — trabalho de mesa, pouca ou nenhuma atividade)",
      light: isEnglish ? "1.375 (lightly active — light exercise 1–3 days/week)" : "1.375 (levemente ativo — exercicio leve 1–3 dias/semana)",
      moderate: isEnglish ? "1.55 (moderately active — moderate exercise 3–5 days/week)" : "1.55 (moderadamente ativo — exercicio moderado 3–5 dias/semana)",
      active: isEnglish ? "1.725 (very active — hard exercise 6–7 days/week)" : "1.725 (muito ativo — exercicio intenso 6–7 dias/semana)",
      very_active: isEnglish ? "1.9 (extremely active — very hard exercise, physical job)" : "1.9 (extremamente ativo — exercicio muito intenso, trabalho fisico)",
    }

    const activityMultiplier = activityMultipliers[activityLevel] || activityMultipliers.moderate

    const bmrCalculation = gender === "male"
      ? `BMR = (10 × ${weight}) + (6.25 × ${height}) − (5 × ${age}) + 5 = ${(10 * weight + 6.25 * height - 5 * age + 5).toFixed(0)} kcal/day`
      : `BMR = (10 × ${weight}) + (6.25 × ${height}) − (5 × ${age}) − 161 = ${(10 * weight + 6.25 * height - 5 * age - 161).toFixed(0)} kcal/day`

    const bmr = gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161
    const tdee = bmr * parseFloat(activityMultipliers[activityLevel] || "1.55")

    const prompt = `You are an elite-level sports nutritionist, exercise physiologist, and biohacking expert with 20+ years of clinical experience. Generate a COMPREHENSIVE, SCIENTIFICALLY-BACKED personalized metabolic and performance plan. All text output MUST be in ${lang}. All JSON keys remain in English.

═══════════════════════════════════════════════════════════
USER BIOMETRIC & LIFESTYLE PROFILE
═══════════════════════════════════════════════════════════
• Body Mass: ${weight}kg
• Stature: ${height}cm
• Chronological Age: ${age} years
• Biological Sex: ${genderLabel}
• Current Activity Classification: ${activityLevel}
• Primary Objective: ${goalLabel}
• Nocturnal Rest: ${sleepHours} hours/night | Quality Rating: ${sleepQuality}
• Perceived Stress Level: ${stressLevel}
• Known Injuries / Limitations: ${injuries?.length > 0 ? injuries.join(", ") : "None reported"}
• Available Training Equipment: ${equipment?.length > 0 ? equipment.join(", ") : "None — bodyweight only"}
• Dietary Restrictions / Allergies: ${dietaryRestrictions?.length > 0 ? dietaryRestrictions.join(", ") : "None"}
• Training Experience Level: ${experience}
• Target Training Frequency: ${workoutsPerWeek} sessions per week

═══════════════════════════════════════════════════════════
CALORIC & MACRONUTRIENT CALCULATION PROTOCOL
═══════════════════════════════════════════════════════════

STEP 1 — Calculate BMR using the Mifflin-St Jeor equation (most accurate for general population):
${genderLabel === "Male" || genderLabel === "Masculino"
    ? `Males: BMR = (10 × body weight in kg) + (6.25 × height in cm) − (5 × age in years) + 5`
    : `Females: BMR = (10 × body weight in kg) + (6.25 × height in cm) − (5 × age in years) − 161`}

Pre-calculated BMR: ${bmr.toFixed(0)} kcal/day
${bmrCalculation}

STEP 2 — Calculate TDEE (Total Daily Energy Expenditure):
Activity Multiplier for "${activityLevel}": ${activityMultiplier}
TDEE = BMR × Activity Multiplier = ${bmr.toFixed(0)} × ${activityMultipliers[activityLevel]?.split(" ")[0] || "1.55"} = ${tdee.toFixed(0)} kcal/day

STEP 3 — Apply goal-specific caloric adjustment:
${goal === "lose_weight" ? "Fat loss: TDEE × 0.80 (20% deficit) — aggressive but sustainable deficit for steady fat loss while preserving lean mass. Target: −0.5 to −0.7 kg/week." :
    goal === "gain_muscle" ? "Muscle gain: TDEE × 1.10 (10% surplus) — lean bulk to maximize muscle protein synthesis while minimizing fat gain. Target: +0.25 to −0.5 kg/week." :
      goal === "improve_health" ? "Health optimization: TDEE × 1.00 (maintenance) — focus on nutrient density and metabolic health improvement." :
        "Weight maintenance: TDEE × 1.00 (maintenance calories)"}

STEP 4 — Distribute macronutrients:
• Protein: ${goal === "lose_weight" ? "2.2–2.6 g/kg bodyweight (higher end to preserve muscle during deficit)" : goal === "gain_muscle" ? "1.8–2.2 g/kg bodyweight (optimal for muscle protein synthesis)" : "1.4–1.8 g/kg bodyweight (health-optimized range)"}
• Fat: 0.8–1.2 g/kg bodyweight (minimum for hormonal health, typically 25–35% of calories)
• Carbohydrates: Remaining calories after protein and fat allocation — prioritize around training windows

═══════════════════════════════════════════════════════════
DIETARY PLAN REQUIREMENTS
═══════════════════════════════════════════════════════════

1. MACRO PERIODIZATION: Provide TWO distinct macro splits:
   a) TRAINING DAYS: Higher carbs (45–55% of calories), moderate fat, high protein — fuel performance and recovery
   b) REST DAYS: Lower carbs (30–40% of calories), higher fat, same protein — enhance fat oxidation and recovery
   Include a "macroPeriodization" object with "trainingDay" and "restDay" variants, each with the full macro breakdown (calories, protein%, carbs%, fat%, plus gram amounts).

2. MEAL TIMING AROUND WORKOUTS: Structure meals to optimize performance:
   • Pre-workout meal (60–90 min before): Complex carbs + moderate protein, low fat (e.g., oats + whey + banana)
   • Intra-workout (if session > 60 min): Fast-digesting carbs + electrolytes (e.g., cyclic dextrin + BCAAs)
   • Post-workout (within 30–60 min): Fast protein + high glycemic carbs for glycogen replenishment (e.g., whey isolate + white rice/fruit)
   • Each meal in the "meals" array must include a "timing" field with one of: "pre-workout", "intra-workout", "post-workout", "morning", "midday", "afternoon", "evening", or "pre-bed"

3. HYDRATION PROTOCOL: Minimum 35–40 mL per kg bodyweight daily (${(weight * 0.035).toFixed(1)}–${(weight * 0.04).toFixed(1)} L/day). Add electrolytes during intense training. Provide specific daily water schedule.

4. SUPPLEMENT TIMING: Provide supplements WITH specific dosages AND timing:
   • Each supplement entry: name, dosage, timing (e.g., "Creatine Monohydrate: 5g — post-workout with carbs")
   • Include: Vitamin D3, Omega-3, Magnesium, Creatine (if appropriate), Protein powder, and any goal-specific supplements
   • List in "supplements" array with format: "Name: dosage — timing rationale"

═══════════════════════════════════════════════════════════
TRAINING PLAN REQUIREMENTS
═══════════════════════════════════════════════════════════

• Design a ${workoutsPerWeek}-day weekly split appropriate for ${experience} level
• Every exercise MUST include a detailed "safety_tip" with proper form cues and injury prevention notes
• Include "estimated_calories_burned" per exercise (realistic estimate)
• Include warmup (dynamic stretches, activation drills) and cooldown (static stretches, mobility work) routines
• MUST respect all listed injuries: ${injuries?.length > 0 ? injuries.join(", ") : "None"} — substitute or modify any contraindicated exercises
• MUST respect available equipment: ${equipment?.length > 0 ? equipment.join(", ") : "Bodyweight only — no equipment"}
• Progressive overload strategy in "progression" field — week-by-week progression plan for at least 4 weeks
• Each exercise must include "substitute_exercises" array with 1–2 alternatives for equipment limitations or discomfort

═══════════════════════════════════════════════════════════
HEALTH & RECOVERY OPTIMIZATION
═══════════════════════════════════════════════════════════

SLEEP OPTIMIZATION PROTOCOL (based on ${sleepHours}h/night, quality: ${sleepQuality}):
• Specific bedtime routine (screens, temperature, lighting)
• Nutritional interventions for sleep quality (magnesium, tryptophan-rich foods, etc.)
• Recommended sleep window and consistency guidelines
• Environmental optimization (room temperature, darkness, noise)
${sleepHours < 7 ? "• URGENT: Current sleep is suboptimal — include recovery strategies for sleep debt" : ""}

STRESS MANAGEMENT TECHNIQUES (stress level: ${stressLevel}):
• Daily stress-reduction practices (breathing exercises, meditation, nature exposure)
• Nutritional support for HPA axis regulation (adaptogens, vitamin C, B vitamins)
• Training stress vs. life stress balance recommendations
${stressLevel === "high" || stressLevel === "very_high" ? "• CRITICAL: Elevated stress detected — recommend parasympathetic activation techniques and potential deload weeks" : ""}

INJURY PREVENTION STRATEGIES:
• Joint stability exercises for vulnerable areas
• Mobility routines targeting problem areas
• Recovery protocols: foam rolling, stretching, cold/heat therapy
• Warning signs to stop training immediately
${injuries?.length > 0 ? `• SPECIFIC: User reports ${injuries.join(", ")} — all programming must accommodate these limitations with appropriate modifications` : "• Prehabilitation exercises to prevent common injuries"}

WEEKLY PROGRESSION PLAN (4-week cycle):
• Week 1: Foundation — establish baseline, master form, moderate volume
• Week 2: Accumulation — increase volume by 5–10%, maintain intensity
• Week 3: Intensification — increase intensity by 5–10%, maintain volume
• Week 4: Deload — reduce volume by 40–50%, maintain intensity, focus on recovery
• Include specific progression markers and when to advance

HABIT STACKING RECOMMENDATIONS:
• Morning routine: stack new habits onto existing ones (e.g., "After I brush my teeth, I will drink 500mL water with electrolytes")
• Pre-workout routine: specific sequence of preparation habits
• Post-workout routine: recovery nutrition + mobility
• Evening routine: sleep preparation sequence
• Include implementation intention format: "After [CURRENT HABIT], I will [NEW HABIT]"

═══════════════════════════════════════════════════════════
OUTPUT JSON STRUCTURE (STRICT — no markdown, no explanation outside JSON)
═══════════════════════════════════════════════════════════

{
  "bmrCalculation": {
    "formula": "Mifflin-St Jeor",
    "equation": "${gender === "male" ? "BMR = (10 × weight) + (6.25 × height) − (5 × age) + 5" : "BMR = (10 × weight) + (6.25 × height) − (5 × age) − 161"}",
    "bmr": ${bmr.toFixed(0)},
    "tdee": ${tdee.toFixed(0)},
    "activityMultiplier": ${activityMultipliers[activityLevel]?.split(" ")[0] || "1.55"},
    "activityDescription": "${activityLevel}"
  },
  "macros": {
    "calories": number,
    "proteinGrams": number,
    "proteinPercentage": number,
    "carbsGrams": number,
    "carbsPercentage": number,
    "fatGrams": number,
    "fatPercentage": number,
    "fiberGrams": number,
    "macroPeriodization": {
      "trainingDay": {
        "calories": number,
        "proteinGrams": number,
        "proteinPercentage": number,
        "carbsGrams": number,
        "carbsPercentage": number,
        "fatGrams": number,
        "fatPercentage": number
      },
      "restDay": {
        "calories": number,
        "proteinGrams": number,
        "proteinPercentage": number,
        "carbsGrams": number,
        "carbsPercentage": number,
        "fatGrams": number,
        "fatPercentage": number
      }
    }
  },
  "diet": {
    "title": "Diet plan name reflecting the approach",
    "summary": "One-sentence summary of dietary philosophy",
    "trainingDayNote": "Brief explanation of training day nutrition strategy",
    "restDayNote": "Brief explanation of rest day nutrition strategy",
    "meals": [
      {
        "name": "Meal name (e.g., Pre-Workout Meal)",
        "time": "6:30",
        "timing": "pre-workout",
        "items": ["Specific food item — exact portion (e.g., 'Oatmeal — 80g dry weight')"],
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    ],
    "dailySchedule": {
      "firstMeal": "7:00",
      "lastMeal": "20:00",
      "eatingWindow": "13 hours"
    },
    "hydration": {
      "dailyMinimum": "${(weight * 0.035).toFixed(1)}L",
      "trainingDays": "${(weight * 0.04).toFixed(1)}L",
      "schedule": ["Specific hydration timing recommendations"]
    },
    "supplements": [
      {
        "name": "Supplement name",
        "dosage": "Specific dosage",
        "timing": "When to take it",
        "rationale": "Why this supplement for this user"
      }
    ]
  },
  "workout": {
    "name": "Workout plan name",
    "philosophy": "Training philosophy explanation",
    "daysPerWeek": ${workoutsPerWeek},
    "weeklySchedule": [
      {
        "day": "Monday",
        "focus": "Muscle group focus",
        "duration": "45 min",
        "sessionType": "strength | hypertrophy | endurance | deload",
        "estimatedCaloriesBurned": number,
        "exercises": [
          {
            "name": "Exercise name",
            "sets": number,
            "reps": "8-12",
            "rest": "60-90s",
            "weight_suggestion": "Starting weight recommendation or 'bodyweight'",
            "muscle_group": "Primary target muscle",
            "secondary_muscles": ["Secondary muscles"],
            "safety_tip": "Detailed form cue and injury prevention note",
            "substitute_exercises": ["Alternative exercise 1", "Alternative exercise 2"],
            "estimated_calories_burned": number
          }
        ],
        "notes": "Additional session notes"
      }
    ],
    "warmup": {
      "duration": "5-10 minutes",
      "exercises": ["Specific warmup exercise with duration/reps"]
    },
    "cooldown": {
      "duration": "5-10 minutes",
      "exercises": ["Specific cooldown exercise with duration/reps"]
    },
    "progression": {
      "week1": "Foundation phase description",
      "week2": "Accumulation phase description",
      "week3": "Intensification phase description",
      "week4": "Deload phase description",
      "markers": "How to know when to increase load/progress"
    }
  },
  "healthInsights": {
    "sleepOptimization": {
      "currentAssessment": "Assessment based on ${sleepHours}h/night, quality: ${sleepQuality}",
      "bedtimeRoutine": ["Step-by-step evening routine"],
      "nutritionalSupport": ["Foods/supplements for better sleep"],
      "environmentOptimization": ["Room setup recommendations"],
      "targetSleepWindow": "Recommended consistent sleep/wake times"
    },
    "stressManagement": {
      "currentAssessment": "Assessment based on stress level: ${stressLevel}",
      "dailyPractices": ["Specific stress-reduction techniques with duration"],
      "nutritionalSupport": ["Nutrients for HPA axis support"],
      "trainingBalance": "How to balance training stress with life stress"
    },
    "injuryPrevention": {
      "currentConcerns": ["Based on reported injuries: ${injuries?.length > 0 ? injuries.join(", ") : "None"}"],
      "prehabilitation": ["Specific prehab exercises"],
      "mobilityWork": ["Daily mobility routines"],
      "warningSignals": ["Signs to stop training and seek help"]
    },
    "longevityTips": ["Evidence-based longevity tip 1", "Evidence-based longevity tip 2", "Evidence-based longevity tip 3"]
  },
  "prediction": {
    "weeks": number,
    "explanation": "Detailed explanation with specific milestones and expected body composition changes",
    "milestones": ["Week X: Expected milestone 1", "Week Y: Expected milestone 2"]
  },
  "dailyHabits": {
    "morning": {
      "routine": ["Specific habit with implementation intention format: 'After [existing habit], I will [new habit]'"],
      "stackingAnchor": "The existing habit to stack onto"
    },
    "preWorkout": {
      "routine": ["Pre-workout preparation habits"],
      "stackingAnchor": "Anchor habit"
    },
    "postWorkout": {
      "routine": ["Post-workout recovery habits"],
      "stackingAnchor": "Anchor habit"
    },
    "evening": {
      "routine": ["Evening wind-down habits"],
      "stackingAnchor": "Anchor habit"
    }
  }
}

═══════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS
═══════════════════════════════════════════════════════════
1. All user-facing text MUST be in ${lang}. Only JSON keys stay in English.
2. Output ONLY valid JSON — no markdown fences, no explanatory text outside the JSON.
3. Every calorie, gram, and percentage must be mathematically consistent (macros must sum to calories within ±5%).
4. Meal calories must approximately sum to the daily calorie target.
5. Exercise calorie estimates should be realistic (typically 5–12 kcal/min depending on exercise type and intensity).
6. All supplements must include specific dosages and timing — never leave generic.
7. Respect ALL injuries and equipment constraints — never prescribe exercises that contradict these.
8. The plan must be actionable and specific — a user should be able to follow it starting tomorrow.
9. If the user is ${experience}, adjust exercise complexity and volume accordingly.
10. Include variety in meals — no repeated meals across the day unless specified.

Now generate the complete plan as valid JSON.`

    let data: any = null
    let lastError: any = null

    for (let attempt = 1; attempt <= MAX_PARSE_ATTEMPTS; attempt++) {
      try {
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim()

        data = JSON.parse(cleanedText)
        break
      } catch (parseError) {
        lastError = parseError
        console.error(`JSON parse attempt ${attempt}/${MAX_PARSE_ATTEMPTS} failed:`, parseError)
        if (attempt === MAX_PARSE_ATTEMPTS) {
          return NextResponse.json(
            { error: "AI generated invalid JSON after multiple attempts. Please try again." },
            { status: 500, headers }
          )
        }
      }
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
