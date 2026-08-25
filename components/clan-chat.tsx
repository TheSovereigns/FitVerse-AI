"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Send, Loader2, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClanChat } from "@/hooks/useClanChat"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "@/lib/i18n"

export function ClanChat({ clanId }: { clanId: string }) {
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { user } = useAuth()
  const { messages, isLoading, isSending, sendMessage } = useClanChat(clanId)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isSending) return
    const msg = input.trim(); setInput("")
    await sendMessage(msg)
  }

  const formatTime = (d: string) => new Date(d).toLocaleTimeString(isEnglish ? "en-US" : "pt-BR", { hour: "2-digit", minute: "2-digit" })
  const formatDate = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
    if (diff === 0) return isEnglish ? "Today" : "Hoje"
    if (diff === 1) return isEnglish ? "Yesterday" : "Ontem"
    return new Date(d).toLocaleDateString(isEnglish ? "en-US" : "pt-BR", { day: "numeric", month: "short" })
  }

  const grouped = messages.reduce((g: any[], msg) => {
    const key = new Date(msg.created_at).toISOString().split("T")[0]
    const last = g[g.length - 1]
    if (last?.dateKey === key) last.messages.push(msg)
    else g.push({ dateKey: key, date: formatDate(msg.created_at), messages: [msg] })
    return g
  }, [])

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-background overflow-hidden" style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 text-foreground/20 animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-foreground/20 mb-3" />
            <p className="text-sm font-bold text-foreground/20">{isEnglish ? "Start the conversation!" : "Inicie a conversa!"}</p>
          </div>
        ) : grouped.map((group: any) => (
          <div key={group.dateKey}>
              <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-muted/50" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/40">{group.date}</span>
              <div className="flex-1 h-px bg-muted/50" />
            </div>
            {group.messages.map((msg: any) => {
              const isOwn = msg.user_id === user?.id
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2 mb-2", isOwn ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5",
                    isOwn ? "bg-brand/10 border border-brand/10 rounded-br-md" : "bg-card border border-border rounded-bl-md"
                  )}>
                    {!isOwn && <p className="text-[10px] font-bold text-foreground/40 mb-1">{msg.profiles?.name || "User"}</p>}
                    <p className="text-sm text-foreground/80 break-words whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-[9px] text-foreground/40 mt-1 text-right">{formatTime(msg.created_at)}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isEnglish ? "Type a message..." : "Digite uma mensagem..."}
            disabled={isSending}
            className="flex-1 h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-foreground/20 outline-none focus:border-brand/30 transition-colors" />
          <button onClick={handleSend} disabled={!input.trim() || isSending}
            className="h-11 w-11 rounded-xl bg-brand flex items-center justify-center text-foreground hover:bg-brand/90 transition-colors disabled:opacity-40">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
