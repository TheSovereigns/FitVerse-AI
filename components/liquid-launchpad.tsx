"use client"

import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Home, ScanLine, Dumbbell, Calculator, 
  ChefHat, ShoppingBag, Bot, User, Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface LaunchpadProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (view: any) => void
  currentView: string
}

export function LiquidLaunchpad({ isOpen, onClose, onNavigate, currentView }: LaunchpadProps) {
  const { t } = useTranslation()

  const menuItems = [
    { id: "home", icon: Home, label: t("nav_home") },
    { id: "dashboard", icon: ScanLine, label: t("nav_bioscan") },
    { id: "training", icon: Dumbbell, label: t("nav_workouts") },
    { id: "planner", icon: Calculator, label: t("nav_diet") },
    { id: "recipes", icon: ChefHat, label: t("nav_recipes") },
    { id: "store", icon: ShoppingBag, label: t("nav_store") },
    { id: "chatbot", icon: Bot, label: t("nav_aichat") },
    { id: "profile", icon: User, label: t("nav_profile") },
    { id: "settings", icon: Settings, label: t("nav_settings") },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100) onClose()
          }}
          className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#050302]/86 backdrop-blur-[48px] md:hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,149,0,0.2),transparent_42%),radial-gradient(circle_at_20%_90%,rgba(249,115,22,0.13),transparent_36%)]" />

          {/* Top Indicator / Close handle */}
          <div className="relative z-10 flex cursor-pointer flex-col items-center gap-1 pb-5 pt-safe-top group" onClick={onClose}>
             <div className="mt-2 h-1.5 w-11 rounded-full bg-orange-100/20 transition-colors group-hover:bg-orange-100/35" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-orange-100/24 transition-opacity group-hover:text-orange-100/42">
                {t("nav_pull_down_to_close")}
              </span>
          </div>

           <div className="relative z-10 flex-1 space-y-8 overflow-y-auto px-4 pb-32 pt-2 scrollbar-thin scrollbar-thumb-orange-300/20 scrollbar-track-transparent">


            {/* Modules Grid */}
            <div className="space-y-6">
                <h3 className="ml-2 text-[10px] font-black uppercase tracking-[0.34em] text-orange-100/32">
                  {t("lp_bio_modules")}
                </h3>
               <div className="grid grid-cols-3 gap-3">
                 {menuItems.map((item) => {
                   const isActive = currentView === item.id
                   return (
                     <motion.button
                       key={item.id}
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95, opacity: 0.7 }}
                       onClick={() => {
                         onNavigate(item.id)
                         onClose()
                       }}
                       className={cn(
                         "relative aspect-square rounded-[1.55rem] flex flex-col items-center justify-center gap-2 transition-all duration-300 border haptic-press overflow-hidden",
                         isActive 
                           ? "border-orange-300/45 bg-orange-500 text-black shadow-[0_18px_42px_rgba(255,149,0,0.3)]"
                           : "border-orange-300/12 bg-[#0c0704]/74 text-orange-50 shadow-[inset_0_1px_0_rgba(251,146,60,0.08),0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
                       )}
                     >
                       {!isActive && <span className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-black/20" />}
                       <item.icon className={cn("relative z-10 h-6 w-6", isActive ? "text-black" : "text-orange-100/70")} />
                       <span className={cn(
                         "relative z-10 max-w-[78px] truncate text-[8px] font-black uppercase tracking-widest",
                         isActive ? "text-black" : "text-orange-100/42"
                       )}>
                         {item.label}
                       </span>
                       {isActive && (
                          <motion.div 
                            layoutId="launch-active"
                            className="absolute inset-[-3px] rounded-[1.75rem] border border-orange-200/55 opacity-60"
                          />
                       )}
                     </motion.button>
                   )
                 })}
               </div>
            </div>

            {/* Quick Actions / Integration */}
            <div className="grid grid-cols-2 gap-3">
               <div className="rounded-[1.5rem] border border-orange-300/12 bg-[#0c0704]/76 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Calculator className="w-5 h-5" />
                  </div>
                   <h4 className="mt-4 text-sm font-black uppercase tracking-tight text-orange-50">{t("lp_bio_stats")}</h4>
                   <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-orange-100/36">{t("lp_protocol")}</p>
               </div>
               <div className="rounded-[1.5rem] border border-orange-300/12 bg-[#0c0704]/76 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-primary">
                    <ScanLine className="w-5 h-5" />
                  </div>
                   <h4 className="mt-4 text-sm font-black uppercase tracking-tight text-orange-50">{t("lp_ai_sync")}</h4>
                   <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-orange-100/36">{t("lp_stabilized")}</p>
               </div>
            </div>
          </div>

          {/* Footer Blur Edge */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/75 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
