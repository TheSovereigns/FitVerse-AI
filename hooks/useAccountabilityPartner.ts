"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

interface Partner {
  id: string
  name: string
  avatar_url: string | null
}

interface AccountabilityPair {
  id: string
  user_a_id: string
  user_b_id: string
  clan_id: string | null
  combined_streak: number
  longest_combined_streak: number
  status: string
  created_at: string
  partner: Partner
  myId: string
  isUserA: boolean
}

interface CheckinToday {
  userA: boolean
  userB: boolean
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

export function useAccountabilityPartner() {
  const [pairs, setPairs] = useState<AccountabilityPair[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPairs = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch("/api/accountability", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPairs(data.pairs || [])
    } catch (e) {
      console.error("Error fetching pairs:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createPair = useCallback(async (partnerId: string, clanId?: string) => {
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Not authenticated")

      const res = await fetch("/api/accountability", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ partnerId, clanId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await fetchPairs()
      return data.pair
    } catch (e: any) {
      setError(e.message)
      return null
    }
  }, [fetchPairs])

  const endPair = useCallback(async (pairId: string) => {
    try {
      const token = await getToken()
      if (!token) return false

      const res = await fetch(`/api/accountability?pairId=${pairId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return false

      setPairs((prev) => prev.filter((p) => p.id !== pairId))
      return true
    } catch {
      return false
    }
  }, [])

  const checkin = useCallback(async (pairId: string, activityType: string, activityData?: any) => {
    try {
      const token = await getToken()
      if (!token) return false

      const res = await fetch("/api/accountability/checkin", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pairId, activityType, activityData }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error !== "Already checked in today") {
          setError(data.error)
        }
        return false
      }
      return true
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    fetchPairs()
  }, [fetchPairs])

  return {
    pairs,
    isLoading,
    error,
    fetchPairs,
    createPair,
    endPair,
    checkin,
  }
}
