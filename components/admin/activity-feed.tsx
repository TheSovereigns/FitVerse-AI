"use client"

import { motion, AnimatePresence } from "framer-motion"
import { 
  UserPlus, 
  CreditCard, 
  UserMinus, 
  Bot, 
  LogIn,
  AlertCircle,
  Sparkles
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface AdminEvent {
  id: string
  user_id: string | null
  user_name: string | null
  user_email: string | null
  type: string
  metadata: Record<string, unknown>
  created_at: string
}

interface ActivityFeedProps {
  events: AdminEvent[]
  isLoading?: boolean
}

const eventConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  signup: { icon: UserPlus, color: "text-green-400", bgColor: "bg-green-500/10" },
  login: { icon: LogIn, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  subscription: { icon: CreditCard, color: "text-orange-400", bgColor: "bg-orange-500/10" },
  upgrade: { icon: CreditCard, color: "text-orange-400", bgColor: "bg-orange-500/10" },
  cancel: { icon: UserMinus, color: "text-red-400", bgColor: "bg-red-500/10" },
  ai_message: { icon: Bot, color: "text-neutral-400", bgColor: "bg-neutral-500/10" },
  ai_chat: { icon: Bot, color: "text-neutral-400", bgColor: "bg-neutral-500/10" },
}

function formatTimeAgo(dateString: string, locale: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return locale === "en-US" ? "now" : "agora"
  if (seconds < 3600) return locale === "en-US" 
    ? `${Math.floor(seconds / 60)}m ago` 
    : `há ${Math.floor(seconds / 60)}min`
  if (seconds < 86400) return locale === "en-US" 
    ? `${Math.floor(seconds / 3600)}h ago` 
    : `há ${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return locale === "en-US" 
    ? `${Math.floor(seconds / 86400)}d ago` 
    : `há ${Math.floor(seconds / 86400)}d`
  return date.toLocaleDateString(locale === "en-US" ? "en-US" : "pt-BR")
}

function getEventLabel(type: string, name: string | null, locale: string): string {
  const labels: Record<string, { pt: string; en: string }> = {
    signup: { pt: `${name || "Novo usuário"} se cadastrou`, en: `${name || "New user"} signed up` },
    login: { pt: `${name || "Usuário"} entrou no app`, en: `${name || "User"} logged in` },
    subscription: { pt: `${name || "Usuário"} assinou Premium`, en: `${name || "User"} subscribed to Premium` },
    upgrade: { pt: `${name || "Usuário"} fez upgrade`, en: `${name || "User"} upgraded` },
    cancel: { pt: `${name || "Usuário"} cancelou`, en: `${name || "User"} canceled` },
    ai_message: { pt: `${name || "Usuário"} usou a IA`, en: `${name || "User"} used AI` },
    ai_chat: { pt: `${name || "Usuário"} usou o chat IA`, en: `${name || "User"} used AI chat` },
  }
  return labels[type]?.[locale === "en-US" ? "en" : "pt"] || `${type}: ${name || "Unknown"}`
}

export function ActivityFeed({ events, isLoading = false }: ActivityFeedProps) {
  const { locale } = useTranslation()

  if (isLoading) {
    return (
      <div className="glass-strong border border-orange-500/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-bold text-white">
            {locale === "en-US" ? "Recent Activity" : "Atividade Recente"}
          </h3>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-strong border border-orange-500/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-bold text-white">
          {locale === "en-US" ? "Recent Activity" : "Atividade Recente"}
        </h3>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-neutral-400">AO VIVO</span>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
        <AnimatePresence>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">
                {locale === "en-US" ? "No recent activity" : "Nenhuma atividade recente"}
              </p>
            </div>
          ) : (
            events.map((event) => {
              const config = eventConfig[event.type] || eventConfig.login
              const Icon = config.icon

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bgColor)}>
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">
                      {getEventLabel(event.type, event.user_name, locale)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatTimeAgo(event.created_at, locale)}
                    </p>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}