"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import type { Plan } from "@/lib/plan-limits"
import { PLAN_LIMITS, getPlanLimits, canScanToday, canGenerateWorkout, canGenerateDiet } from "@/lib/plan-limits"

export function usePlanLimits() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<Plan>('free')
  const [limits, setLimits] = useState(PLAN_LIMITS.free)
  const [scansToday, setScansToday] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch plan from database
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const fetchPlan = async () => {
      try {
        let { data, error } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()

        if (data?.plan) {
          const userPlan = (data.plan as Plan) || 'free'
          setPlan(userPlan)
          setLimits(getPlanLimits(userPlan))
        } else {
          setPlan('free')
          setLimits(getPlanLimits('free'))
        }
      } catch (e) {
        console.warn("[PlanLimits] Error fetching plan:", e)
        setPlan('free')
        setLimits(getPlanLimits('free'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()
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
        // ignore
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
    canScan: () => canScanToday(plan, scansToday),
    canGenerateWorkout: (count: number) => canGenerateWorkout(plan, count),
    canGenerateDiet: (count: number) => canGenerateDiet(plan, count),
    incrementScans,
    remainingScans: limits.scansPerDay === 'unlimited' 
      ? 'Ilimitados' 
      : `${Math.max(0, (limits.scansPerDay as number) - scansToday)} de ${limits.scansPerDay}`,
  }
}
