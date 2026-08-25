"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Plus, Search, ArrowRight, Crown, Shield, X, Loader2,
  Globe, Lock, UserPlus, Hash, MessageCircle, Activity, Trophy,
  ChevronRight, LogOut, Settings, Flame, Target, Swords, Star,
  Zap, Medal, Award, TrendingUp, Sparkles, Heart,
  Dumbbell, ScanLine, UtensilsCrossed, UserMinus, ArrowLeftRight,
  ChevronDown,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useClans } from "@/hooks/useClans"
import { useTranslation } from "@/lib/i18n"
import { ClanChat } from "./clan-chat"
import { ClanFeed } from "./clan-feed"
import { ClanMemberList } from "./clan-member-list"
import { ClanRanking } from "./clan-ranking"
import { ClanCreateModal } from "./clan-create-modal"
import { ClanInviteModal } from "./clan-invite-modal"
import { ChallengesTab } from "./challenges-tab"
import { AccountabilityPartnerCard } from "./accountability-partner-card"

type ClanView = "list" | "detail"

const GUILD_LEVELS = [
  { level: 1, xpRequired: 0, title: "Iniciante", titleEn: "Initiate", color: "#6B7280" },
  { level: 2, xpRequired: 100, title: "Recruta", titleEn: "Recruit", color: "#10B981" },
  { level: 3, xpRequired: 300, title: "Membro", titleEn: "Member", color: "#3B82F6" },
  { level: 4, xpRequired: 600, title: "Veterano", titleEn: "Veteran", color: "#8B5CF6" },
  { level: 5, xpRequired: 1000, title: "Elite", titleEn: "Elite", color: "#F59E0B" },
  { level: 6, xpRequired: 1500, title: "Campeao", titleEn: "Champion", color: "#EF4444" },
  { level: 7, xpRequired: 2500, title: "Heroi", titleEn: "Hero", color: "#EC4899" },
  { level: 8, xpRequired: 4000, title: "Lenda", titleEn: "Legend", color: "#F97316" },
  { level: 9, xpRequired: 6000, title: "Mitico", titleEn: "Mythic", color: "#A855F7" },
  { level: 10, xpRequired: 10000, title: "Imortal", titleEn: "Immortal", color: "#FBBF24" },
]

const GUILD_ACHIEVEMENTS = [
  { id: "first_workout", icon: Dumbbell, title: "Primeiro Treino", titleEn: "First Workout", xp: 50 },
  { id: "streak_7", icon: Flame, title: "7 Dias Seguidos", titleEn: "7-Day Streak", xp: 200 },
  { id: "scan_10", icon: ScanLine, title: "Mestre do Scan", titleEn: "Scan Master", xp: 100 },
  { id: "meal_plan", icon: UtensilsCrossed, title: "Planejador", titleEn: "Meal Planner", xp: 150 },
  { id: "challenge_win", icon: Trophy, title: "Desafiador", titleEn: "Challenge Champion", xp: 300 },
  { id: "invite_3", icon: UserPlus, title: "Recrutador", titleEn: "Recruiter", xp: 250 },
  { id: "rank_1", icon: Crown, title: "Lider", titleEn: "Guild Leader", xp: 500 },
  { id: "partner_30", icon: Heart, title: "Parceiro Dedicado", titleEn: "Dedicated Partner", xp: 400 },
]

