export type Plan = 'free' | 'pro' | 'premium' | 'banned'

export interface PlanLimits {
  scansPerDay: number | 'unlimited'
  analysisLevel: 'basic' | 'detailed' | 'deep'
  historyDays: number
  workoutsPerMonth: number | 'unlimited'
  dietsPerMonth: number | 'unlimited'
  mealPlansPerWeek: number | 'unlimited'
  hasAds: boolean
  prioritySupport: boolean
  sleepTracker: boolean
  stressTracker: boolean
  healthCheckin: boolean
  supplementRecommendations: boolean
  weeklyMealPlanner: boolean
  dietaryRestrictions: boolean
  micronutrientAnalysis: boolean
  smartSubstitutions: boolean
  periodizedWorkouts: boolean
  workoutFeedback: boolean
  mobilityRoutines: boolean
  longevityScore: boolean
  fastingTracker: boolean
  biologicalAge: boolean
  moodTracker: boolean
  habitBuilder: boolean
  guidedMeditation: boolean
  seasons: boolean
  bossBattles: boolean
  rewardShop: boolean
  autoAdjustPlans: boolean
  aiCoach: boolean
  bodyPhotoAnalysis: boolean
  monthlyReport: boolean
  planDetailLevel: 'summary' | 'full' | 'full+autoadjust'
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    scansPerDay: 5,
    analysisLevel: 'basic',
    historyDays: 7,
    workoutsPerMonth: 1,
    dietsPerMonth: 2,
    mealPlansPerWeek: 0,
    hasAds: true,
    prioritySupport: false,
    sleepTracker: false,
    stressTracker: false,
    healthCheckin: false,
    supplementRecommendations: false,
    weeklyMealPlanner: false,
    dietaryRestrictions: false,
    micronutrientAnalysis: false,
    smartSubstitutions: false,
    periodizedWorkouts: false,
    workoutFeedback: true,
    mobilityRoutines: false,
    longevityScore: true,
    fastingTracker: false,
    biologicalAge: false,
    moodTracker: false,
    habitBuilder: true,
    guidedMeditation: false,
    seasons: true,
    bossBattles: false,
    rewardShop: false,
    autoAdjustPlans: false,
    aiCoach: false,
    bodyPhotoAnalysis: false,
    monthlyReport: false,
    planDetailLevel: 'summary',
  },
  pro: {
    scansPerDay: 50,
    analysisLevel: 'detailed',
    historyDays: 30,
    workoutsPerMonth: 5,
    dietsPerMonth: 5,
    mealPlansPerWeek: 1,
    hasAds: false,
    prioritySupport: false,
    sleepTracker: true,
    stressTracker: true,
    healthCheckin: true,
    supplementRecommendations: false,
    weeklyMealPlanner: true,
    dietaryRestrictions: true,
    micronutrientAnalysis: false,
    smartSubstitutions: true,
    periodizedWorkouts: true,
    workoutFeedback: true,
    mobilityRoutines: true,
    longevityScore: true,
    fastingTracker: true,
    biologicalAge: false,
    moodTracker: true,
    habitBuilder: true,
    guidedMeditation: false,
    seasons: true,
    bossBattles: true,
    rewardShop: false,
    autoAdjustPlans: false,
    aiCoach: false,
    bodyPhotoAnalysis: false,
    monthlyReport: false,
    planDetailLevel: 'full',
  },
  premium: {
    scansPerDay: 'unlimited',
    analysisLevel: 'deep',
    historyDays: 365,
    workoutsPerMonth: 'unlimited',
    dietsPerMonth: 'unlimited',
    mealPlansPerWeek: 'unlimited',
    hasAds: false,
    prioritySupport: true,
    sleepTracker: true,
    stressTracker: true,
    healthCheckin: true,
    supplementRecommendations: true,
    weeklyMealPlanner: true,
    dietaryRestrictions: true,
    micronutrientAnalysis: true,
    smartSubstitutions: true,
    periodizedWorkouts: true,
    workoutFeedback: true,
    mobilityRoutines: true,
    longevityScore: true,
    fastingTracker: true,
    biologicalAge: true,
    moodTracker: true,
    habitBuilder: true,
    guidedMeditation: true,
    seasons: true,
    bossBattles: true,
    rewardShop: true,
    autoAdjustPlans: true,
    aiCoach: true,
    bodyPhotoAnalysis: true,
    monthlyReport: true,
    planDetailLevel: 'full+autoadjust',
  },
  banned: {
    scansPerDay: 0,
    analysisLevel: 'basic',
    historyDays: 0,
    workoutsPerMonth: 0,
    dietsPerMonth: 0,
    mealPlansPerWeek: 0,
    hasAds: true,
    prioritySupport: false,
    sleepTracker: false,
    stressTracker: false,
    healthCheckin: false,
    supplementRecommendations: false,
    weeklyMealPlanner: false,
    dietaryRestrictions: false,
    micronutrientAnalysis: false,
    smartSubstitutions: false,
    periodizedWorkouts: false,
    workoutFeedback: false,
    mobilityRoutines: false,
    longevityScore: false,
    fastingTracker: false,
    biologicalAge: false,
    moodTracker: false,
    habitBuilder: false,
    guidedMeditation: false,
    seasons: false,
    bossBattles: false,
    rewardShop: false,
    autoAdjustPlans: false,
    aiCoach: false,
    bodyPhotoAnalysis: false,
    monthlyReport: false,
    planDetailLevel: 'summary',
  },
}

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function canScanToday(plan: Plan, scansToday: number): boolean {
  const limits = PLAN_LIMITS[plan]
  if (limits.scansPerDay === 'unlimited') return true
  return scansToday < limits.scansPerDay
}

export function canGenerateWorkout(plan: Plan, workoutsThisMonth: number): boolean {
  const limits = PLAN_LIMITS[plan]
  if (limits.workoutsPerMonth === 'unlimited') return true
  return workoutsThisMonth < limits.workoutsPerMonth
}

export function canGenerateDiet(plan: Plan, dietsThisMonth: number): boolean {
  const limits = PLAN_LIMITS[plan]
  if (limits.dietsPerMonth === 'unlimited') return true
  return dietsThisMonth < limits.dietsPerMonth
}

export function canGenerateMealPlan(plan: Plan, mealPlansThisWeek: number): boolean {
  const limits = PLAN_LIMITS[plan]
  if (limits.mealPlansPerWeek === 'unlimited') return true
  return mealPlansThisWeek < limits.mealPlansPerWeek
}

export function isFeatureLocked(plan: Plan, feature: keyof PlanLimits): boolean {
  const limits = PLAN_LIMITS[plan]
  const value = limits[feature]
  if (typeof value === 'boolean') return !value
  if (typeof value === 'number') return value === 0
  return false
}

export function getFilteredHistory(plan: Plan, items: any[]): any[] {
  const limits = PLAN_LIMITS[plan]
  if (limits.historyDays === 365) return items

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - limits.historyDays)

  return items.filter(item => {
    const date = new Date(item.scannedAt || item.created_at)
    return date >= cutoff
  })
}

export function getRemainingScans(plan: Plan, scansToday: number): string {
  const limits = PLAN_LIMITS[plan]
  if (limits.scansPerDay === 'unlimited') return 'Ilimitados'
  const remaining = Math.max(0, limits.scansPerDay - scansToday)
  return `${remaining} de ${limits.scansPerDay}`
}