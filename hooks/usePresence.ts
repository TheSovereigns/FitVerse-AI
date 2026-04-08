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
      } catch (error) {
        console.error("Error updating last_seen:", error)
      }
    }
  }, [updateIntervalMs])

  useEffect(() => {
    if (!enabled || !user?.id) {
      return
    }

    const initializePresence = async () => {
      // Presence desabilitado temporariamente
      return
    }
          }
        }
      } catch (error) {
        console.error("Error setting up presence:", error)
      }
    }

    initializePresence()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).then(() => {
          channelRef.current = null
        })
      }
    }
  }, [enabled, user?.id, user?.email, channelName, updateIntervalMs, updateLastSeen])
}