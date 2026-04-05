"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MoreVertical, 
  Shield, 
  ShieldOff,
  Ban,
  Mail,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Search,
  Download
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface Profile {
  id: string
  name: string | null
  email: string
  plan: string
  is_admin: boolean
  is_banned: boolean
  country: string
  created_at: string
  last_seen: string | null
  avatar_url?: string
}

interface UsersTableProps {
  users: Profile[]
  totalCount: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onSearch: (term: string) => void
  onPromoteToAdmin: (userId: string) => void
  onRemoveAdmin: (userId: string) => void
  onBanUser: (userId: string) => void
  onUnbanUser: (userId: string) => void
  onCancelSubscription: (userId: string) => void
}

const countryFlags: Record<string, string> = {
  BR: "🇧🇷",
  US: "🇺🇸",
  PT: "🇵🇹",
  ES: "🇪🇸",
}

const countryNames: Record<string, string> = {
  BR: "Brasil",
  US: "Estados Unidos",
  PT: "Portugal",
  ES: "Espanha",
}

function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleDateString(locale === "en-US" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatRelativeTime(dateString: string | null, locale: string): string {
  if (!dateString) return "-"
  
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return locale === "en-US" ? "now" : "agora"
  if (seconds < 3600) return locale === "en-US" 
    ? `${Math.floor(seconds / 60)}m` 
    : `${Math.floor(seconds / 60)}min`
  if (seconds < 86400) return locale === "en-US" 
    ? `${Math.floor(seconds / 3600)}h` 
    : `${Math.floor(seconds / 3600)}h`
  return locale === "en-US" 
    ? `${Math.floor(seconds / 86400)}d` 
    : `${Math.floor(seconds / 86400)}d`
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(" ")
    return parts[0].charAt(0).toUpperCase() + (parts[1] ? parts[1].charAt(0).toUpperCase() : "")
  }
  return email.charAt(0).toUpperCase()
}

