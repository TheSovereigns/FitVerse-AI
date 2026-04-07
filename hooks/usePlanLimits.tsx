"use client"

import { useState, useEffect, useCallback } from "react"
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
  const [, forceRefresh] = useState(0)

  const refreshPlan = useCallback(async () => {
    if (!user) return
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      if (data?.plan) {
        const userPlan = data.plan as Plan
        setPlan(userPlan)
        setLimits(getPlanLimits(userPlan))
      }
    } catch (e) {
      // ignore
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
        const { data } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()

        if (data?.plan) {
          const userPlan = data.plan as Plan
          setPlan(userPlan)
          setLimits(getPlanLimits(userPlan))
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()

    // Listen for profile changes
    const channel = supabase
      .channel('plan-refresh')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        if (payload.new?.plan) {
          const newPlan = payload.new.plan as Plan
          setPlan(newPlan)
          setLimits(getPlanLimits(newPlan))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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
