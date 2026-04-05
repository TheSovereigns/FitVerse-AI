"use client"

import { Clock, Filter } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface ScanHistoryItem {
  id: string
  name: string
  score: number
  image: string
  scannedAt: string
}

interface ScanHistoryProps {
  items: ScanHistoryItem[]
  showAll?: boolean
}

export function ScanHistory({ items, showAll = false }: ScanHistoryProps) {
  const [filter, setFilter] = useState<"all" | "healthy" | "moderate" | "poor">("all")

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-success/20 text-success border-success/40"
    if (score >= 40) return "bg-warning/20 text-warning border-warning/40"
    return "bg-destructive/20 text-destructive border-destructive/40"
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`
    return `${Math.floor(diffInMinutes / 1440)}d atrás`
  }

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true
    if (filter === "healthy") return item.score >= 70
    if (filter === "moderate") return item.score >= 40 && item.score < 70
    if (filter === "poor") return item.score < 40
    return true
  })

  return (
    <div className={showAll ? "" : "px-4 py-6"}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">{showAll ? "Todos os Scans" : "Histórico de Scans"}</h2>
        </div>
        {showAll && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-primary/30 rounded-lg px-3 py-1.5 bg-secondary/50 text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Todos</option>
              <option value="healthy">Saudáveis</option>
              <option value="moderate">Moderados</option>
              <option value="poor">Evitar</option>
            </select>
          </div>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <Card className="p-6 text-center glass border-primary/20">
          <p className="text-sm text-muted-foreground">Nenhum produto encontrado com este filtro</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="p-4 glass border-primary/20 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover bg-muted flex-shrink-0 border border-primary/20"
                  />
                  <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatTime(item.scannedAt)}</p>
                </div>
                <Badge className={`${getScoreColor(item.score)} font-bold shadow-lg`}>{item.score}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
