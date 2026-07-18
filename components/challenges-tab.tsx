"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Trophy, Plus, Loader2, X, Target, Clock, Users, Check, Flame,
  ScanLine, Dumbbell, Wheat, Zap, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useChallenges } from "@/hooks/useChallenges"
import { useTranslation } from "@/lib/i18n"

type ChallengeType = "scans" | "workouts" | "streak" | "calories" | "custom"

export function ChallengesTab({ clanId }: { clanId?: string }) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { challenges, isLoading, createChallenge, joinChallenge, updateProgress } = useChallenges(clanId)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newType, setNewType] = useState<ChallengeType>("scans")
  const [newTarget, setNewTarget] = useState("10")
  const [newEndDate, setNewEndDate] = useState("")

  useEffect(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    setNewEndDate(d.toISOString().split("T")[0])
  }, [])

  const typeIcons: Record<string, any> = {
    scans: ScanLine,
    workouts: Dumbbell,
    streak: Flame,
    calories: Wheat,
    custom: Target,
  }

  const typeLabels: Record<string, string> = {
    scans: isEnglish ? "Scans" : "Scans",
    workouts: isEnglish ? "Workouts" : "Treinos",
    streak: isEnglish ? "Streak" : "Sequencia",
    calories: isEnglish ? "Calories" : "Calorias",
    custom: isEnglish ? "Custom" : "Personalizado",
  }

  const typeUnits: Record<string, string> = {
    scans: isEnglish ? "products" : "alimentos",
    workouts: isEnglish ? "sessions" : "sessoes",
    streak: isEnglish ? "days" : "dias",
    calories: isEnglish ? "kcal" : "kcal",
    custom: isEnglish ? "units" : "unidades",
  }

  const handleCreate = async () => {
    if (!newTitle.trim() || !newTarget) return
    setIsCreating(true)
    const challenge = await createChallenge({
      title: newTitle.trim(),
      description: newDesc.trim(),
      challengeType: newType,
      targetValue: parseInt(newTarget) || 10,
      unit: typeUnits[newType],
      endDate: new Date(newEndDate).toISOString(),
    })
    if (challenge) {
      setShowCreateModal(false)
      setNewTitle("")
      setNewDesc("")
      setNewTarget("10")
    }
    setIsCreating(false)
  }

  const timeLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black tracking-tight text-foreground">
          {isEnglish ? "Challenges" : "Desafios"}
        </h3>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="h-9 rounded-xl bg-foreground px-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-foreground/80"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {isEnglish ? "Create" : "Criar"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 text-foreground/50 animate-spin" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-8 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-white/10" />
          <p className="text-sm font-bold text-white/20">
            {isEnglish ? "No active challenges. Create one!" : "Nenhum desafio ativo. Crie um!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((challenge, i) => {
            const Icon = typeIcons[challenge.challenge_type] || Target
            const isParticipant = challenge.participants?.some((p) => p.completed === false)
            const myProgress = challenge.participants?.find((p) => p.completed === false)
            const completedCount = challenge.participants?.filter((p) => p.completed).length || 0
            const totalCount = challenge.participants?.length || 0
            const progressPercent = myProgress
              ? Math.min((myProgress.current_value / challenge.target_value) * 100, 100)
              : 0

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-[1.25rem] border border-white/10 bg-[#090704]/60 p-4 backdrop-blur-xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                      <Icon className="h-5 w-5 text-foreground/60" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-foreground">{challenge.title}</p>
                      <p className="text-[10px] font-bold text-white/20">
                        {challenge.target_value} {challenge.unit || typeUnits[challenge.challenge_type]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-white/15">
                    <Clock className="h-3 w-3" />
                    <span className="text-[9px] font-bold">{timeLeft(challenge.end_date)}</span>
                  </div>
                </div>

                {challenge.description && (
                  <p className="text-xs text-white/20 mb-3">{challenge.description}</p>
                )}

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-white/15" />
                    <span className="text-[10px] font-bold text-white/20">
                      {completedCount}/{totalCount} {isEnglish ? "completed" : "concluidos"}
                    </span>
                  </div>
                  {myProgress && (
                    <span className="text-[10px] font-black text-foreground">
                      {myProgress.current_value}/{challenge.target_value}
                    </span>
                  )}
                </div>

                {myProgress && !myProgress.completed && (
                  <div className="mb-3">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-gradient-to-r from-foreground/50 to-foreground/30 rounded-full"
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                {myProgress?.completed ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/15 p-2.5">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      {isEnglish ? "Completed!" : "Concluido!"}
                    </span>
                  </div>
                ) : myProgress ? (
                  <Button
                    onClick={() => updateProgress(challenge.id)}
                    className="w-full h-10 rounded-xl bg-white/8 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground/60 hover:bg-white/10"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    {isEnglish ? "Log Progress" : "Registrar Progresso"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => joinChallenge(challenge.id)}
                    className="w-full h-10 rounded-xl bg-foreground text-[10px] font-black uppercase tracking-widest text-black hover:bg-foreground/80"
                  >
                    {isEnglish ? "Join Challenge" : "Entrar no Desafio"}
                  </Button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d0a06] border border-white/10 rounded-3xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-foreground">
                  {isEnglish ? "New Challenge" : "Novo Desafio"}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="h-8 w-8 rounded-xl">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-1.5 block">
                    {isEnglish ? "Title" : "Titulo"}
                  </label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={isEnglish ? "e.g., Scan 10 foods this week" : "ex.: Escaneie 10 alimentos esta semana"}
                    className="h-12 rounded-xl border-white/10 bg-black/30 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-1.5 block">
                    {isEnglish ? "Description" : "Descricao"}
                  </label>
                  <Input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder={isEnglish ? "Optional description" : "Descricao opcional"}
                    className="h-12 rounded-xl border-white/10 bg-black/30 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-2 block">
                    {isEnglish ? "Type" : "Tipo"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["scans", "workouts", "streak", "calories", "custom"] as ChallengeType[]).map((type) => {
                      const TypeIcon = typeIcons[type]
                      return (
                        <button
                          key={type}
                          onClick={() => setNewType(type)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-xl p-2.5 text-[9px] font-black uppercase tracking-widest transition-all border",
                            newType === type
                              ? "bg-white/8 text-foreground/60 border-white/10"
                              : "text-foreground/50 border-white/10 hover:text-foreground/70"
                          )}
                        >
                          <TypeIcon className="h-4 w-4" />
                          {typeLabels[type]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-1.5 block">
                      {isEnglish ? "Target" : "Meta"}
                    </label>
                    <Input
                      type="number"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      className="h-12 rounded-xl border-white/10 bg-black/30 text-sm"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-1.5 block">
                      {isEnglish ? "End Date" : "Data Final"}
                    </label>
                    <Input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="h-12 rounded-xl border-white/10 bg-black/30 text-sm"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={!newTitle.trim() || !newTarget || isCreating}
                className="mt-6 h-12 w-full rounded-xl bg-foreground text-sm font-black uppercase tracking-widest text-black hover:bg-foreground/80 disabled:opacity-40"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isEnglish ? "Create Challenge" : "Criar Desafio"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
