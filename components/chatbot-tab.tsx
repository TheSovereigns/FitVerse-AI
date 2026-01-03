"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  role: "user" | "assistant"
  content: string
}

export function ChatbotTab() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Sou seu assistente FitVerse. Como posso ajudar com seu treino, dieta ou dúvidas sobre produtos?" }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async (message?: string) => {
    const currentMessage = message || inputValue;
    if (!currentMessage.trim()) return;

    const historyForAPI = [...messages];

    setInputValue("");
    // Adiciona a mensagem do usuário e um placeholder vazio para a resposta da IA
    setMessages(prev => [...prev, { role: "user", content: currentMessage }, { role: "assistant", content: "" }]);
    setIsLoading(true);
    
    try {
      // Carrega o plano metabólico do localStorage para dar contexto à IA
      const savedPlan = localStorage.getItem("userMetabolicPlan");
      let metabolicPlanContext = null;
      if (savedPlan) {
        try {
          metabolicPlanContext = JSON.parse(savedPlan);
        } catch (e) {
          console.error("Falha ao carregar plano metabólico para o chatbot", e);
        }
      }

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          history: historyForAPI, 
          message: currentMessage,
          metabolicPlan: metabolicPlanContext // Adiciona o contexto do usuário (memória)
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Lida com a resposta em streaming
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Falha ao ler a resposta da IA.");
      }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => {
          const lastMessageIndex = prev.length - 1;
          const updatedMessages = [...prev];
          updatedMessages[lastMessageIndex] = {
            ...updatedMessages[lastMessageIndex],
            content: updatedMessages[lastMessageIndex].content + chunk,
          };
          return updatedMessages;
        });
      }

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      setMessages(prev => {
        const lastMessageIndex = prev.length - 1;
        const updatedMessages = [...prev];
        if (updatedMessages[lastMessageIndex]?.role === 'assistant') {
          updatedMessages[lastMessageIndex].content = "Desculpe, tive um erro de conexão com a IA. Tente novamente mais tarde.";
        }
        return updatedMessages;
      });
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const quickQuestions = [
    "Qual o melhor suplemento para ganhar massa?",
    "Me dê uma ideia de treino para peito",
    "Como funciona a Dieta AI?",
  ]

  return (
    <div className="flex flex-col h-full min-h-[calc(100dvh-8rem)] md:min-h-0 bg-background text-foreground">
        {/* Header */}
        <div className="p-4 border-b border-border">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                <Bot className="w-7 h-7 text-primary"/>
                Assistente <span className="text-primary">AI</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Tire suas dúvidas sobre treino, dieta e produtos.</p>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 pb-4 max-w-3xl mx-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex w-full animate-in slide-in-from-bottom-2 duration-300 items-start gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted/50 border border-border text-foreground rounded-tl-none"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-background/80 backdrop-blur-lg p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0">
            <div className="max-w-3xl mx-auto">
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 -mx-4 px-4">
                    {quickQuestions.map(q => (
                        <Button key={q} variant="outline" size="sm" className="text-xs shrink-0" onClick={() => handleSendMessage(q)} disabled={isLoading}>
                            {q}
                        </Button>
                    ))}
                </div>
                <form
                    onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                    }}
                    className="flex gap-2 items-center"
                >
                    <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Digite sua dúvida..."
                    className="flex-1 bg-muted/50 border-muted-foreground/20 focus:border-primary focus:ring-primary/20 h-12"
                    disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 shrink-0">
                    <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    </div>
  )
}