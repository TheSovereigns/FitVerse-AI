"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Plus, Search, ArrowRight, Crown, Shield, X, Loader2,
  Globe, Lock, UserPlus, Hash, MessageCircle, Activity, Trophy,
  ChevronRight, LogOut, Settings, Flame, Target, Swords, Star,
  Zap, Medal, Award, TrendingUp, Sparkles, Heart,
  Dumbbell, ScanLine, UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  { level: 1, xpRequired: 0, title: "Initiate" },
  { level: 2, xpRequired: 100, title: "Recruit" },
  { level: 3, xpRequired: 300, title: "Member" },
  { level: 4, xpRequired: 600, title: "Veteran" },
  { level: 5, xpRequired: 1000, title: "Elite" },
  { level: 6, xpRequired: 1500, title: "Champion" },
  { level: 7, xpRequired: 2500, title: "Hero" },
  { level: 8, xpRequired: 4000, title: "Legend" },
  { level: 9, xpRequired: 6000, title: "Mythic" },
  { level: 10, xpRequired: 10000, title: "Immortal" },
]

const GUILD_ACHIEVEMENTS = [
  { id: "first_workout", icon: Dumbbell, title: "First Workout", desc: "Complete your first workout", xp: 50 },
  { id: "streak_7", icon: Flame, title: "7-Day Streak", desc: "Train 7 days in a row", xp: 200 },
  { id: "scan_10", icon: ScanLine, title: "Scan Master", desc: "Scan 10 food products", xp: 100 },
  { id: "meal_plan", icon: UtensilsCrossed, title: "Meal Planner", desc: "Generate 5 meal plans", xp: 150 },
  { id: "challenge_win", icon: Trophy, title: "Challenge Champion", desc: "Win a guild challenge", xp: 300 },
  { id: "invite_3", icon: UserPlus, title: "Recruiter", desc: "Invite 3 friends", xp: 250 },
  { id: "rank_1", icon: Crown, title: "Guild Leader", desc: "Reach #1 in ranking", xp: 500 },
  { id: "partner_30", icon: Heart, title: "Dedicated Partner", desc: "30 days with accountability partner", xp: 400 },
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
    isLoading, error,
    fetchUserClan, fetchDiscoverClans, fetchClanDetail, fetchMembers, fetchInvites,
    createClan, joinClan, leaveClan, createInvite, deleteClan, setSelectedClan,
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
    if (!joinCode.trim()) return
    setIsJoining(true)
    const success = await joinClan(selectedClan?.id || "", joinCode.trim())
    if (success) {
      await fetchUserClan()
      setJoinCode("")
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
      }
    }
  }

  const handleCreateClan = async (name: string, description: string, isPublic: boolean) => {
    const clan = await createClan(name, description, isPublic)
    if (clan) {
      setShowCreateModal(false)
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass-strong p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setView("list"); setSelectedClan(null) }}
                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{selectedClan.name}</h2>
                  {selectedClan.is_public ? (
                    <Globe className="h-4 w-4 text-brand" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedClan.memberCount || 0} {isEnglish ? "members" : "membros"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedClan.isMember && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInviteModal(true)}
                  className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}
              {selectedClan.userRole === "owner" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteClan(selectedClan.id)}
                  className="h-10 w-10 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              {selectedClan.isMember && selectedClan.userRole !== "owner" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLeave}
                  className="h-10 w-10 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {!selectedClan.isMember && (
              <div className="flex items-center gap-2 mt-3">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder={isEnglish ? "Enter invite code..." : "Digite o codigo de convite..."}
                  className="h-10 rounded-xl border-border bg-muted/50 text-sm"
                />
                <Button
                  onClick={handleJoinWithCode}
                  disabled={isJoining || !joinCode.trim()}
                  className="h-10 rounded-xl bg-brand px-4 text-xs font-semibold text-white hover:bg-brand/90"
                >
                  {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : isEnglish ? "Join" : "Entrar"}
                </Button>
                {selectedClan.is_public && (
                  <Button
                    onClick={async () => { await joinClan(selectedClan.id); await fetchUserClan() }}
                    disabled={isJoining}
                    variant="ghost"
                    className="h-10 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {isEnglish ? "Join Free" : "Entrar Gratis"}
                  </Button>
                )}
              </div>
            )}
        </motion.div>

        {selectedClan.isMember && (
          <div className="flex gap-1.5 px-1 overflow-x-auto scrollbar-none">
            {(["chat", "feed", "members", "ranking", "challenges", "partner"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all whitespace-nowrap",
                  tab === v
                    ? "bg-brand/10 text-brand border border-brand/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                )}
              >
                {v === "chat" && <MessageCircle className="h-3.5 w-3.5" />}
                {v === "feed" && <Activity className="h-3.5 w-3.5" />}
                {v === "members" && <Users className="h-3.5 w-3.5" />}
                {v === "ranking" && <Trophy className="h-3.5 w-3.5" />}
                {v === "challenges" && <Target className="h-3.5 w-3.5" />}
                {v === "partner" && <Flame className="h-3.5 w-3.5" />}
                {v === "chat" ? "Chat" : v === "feed" ? (isEnglish ? "Feed" : "Atividades") : v === "members" ? (isEnglish ? "Members" : "Membros") : v === "ranking" ? "Ranking" : v === "challenges" ? (isEnglish ? "Challenges" : "Desafios") : (isEnglish ? "Partner" : "Parceiro")}
              </button>
            ))}
          </div>
        )}

        {selectedClan.isMember && tab === "chat" && <ClanChat clanId={selectedClan.id} />}
        {selectedClan.isMember && tab === "feed" && <ClanFeed clanId={selectedClan.id} />}
        {selectedClan.isMember && tab === "members" && <ClanMemberList clanId={selectedClan.id} userRole={selectedClan.userRole} />}
        {selectedClan.isMember && tab === "ranking" && <ClanRanking clanId={selectedClan.id} />}
        {selectedClan.isMember && tab === "challenges" && <ChallengesTab clanId={selectedClan.id} />}
        {selectedClan.isMember && tab === "partner" && (
          <div className="space-y-4">
            <AccountabilityPartnerCard />
          </div>
        )}

        <ClanCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateClan}
          isLoading={isLoading}
        />

        {selectedClan && (
          <ClanInviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            clanId={selectedClan.id}
            clanName={selectedClan.name}
          />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 pb-20">
      {userClan && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl glass-strong p-5 cursor-pointer hover:bg-brand/5 transition-colors"
          onClick={() => handleSelectClan(userClan)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand shadow-lg shadow-brand/20">
                  <Crown className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-brand">
                    {isEnglish ? "Your Guild" : "Sua Guild"}
                  </p>
                  <h3 className="text-lg font-bold text-foreground">{userClan.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {userClan.memberCount || 0} {isEnglish ? "members" : "membros"} · {userClan.role === "owner" ? "Owner" : userClan.role === "admin" ? "Admin" : "Member"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-brand" />
                  <span className="font-bold text-foreground">{guildLevel.current.title}</span>
                  <span className="text-muted-foreground">Level {guildLevel.current.level}</span>
                </div>
                <span className="font-bold text-brand">{guildXp.toLocaleString()} XP</span>
              </div>
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${guildLevel.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full gradient-brand"
                />
              </div>
              {guildLevel.next && (
                <p className="text-[10px] text-muted-foreground text-right">
                  {(guildLevel.next.xpRequired - guildXp).toLocaleString()} XP to {guildLevel.next.title}
                </p>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {userClan && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-brand" />
            <h3 className="text-xs font-medium text-muted-foreground">
              {isEnglish ? "Guild Achievements" : "Conquistas da Guild"}
            </h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {GUILD_ACHIEVEMENTS.slice(0, 8).map((ach, i) => {
              const unlocked = (userClan?.achievements || []).includes(ach.id)
              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-xl p-2.5 border transition-all",
                    unlocked
                      ? "border-brand/20 bg-brand/5"
                      : "border-border bg-muted/30 opacity-50"
                  )}
                >
                  <ach.icon className={cn("h-5 w-5", unlocked ? "text-brand" : "text-muted-foreground")} />
                  <p className="text-[9px] font-bold text-center leading-tight text-foreground">{ach.title}</p>
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

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">
            {isEnglish ? "Discover Guilds" : "Descobrir Guilds"}
          </h2>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-10 rounded-xl bg-brand px-4 text-xs font-semibold text-white hover:bg-brand/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            {isEnglish ? "Create" : "Criar"}
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEnglish ? "Search guilds..." : "Buscar guilds..."}
            className="h-11 rounded-xl border-border bg-muted/50 pl-10 text-sm"
          />
        </div>

        {filteredDiscover.length === 0 ? (
          <div className="rounded-2xl glass-strong p-8 text-center">
            <Swords className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-bold text-muted-foreground">
              {isEnglish ? "No guilds found. Create one!" : "Nenhuma guild encontrada. Crie uma!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDiscover.map((clan, i) => {
              const clanLevel = getGuildLevel(clan.total_xp || 0)
              return (
                <motion.div
                  key={clan.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 rounded-xl glass-card p-4 cursor-pointer group hover:bg-brand/5 transition-colors"
                  onClick={() => handleSelectClan(clan)}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 group-hover:bg-brand/15 transition-colors">
                    <Swords className="h-5 w-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground truncate">{clan.name}</p>
                      {clan.is_public ? (
                        <Globe className="h-3 w-3 text-brand shrink-0" />
                      ) : (
                        <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {clan.description || (isEnglish ? "No description" : "Sem descricao")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-brand">
                        Lvl {clanLevel.current.level}
                      </span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {(clan.total_xp || 0).toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">{clan.memberCount || 0}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {isEnglish ? "members" : "membros"}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <ClanCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateClan}
        isLoading={isLoading}
      />
    </div>
  )
}
