"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  X,
  Save,
  FileText,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"

type MessageRecord = {
  id: string
  user_message: string
  ai_response: string
  edited_response: string | null
  category: string | null
  subcategory: string | null
  user_rating: number | null
  user_thumbs_up: boolean | null
  user_flagged: boolean
  flag_reason: string | null
  training_status: string
  user_message_lang: string
  created_at: string
  user_context: Record<string, unknown>
  profiles: { name: string | null; email: string } | null
}

type StatsRecord = {
  total_messages: number
  approved: number
  edited: number
  rejected: number
  pending_review: number
  thumbs_up: number
  flagged: number
  avg_rating: number | null
  unique_users: number
  portuguese_messages: number
  english_messages: number
  category: string | null
  category_count: number
}

type GrowthPoint = { date: string; total: number }
type CategoryPoint = { name: string; value: number; color: string }
type RatingPoint = { rating: string; count: number; color: string }
type LangPoint = { name: string; value: number; color: string }

const CATEGORY_LABELS: Record<string, string> = {
  workout: "Treino",
  nutrition: "Nutrição",
  motivation: "Motivação",
  recovery: "Recuperação",
  supplement: "Suplementos",
  general: "Geral",
}

const CATEGORY_COLORS: Record<string, string> = {
  workout: "#FF6B6B",
  nutrition: "#4ECDC4",
  motivation: "#FFE66D",
  recovery: "#A78BFA",
  supplement: "#F59E0B",
  general: "#6B7280",
}

const STATUS_LABELS: Record<string, string> = {
  raw: "Pendente",
  approved: "Aprovado",
  edited: "Editado",
  rejected: "Rejeitado",
  exported: "Exportado",
}

const STATUS_COLORS: Record<string, string> = {
  raw: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  edited: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  rejected: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  exported: "bg-purple-500/20 text-purple-400 border-purple-500/30",
}

const DATASET_GOAL = 10000

