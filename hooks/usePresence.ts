"use client"

import { useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

interface UsePresenceOptions {
  enabled?: boolean
  channelName?: string
  updateIntervalMs?: number
}

export function usePresence(options: UsePresenceOptions = {}): void {
  const { enabled = true, channelName = "app-presence", updateIntervalMs = 300000 } = options
  const { user } = useAuth()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const lastSeenUpdateRef = useRef<number>(0)

  const updateLastSeen = useCallback(async (userId: string) => {
    const now = Date.now()
    if (now - lastSeenUpdateRef.current >= updateIntervalMs) {
      lastSeenUpdateRef.current = now
      try {
        await supabase.rpc("update_last_seen", { p_user_id: userId })
      } catch {}
    }
  }, [updateIntervalMs])

  useEffect(() => {
    if (!enabled || !user?.id) return

    updateLastSeen(user.id)

    const interval = setInterval(() => {
      if (user?.id) updateLastSeen(user.id)
    }, updateIntervalMs)

    const channel = supabase.channel(channelName)
    channelRef.current = channel

    channel
      .on("presence", { event: "sync" }, () => {})
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      clearInterval(interval)
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [enabled, user?.id, channelName, updateIntervalMs, updateLastSeen])
}
