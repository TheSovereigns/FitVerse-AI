"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Search, 
  Filter, 
  MoreVertical,
  Shield,
  Ban,
  Crown,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { supabase, Profile } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type FilterType = "all" | "free" | "pro" | "premium" | "canceled"

export default function AdminUsersPage() {
  const { t, locale } = useTranslation()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const pageSize = 20

  useEffect(() => {
    fetchUsers()
  }, [currentPage, filter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

      if (filter === "free") {
        query = query.eq('plan', 'free')
      } else if (filter === "pro") {
        query = query.eq('plan', 'pro')
      } else if (filter === "premium") {
        query = query.eq('plan', 'premium')
      }

      const { data, count, error } = await query

      if (error) throw error

      setUsers(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchUsers()
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error("Error promoting user:", error)
    }
  }

  const handleDemoteFromAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: false })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error("Error demoting user:", error)
    }
  }

  const handleChangePlan = async (userId: string, newPlan: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: newPlan })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error("Error changing plan:", error)
    }
  }

  const handleBanUser = async (userId: string) => {
    if (!confirm(locale === "en-US" ? "Are you sure you want to ban this user?" : "Tem certeza que deseja banir este usuário?")) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'banned' })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error("Error banning user:", error)
    }
  }

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Plan", "Country", "Created At", "Last Seen"]
    const rows = users.map(u => [
      u.name || "",
      u.email,
      u.plan,
      u.country,
      new Date(u.created_at).toLocaleDateString(),
      u.last_seen ? new Date(u.last_seen).toLocaleDateString() : "Never"
    ])

    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fitverse-users.csv"
    a.click()
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const getPlanBadge = (plan: string) => {
    const styles: Record<string, string> = {
      free: "bg-white/10 text-white/60",
      pro: "bg-blue-500/20 text-blue-400",
      premium: "bg-primary/20 text-primary",
      banned: "bg-red-500/20 text-red-400"
    }
    const labels: Record<string, string> = {
      free: locale === "en-US" ? "Free" : "Grátis",
      pro: "Pro",
      premium: locale === "en-US" ? "Premium" : "Premium",
      banned: locale === "en-US" ? "Banned" : "Banido"
    }
    return (
      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", styles[plan] || styles.free)}>
        {labels[plan] || plan}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">
            {locale === "en-US" ? "Users" : "Usuários"}
          </h1>
          <p className="text-white/40 mt-1">
            {totalCount} {locale === "en-US" ? "total users" : "usuários total"}
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          className="bg-white/10 text-white hover:bg-white/20 border border-white/10"
        >
          <Download className="w-4 h-4 mr-2" />
          {locale === "en-US" ? "Export CSV" : "Exportar CSV"}
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={locale === "en-US" ? "Search by name or email..." : "Buscar por nome ou email..."}
            className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "free", "pro", "premium"] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "ghost"}
              onClick={() => { setFilter(f); setCurrentPage(1) }}
              className={cn(
                filter === f ? "bg-primary text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {f === "all" ? (locale === "en-US" ? "All" : "Todos") :
               f === "free" ? (locale === "en-US" ? "Free" : "Grátis") :
               f === "pro" ? "Pro" :
               (locale === "en-US" ? "Premium" : "Premium")}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-strong border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4">
                  {locale === "en-US" ? "User" : "Usuário"}
                </th>
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4">
                  {locale === "en-US" ? "Plan" : "Plano"}
                </th>
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4">
                  {locale === "en-US" ? "Country" : "País"}
                </th>
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4">
                  {locale === "en-US" ? "Joined" : "Cadastrado"}
                </th>
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4">
                  {locale === "en-US" ? "Last Seen" : "Último Acesso"}
                </th>
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4">
                  {locale === "en-US" ? "Actions" : "Ações"}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/40">
                    {locale === "en-US" ? "Loading..." : "Carregando..."}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/40">
                    {locale === "en-US" ? "No users found" : "Nenhum usuário encontrado"}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black">
                          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name || "Unknown"}</p>
                          <p className="text-xs text-white/40">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{getPlanBadge(user.plan)}</td>
                    <td className="p-4 text-sm text-white/60">{user.country}</td>
                    <td className="p-4 text-sm text-white/60">
                      {new Date(user.created_at).toLocaleDateString(locale === "en-US" ? "en-US" : "pt-BR")}
                    </td>
                    <td className="p-4 text-sm text-white/60">
                      {user.last_seen
                        ? new Date(user.last_seen).toLocaleDateString(locale === "en-US" ? "en-US" : "pt-BR")
                        : "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={user.plan}
                          onChange={(e) => handleChangePlan(user.id, e.target.value)}
                          className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-2 py-1"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => user.is_admin ? handleDemoteFromAdmin(user.id) : handlePromoteToAdmin(user.id)}
                          className={cn(
                            "text-xs px-2 py-1 h-auto rounded-lg",
                            user.is_admin ? "text-primary hover:text-primary/80" : "text-white/40 hover:text-primary"
                          )}
                          title={user.is_admin ? "Remove Admin" : "Make Admin"}
                        >
                          <Crown className={cn("w-3 h-3", user.is_admin && "fill-current")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBanUser(user.id)}
                          className="text-white/40 hover:text-red-400 text-xs px-2 py-1 h-auto rounded-lg"
                          title="Ban User"
                        >
                          <Ban className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-sm text-white/40">
              {locale === "en-US" 
                ? `Page ${currentPage} of ${totalPages}`
                : `Página ${currentPage} de ${totalPages}`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-white/60"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-white/60"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}