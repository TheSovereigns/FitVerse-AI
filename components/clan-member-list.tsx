"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Crown, Shield, UserMinus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useClans } from "@/hooks/useClans"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "@/lib/i18n"

interface Member {
  id: string
  clan_id: string
  user_id: string
  role: string
  joined_at: string
  profiles?: {
    id: string
    name: string
    avatar_url: string | null
    plan: string
  }
}

export function ClanMemberList({ clanId, userRole }: { clanId: string; userRole?: string }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { user } = useAuth()
  const { members, fetchMembers } = useClans()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      await fetchMembers(clanId)
      setIsLoading(false)
    }
    load()
  }, [clanId, fetchMembers])

  const roleIcons: Record<string, any> = {
    owner: Crown,
    admin: Shield,
    member: Users,
  }

  const roleColors: Record<string, string> = {
    owner: "text-foreground",
    admin: "text-foreground/80",
    member: "text-foreground/50",
  }

  const roleLabels: Record<string, string> = {
    owner: isEnglish ? "Owner" : "Dono",
    admin: isEnglish ? "Admin" : "Admin",
    member: isEnglish ? "Member" : "Membro",
  }

  const planBadges: Record<string, string> = {
    free: "bg-zinc-500/20 text-zinc-400",
    pro: "bg-foreground/10 text-foreground/60",
    premium: "bg-foreground/20 text-foreground/60",
  }

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 text-foreground/60 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-8 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-foreground/15" />
          <p className="text-sm font-bold text-foreground/50">
            {isEnglish ? "No members yet" : "Nenhum membro ainda"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member, i) => {
            const Icon = roleIcons[member.role] || Users
            const isMe = member.user_id === user?.id
            const profile = member.profiles
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-[#090704]/60 p-4 backdrop-blur-xl",
                  isMe && "border-white/10 bg-white/5"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/30 border border-white/10">
                  <span className="text-lg font-black text-foreground">
                    {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm text-foreground truncate">
                      {profile?.name || "Unknown"}
                    </p>
                    {isMe && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-foreground/60">
                        (voce)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Icon className={cn("h-3 w-3", roleColors[member.role])} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", roleColors[member.role])}>
                      {roleLabels[member.role]}
                    </span>
                    {profile?.plan && profile.plan !== "free" && (
                      <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full", planBadges[profile.plan])}>
                        {profile.plan}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
