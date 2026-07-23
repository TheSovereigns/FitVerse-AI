"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { logger } from "@/lib/logger"
import type { Plan } from "@/lib/plan-limits"
import { PLAN_LIMITS, getPlanLimits, canScanToday, canGenerateWorkout, canGenerateDiet } from "@/lib/plan-limits"

export function usePlanLimits() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<Plan>(() => {
    if (typeof window === 'undefined') return 'free'
    return (localStorage.getItem('fitverse-plan') as Plan) || 'free'
  })
  const [limits, setLimits] = useState(() => getPlanLimits((typeof window !== 'undefined' ? (localStorage.getItem('fitverse-plan') as Plan) : null) || 'free'))
  const [scansToday, setScansToday] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPlan = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        logger.error("[usePlanLimits] Query error:", error.message, error.code)
        if (error.code === "PGRST301" || error.message?.includes("JWT")) {
          await supabase.auth.refreshSession()
          const { data: retry } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .maybeSingle()
          if (retry?.plan) {
            const p = retry.plan as Plan
            setPlan(p)
            setLimits(getPlanLimits(p))
            localStorage.setItem('fitverse-plan', p)
            logger.info("[usePlanLimits] Plan set after refresh:", p)
          }
        }
        return
      }

      if (data?.plan) {
        const p = data.plan as Plan
        setPlan(p)
        setLimits(getPlanLimits(p))
        localStorage.setItem('fitverse-plan', p)
        logger.info("[usePlanLimits] Plan set to:", p)
      } else {
        logger.warn("[usePlanLimits] No profile found for user:", user.id)
      }
    } catch (e) {
      logger.error("[usePlanLimits] Error:", e)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const refreshPlan = useCallback(async () => {
    if (!user?.id) return
    await fetchPlan()
  }, [user?.id, fetchPlan])

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    fetchPlan()

    const pollInterval = setInterval(fetchPlan, 30000)
    return () => clearInterval(pollInterval)
  }, [user, fetchPlan])

  useEffect(() => {
    if (!user) return

    const fetchScansToday = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      try {
        const { count } = await supabase
          .from('scans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString())

        setScansToday(count || 0)
      } catch (e) {
        logger.error("[usePlanLimits] Failed to fetch scans:", e)
      }
    }

    fetchScansToday()
  }, [user])

  const incrementScans = () => {
    setScansToday(prev => prev + 1)
  }

  return {
    plan,
    limits,
    scansToday,
    isLoading,
    refreshPlan,
    canScan: () => canScanToday(plan, scansToday),
    canGenerateWorkout: (count: number) => canGenerateWorkout(plan, count),
    canGenerateDiet: (count: number) => canGenerateDiet(plan, count),
    incrementScans,
    remainingScans: limits.scansPerDay === 'unlimited'
      ? 'Ilimitados'
      : `${Math.max(0, (limits.scansPerDay as number) - scansToday)} de ${limits.scansPerDay}`,
  }
}
