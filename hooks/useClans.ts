"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

interface Clan {
  id: string
  name: string
  description: string
  avatar_url: string | null
  owner_id: string
  max_members: number
  is_public: boolean
  created_at: string
  memberCount?: number
  role?: string
  userRole?: string
  isMember?: boolean
  ownerName?: string
}

interface ClanMember {
  id: string
  clan_id: string
  user_id: string
  role: string
  joined_at: string
  profiles?: {
    id: string
    name: string
    avatar_url: string | null
    plan: string
  }
}

interface ClanInvite {
  id: string
  invite_code: string
  status: string
  expires_at: string
  created_at: string
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

export function useClans() {
  const [userClan, setUserClan] = useState<Clan | null>(null)
  const [discoverClans, setDiscoverClans] = useState<Clan[]>([])
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null)
  const [members, setMembers] = useState<ClanMember[]>([])
  const [invites, setInvites] = useState<ClanInvite[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserClan = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch("/api/clans?view=my", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setUserClan(data.userClan || null)
    } catch (e) {
      console.error("Error fetching user clan:", e)
    }
  }, [])

  const fetchDiscoverClans = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch("/api/clans?view=discover", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setDiscoverClans(data.clans || [])
    } catch (e) {
      console.error("Error fetching discover clans:", e)
    }
  }, [])

  const fetchClanDetail = useCallback(async (clanId: string) => {
    setIsLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch(`/api/clans/${clanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.clan) {
        setSelectedClan(data.clan)
      }
    } catch (e) {
      console.error("Error fetching clan detail:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchMembers = useCallback(async (clanId: string) => {
    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch(`/api/clans/${clanId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setMembers(data.members || [])
    } catch (e) {
      console.error("Error fetching members:", e)
    }
  }, [])

  const fetchInvites = useCallback(async (clanId: string) => {
    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch(`/api/clans/${clanId}/invite`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setInvites(data.invites || [])
    } catch (e) {
      console.error("Error fetching invites:", e)
    }
  }, [])

  const createClan = useCallback(async (name: string, description: string, isPublic: boolean) => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Not authenticated")

      const res = await fetch("/api/clans", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, isPublic }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setUserClan(data.clan)
      return data.clan
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const joinClan = useCallback(async (clanId: string, inviteCode?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Not authenticated")

      const res = await fetch(`/api/clans/${clanId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await fetchUserClan()
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [fetchUserClan])

  const leaveClan = useCallback(async (clanId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Not authenticated")

      const res = await fetch(`/api/clans/${clanId}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setUserClan(null)
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createInvite = useCallback(async (clanId: string) => {
    try {
      const token = await getToken()
      if (!token) return null

      const res = await fetch(`/api/clans/${clanId}/invite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await fetchInvites(clanId)
      return data.invite
    } catch (e: any) {
      console.error("Error creating invite:", e)
      return null
    }
  }, [fetchInvites])

  const deleteClan = useCallback(async (clanId: string) => {
    try {
      const token = await getToken()
      if (!token) return false

      const res = await fetch(`/api/clans/${clanId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return false

      setUserClan(null)
      setSelectedClan(null)
      return true
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    fetchUserClan()
  }, [fetchUserClan])

  return {
    userClan,
    discoverClans,
    selectedClan,
    members,
    invites,
    isLoading,
    error,
    fetchUserClan,
    fetchDiscoverClans,
    fetchClanDetail,
    fetchMembers,
    fetchInvites,
    createClan,
    joinClan,
    leaveClan,
    createInvite,
    deleteClan,
    setSelectedClan,
  }
}
