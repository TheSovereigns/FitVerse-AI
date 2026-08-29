"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { getToken } from "@/lib/auth/getToken"

interface ClanMessage {
  id: string
  clan_id: string
  user_id: string
  content: string
  message_type: string
  metadata: any
  created_at: string
  profiles?: {
    name: string
    avatar_url: string | null
  }
}

export function useClanChat(clanId: string | null) {
  const [messages, setMessages] = useState<ClanMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const channelRef = useRef<any>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRealtimeRef = useRef(false)
  const messagesRef = useRef<ClanMessage[]>([])
  // Keep ref in sync for incremental poll (avoid stale closure)
  useEffect(() => { messagesRef.current = messages }, [messages])

  const fetchMessages = useCallback(async () => {
    if (!clanId) return
    setIsLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch(`/api/clans/${clanId}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (e) {
      console.error("Error fetching messages:", e)
    } finally {
      setIsLoading(false)
    }
  }, [clanId])

  // Silent background fetch for polling fallback (no loading spinner) — incremental via ?after=lastId
  const fetchMessagesSilent = useCallback(async () => {
    if (!clanId) return
    try {
      const token = await getToken()
      if (!token) return
      const lastId = messagesRef.current[messagesRef.current.length - 1]?.id
      const url = lastId
        ? `/api/clans/${clanId}/messages?limit=100&after=${encodeURIComponent(lastId)}`
        : `/api/clans/${clanId}/messages?limit=100`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        // If incremental, append; otherwise replace (fallback when API ignores ?after)
        if (lastId) {
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.id))
            const next = data.messages.filter((m: ClanMessage) => !existing.has(m.id))
            return next.length ? [...prev, ...next] : prev
          })
        } else {
          setMessages(data.messages)
        }
      }
    } catch (e) {
      console.error("Error polling messages:", e)
    }
  }, [clanId])

  const sendMessage = useCallback(async (content: string, messageType?: string, metadata?: any) => {
    if (!clanId || !content.trim()) return
    setIsSending(true)
    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch(`/api/clans/${clanId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          messageType: messageType || "text",
          metadata,
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages((prev) => [...prev, data.message])
      }
    } catch (e) {
      console.error("Error sending message:", e)
    } finally {
      setIsSending(false)
    }
  }, [clanId])

  useEffect(() => {
    if (!clanId) {
      setMessages([])
      return
    }

    fetchMessages()

    const startPolling = (ms: number) => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(() => {
        if (document.hidden) return
        if (isRealtimeRef.current) return
        fetchMessagesSilent()
      }, ms)
    }
    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    // Adaptive polling: 30s heartbeat when realtime unavailable, 5s on error
    startPolling(30000)

    // Realtime subscription (enhancement) - adaptive fallback for free tier
    const channel = supabase
      .channel(`clan-chat-${clanId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clan_messages",
          filter: `clan_id=eq.${clanId}`,
        },
        (payload) => {
          const newMsg = payload.new as ClanMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          isRealtimeRef.current = true
          stopPolling()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          isRealtimeRef.current = false
          console.warn(`[useClanChat] Realtime ${status} for clan ${clanId} — polling fallback active (5s)`)
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
  }, [clanId, fetchMessages, fetchMessagesSilent])

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    fetchMessages,
  }
}
