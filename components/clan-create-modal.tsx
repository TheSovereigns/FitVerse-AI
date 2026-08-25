"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Globe, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

export function ClanCreateModal({ isOpen, onClose, onCreate, isLoading }: {
  isOpen: boolean; onClose: () => void
  onCreate: (name: string, description: string, isPublic: boolean) => Promise<void>
  isLoading: boolean
}) {
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)

  const handleCreate = async () => {
    if (!name.trim()) return
    await onCreate(name.trim(), description.trim(), isPublic)
    setName(""); setDescription(""); setIsPublic(true)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white">{isEnglish ? "Create Clan" : "Criar Clan"}</h3>
              <button onClick={onClose} className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5 block">
                  {isEnglish ? "Clan Name" : "Nome do Clan"}
                </label>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30}
                  placeholder={isEnglish ? "e.g., VyseFit United" : "ex.: VyseFit Unidos"}
                  className="h-12 w-full rounded-xl border border-white/5 bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/30 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5 block">
                  {isEnglish ? "Description" : "Descricao"}
                </label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={100}
                  placeholder={isEnglish ? "What's your clan about?" : "Sobre o que e seu clan?"}
                  className="h-12 w-full rounded-xl border border-white/5 bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/30 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2 block">
                  {isEnglish ? "Visibility" : "Visibilidade"}
                </label>
                <div className="flex gap-2">
                  {[{ val: true, icon: Globe, label: isEnglish ? "Public" : "Publico" },
                    { val: false, icon: Lock, label: isEnglish ? "Private" : "Privado" }].map(({ val, icon: I, label }) => (
                    <button key={String(val)} onClick={() => setIsPublic(val)}
                      className={cn("flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold border transition-all",
                        isPublic === val ? "bg-brand/10 text-brand border-brand/20" : "text-white/30 border-white/5 hover:text-white/50")}>
                      <I className="h-3.5 w-3.5" />{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleCreate} disabled={!name.trim() || isLoading}
              className="mt-6 h-12 w-full rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEnglish ? "Create Clan" : "Criar Clan"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