export default function DatasetPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, profile } = useAuth()
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login")
        return
      }
      if (profile && !profile.is_admin) {
        setAccessDenied(true)
      } else if (!profile) {
        supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (!data?.is_admin) setAccessDenied(true)
          })
      }
    }
  }, [user, authLoading, profile, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-black text-white mb-4">Acesso Negado</h1>
          <p className="text-zinc-400 mb-8">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => router.push("/")} className="bg-orange-500 hover:bg-orange-600 text-black font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar ao Início
          </Button>
        </div>
      </div>
    )
  }

  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [stats, setStats] = useState<StatsRecord[]>([])
  const [growthData, setGrowthData] = useState<GrowthPoint[]>([])
  const [ratingData, setRatingData] = useState<RatingPoint[]>([])
  const [langData, setLangData] = useState<LangPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterLang, setFilterLang] = useState("all")
  const [filterRating, setFilterRating] = useState("all")
  const [filterThumbsUp, setFilterThumbsUp] = useState(false)
  const [filterFlagged, setFilterFlagged] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [editingMessage, setEditingMessage] = useState<MessageRecord | null>(null)
  const [editText, setEditText] = useState("")
  const [viewingMessage, setViewingMessage] = useState<MessageRecord | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<"jsonl" | "alpaca" | "csv">("jsonl")
  const [exportLang, setExportLang] = useState("all")

  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("ai_messages")
        .select("*, profiles(name, email)")
        .order("created_at", { ascending: false })

      if (filterStatus !== "all") query = query.eq("training_status", filterStatus)
      if (filterCategory !== "all") query = query.eq("category", filterCategory)
      if (filterLang !== "all") query = query.eq("user_message_lang", filterLang)
      if (filterRating !== "all") query = query.eq("user_rating", parseInt(filterRating))
      if (filterThumbsUp) query = query.eq("user_thumbs_up", true)
      if (filterFlagged) query = query.eq("user_flagged", true)
      if (searchQuery) query = query.ilike("user_message", `%${searchQuery}%`)

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data, error } = await query.range(from, to)

      if (!error && data) setMessages(data as MessageRecord[])

      const { data: statsData } = await supabase.from("dataset_stats").select("*")
      if (statsData) setStats(statsData as StatsRecord[])

      const { data: growthRows } = await supabase
        .from("ai_messages")
        .select("created_at")
        .order("created_at", { ascending: true })

      if (growthRows) {
        const dateMap: Record<string, number> = {}
        growthRows.forEach((r) => {
          const d = r.created_at.split("T")[0]
          dateMap[d] = (dateMap[d] || 0) + 1
        })
        let cumulative = 0
        const points: GrowthPoint[] = Object.entries(dateMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => {
            cumulative += count
            return { date, total: cumulative }
          })
        setGrowthData(points)
      }

      const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      const langCounts: Record<string, number> = { pt: 0, en: 0 }
      if (data) {
        data.forEach((m) => {
          if (m.user_rating && m.user_rating >= 1 && m.user_rating <= 5) {
            ratingCounts[m.user_rating]++
          }
          if (m.user_message_lang === "pt") langCounts.pt++
          else if (m.user_message_lang === "en") langCounts.en++
        })
      }
      setRatingData([
        { rating: "1★", count: ratingCounts[1], color: "#EF4444" },
        { rating: "2★", count: ratingCounts[2], color: "#F97316" },
        { rating: "3★", count: ratingCounts[3], color: "#EAB308" },
        { rating: "4★", count: ratingCounts[4], color: "#22C55E" },
        { rating: "5★", count: ratingCounts[5], color: "#10B981" },
      ])
      setLangData([
        { name: "Português", value: langCounts.pt, color: "#FF9500" },
        { name: "English", value: langCounts.en, color: "#4ECDC4" },
      ])
    } catch (error) {
      console.error("Failed to fetch dataset:", error)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterCategory, filterLang, filterRating, filterThumbsUp, filterFlagged, searchQuery, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalMessages = stats.length > 0 ? (stats[0]?.total_messages ?? 0) : 0
  const totalApproved = stats.length > 0 ? (stats[0]?.approved ?? 0) : 0
  const totalEdited = stats.length > 0 ? (stats[0]?.edited ?? 0) : 0
  const totalPending = stats.length > 0 ? (stats[0]?.pending_review ?? 0) : 0
  const totalRejected = stats.length > 0 ? (stats[0]?.rejected ?? 0) : 0
  const avgRating = stats.length > 0 ? (stats[0]?.avg_rating ?? null) : null
  const readyForTraining = totalApproved + totalEdited
  const progressPercent = Math.min(100, (readyForTraining / DATASET_GOAL) * 100)

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from("ai_messages").update({ training_status: status }).eq("id", id)
    fetchData()
  }

  const handleSaveEdit = async () => {
    if (!editingMessage) return
    await supabase
      .from("ai_messages")
      .update({
        training_status: "edited",
        edited_response: editText,
        edited_at: new Date().toISOString(),
      })
      .eq("id", editingMessage.id)
    setEditingMessage(null)
    fetchData()
  }

  const handleBulkAction = async (status: string) => {
    if (selectedMessages.size === 0) return
    await supabase
      .from("ai_messages")
      .update({ training_status: status })
      .in("id", Array.from(selectedMessages))
    setSelectedMessages(new Set())
    fetchData()
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch("/api/admin/export-dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: exportFormat,
          lang: exportLang,
          status: ["approved", "edited"],
        }),
      })
      if (!response.ok) throw new Error("Export failed")
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fitverse-dataset.${exportFormat === "jsonl" ? "jsonl" : exportFormat === "csv" ? "csv" : "json"}`
      a.click()
      URL.revokeObjectURL(url)
      setShowExportModal(false)
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setExporting(false)
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedMessages)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedMessages(next)
  }

  const toggleSelectAll = () => {
    if (selectedMessages.size === messages.length) {
      setSelectedMessages(new Set())
    } else {
      setSelectedMessages(new Set(messages.map((m) => m.id)))
    }
  }

  const truncate = (str: string, len: number) =>
    str.length > len ? str.slice(0, len) + "..." : str

  const StarRating = ({ rating }: { rating: number | null }) => {
    if (!rating) return <span className="text-muted-foreground/30 text-xs">—</span>
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn("w-3 h-3", i < rating ? "text-amber-400 fill-amber-400" : "text-white/10")}
          />
        ))}
      </div>
    )
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/20">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Dataset IA</h1>
            <p className="text-xs text-neutral-500">Coleta de dados para fine-tuning</p>
          </div>
        </div>
        <Button
          onClick={() => setShowExportModal(true)}
          className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 rounded-xl"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Dataset
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={totalMessages} icon={Database} color="text-white" bg="bg-white/5" />
        <StatCard label="Aprovadas" value={totalApproved} icon={CheckCircle} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard label="Editadas" value={totalEdited} icon={Edit3} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard label="Pendentes" value={totalPending} icon={Clock} color="text-yellow-400" bg="bg-yellow-500/10" />
        <StatCard label="Rejeitadas" value={totalRejected} icon={XCircle} color="text-rose-400" bg="bg-rose-500/10" />
        <StatCard
          label="Rating Médio"
          value={avgRating ? `${avgRating.toFixed(1)}★` : "—"}
          icon={Star}
          color="text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Progress Bar */}
      <div className="glass-strong border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Progresso para Fine-Tuning
          </span>
          <span className="text-xs font-black text-primary">
            {readyForTraining.toLocaleString()} / {DATASET_GOAL.toLocaleString()}
          </span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full"
          />
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1.5">
          {progressPercent.toFixed(1)}% completo — {DATASET_GOAL - readyForTraining} mensagens restantes
        </p>
      </div>

      {/* Filters */}
      <div className="glass-strong border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs bg-white/5 border-white/10 rounded-lg"
          />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="h-8 text-xs bg-white/5 border border-white/10 rounded-lg px-2 text-white"
          >
            <option value="all">Todos Status</option>
            <option value="raw">Pendentes</option>
            <option value="approved">Aprovadas</option>
            <option value="edited">Editadas</option>
            <option value="rejected">Rejeitadas</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
            className="h-8 text-xs bg-white/5 border border-white/10 rounded-lg px-2 text-white"
          >
            <option value="all">Todas Categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterLang}
            onChange={(e) => { setFilterLang(e.target.value); setPage(1) }}
            className="h-8 text-xs bg-white/5 border border-white/10 rounded-lg px-2 text-white"
          >
            <option value="all">Todos Idiomas</option>
            <option value="pt">Português</option>
            <option value="en">English</option>
          </select>
          <select
            value={filterRating}
            onChange={(e) => { setFilterRating(e.target.value); setPage(1) }}
            className="h-8 text-xs bg-white/5 border border-white/10 rounded-lg px-2 text-white"
          >
            <option value="all">Todas Ratings</option>
            <option value="5">5★</option>
            <option value="4">4★</option>
            <option value="3">3★</option>
          </select>
          <button
            onClick={() => { setFilterThumbsUp(!filterThumbsUp); setPage(1) }}
            className={cn(
              "h-8 text-xs rounded-lg px-2 border transition-all font-bold",
              filterThumbsUp
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                : "bg-white/5 border-white/10 text-muted-foreground"
            )}
          >
            👍 Only
          </button>
          <button
            onClick={() => { setFilterFlagged(!filterFlagged); setPage(1) }}
            className={cn(
              "h-8 text-xs rounded-lg px-2 border transition-all font-bold",
              filterFlagged
                ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
                : "bg-white/5 border-white/10 text-muted-foreground"
            )}
          >
            🚩 Flagged
          </button>
        </div>
        {selectedMessages.size > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <span className="text-xs text-muted-foreground">{selectedMessages.size} selecionadas</span>
            <Button
              size="sm"
              onClick={() => handleBulkAction("approved")}
              className="h-7 text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg"
            >
              <CheckCircle className="w-3 h-3 mr-1" /> Aprovar
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkAction("rejected")}
              className="h-7 text-[10px] bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg"
            >
              <XCircle className="w-3 h-3 mr-1" /> Rejeitar
            </Button>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Growth Chart */}
        <div className="glass-strong border-white/10 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Crescimento do Dataset
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} />
              <YAxis tick={{ fontSize: 10, fill: "#666" }} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
              />
              <Line type="monotone" dataKey="total" stroke="#FF9500" strokeWidth={2} dot={false} />
              {growthData.length > 0 && (
                <Line
                  type="monotone"
                  dataKey={() => DATASET_GOAL}
                  stroke="#666"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="glass-strong border-white/10 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Distribuição por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats
                  .filter((s) => s.category && s.category_count > 0)
                  .map((s) => ({
                    name: CATEGORY_LABELS[s.category!] || s.category,
                    value: s.category_count,
                    color: CATEGORY_COLORS[s.category!] || "#6B7280",
                  }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
              >
                {stats
                  .filter((s) => s.category && s.category_count > 0)
                  .map((s, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[s.category!] || "#6B7280"} />
                  ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Rating Distribution */}
        <div className="glass-strong border-white/10 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Qualidade das Respostas
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="rating" tick={{ fontSize: 10, fill: "#666" }} />
              <YAxis tick={{ fontSize: 10, fill: "#666" }} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ratingData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Language Distribution */}
        <div className="glass-strong border-white/10 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
            PT vs EN
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={langData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
              >
                {langData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Messages Table */}
      <div className="glass-strong border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedMessages.size === messages.length && messages.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-white/20 bg-white/5"
                  />
                </th>
                <th className="p-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data</th>
                <th className="p-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Usuário</th>
                <th className="p-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pergunta</th>
                <th className="p-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Categoria</th>
                <th className="p-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rating</th>
                <th className="p-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Feedback</th>
                <th className="p-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="p-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedMessages.has(msg.id)}
                      onChange={() => toggleSelect(msg.id)}
                      className="rounded border-white/20 bg-white/5"
                    />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                        {msg.profiles?.name?.charAt(0) || msg.profiles?.email?.charAt(0) || "?"}
                      </div>
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                        {msg.profiles?.name || msg.profiles?.email?.split("@")[0] || "Anônimo"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setViewingMessage(msg)}
                      className="text-xs text-left text-foreground hover:text-primary transition-colors max-w-[200px] truncate block"
                    >
                      {truncate(msg.user_message, 80)}
                    </button>
                  </td>
                  <td className="p-3">
                    {msg.category && (
                      <Badge className="text-[9px] font-bold border-0" style={{ backgroundColor: CATEGORY_COLORS[msg.category] + "33", color: CATEGORY_COLORS[msg.category] }}>
                        {CATEGORY_LABELS[msg.category] || msg.category}
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <StarRating rating={msg.user_rating} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {msg.user_thumbs_up && <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />}
                      {msg.user_thumbs_up === false && <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />}
                      {msg.user_flagged && <Flag className="w-3.5 h-3.5 text-amber-400" />}
                      {!msg.user_thumbs_up && !msg.user_flagged && <span className="text-muted-foreground/30 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border", STATUS_COLORS[msg.training_status] || STATUS_COLORS.raw)}>
                      {STATUS_LABELS[msg.training_status] || msg.training_status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateStatus(msg.id, "approved")}
                        className="p-1 hover:bg-emerald-500/20 rounded text-emerald-400 transition-colors"
                        title="Aprovar"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingMessage(msg); setEditText(msg.edited_response || msg.ai_response) }}
                        className="p-1 hover:bg-blue-500/20 rounded text-blue-400 transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(msg.id, "rejected")}
                        className="p-1 hover:bg-rose-500/20 rounded text-rose-400 transition-colors"
                        title="Rejeitar"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewingMessage(msg)}
                        className="p-1 hover:bg-white/10 rounded text-muted-foreground transition-colors"
                        title="Ver completo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-white/5">
          <span className="text-xs text-muted-foreground">
            Mostrando {messages.length} mensagens
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <span className="text-xs text-muted-foreground">Página {page}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => p + 1)}
              disabled={messages.length < pageSize}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* View Message Modal */}
      {viewingMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingMessage(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong border-white/20 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-foreground">Mensagem Completa</h3>
              <button onClick={() => setViewingMessage(null)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pergunta</span>
                <p className="text-sm text-foreground mt-1 p-3 bg-white/5 rounded-xl">{viewingMessage.user_message}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resposta IA</span>
                <p className="text-sm text-foreground mt-1 p-3 bg-white/5 rounded-xl whitespace-pre-wrap">{viewingMessage.ai_response}</p>
              </div>
              {viewingMessage.edited_response && (
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Resposta Editada</span>
                  <p className="text-sm text-foreground mt-1 p-3 bg-blue-500/5 rounded-xl whitespace-pre-wrap">{viewingMessage.edited_response}</p>
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contexto</span>
                <pre className="text-xs text-muted-foreground mt-1 p-3 bg-white/5 rounded-xl overflow-x-auto">
                  {JSON.stringify(viewingMessage.user_context, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Sheet */}
      {editingMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end" onClick={() => setEditingMessage(null)}>
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="glass-strong border-l border-white/10 w-full max-w-lg h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-foreground">Editar Resposta</h3>
                <button onClick={() => setEditingMessage(null)} className="p-1 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pergunta do Usuário</span>
                <p className="text-sm text-foreground mt-1 p-3 bg-white/5 rounded-xl">{editingMessage.user_message}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contexto</span>
                <pre className="text-xs text-muted-foreground mt-1 p-3 bg-white/5 rounded-xl overflow-x-auto text-[10px]">
                  {JSON.stringify(editingMessage.user_context, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resposta Original</span>
                <p className="text-xs text-muted-foreground mt-1 p-3 bg-white/5 rounded-xl max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {editingMessage.ai_response}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Nova Resposta</span>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full h-48 mt-1 p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground resize-none focus:border-primary/50 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSaveEdit}
                  className="w-full h-10 bg-primary text-white font-bold rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar como Editada
                </Button>
                <Button
                  onClick={() => { handleUpdateStatus(editingMessage.id, "approved"); setEditingMessage(null) }}
                  variant="ghost"
                  className="w-full h-10 text-emerald-400 font-bold rounded-xl border border-emerald-500/20"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar sem Editar
                </Button>
                <Button
                  onClick={() => { handleUpdateStatus(editingMessage.id, "rejected"); setEditingMessage(null) }}
                  variant="ghost"
                  className="w-full h-10 text-rose-400 font-bold rounded-xl border border-rose-500/20"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowExportModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong border-white/20 rounded-3xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-foreground">Exportar Dataset</h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Formato</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(["jsonl", "alpaca", "csv"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={cn(
                        "p-2 rounded-xl border text-xs font-bold transition-all",
                        exportFormat === fmt
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-white/10 text-muted-foreground hover:border-white/30"
                      )}
                    >
                      <FileText className="w-4 h-4 mx-auto mb-1" />
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Idioma</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { value: "all", label: "Ambos" },
                    { value: "pt", label: "PT" },
                    { value: "en", label: "EN" },
                  ].map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setExportLang(l.value)}
                      className={cn(
                        "p-2 rounded-xl border text-xs font-bold transition-all",
                        exportLang === l.value
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-white/10 text-muted-foreground hover:border-white/30"
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={exporting}
                className="w-full h-10 bg-primary text-white font-bold rounded-xl"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  bg: string
}) {
  return (
    <div className={cn("rounded-2xl p-4 border border-white/5", bg)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-xl font-black", color)}>{value}</p>
    </div>
  )
}
