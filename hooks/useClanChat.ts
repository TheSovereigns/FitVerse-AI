"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"

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

export function useClanChat(clanId: string | null) {
  const [messages, setMessages] = useState<ClanMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const channelRef = useRef<any>(null)

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
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [clanId, fetchMessages])

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    fetchMessages,
  }
}
