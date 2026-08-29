"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Crown, Shield, UserMinus, ArrowLeftRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { getToken } from "@/lib/auth/getToken"

interface Member {
  id: string; clan_id: string; user_id: string; role: string; joined_at: string
  profiles?: { id: string; name: string; avatar_url: string | null; plan: string }
}

export function ClanMemberList({ clanId, userRole, onKick, onTransfer }: {
  clanId: string; userRole?: string
  onKick?: (clanId: string, userId: string) => Promise<boolean>
  onTransfer?: (clanId: string, userId: string) => Promise<boolean>
}) {
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const token = await getToken()
        if (!token) return
        const res = await fetch(`/api/clans/${clanId}/members`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        setMembers(data.members || [])
      } catch (e) { console.error(e) }
      setIsLoading(false)
    }
    load()
  }, [clanId])

  const handleKick = async (userId: string) => {
    if (!onKick || !confirm(isEnglish ? "Kick this member?" : "Remover este membro?")) return
    setActionLoading(userId)
    await onKick(clanId, userId)
    setMembers(prev => prev.filter(m => m.user_id !== userId))
    setActionLoading(null)
  }

  const handleTransfer = async (userId: string) => {
    if (!onTransfer || !confirm(isEnglish ? "Transfer ownership to this member?" : "Transferir ownership para este membro?")) return
    setActionLoading(userId)
    await onTransfer(clanId, userId)
    window.location.reload()
  }

  const roleIcons: Record<string, any> = { owner: Crown, admin: Shield, member: Users }
  const roleColors: Record<string, string> = {
    owner: "text-yellow-400", admin: "text-blue-400", member: "text-foreground/40",
  }
  const roleLabels: Record<string, string> = {
    owner: isEnglish ? "Owner" : "Dono",
    admin: isEnglish ? "Admin" : "Admin",
    member: isEnglish ? "Member" : "Membro",
  }

  const canKick = userRole === "owner" || userRole === "admin"
  const canTransfer = userRole === "owner"

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 text-foreground/20 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-border bg-background p-8 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-foreground/20" />
          <p className="text-sm font-bold text-foreground/40">{isEnglish ? "No members yet" : "Nenhum membro ainda"}</p>
        </div>
      ) : (
        members.map((member, i) => {
          const Icon = roleIcons[member.role] || Users
          const isMe = member.user_id === user?.id
          const profile = member.profiles
          const showActions = canKick && !isMe && member.role !== "owner"
          const showTransfer = canTransfer && !isMe && member.role !== "owner"

          return (
            <motion.div key={member.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border bg-background p-4",
                isMe && "border-border bg-card"
              )}>
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-foreground/60">{profile?.name?.charAt(0)?.toUpperCase() || "?"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-foreground truncate">{profile?.name || "Unknown"}</p>
                  {isMe && <span className="text-[10px] font-bold text-foreground/40">(voce)</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Icon className={cn("h-3 w-3", roleColors[member.role])} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", roleColors[member.role])}>
                    {roleLabels[member.role]}
                  </span>
                  {profile?.plan && profile.plan !== "free" && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-brand/10 text-brand">
                      {profile.plan}
                    </span>
                  )}
                </div>
              </div>
              {showActions && (
                <div className="flex items-center gap-1 shrink-0">
                  {showTransfer && (
                    <button onClick={() => handleTransfer(member.user_id)} disabled={actionLoading === member.user_id}
                      className="h-8 w-8 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center hover:bg-yellow-500/20 transition-colors disabled:opacity-40"
                      title={isEnglish ? "Transfer ownership" : "Transferir ownership"}>
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleKick(member.user_id)} disabled={actionLoading === member.user_id}
                    className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-40"
                    title={isEnglish ? "Kick member" : "Remover membro"}>
                    {actionLoading === member.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
            </motion.div>
          )
        })
      )}
    </div>
  )
}
