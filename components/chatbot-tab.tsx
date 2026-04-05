"use client";

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Loader2, Send, BrainCircuit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function ChatbotTab() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: t("chatbot_greeting") }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history }),
      });
      if (!response.ok) throw new Error(t("chatbot_net_error"));
      const data = await response.json();
      const botMessage: Message = { role: 'model', text: data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: t("chatbot_error") }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-[calc(100dvh-10rem)] md:h-[80vh] w-full max-w-5xl mx-auto glass-strong border-white/20 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in duration-700">

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
        <div className="flex -space-x-2">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-background bg-primary/20" />
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-background bg-purple-500/20" />
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-background bg-cyan-500/20" />
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
                'max-w-[88%] md:max-w-lg p-4 md:p-6 shadow-xl',
                msg.role === 'user'
                  ? 'mesh-gradient text-white rounded-[1.5rem] rounded-br-[0.25rem]'
                  : 'glass-strong text-foreground rounded-[1.5rem] rounded-bl-[0.25rem] border border-white/10'
              )}>
                <div className="prose prose-sm dark:prose-invert max-w-none text-base md:text-lg font-medium leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
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
  );
}