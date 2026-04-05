"use client"

import { useState, useEffect } from "react"
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

  useEffect(() => {
    let eventsChannel: ReturnType<typeof supabase.channel> | null = null
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null

    const initializeRealtime = async () => {
      try {
        eventsChannel = supabase.channel("admin-events")

        eventsChannel
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "events",
            },
            (payload) => {
              const newEvent = payload.new as AdminEvent
              setRecentEvents((prev) => [newEvent, ...prev.slice(0, 14)])
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setIsConnected(true)
            }
          })

        presenceChannel = supabase.channel("admin-presence")

        presenceChannel
          .on("presence", { event: "sync" }, () => {
            if (!presenceChannel) return
            const state = presenceChannel.presenceState()
            const count = state ? Object.keys(state).length : 0
            setOnlineCount(count)
          })
          .subscribe()

        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(15)

        if (eventsData) {
          setRecentEvents(eventsData)
        }
      } catch (error) {
        console.error("Error initializing admin realtime:", error)
      }
    }

    initializeRealtime()

    return () => {
      if (eventsChannel) {
        supabase.removeChannel(eventsChannel)
      }
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel)
      }
    }
  }, [])

  return {
    onlineCount,
    recentEvents,
    isConnected,
  }
}