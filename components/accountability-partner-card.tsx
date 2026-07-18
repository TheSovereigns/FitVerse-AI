"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart, UserPlus, Loader2, X, Users, Zap, Check, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAccountabilityPartner } from "@/hooks/useAccountabilityPartner"
import { useClans } from "@/hooks/useClans"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "@/lib/i18n"

export function AccountabilityPartnerCard() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { user } = useAuth()
  const { pairs, isLoading, createPair, endPair, checkin } = useAccountabilityPartner()
  const { userClan, members, fetchMembers } = useClans()
  const [showPairModal, setShowPairModal] = useState(false)
  const [isPairing, setIsPairing] = useState(false)
  const [todayCheckins, setTodayCheckins] = useState<Record<string, { userA: boolean; userB: boolean }>>({})

  useEffect(() => {
    if (userClan?.id) {
      fetchMembers(userClan.id)
    }
  }, [userClan, fetchMembers])

  useEffect(() => {
    const loadTodayCheckins = async () => {
      const checkins: Record<string, { userA: boolean; userB: boolean }> = {}
      for (const pair of pairs) {
        const today = new Date().toISOString().split("T")[0]
        checkins[pair.id] = { userA: false, userB: false }
      }
      setTodayCheckins(checkins)
    }
    loadTodayCheckins()
  }, [pairs])

  const handlePair = async (partnerId: string) => {
    setIsPairing(true)
    await createPair(partnerId, userClan?.id)
    setIsPairing(false)
    setShowPairModal(false)
  }

  const handleCheckin = async (pairId: string) => {
    await checkin(pairId, "daily_checkin")
    setTodayCheckins((prev) => ({
      ...prev,
      [pairId]: { ...prev[pairId], userA: true },
    }))
  }

  const availablePartners = members?.filter(
    (m) => m.user_id !== user?.id && !pairs.some((p) => p.partner?.id === m.user_id)
  ) || []

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.5rem] border border-pink-500/14 bg-[#090704]/70 backdrop-blur-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/6 via-transparent to-rose-500/4" />
        <div className="relative p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/15 border border-pink-500/20">
                <Heart className="h-4 w-4 text-pink-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  {isEnglish ? "Accountability Partner" : "Parceiro de Accountability"}
                </h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/50">
                  {isEnglish ? "Stay consistent together" : "Mantenham a consistencia juntos"}
                </p>
              </div>
            </div>
            {pairs.length === 0 && (
              <Button
                onClick={() => setShowPairModal(true)}
                className="h-8 rounded-lg bg-pink-500/15 border border-pink-500/20 px-3 text-[9px] font-black uppercase tracking-widest text-pink-400 hover:bg-pink-500/25"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                {isEnglish ? "Pair Up" : "Parear"}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-5 w-5 text-pink-400 animate-spin" />
            </div>
          ) : pairs.length === 0 ? (
            <div className="rounded-xl border border-pink-500/10 bg-pink-500/5 p-4 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-pink-400/30" />
                    <p className="text-xs font-bold text-foreground/50">
                {isEnglish
                  ? "Pair up with a clan member to keep each other accountable!"
                  : "Pareie-se com um membro do clã para se manterem responsaveis!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pairs.map((pair) => {
                const isCheckedIn = todayCheckins[pair.id]?.userA
                return (
                  <div
                    key={pair.id}
                    className="rounded-xl border border-pink-500/12 bg-black/30 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/15 border border-pink-500/20">
                          <span className="text-xs font-black text-pink-400">
                            {pair.partner?.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">{pair.partner?.name}</p>
                          <p className="text-[9px] font-bold text-foreground/50">
                            {isEnglish ? "Partner" : "Parceiro"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => endPair(pair.id)}
                        className="h-7 w-7 rounded-lg text-foreground/50 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-foreground/60" />
                          <span className="text-xs font-black text-foreground/60">{pair.combined_streak}</span>
                          <span className="text-[9px] font-bold text-foreground/50">
                            {isEnglish ? "days together" : "dias juntos"}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleCheckin(pair.id)}
                        disabled={isCheckedIn}
                        className={cn(
                          "h-8 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest",
                          isCheckedIn
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            : "bg-pink-500/15 text-pink-400 border border-pink-500/20 hover:bg-pink-500/25"
                        )}
                      >
                        {isCheckedIn ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            {isEnglish ? "Done" : "Feito"}
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            {isEnglish ? "Check In" : "Check In"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showPairModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPairModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d0a06] border border-pink-500/18 rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-foreground">
                  {isEnglish ? "Choose Partner" : "Escolher Parceiro"}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowPairModal(false)} className="h-8 w-8 rounded-xl">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {availablePartners.length === 0 ? (
                <div className="rounded-xl border border-pink-500/10 bg-pink-500/5 p-6 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-pink-400/30" />
              <p className="text-xs font-bold text-foreground/50">
                    {isEnglish
                      ? "No available partners. Join a clan first!"
                      : "Nenhum parceiro disponivel. Entre em um clã primeiro!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availablePartners.map((member) => (
                    <button
                      key={member.user_id}
                      onClick={() => handlePair(member.user_id)}
                      disabled={isPairing}
                      className="w-full flex items-center gap-3 rounded-xl border border-pink-500/10 bg-black/30 p-3 hover:bg-pink-500/5 transition-all"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/15 border border-pink-500/20">
                        <span className="text-xs font-black text-pink-400">
                          {member.profiles?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-black text-foreground">{member.profiles?.name}</p>
                      </div>
                      {isPairing ? (
                        <Loader2 className="h-4 w-4 text-pink-400 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 text-pink-400/50" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
