export interface ProductAnalysis {
  productName: string
  image?: string
  longevityScore: number
  macros: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  healthBenefits?: string[]
  healthRisks?: string[]
  vitamins?: string[]
  minerals?: string[]
  proteins?: string[]
  otherBenefits?: string[]
  alternatives?: Array<{
    name: string
    score: number
    image?: string
    healthier: boolean
    highlights?: string[]
  }>
  generic?: boolean
  analysisLevel?: 'basic' | 'detailed' | 'deep'
  bioInsight?: string
  weight?: number
}

export interface DailyActivity {
  date: string
  scannedProducts: ProductAnalysis[]
  generatedDiets: string[]
  generatedWorkouts: string[]
}

export interface MetabolicPlan {
  calories: number
  protein: number
  carbs: number
  fat: number
  macros?: {
    calories: number
    protein: number
    proteinGrams?: number
    carbs: number
    carbsGrams?: number
    fat: number
    fatGrams?: number
  }
  goal?: string
  weeklyForecast?: {
    weeks: number
    description: string
  }
  prediction?: {
    weeks: number
    explanation: string
    macroTips?: string[]
  }
  mealPlan?: Array<{
    name: string
    foods: string[]
    macros: { calories: number; protein: number; carbs: number; fat: number }
  }>
  diet?: {
    title: string
    summary: string
    meals: Array<{
      name: string
      items: string[]
    }>
  }
  perfil?: UserProfile
}

export interface UserProfile {
  id?: string
  name?: string
  gender?: 'male' | 'female'
  age?: number
  weight?: number
  height?: number
  goal?: string
  activityLevel?: string
  is_admin?: boolean
  avatar_url?: string
}

export interface Exercise {
  name: string
  sets: string | number
  reps?: string
  duration?: string
  rest?: string | number
  notes?: string
}

export interface Workout {
  name: string
  category: string
  duration: string
  calories: string
  difficulty: string
  aiVerdict: string
  exercises: Exercise[]
  criteria?: {
    location?: string
    equipment?: string[]
    level?: string
    focus?: string
    duration?: string
    notes?: string
  }
}

export interface Recipe {
  name: string
  prepTime: string
  difficulty: string
  macros: { calories: number; protein: number; carbs: number; fat: number }
  ingredients: string[]
  instructions: string[]
  biohackingTips?: string[]
  description?: string
  servings?: number
}

export interface ScanHistoryItem {
  id: string
  name: string
  scannedAt: string
  score: number
  image: string
  status?: 'healthy' | 'caution' | 'avoid'
}

export type View =
  | 'home' | 'dashboard' | 'result' | 'recipes' | 'training'
  | 'profile' | 'planner' | 'settings' | 'store' | 'chatbot' | 'clans'
  | 'sleep' | 'stress' | 'health-checkin' | 'supplements'
  | 'meal-planner' | 'dietary' | 'micronutrients' | 'substitutions'
  | 'periodization' | 'workout-feedback' | 'equipment' | 'mobility'
  | 'longevity' | 'fasting' | 'biological-age'
  | 'mood' | 'habits' | 'meditation'
  | 'seasons' | 'battle-pass'
  | 'food-diary' | 'body'
  | 'weekly-report' | 'body-evolution' | 'streak-calendar' | 'achievements-page' | 'analytics-charts'
