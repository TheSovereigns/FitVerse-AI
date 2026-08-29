"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { getToken } from "@/lib/auth/getToken"

interface ClanActivity {
  id: string
  clan_id: string
  user_id: string
  activity_type: string
  activity_data: any
  created_at: string
  profiles?: {
    name: string
    avatar_url: string | null
  }
}

export function useClanFeed(clanId: string | null) {
  const [activities, setActivities] = useState<ClanActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const channelRef = useRef<any>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRealtimeRef = useRef(false)
  const activitiesRef = useRef<ClanActivity[]>([])
  useEffect(() => { activitiesRef.current = activities }, [activities])

  const fetchActivities = useCallback(async () => {
    if (!clanId) return
    setIsLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch(`/api/clans/${clanId}/activities?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setActivities(data.activities || [])
    } catch (e) {
      console.error("Error fetching activities:", e)
    } finally {
      setIsLoading(false)
    }
  }, [clanId])

  // Silent background fetch for polling fallback (no loading spinner) — incremental via ?after=lastId
  const fetchActivitiesSilent = useCallback(async () => {
    if (!clanId) return
    try {
      const token = await getToken()
      if (!token) return
      const lastId = activitiesRef.current[0]?.id // activities are DESC, newest first
      const url = lastId
        ? `/api/clans/${clanId}/activities?limit=50&after=${encodeURIComponent(lastId)}`
        : `/api/clans/${clanId}/activities?limit=50`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (Array.isArray(data.activities) && data.activities.length > 0) {
        if (lastId) {
          setActivities((prev) => {
            const existing = new Set(prev.map((a) => a.id))
            const next = data.activities.filter((a: ClanActivity) => !existing.has(a.id))
            return next.length ? [...next, ...prev] : prev
          })
        } else {
          setActivities(data.activities)
        }
      }
    } catch (e) {
      console.error("Error polling activities:", e)
    }
  }, [clanId])

  const shareActivity = useCallback(async (activityType: string, activityData: any) => {
    if (!clanId) return false
    try {
      const token = await getToken()
      if (!token) return false

      const res = await fetch(`/api/clans/${clanId}/share`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activityType, activityData }),
      })
      const data = await res.json()
      if (data.activity) {
        setActivities((prev) => [data.activity, ...prev])
        return true
      }
      return false
    } catch (e) {
      console.error("Error sharing activity:", e)
      return false
    }
  }, [clanId])

  useEffect(() => {
    if (!clanId) {
      setActivities([])
      return
    }

    fetchActivities()

    const startPolling = (ms: number) => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(() => {
        if (document.hidden) return
        if (isRealtimeRef.current) return
        fetchActivitiesSilent()
      }, ms)
    }
    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    startPolling(30000)

    // Realtime subscription (enhancement) - adaptive fallback for free tier
    const channel = supabase
      .channel(`clan-feed-${clanId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clan_activities",
          filter: `clan_id=eq.${clanId}`,
        },
        (payload) => {
          const newActivity = payload.new as ClanActivity
          setActivities((prev) => {
            if (prev.some((a) => a.id === newActivity.id)) return prev
            return [newActivity, ...prev]
          })
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          isRealtimeRef.current = true
          stopPolling()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          isRealtimeRef.current = false
          console.warn(`[useClanFeed] Realtime ${status} for clan ${clanId} — polling fallback active (5s)`)
          startPolling(5000)
        } else {
          isRealtimeRef.current = false
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      stopPolling()
      isRealtimeRef.current = false
    }
  }, [clanId, fetchActivities, fetchActivitiesSilent])

  return {
    activities,
    isLoading,
    shareActivity,
    fetchActivities,
  }
}
