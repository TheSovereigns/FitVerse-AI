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
    const fetchData = async () => {
      try {
        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(15)

        if (eventsData) {
          setRecentEvents(eventsData)
        }
      } catch (error) {
        console.error("Error fetching admin events:", error)
      }
    }

    fetchData()
  }, [])

  return {
    onlineCount,
    recentEvents,
    isConnected,
  }
}