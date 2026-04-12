"use client"

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Loader2, Send, BrainCircuit, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { MessageFeedback } from '@/components/chat/message-feedback'
import { saveAIMessage, createConversation, updateMessageFeedback } from '@/lib/ai-chat-service'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface Message {
  role: 'user' | 'model'
  text: string
  messageId?: string
}

const FINE_TUNING_GOAL = 10000

export function ChatbotTab() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: t("chatbot_greeting") }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [sessionId] = useState(() => crypto.randomUUID())
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showRatingPrompt, setShowRatingPrompt] = useState(false)
  const [ratingGiven, setRatingGiven] = useState(false)
  const [messageCount, setMessageCount] = useState(0)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (messageCount === 3 && !ratingGiven) {
      setShowRatingPrompt(true)
    }
  }, [messageCount, ratingGiven])

  const handleRating = async (rating: number) => {
    setRatingGiven(true)
    setShowRatingPrompt(false)
    try {
      const { data } = await supabase
        .from('ai_messages')
        .select('id')
        .eq('user_id', user?.id ?? null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (data?.id) {
        await updateMessageFeedback(data.id, { userRating: rating })
      }
    } catch {
      // silent
    }
  }

  const sendMessageToDb = async (userMsg: string, aiMsg: string, responseTimeMs: number) => {
    let convId = conversationId
    if (!convId) {
      convId = await createConversation(user?.id ?? null, sessionId)
      setConversationId(convId)
    }

    const userContext = {
      goal: (user?.user_metadata?.goal as string) || 'general',
      weight: user?.user_metadata?.weight as number | undefined,
      height: user?.user_metadata?.height as number | undefined,
      age: user?.user_metadata?.age as number | undefined,
      level: (user?.user_metadata?.level as string) || 'beginner',
      restrictions: (user?.user_metadata?.restrictions as string[]) || [],
      plan: (user?.user_metadata?.plan as 'free' | 'premium') || 'free',
      country: (user?.user_metadata?.country as 'BR' | 'US') || 'BR',
    }

    await saveAIMessage({
      conversationId: convId,
      userId: user?.id ?? null,
      userMessage: userMsg,
      aiResponse: aiMsg,
      userContext,
      modelUsed: 'gemini-2.5-flash',
      tokensUsed: null,
      responseTimeMs,
    })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', text: input }
    const userText = input
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const startTime = Date.now()

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))

      const storedPlan = typeof window !== 'undefined' ? localStorage.getItem('userMetabolicPlan') : null
      
      // Get token from localStorage directly
      let token = ''
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.includes('sb-') && key.includes('-auth-token')) {
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
      }
      
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userText,
          history,
          userMetabolicPlan: storedPlan ? JSON.parse(storedPlan) : null,
          userId: user?.id,
        }),
      })
      if (!response.ok) throw new Error(t("chatbot_net_error"))
      const data = await response.json()
      const botMessage: Message = { role: 'model', text: data.reply, messageId: data.messageId }
      setMessages(prev => [...prev, botMessage])

      const responseTimeMs = Date.now() - startTime
      setMessageCount(prev => prev + 1)

      // Save to dataset in background — never block the UI
      void sendMessageToDb(userText, data.reply, responseTimeMs)
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: t("chatbot_error") }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col h-[calc(100dvh-12rem)] md:h-[calc(100vh-8rem)] lg:h-[calc(100vh-10rem)] max-h-[800px] xl:max-h-[900px] w-full max-w-5xl xl:max-w-6xl mx-auto glass-strong border-white/20 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in duration-700">

      {/* Siri loading glow */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <div className="absolute inset-[-4px] border-[4px] border-transparent rounded-[3.5rem] bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-[length:200%_200%] animate-gradient-flow opacity-60 blur-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 px-5 md:px-8 py-4 md:py-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
            <Bot className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-black tracking-tight">{t("chatbot_header")}</h3>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{t("chatbot_status")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-bold text-muted-foreground opacity-40">
            {messageCount}{t("chatbot_msg_count")}
          </div>
          <div className="flex -space-x-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-background bg-primary/20" />
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-background bg-purple-500/20" />
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-background bg-cyan-500/20" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="relative z-10 flex-1 p-4 md:p-8 space-y-4 md:space-y-8 overflow-y-auto no-scrollbar scroll-smooth ios-scroll">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={cn('flex items-start gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div className={cn(
                'max-w-[88%] md:max-w-lg lg:max-w-xl xl:max-w-2xl shadow-xl',
                msg.role === 'user'
                  ? 'mesh-gradient text-white rounded-[1.5rem] rounded-br-[0.25rem]'
                  : 'glass-strong text-foreground rounded-[1.5rem] rounded-bl-[0.25rem] border border-white/10'
              )}>
                <div className={cn(
                  'p-4 md:p-6',
                  msg.role === 'model' && 'pb-2'
                )}>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-base md:text-lg font-medium leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
                {msg.role === 'model' && msg.messageId && (
                  <div className="px-4 pb-3">
                    <MessageFeedback messageId={msg.messageId} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 justify-start"
          >
            <div className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center animate-pulse">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <div className="glass-strong px-5 py-3 rounded-full text-xs font-black tracking-widest opacity-40 animate-pulse">
              {t("chatbot_analyzing")}
            </div>
          </motion.div>
        )}

        {/* Rating Prompt */}
        <AnimatePresence>
          {showRatingPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-center"
            >
              <div className="glass-strong border-white/10 rounded-2xl p-4 text-center">
                <p className="text-sm font-bold text-foreground mb-3">{t("chatbot_rate_experience")}</p>
                <div className="flex items-center gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:scale-125 transition-transform active:scale-90"
                    >
                      <Star className="w-7 h-7 text-amber-400 fill-amber-400 hover:text-amber-300" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowRatingPrompt(false)}
                  className="text-[10px] text-muted-foreground mt-2 hover:text-foreground transition-colors"
                >
                  {t("chatbot_skip_rating")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="relative z-10 p-3 md:p-6 bg-white/5 backdrop-blur-3xl">
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-3 md:gap-4 group">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chatbot_placeholder")}
            className="flex-1 rounded-[2rem] bg-white/5 border-white/10 hover:border-primary/40 focus:border-primary px-5 md:px-8 h-14 md:h-20 text-base md:text-xl font-bold transition-all shadow-inner"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="w-14 h-14 md:w-20 md:h-20 rounded-[1.75rem] md:rounded-[2.25rem] mesh-gradient shadow-2xl haptic-press transition-all active:scale-90"
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-6 h-6 md:w-8 md:h-8" />
          </Button>
        </form>
      </div>
    </div>
  )
}
