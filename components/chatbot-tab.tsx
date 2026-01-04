"use client";

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Loader2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function ChatbotTab() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou seu assistente FitVerse. Como posso ajudar com seu treino, dieta ou dúvidas sobre produtos?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
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
      // Prepare history for the API
      const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao comunicar com a IA.');
      }

      const data = await response.json();

      if (typeof data.reply !== 'string') {
        throw new Error("A resposta da IA não veio no formato esperado.");
      }

      const botMessage: Message = { role: 'model', text: data.reply };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      const errorMessage: Message = {
        role: 'model',
        text: error instanceof Error ? error.message : 'Ocorreu um erro. Tente novamente.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-white dark:bg-gray-950 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
      <div ref={chatContainerRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={cn('flex items-start gap-4', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'model' && (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="w-6 h-6" />
              </div>
            )}
            <div className={cn(
              'max-w-md p-4 rounded-2xl',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-none'
                : 'bg-gray-100 dark:bg-gray-800 rounded-bl-none'
            )}>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{ p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} /> }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-4 justify-start">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="max-w-md p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-bl-none">
              <p className="text-sm text-gray-500">Digitando...</p>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pergunte ao FitVerse AI..." className="flex-1" disabled={isLoading} />
        <Button type="submit" size="icon" disabled={isLoading}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}