"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface ClanCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, description: string, isPublic: boolean) => Promise<void>
  isLoading: boolean
}

export function ClanCreateModal({ isOpen, onClose, onCreate, isLoading }: ClanCreateModalProps) {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)

  const handleCreate = async () => {
    if (!name.trim()) return
    await onCreate(name.trim(), description.trim(), isPublic)
    setName("")
    setDescription("")
    setIsPublic(true)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-black/40 border border-white/10 rounded-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-foreground">
                {isEnglish ? "Create Clan" : "Criar Clã"}
              </h3>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-1.5 block">
                  {isEnglish ? "Clan Name" : "Nome do Clã"}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isEnglish ? "e.g., FitVerse United" : "ex.: FitVerse Unidos"}
                  className="h-12 rounded-xl border-white/10 bg-black/30 text-sm"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-1.5 block">
                  {isEnglish ? "Description" : "Descricao"}
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isEnglish ? "What's your clan about?" : "Sobre o que e seu clã?"}
                  className="h-12 rounded-xl border-white/10 bg-black/30 text-sm"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-2 block">
                  {isEnglish ? "Visibility" : "Visibilidade"}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      isPublic
                        ? "bg-white/10 text-foreground border-white/10"
                        : "text-foreground/50 border-white/10 hover:text-foreground/60"
                    )}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {isEnglish ? "Public" : "Publico"}
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      !isPublic
                        ? "bg-white/10 text-foreground border-white/10"
                        : "text-foreground/50 border-white/10 hover:text-foreground/60"
                    )}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    {isEnglish ? "Private" : "Privado"}
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isLoading}
              className="mt-6 h-12 w-full rounded-xl bg-foreground text-sm font-black uppercase tracking-widest text-black hover:bg-foreground/60 disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isEnglish ? "Create Clan" : "Criar Clã"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
