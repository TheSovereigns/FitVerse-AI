"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useClanChat } from "@/hooks/useClanChat"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "@/lib/i18n"

export function ClanChat({ clanId }: { clanId: string }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { user } = useAuth()
  const { messages, isLoading, isSending, sendMessage } = useClanChat(clanId)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isSending) return
    const msg = input.trim()
    setInput("")
    await sendMessage(msg)
    inputRef.current?.focus()
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString(isEnglish ? "en-US" : "pt-BR", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return isEnglish ? "Today" : "Hoje"
    if (diffDays === 1) return isEnglish ? "Yesterday" : "Ontem"
    return d.toLocaleDateString(isEnglish ? "en-US" : "pt-BR", { day: "numeric", month: "short" })
  }

  const groupedMessages = messages.reduce((groups: any[], msg, i) => {
    const dateKey = new Date(msg.created_at).toISOString().split("T")[0]
    const lastGroup = groups[groups.length - 1]
    if (lastGroup?.dateKey === dateKey) {
      lastGroup.messages.push(msg)
    } else {
      groups.push({ dateKey, date: formatDate(msg.created_at), messages: [msg] })
    }
    return groups
  }, [])

  return (
    <div className="flex flex-col rounded-[1.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl overflow-hidden" style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 text-foreground/50 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-foreground/10 mb-3" />
            <p className="text-sm font-bold text-foreground/40">
              {isEnglish ? "Start the conversation!" : "Inicie a conversa!"}
            </p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.dateKey}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
                  {group.date}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              {group.messages.map((msg: any) => {
                const isOwn = msg.user_id === user?.id
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-2 mb-2", isOwn ? "justify-end" : "justify-start")}
                  >
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5",
                      isOwn
                        ? "bg-white/5 border border-white/10 rounded-br-md"
                        : "bg-black/40 border border-white/5 rounded-bl-md"
                    )}>
                      {!isOwn && (
                        <p className="text-[10px] font-black text-foreground/60 mb-1">
                          {msg.profiles?.name || "User"}
                        </p>
                      )}
                      <p className="text-sm text-foreground/80 break-words whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[9px] text-foreground/30 mt-1 text-right">{formatTime(msg.created_at)}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isEnglish ? "Type a message..." : "Digite uma mensagem..."}
            className="flex-1 h-11 rounded-xl border-white/10 bg-black/30 text-sm"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="h-11 w-11 rounded-xl bg-foreground text-black hover:bg-foreground/80 disabled:opacity-40"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
