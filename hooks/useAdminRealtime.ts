"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"

interface AdminEvent {
  id: string
  user_id: string | null
  user_name: string | null
  user_email: string | null
  type: string
  metadata: Record<string, unknown>
  created_at: string
}

interface UseAdminRealtimeReturn {
  onlineCount: number
  recentEvents: AdminEvent[]
  isConnected: boolean
}

export function useAdminRealtime(): UseAdminRealtimeReturn {
  const [onlineCount, setOnlineCount] = useState(0)
  const [recentEvents, setRecentEvents] = useState<AdminEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(15)

        if (eventsData) {
          setRecentEvents(eventsData as AdminEvent[])
        }

        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString())

        setOnlineCount(count || 0)
      } catch {}
    }

    fetchData()

    const channel = supabase.channel("admin-realtime")
    channelRef.current = channel

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "events" }, (payload) => {
        const newEvent = payload.new as AdminEvent
        setRecentEvents(prev => [newEvent, ...prev].slice(0, 15))
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => {
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString())
          .then(({ count }) => setOnlineCount(count || 0))
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [])

  return { onlineCount, recentEvents, isConnected }
}
