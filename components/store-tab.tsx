"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ShoppingBag, 
  Star, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ShieldCheck, 
  Award, 
  Lock, 
  Truck, 
  Sparkles,
  Zap,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

export function StoreTab() {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-black text-foreground">{t("store_heading")}</h1>
        <p className="text-muted-foreground opacity-60">
          {t("store_desc")}
        </p>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 w-fit mx-auto">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-primary">{t("store_coming_soon")}</span>
        </div>
      </div>
    </div>
  )
}
