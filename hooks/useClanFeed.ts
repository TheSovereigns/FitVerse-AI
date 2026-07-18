"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"

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

async function getToken(): Promise<string> {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.includes("sb-") && key.includes("-auth-token")) {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.access_token) return parsed.access_token
      }
    }
  }
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || ""
}

export function useClanFeed(clanId: string | null) {
  const [activities, setActivities] = useState<ClanActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const channelRef = useRef<any>(null)

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
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [clanId, fetchActivities])

  return {
    activities,
    isLoading,
    shareActivity,
    fetchActivities,
  }
}