export function UsersTable({
  users,
  totalCount,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onSearch,
  onPromoteToAdmin,
  onRemoveAdmin,
  onBanUser,
  onUnbanUser,
  onCancelSubscription,
}: UsersTableProps) {
  const { locale } = useTranslation()
  const [searchTerm, setSearchTerm] = useState("")
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    onSearch(term)
  }

  const handleExportCSV = () => {
    const headers = ["Nome", "Email", "Plano", "País", "Cadastro", "Último Acesso", "Admin", "Banido"]
    const rows = users.map(u => [
      u.name || "",
      u.email,
      u.plan,
      u.country,
      formatDate(u.created_at, locale),
      u.last_seen || "",
      u.is_admin ? "Sim" : "Não",
      u.is_banned ? "Sim" : "Não"
    ])
    
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `usuarios-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder={locale === "en-US" ? "Search by name or email..." : "Buscar por nome ou email..."}
            value={searchTerm}
            onChange={handleSearch}
            className="w-full sm:w-80 pl-10 pr-4 py-2 bg-[#1f1100] border border-orange-500/20 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500/40"
          />
        </div>
        
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          {locale === "en-US" ? "Export CSV" : "Exportar CSV"}
        </button>
      </div>

      <div className="glass-strong border border-orange-500/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orange-500/10">
                <th className="text-left text-sm font-medium text-neutral-400 px-4 py-3">
                  {locale === "en-US" ? "User" : "Usuário"}
                </th>
                <th className="text-left text-sm font-medium text-neutral-400 px-4 py-3">
                  {locale === "en-US" ? "Plan" : "Plano"}
                </th>
                <th className="text-left text-sm font-medium text-neutral-400 px-4 py-3">
                  {locale === "en-US" ? "Country" : "País"}
                </th>
                <th className="text-left text-sm font-medium text-neutral-400 px-4 py-3">
                  {locale === "en-US" ? "Joined" : "Cadastro"}
                </th>
                <th className="text-left text-sm font-medium text-neutral-400 px-4 py-3">
                  {locale === "en-US" ? "Last Seen" : "Último Acesso"}
                </th>
                <th className="text-left text-sm font-medium text-neutral-400 px-4 py-3">
                  {locale === "en-US" ? "Status" : "Status"}
                </th>
                <th className="text-left text-sm font-medium text-neutral-400 px-4 py-3">
                  {locale === "en-US" ? "Actions" : "Ações"}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-orange-500/5">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="animate-pulse flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5" />
                        <div className="space-y-2">
                          <div className="h-4 bg-white/5 rounded w-32" />
                          <div className="h-3 bg-white/5 rounded w-48" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    {locale === "en-US" ? "No users found" : "Nenhum usuário encontrado"}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b border-orange-500/5 hover:bg-orange-500/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                          {getInitials(user.name, user.email)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name || "-"}</p>
                          <p className="text-sm text-neutral-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                        user.plan === "premium" 
                          ? "bg-orange-500/20 text-orange-400" 
                          : "bg-neutral-700/50 text-neutral-400"
                      )}>
                        {user.plan === "premium" ? "Premium" : "Free"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-white">
                        <span>{countryFlags[user.country] || "🌍"}</span>
                        <span className="text-sm text-neutral-400">
                          {countryNames[user.country] || user.country}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {formatDate(user.created_at, locale)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {formatRelativeTime(user.last_seen, locale)}
                    </td>
                    <td className="px-4 py-3">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                          Banido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          Ativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-neutral-400" />
                      </button>
                      
                      <AnimatePresence>
                        {openDropdownId === user.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-4 top-full mt-1 w-48 bg-[#1f1100] border border-orange-500/20 rounded-xl shadow-lg z-50 py-1"
                          >
                            {user.is_admin ? (
                              <button
                                onClick={() => { onRemoveAdmin(user.id); setOpenDropdownId(null) }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:bg-orange-500/10"
                              >
                                <ShieldOff className="w-4 h-4" />
                                {locale === "en-US" ? "Remove Admin" : "Remover Admin"}
                              </button>
                            ) : (
                              <button
                                onClick={() => { onPromoteToAdmin(user.id); setOpenDropdownId(null) }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:bg-orange-500/10"
                              >
                                <Shield className="w-4 h-4" />
                                {locale === "en-US" ? "Promote to Admin" : "Tornar Admin"}
                              </button>
                            )}
                            
                            {user.is_banned ? (
                              <button
                                onClick={() => { onUnbanUser(user.id); setOpenDropdownId(null) }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-orange-500/10"
                              >
                                <Ban className="w-4 h-4" />
                                {locale === "en-US" ? "Unban User" : "Desbanir"}
                              </button>
                            ) : (
                              <button
                                onClick={() => { onBanUser(user.id); setOpenDropdownId(null) }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-orange-500/10"
                              >
                                <Ban className="w-4 h-4" />
                                {locale === "en-US" ? "Ban User" : "Banir Usuário"}
                              </button>
                            )}
                            
                            {user.plan === "premium" && (
                              <button
                                onClick={() => { onCancelSubscription(user.id); setOpenDropdownId(null) }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-400 hover:bg-orange-500/10"
                              >
                                <CreditCard className="w-4 h-4" />
                                {locale === "en-US" ? "Cancel Subscription" : "Cancelar Assinatura"}
                              </button>
                            )}
                            
                            <a
                              href={`mailto:${user.email}`}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:bg-orange-500/10"
                            >
                              <Mail className="w-4 h-4" />
                              {locale === "en-US" ? "Send Email" : "Enviar Email"}
                            </a>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-400">
          <p>
            {locale === "en-US" 
              ? `Showing ${startIndex}-${endIndex} of ${totalCount} users`
              : `Mostrando ${startIndex}-${endIndex} de ${totalCount} usuários`
            }
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg">
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}