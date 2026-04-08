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
      console.log("[usePlanLimits] Refreshing plan for user:", user.id)
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      console.log("[usePlanLimits] Refresh result:", { data, error })

      if (data?.plan) {
        const userPlan = data.plan as Plan
        setPlan(userPlan)
        setLimits(getPlanLimits(userPlan))
        console.log("[usePlanLimits] Plan refreshed to:", userPlan)
      }
    } catch (e) {
      console.error("[usePlanLimits] Refresh error:", e)
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
        const { data, error } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()

        console.log("[usePlanLimits] Fetch result:", { data, error })

        // If profile doesn't exist, create it
        if (error?.code === 'PGRST116' || !data) {
          console.log("[usePlanLimits] Creating profile for user:", user.id)
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              plan: 'free',
              is_admin: false,
              country: 'BR',
              ads_enabled: true,
            })
            .select('plan')
            .single()

          if (!insertError && newProfile) {
            setPlan('free')
            setLimits(getPlanLimits('free'))
          }
        } else if (data?.plan) {
          const userPlan = data.plan as Plan
          setPlan(userPlan)
          setLimits(getPlanLimits(userPlan))
          console.log("[usePlanLimits] Plan set to:", userPlan)
        }
      } catch (e) {
        console.error("[usePlanLimits] Error:", e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()

    // Listen for profile changes - with error handling
    const channel = supabase.channel('plan-refresh')
    
    channel.on('postgres_changes', {
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

    channel.subscribe((status, err) => {
      if (err) {
        console.error('[usePlanLimits] Subscribe error:', err)
      } else if (status === 'SUBSCRIBED') {
        console.log('[usePlanLimits] Realtime subscribed')
      }
    })

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
