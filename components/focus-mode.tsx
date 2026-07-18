"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Minimize2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FocusModeProps {
  isActive: boolean
  type: "workout" | "recipe" | "general"
  title: string
  onDeactivate: () => void
  children: React.ReactNode
}

export function FocusMode({ isActive, type, title, onDeactivate, children }: FocusModeProps) {
  return (
    <AnimatePresence>
      {isActive ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-[#050302] flex flex-col"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_50%)]" />

          <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-white/10">
                <Eye className="h-3.5 w-3.5 text-foreground/50" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground/50">
                  {type === "workout" ? "Modo Treino" : type === "recipe" ? "Modo Receita" : "Modo Foco"}
                </p>
                {title && (
                  <p className="text-[10px] font-bold text-foreground/30 truncate max-w-[200px]">{title}</p>
                )}
              </div>
            </div>
            <Button
              onClick={onDeactivate}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg border border-white/10 bg-white/8 text-foreground/60 hover:bg-white/16"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto">
            {children}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 px-4 py-3 border-t border-white/10"
          >
            <button
              onClick={onDeactivate}
              className="w-full h-10 rounded-xl border border-white/10 bg-white/8 text-[10px] font-black uppercase tracking-widest text-foreground/50 hover:bg-white/16 transition-all"
            >
              Sair do Modo Foco
            </button>
          </motion.div>
        </motion.div>
      ) : (
        <>{children}</>
      )}
    </AnimatePresence>
  )
}
