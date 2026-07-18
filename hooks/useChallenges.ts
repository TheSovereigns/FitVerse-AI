"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

interface ChallengeParticipant {
  id: string
  user_id: string
  current_value: number
  completed: boolean
  profiles?: {
    name: string
    avatar_url: string | null
  }
}

interface Challenge {
  id: string
  title: string
  description: string
  challenge_type: string
  target_value: number
  unit: string
  clan_id: string | null
  created_by: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  creator?: { name: string; avatar_url: string | null }
  participants: ChallengeParticipant[]
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

export function useChallenges(clanId?: string | null) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChallenges = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const url = clanId
        ? `/api/challenges?clanId=${clanId}`
        : "/api/challenges"

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setChallenges(data.challenges || [])
    } catch (e) {
      console.error("Error fetching challenges:", e)
    } finally {
      setIsLoading(false)
    }
  }, [clanId])

  const createChallenge = useCallback(async (params: {
    title: string
    description?: string
    challengeType: string
    targetValue: number
    unit?: string
    endDate: string
  }) => {
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Not authenticated")

      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...params, clanId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await fetchChallenges()
      return data.challenge
    } catch (e: any) {
      setError(e.message)
      return null
    }
  }, [clanId, fetchChallenges])

  const joinChallenge = useCallback(async (challengeId: string) => {
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Not authenticated")

      const res = await fetch(`/api/challenges/${challengeId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await fetchChallenges()
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    }
  }, [fetchChallenges])

  const updateProgress = useCallback(async (challengeId: string, increment?: number) => {
    try {
      const token = await getToken()
      if (!token) return false

      const res = await fetch(`/api/challenges/${challengeId}/progress`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ increment: increment || 1 }),
      })
      const data = await res.json()
      if (!res.ok) return false

      setChallenges((prev) =>
        prev.map((c) => {
          if (c.id !== challengeId) return c
          return {
            ...c,
            participants: c.participants.map((p) => {
              if (p.user_id !== data.user_id) return p
              return { ...p, current_value: data.currentValue, completed: data.completed }
            }),
          }
        })
      )

      return data.completed
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

  return {
    challenges,
    isLoading,
    error,
    fetchChallenges,
    createChallenge,
    joinChallenge,
    updateProgress,
  }
}
