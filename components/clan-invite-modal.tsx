"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Check, Loader2, Clock, Link as LinkIcon } from "lucide-react"
import { useClans } from "@/hooks/useClans"
import { useTranslation } from "@/lib/i18n"

export function ClanInviteModal({ isOpen, onClose, clanId, clanName }: {
  isOpen: boolean; onClose: () => void; clanId: string; clanName: string
}) {
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { invites, fetchInvites, createInvite } = useClans()
  const [isCreating, setIsCreating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => { if (isOpen && clanId) fetchInvites(clanId) }, [isOpen, clanId, fetchInvites])

  const handleCreateInvite = async () => { setIsCreating(true); await createInvite(clanId); setIsCreating(false) }
  const copyCode = (code: string) => { navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000) }
  const copyLink = (code: string) => { navigator.clipboard.writeText(`${window.location.origin}?clan_invite=${code}`); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000) }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background border border-border rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">{isEnglish ? "Invite to" : "Convidar para"} {clanName}</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mt-1">
                  {isEnglish ? "Share code or link" : "Compartilhe codigo ou link"}
                </p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center text-foreground/40 hover:text-foreground/60 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {invites.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">{isEnglish ? "Active Codes" : "Codigos Ativos"}</p>
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-bold text-sm text-foreground tracking-wider">{invite.invite_code}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-foreground/20" />
                        <span className="text-[10px] text-foreground/20">
                          {isEnglish ? "Expires" : "Expira"}: {new Date(invite.expires_at).toLocaleDateString(isEnglish ? "en-US" : "pt-BR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => copyCode(invite.invite_code)}
                        className="h-8 w-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center hover:bg-muted/30 transition-colors">
                        {copiedCode === invite.invite_code ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5 text-foreground/40" />}
                      </button>
                      <button onClick={() => copyLink(invite.invite_code)}
                        className="h-8 w-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center hover:bg-muted/30 transition-colors">
                        <LinkIcon className="h-3.5 w-3.5 text-foreground/40" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={handleCreateInvite} disabled={isCreating}
              className="w-full h-11 rounded-xl bg-muted/50 border border-border text-foreground/40 text-xs font-bold hover:bg-muted/30 transition-colors flex items-center justify-center gap-2">
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEnglish ? "Generate New Code" : "Gerar Novo Codigo"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
