"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Plus, Search, ArrowRight, Crown, Shield, X, Loader2,
  Globe, Lock, UserPlus, Hash, MessageCircle, Activity, Trophy,
  ChevronRight, LogOut, Settings, Flame, Target,
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

type ClanView = "list" | "detail" | "chat" | "feed" | "members" | "ranking"

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
      <div className="mx-auto w-full max-w-4xl space-y-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40 p-5 backdrop-blur-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setView("list"); setSelectedClan(null) }}
                  className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-foreground/60 hover:bg-white/10"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </Button>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-foreground">{selectedClan.name}</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
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
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-foreground/60 hover:bg-white/10"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                )}
                {selectedClan.userRole === "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteClan(selectedClan.id)}
                    className="h-10 w-10 rounded-xl border border-red-300/14 bg-red-500/8 text-red-300 hover:bg-red-500/16"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
                {selectedClan.isMember && selectedClan.userRole !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLeave}
                    className="h-10 w-10 rounded-xl border border-red-300/14 bg-red-500/8 text-red-300 hover:bg-red-500/16"
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
                  className="h-10 rounded-xl border-white/10 bg-black/30 text-sm"
                />
                <Button
                  onClick={handleJoinWithCode}
                  disabled={isJoining || !joinCode.trim()}
                  className="h-10 rounded-xl bg-foreground px-4 text-[10px] font-black uppercase tracking-widest text-black hover:bg-white/10"
                >
                  {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : isEnglish ? "Join" : "Entrar"}
                </Button>
                {selectedClan.is_public && (
                  <Button
                    onClick={async () => { await joinClan(selectedClan.id); await fetchUserClan() }}
                    disabled={isJoining}
                    variant="ghost"
                    className="h-10 rounded-xl border border-white/10 bg-white/5 text-foreground/60 hover:bg-white/10"
                  >
                    {isEnglish ? "Join Free" : "Entrar Grátis"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {selectedClan.isMember && (
          <div className="flex gap-2 px-1 overflow-x-auto scrollbar-none">
            {(["chat", "feed", "members", "ranking", "challenges", "partner"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  tab === v
                    ? "bg-white/10 text-foreground border border-white/20"
                    : "text-foreground/50 hover:text-foreground/70 border border-transparent"
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
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-20">
      {userClan && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40 p-5 backdrop-blur-2xl cursor-pointer"
          onClick={() => handleSelectClan(userClan)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-foreground to-foreground/80">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
                  {isEnglish ? "Your Clan" : "Seu Clã"}
                </p>
                <h3 className="text-lg font-black text-foreground">{userClan.name}</h3>
                <p className="text-[10px] font-bold text-foreground/50">
                  {userClan.memberCount || 0} {isEnglish ? "members" : "membros"} · {userClan.role === "owner" ? "Owner" : userClan.role === "admin" ? "Admin" : "Member"}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-foreground/50" />
          </div>
        </motion.section>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black tracking-tight text-foreground">
            {isEnglish ? "Discover Clans" : "Descobrir Clãs"}
          </h2>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-10 rounded-xl bg-foreground px-4 text-[10px] font-black uppercase tracking-widest text-black hover:bg-white/10"
          >
            <Plus className="h-4 w-4 mr-1" />
            {isEnglish ? "Create" : "Criar"}
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEnglish ? "Search clans..." : "Buscar clãs..."}
            className="h-11 rounded-xl border-white/10 bg-black/30 pl-10 text-sm"
          />
        </div>

        {filteredDiscover.length === 0 ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-8 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-foreground/30" />
            <p className="text-sm font-bold text-foreground/50">
              {isEnglish ? "No clans found. Create one!" : "Nenhum clã encontrado. Crie um!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDiscover.map((clan, i) => (
              <motion.div
                key={clan.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-black/40 p-4 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/5 cursor-pointer"
                onClick={() => handleSelectClan(clan)}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
                  {clan.is_public ? (
                    <Globe className="h-5 w-5 text-foreground/60" />
                  ) : (
                    <Lock className="h-5 w-5 text-foreground/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-foreground truncate">{clan.name}</p>
                  <p className="text-[10px] font-bold text-foreground/50 truncate">
                    {clan.description || (isEnglish ? "No description" : "Sem descrição")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-foreground">{clan.memberCount || 0}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/50">
                    {isEnglish ? "members" : "membros"}
                  </p>
                </div>
              </motion.div>
            ))}
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
