import { logger } from "@/lib/logger"

export { getSupabaseAdmin, authUser, getTokenFromRequest, getCorsHeaders } from "@/lib/supabase-server"

const FITVERSE_KEYS = [
  "fitverse-locale",
  "dailyActivity",
  "userMetabolicPlan",
  "nutritrain-workouts",
  "fitverse-onboarding",
  "fitverse-hydration",
  "fitverse-sleep",
  "fitverse-stress",
  "fitverse-fasting",
  "fitverse-mood",
  "fitverse-habits",
  "fitverse-meditation",
  "fitverse-season",
  "fitverse-boss",
  "fitverse-shop",
  "fitverse-streak",
  "fitverse-equipment",
  "fitverse-dietary",
  "fitverse-meal-plan",
  "fitverse-bio-age",
  "fitverse-longevity",
  "fitverse-supplements",
]

export function clearFitVerseStorage() {
  FITVERSE_KEYS.forEach((key) => {
    try { localStorage.removeItem(key) } catch (e) { logger.error("[AuthHelpers] Failed to remove localStorage key:", key, e) }
  })
  // Also remove any sb- auth tokens
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith("sb-")) keysToRemove.push(key)
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

export function sanitizeInput(input: string, maxLength: number = 500): string {
  return input
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength)
}
