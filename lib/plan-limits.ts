export type Plan = 'free' | 'pro' | 'premium'

export interface PlanLimits {
  scansPerDay: number | 'unlimited'
  analysisLevel: 'basic' | 'detailed' | 'deep'
  historyDays: number
  workoutsPerMonth: number | 'unlimited'
  dietsPerMonth: number | 'unlimited'
  hasAds: boolean
  prioritySupport: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    scansPerDay: 5,
    analysisLevel: 'basic',
    historyDays: 7,
    workoutsPerMonth: 0,
    dietsPerMonth: 0,
    hasAds: true,
    prioritySupport: false,
  },
  pro: {
    scansPerDay: 50,
    analysisLevel: 'detailed',
    historyDays: 30,
    workoutsPerMonth: 5,
    dietsPerMonth: 5,
    hasAds: false,
    prioritySupport: false,
  },
  premium: {
    scansPerDay: 'unlimited',
    analysisLevel: 'deep',
    historyDays: 365,
    workoutsPerMonth: 'unlimited',
    dietsPerMonth: 'unlimited',
    hasAds: false,
    prioritySupport: true,
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
