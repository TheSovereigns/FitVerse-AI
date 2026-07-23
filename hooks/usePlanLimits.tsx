"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { logger } from "@/lib/logger"
import type { Plan } from "@/lib/plan-limits"
import { PLAN_LIMITS, getPlanLimits, canScanToday, canGenerateWorkout, canGenerateDiet } from "@/lib/plan-limits"

export function usePlanLimits() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<Plan>('free')
  const [limits, setLimits] = useState(PLAN_LIMITS.free)
  const [scansToday, setScansToday] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [, forceRefresh] = useState(0)

  const refreshPlan = useCallback(async () => {
    if (!user) return
    
    try {
      logger.info("[usePlanLimits] Refreshing plan for user:", user.id)
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .maybeSingle()

      logger.info("[usePlanLimits] Refresh result:", { data, error })

      if (data?.plan) {
        const userPlan = data.plan as Plan
        setPlan(userPlan)
        setLimits(getPlanLimits(userPlan))
        logger.info("[usePlanLimits] Plan refreshed to:", userPlan)
      }
    } catch (e) {
      logger.error("[usePlanLimits] Refresh error:", e)
    }
  }, [user])

  // Fetch plan from database on mount and when user changes
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const fetchPlan = async () => {
      try {
        let data: { plan: string } | null = null

        // Ensure we have a fresh session before querying (RLS requires valid JWT)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          logger.warn("[usePlanLimits] No valid session, attempting refresh")
          await supabase.auth.refreshSession()
        }

        const { data: byId, error: errById } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .maybeSingle()

        if (errById) {
          logger.error("[usePlanLimits] Query error:", errById.message, errById.code)
        }

        if (byId) {
          data = byId
        } else if (user.email) {
          const { data: byEmail } = await supabase
            .from('profiles')
            .select('plan')
            .eq('email', user.email)
            .maybeSingle()
          if (byEmail) data = byEmail
        }

        logger.info("[usePlanLimits] Fetch result:", { data })

        if (data?.plan) {
          const userPlan = data.plan as Plan
          setPlan(userPlan)
          setLimits(getPlanLimits(userPlan))
          logger.info("[usePlanLimits] Plan set to:", userPlan)
        } else {
          logger.warn("[usePlanLimits] No profile found, keeping default plan:", plan)
        }
      } catch (e) {
        logger.error("[usePlanLimits] Error:", e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()

    const pollInterval = setInterval(fetchPlan, 30000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [user])

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