function getGuildLevel(xp: number) {
  let current = GUILD_LEVELS[0]!
  for (const level of GUILD_LEVELS) {
    if (xp >= level.xpRequired) current = level
  }
  const nextIdx = GUILD_LEVELS.findIndex(l => l.level === current.level + 1)
  const next = nextIdx >= 0 ? GUILD_LEVELS[nextIdx] ?? null : null
  const progress = next
    ? ((xp - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100
    : 100
  return { current, next, progress: Math.min(100, Math.max(0, progress)) }
}

export function ClansTab() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const {
    userClan, discoverClans, selectedClan, members, invites,
    isLoading,
    fetchUserClan, fetchDiscoverClans, fetchClanDetail, fetchMembers, fetchInvites,
    createClan, joinClan, leaveClan, createInvite, deleteClan,
    kickMember, transferOwnership, setSelectedClan,
  } = useClans()

  const [view, setView] = useState<ClanView>("list")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [tab, setTab] = useState<"chat" | "feed" | "members" | "ranking" | "challenges" | "partner">("chat")
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchDiscoverClans()
  }, [fetchDiscoverClans])

  const guildXp = useMemo(() => {
    return (userClan?.total_xp || 0) + (selectedClan?.total_xp || 0)
  }, [userClan?.total_xp, selectedClan?.total_xp])

  const guildLevel = useMemo(() => getGuildLevel(guildXp), [guildXp])

  const handleSelectClan = async (clan: any) => {
    setSelectedClan(clan)
    setView("detail")
    setTab("chat")
    await fetchClanDetail(clan.id)
    await fetchMembers(clan.id)
  }

  const handleJoinWithCode = async () => {
    if (!joinCode.trim() || !selectedClan) return
    setIsJoining(true)
    const success = await joinClan(selectedClan.id, joinCode.trim())
    if (success) {
      await fetchUserClan()
      setJoinCode("")
      await fetchClanDetail(selectedClan.id)
      await fetchMembers(selectedClan.id)
    }
    setIsJoining(false)
  }

  const handleLeave = async () => {
    if (!selectedClan) return
    if (confirm(isEnglish ? "Leave this clan?" : "Sair deste clã?")) {
      const success = await leaveClan(selectedClan.id)
      if (success) {
        setView("list")
        setSelectedClan(null)
        await fetchUserClan()
        await fetchDiscoverClans()
      }
    }
  }

  const handleCreateClan = async (name: string, description: string, isPublic: boolean) => {
    const clan = await createClan(name, description, isPublic)
    if (clan) {
      setShowCreateModal(false)
      await fetchUserClan()
      handleSelectClan(clan)
    }
  }

  const filteredDiscover = discoverClans.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (view === "detail" && selectedClan) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 pb-20">
        {/* Clan Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/5"
          style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)" }}
        >
          <div className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(circle at 20% 50%, ${guildLevel.current.color}20, transparent 70%)` }} />

          <div className="relative p-5">
            <div className="flex items-start justify-between mb-4">
              <button onClick={() => { setView("list"); setSelectedClan(null) }}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                {isEnglish ? "Back" : "Voltar"}
              </button>

              <div className="flex items-center gap-2">
                {selectedClan.isMember && (
                  <button onClick={() => setShowInviteModal(true)}
                    className="h-8 px-3 rounded-lg bg-brand/10 text-brand text-xs font-bold flex items-center gap-1.5 hover:bg-brand/20 transition-colors">
                    <UserPlus className="h-3.5 w-3.5" />
                    {isEnglish ? "Invite" : "Convidar"}
                  </button>
                )}
                {selectedClan.userRole === "owner" && (
                  <button onClick={async () => { if (confirm(isEnglish ? "Delete this clan?" : "Deletar este clã?")) await deleteClan(selectedClan.id) }}
                    className="h-8 px-3 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold flex items-center gap-1.5 hover:bg-red-500/20 transition-colors">
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                )}
                {selectedClan.isMember && selectedClan.userRole !== "owner" && (
                  <button onClick={handleLeave}
                    className="h-8 px-3 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold flex items-center gap-1.5 hover:bg-red-500/20 transition-colors">
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${guildLevel.current.color}30, ${guildLevel.current.color}10)` }}>
                <Swords className="h-8 w-8" style={{ color: guildLevel.current.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">{selectedClan.name}</h2>
                  {selectedClan.is_public ? (
                    <Globe className="h-4 w-4 text-brand" />
                  ) : (
                    <Lock className="h-4 w-4 text-white/30" />
                  )}
                </div>
                <p className="text-xs text-white/30 mt-0.5">
                  {selectedClan.memberCount || 0} {isEnglish ? "members" : "membros"} · {selectedClan.ownerName || "Unknown"}
                </p>
                {selectedClan.description && (
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{selectedClan.description}</p>
                )}
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" style={{ color: guildLevel.current.color }} />
                  <span className="font-bold text-white">{isEnglish ? guildLevel.current.titleEn : guildLevel.current.title}</span>
                  <span className="text-white/30">Lv.{guildLevel.current.level}</span>
                </div>
                <span className="font-bold" style={{ color: guildLevel.current.color }}>
                  {(selectedClan?.total_xp || 0).toLocaleString()} XP
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${guildLevel.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${guildLevel.current.color}, ${guildLevel.current.color}80)` }}
                />
              </div>
              {guildLevel.next && (
                <p className="text-[10px] text-white/20 text-right">
                  {(guildLevel.next.xpRequired - (selectedClan?.total_xp || 0)).toLocaleString()} XP {isEnglish ? "to" : "para"} {isEnglish ? guildLevel.next.titleEn : guildLevel.next.title}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Join Section (non-members) */}
        {!selectedClan.isMember && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/5 bg-card p-5">
            <p className="text-sm font-bold text-white mb-3">
              {isEnglish ? "Join this clan" : "Entrar neste clã"}
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder={isEnglish ? "Invite code..." : "Codigo de convite..."}
                className="h-10 rounded-xl border-white/5 bg-white/[0.03] text-sm text-white placeholder:text-white/20"
              />
              <button onClick={handleJoinWithCode} disabled={isJoining || !joinCode.trim()}
                className="h-10 px-5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-colors disabled:opacity-40">
                {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : isEnglish ? "Join" : "Entrar"}
              </button>
            </div>
            {selectedClan.is_public && (
              <button onClick={async () => { setIsJoining(true); await joinClan(selectedClan.id); await fetchUserClan(); setIsJoining(false) }}
                disabled={isJoining}
                className="mt-2 w-full h-10 rounded-xl bg-white/[0.03] border border-white/5 text-white/40 text-xs font-bold hover:bg-white/5 transition-colors">
                {isEnglish ? "Join Free" : "Entrar Gratis"}
              </button>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        {selectedClan.isMember && (
          <div className="flex gap-1 p-1 bg-card rounded-xl border border-white/5 overflow-x-auto">
            {([
              { id: "chat" as const, icon: MessageCircle, label: "Chat" },
              { id: "feed" as const, icon: Activity, label: isEnglish ? "Feed" : "Atividades" },
              { id: "members" as const, icon: Users, label: isEnglish ? "Members" : "Membros" },
              { id: "ranking" as const, icon: Trophy, label: "Ranking" },
              { id: "challenges" as const, icon: Target, label: isEnglish ? "Challenges" : "Desafios" },
              { id: "partner" as const, icon: Flame, label: isEnglish ? "Partner" : "Parceiro" },
            ]).map((v) => (
              <button key={v.id} onClick={() => setTab(v.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center",
                  tab === v.id ? "bg-brand/15 text-brand" : "text-white/30 hover:text-white/50"
                )}>
                <v.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        {selectedClan.isMember && tab === "chat" && <ClanChat clanId={selectedClan.id} />}
        {selectedClan.isMember && tab === "feed" && <ClanFeed clanId={selectedClan.id} />}
        {selectedClan.isMember && tab === "members" && (
          <ClanMemberList
            clanId={selectedClan.id}
            userRole={selectedClan.userRole}
            onKick={kickMember}
            onTransfer={transferOwnership}
          />
        )}
        {selectedClan.isMember && tab === "ranking" && <ClanRanking clanId={selectedClan.id} />}
        {selectedClan.isMember && tab === "challenges" && <ChallengesTab clanId={selectedClan.id} />}
        {selectedClan.isMember && tab === "partner" && <AccountabilityPartnerCard />}

        {/* Modals */}
        <ClanCreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateClan} isLoading={isLoading} />
        <ClanInviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} clanId={selectedClan.id} clanName={selectedClan.name} />
      </div>
    )
  }

  // LIST VIEW
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 pb-20">
      {/* User's Guild Card */}
      {userClan && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/5 cursor-pointer card-hover transition-colors"
          style={{ background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 50%, hsl(var(--card)) 100%)" }}
          onClick={() => handleSelectClan(userClan)}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ background: `radial-gradient(circle at 80% 20%, ${guildLevel.current.color}40, transparent 60%)` }} />

          <div className="relative p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${guildLevel.current.color}30, ${guildLevel.current.color}10)` }}>
                  <Crown className="h-7 w-7" style={{ color: guildLevel.current.color }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: guildLevel.current.color }}>
                    {isEnglish ? "Your Guild" : "Sua Guild"}
                  </p>
                  <h3 className="text-lg font-black text-white">{userClan.name}</h3>
                  <p className="text-xs text-white/30">
                    {userClan.memberCount || 0} {isEnglish ? "members" : "membros"} · {userClan.role === "owner" ? "Owner" : userClan.role === "admin" ? "Admin" : "Member"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/20" />
            </div>

            {/* XP Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" style={{ color: guildLevel.current.color }} />
                  <span className="font-bold text-white">{isEnglish ? guildLevel.current.titleEn : guildLevel.current.title}</span>
                  <span className="text-white/30">Lv.{guildLevel.current.level}</span>
                </div>
                <span className="font-bold" style={{ color: guildLevel.current.color }}>
                  {guildXp.toLocaleString()} XP
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${guildLevel.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${guildLevel.current.color}, ${guildLevel.current.color}80)` }}
                />
              </div>
              {guildLevel.next && (
                <p className="text-[10px] text-white/20 text-right">
                  {(guildLevel.next.xpRequired - guildXp).toLocaleString()} XP {isEnglish ? "to" : "para"} {isEnglish ? guildLevel.next.titleEn : guildLevel.next.title}
                </p>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Achievements */}
      {userClan && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-brand" />
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">
              {isEnglish ? "Guild Achievements" : "Conquistas da Guild"}
            </h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {GUILD_ACHIEVEMENTS.map((ach, i) => {
              const unlocked = (userClan?.achievements || []).includes(ach.id)
              return (
                <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 rounded-xl p-2.5 border transition-all text-center",
                    unlocked ? "border-brand/30 bg-brand/10 shadow-[0_0_20px_rgba(52,211,153,0.15)]" : "border-white/5 bg-white/[0.02] opacity-40"
                  )}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                    unlocked ? "bg-brand/15" : "bg-white/5")}>
                    <ach.icon className={cn("h-5 w-5", unlocked ? "text-brand" : "text-white/20")} />
                  </div>
                  <p className="text-[9px] font-bold leading-tight text-white/70">{isEnglish ? ach.titleEn : ach.title}</p>
                  {unlocked && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand flex items-center justify-center">
                      <Zap className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Discover Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-white">
            {isEnglish ? "Discover Guilds" : "Descobrir Guilds"}
          </h2>
          <button onClick={() => setShowCreateModal(true)}
            className="h-9 px-4 rounded-xl bg-brand text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand/90 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            {isEnglish ? "Create" : "Criar"}
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEnglish ? "Search guilds..." : "Buscar guilds..."}
            className="h-11 rounded-xl border-white/5 bg-white/[0.03] pl-10 text-sm text-white placeholder:text-white/20" />
        </div>

        {filteredDiscover.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-card p-8 text-center">
            <Swords className="mx-auto mb-3 h-10 w-10 text-white/10" />
            <p className="text-sm font-bold text-white/30">
              {isEnglish ? "No guilds found. Create one!" : "Nenhuma guild encontrada. Crie uma!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDiscover.map((clan, i) => {
              const clanLevel = getGuildLevel(clan.total_xp || 0)
              return (
                <motion.div key={clan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-card p-4 cursor-pointer hover:border-white/10 hover:bg-white/[0.02] transition-all"
                  onClick={() => handleSelectClan(clan)}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${clanLevel.current.color}20, ${clanLevel.current.color}05)` }}>
                    <Swords className="h-5 w-5" style={{ color: clanLevel.current.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-white truncate">{clan.name}</p>
                      {clan.is_public ? <Globe className="h-3 w-3 text-brand shrink-0" /> : <Lock className="h-3 w-3 text-white/20 shrink-0" />}
                    </div>
                    <p className="text-xs text-white/30 truncate">
                      {clan.description || (isEnglish ? "No description" : "Sem descricao")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold" style={{ color: clanLevel.current.color }}>
                        Lv.{clanLevel.current.level}
                      </span>
                      <span className="text-[10px] text-white/15">·</span>
                      <span className="text-[10px] font-bold text-white/30">
                        {(clan.total_xp || 0).toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{clan.memberCount || 0}</p>
                    <p className="text-[10px] text-white/20">{isEnglish ? "members" : "membros"}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <ClanCreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateClan} isLoading={isLoading} />
    </div>
  )
}
