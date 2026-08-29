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
        // httpOnly migration: use supabase session instead of localStorage scraping
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token || ""
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
        const { data: { session } } = await supabase.auth.getSession()
        token = session?.access_token || ""
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
        <section className="paywall-card relative w-full overflow-hidden">
          <div className="relative mx-auto max-w-xl">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-border bg-muted/30 text-foreground/80 shadow-xl">
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

  const suggestionChips = ["Create a meal plan", "Analyze my sleep", "What should I eat?"]

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
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5 max-w-md">
              {suggestionChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setInput(chip)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors text-foreground"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div className="bg-brand rounded-2xl rounded-br-md px-4 py-3 max-w-[84%] ml-auto">
                <p className="text-sm whitespace-pre-wrap text-white">{msg.content}</p>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex justify-start">
              <div className="flex items-start gap-2.5 max-w-[84%]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md p-4">
                  <p className="text-sm whitespace-pre-wrap text-foreground">{msg.content}</p>
                  {msg.content && (
                    <div className="flex items-center gap-1.5 mt-3">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => rateMessage(msg.id, score)}
                          className="p-1 rounded-md hover:bg-muted transition-colors"
                          aria-label={`Rate ${score}`}
                        >
                          <Star
                            className={`h-4 w-4 transition-colors ${
                              (rating[msg.id] || 0) >= score
                                ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                                : "text-muted-foreground/60 hover:text-yellow-400/60"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ))}
        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2.5 max-w-[84%]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md p-4">
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
