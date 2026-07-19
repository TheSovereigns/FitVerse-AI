import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS, canScanToday, canGenerateWorkout, canGenerateDiet, isFeatureLocked } from '../lib/plan-limits'

describe('plan-limits', () => {
  it('should have limits for all plans', () => {
    expect(PLAN_LIMITS.free).toBeDefined()
    expect(PLAN_LIMITS.pro).toBeDefined()
    expect(PLAN_LIMITS.premium).toBeDefined()
    expect(PLAN_LIMITS.banned).toBeDefined()
  })

  it('free plan should have 5 scans per day', () => {
    expect(PLAN_LIMITS.free.scansPerDay).toBe(5)
  })

  it('pro plan should have 50 scans per day', () => {
    expect(PLAN_LIMITS.pro.scansPerDay).toBe(50)
  })

  it('premium plan should have unlimited scans', () => {
    expect(PLAN_LIMITS.premium.scansPerDay).toBe('unlimited')
  })

  it('canScanToday should respect limits', () => {
    expect(canScanToday('free', 4)).toBe(true)
    expect(canScanToday('free', 5)).toBe(false)
    expect(canScanToday('premium', 1000)).toBe(true)
  })

  it('canGenerateWorkout should respect limits', () => {
    expect(canGenerateWorkout('free', 0)).toBe(true)
    expect(canGenerateWorkout('free', 1)).toBe(false)
    expect(canGenerateWorkout('premium', 100)).toBe(true)
  })

  it('canGenerateDiet should respect limits', () => {
    expect(canGenerateDiet('free', 0)).toBe(true)
    expect(canGenerateDiet('free', 2)).toBe(false)
    expect(canGenerateDiet('premium', 100)).toBe(true)
  })

  it('isFeatureLocked should work correctly', () => {
    expect(isFeatureLocked('free', 'sleepTracker')).toBe(true)
    expect(isFeatureLocked('pro', 'sleepTracker')).toBe(false)
    expect(isFeatureLocked('premium', 'sleepTracker')).toBe(false)
  })
})
