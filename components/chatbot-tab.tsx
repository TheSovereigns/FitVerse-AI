"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Loader2, Star } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/hooks/useAuth"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { logger } from "@/lib/logger"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export function ChatbotTab() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const { plan } = usePlanLimits()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [rating, setRating] = useState<Record<string, number>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load conversation history on mount
  useEffect(() => {
    if (!user) return

    const loadHistory = async () => {
      try {
        let token = ""
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.includes("sb-") && key.includes("-auth-token")) {
            const storedSession = localStorage.getItem(key)
            if (storedSession) {
              const parsed = JSON.parse(storedSession)
              if (parsed?.access_token) {
                token = parsed.access_token
                break
              }
            }
          }
        }
        if (!token) return

        const response = await fetch("/api/chatbot", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) return

        const data = await response.json()
        if (data.messages?.length > 0) {
          const loaded: Message[] = data.messages.map((m: any, i: number) => ({
            id: `loaded-${i}`,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp || new Date().toISOString(),
          }))
          setMessages(loaded.slice(-50)) // Keep last 50 messages
        }
      } catch (e) {
        logger.error("[Chatbot] Failed to load history:", e)
      }
    }

    loadHistory()
  }, [user])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      let token = ""
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.includes("sb-") && key.includes("-auth-token")) {
            const storedSession = localStorage.getItem(key)
            if (storedSession) {
              const parsed = JSON.parse(storedSession)
              if (parsed?.access_token) {
                token = parsed.access_token
                break
              }
            }
          }
        }
      } catch (e) {
        logger.error("[Chatbot] Failed to get auth token:", e)
      }

      const assistantId = (Date.now() + 1).toString()
      let accumulatedContent = ""

      // Add empty assistant message for streaming
      setMessages((prev) => [...prev, {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      }])

      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: input.trim(),
          history: messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.content }],
          })),
          locale,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          const lines = text.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.text) {
                  accumulatedContent += data.text
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: accumulatedContent }
                        : m
                    )
                  )
                }
              } catch {}
            }
          }
        }
      }

      // Fallback if no streaming occurred
      if (!accumulatedContent) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Desculpe, não consegui processar sua pergunta." }
              : m
          )
        )
      }
    } catch (error) {
      logger.error("[Chatbot] Error:", error)
      toast.error(t("chatbot_error") || "Erro ao enviar mensagem")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const rateMessage = async (messageId: string, score: number) => {
    setRating((prev) => ({ ...prev, [messageId]: score }))
    try {
      await supabase.from("chat_ratings").insert({
        message_id: messageId,
        score,
        user_id: user?.id,
      })
    } catch (e) {
      logger.error("[Chatbot] Failed to rate message:", e)
    }
  }

  if (plan === "free") {
    return (
      <div className="relative mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center p-4">
        <section className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:rounded-[2.5rem] md:p-10">
          <div className="relative mx-auto max-w-xl">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/10 text-foreground/80 shadow-xl">
              <Bot className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">{t("chatbot_header")}</h1>
            <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-relaxed text-foreground/50 md:text-base">
              {t("chatbot_pro_required") || "Faça upgrade para Pro ou Premium para acessar o coach IA."}
            </p>
            <Button onClick={() => window.location.href = "/subscription"} className="mt-7 h-12 rounded-2xl bg-brand text-white">
              {t("subscription_upgrade") || "Fazer Upgrade"}
            </Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-4xl flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold text-foreground">{t("chatbot_welcome") || "Olá! Sou seu coach IA."}</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              {t("chatbot_welcome_desc") || "Pergunte sobre treinos, nutrição, suplementos ou qualquer coisa sobre fitness."}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[80%] gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                msg.role === "user" ? "bg-brand/20 text-brand" : "bg-muted text-muted-foreground"
              }`}>
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-brand text-white"
                  : "bg-muted text-foreground"
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.role === "assistant" && msg.content && (
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => rateMessage(msg.id, score)}
                        className="p-0.5"
                      >
                        <Star
                          className={`h-3 w-3 ${
                            (rating[msg.id] || 0) >= score
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/50"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-background p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatbot_placeholder") || "Digite sua pergunta..."}
            disabled={isLoading}
            className="h-12 rounded-xl border-border bg-background text-foreground"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-xl bg-brand text-white"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
