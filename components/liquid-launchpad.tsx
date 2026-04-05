"use client"

import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Home, ScanLine, Dumbbell, Calculator, 
  ChefHat, ShoppingBag, Bot, User, Settings,
  ChevronDown, Search
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
    { id: "home", icon: Home, label: t("nav_home"), color: "from-blue-500/20 to-cyan-500/10" },
    { id: "dashboard", icon: ScanLine, label: t("nav_bioscan"), color: "from-orange-500/20 to-amber-500/10" },
    { id: "training", icon: Dumbbell, label: t("nav_workouts"), color: "from-rose-500/20 to-purple-500/10" },
    { id: "planner", icon: Calculator, label: t("nav_diet"), color: "from-emerald-500/20 to-teal-500/10" },
    { id: "recipes", icon: ChefHat, label: t("nav_recipes"), color: "from-pink-500/20 to-rose-500/10" },
    { id: "store", icon: ShoppingBag, label: t("nav_store"), color: "from-blue-600/20 to-indigo-500/10" },
    { id: "chatbot", icon: Bot, label: t("nav_aichat"), color: "from-violet-500/20 to-fuchsia-500/10" },
    { id: "profile", icon: User, label: t("nav_profile"), color: "from-gray-500/20 to-slate-500/10" },
    { id: "settings", icon: Settings, label: t("nav_settings"), color: "from-zinc-500/20 to-neutral-500/10" },
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
          className="fixed inset-0 z-[100] md:hidden bg-transparent backdrop-blur-[60px] flex flex-col overflow-hidden mesh-gradient-animated"
        >
          {/* Top Indicator / Close handle */}
          <div className="pt-2 pb-6 flex flex-col items-center gap-1 group cursor-pointer" onClick={onClose}>
             <div className="w-10 h-1.5 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />
             <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-20 group-hover:opacity-40 transition-opacity">
               {t("nav_pull_down_to_close") || "Pull down"}
             </span>
          </div>

          <div className="flex-1 px-8 pt-4 pb-32 space-y-10 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">


            {/* Modules Grid */}
            <div className="space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 ml-4">
                 Bio-Modules
               </h3>
               <div className="grid grid-cols-3 gap-4">
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
                         "relative aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all duration-300 border haptic-press",
                         isActive 
                           ? "bg-primary border-primary shadow-[0_0_30px_rgba(255,149,0,0.4)]" 
                           : "glass-strong border-white/10 bg-gradient-to-br" + " " + item.color
                       )}
                     >
                       <item.icon className={cn("w-7 h-7", isActive ? "text-white" : "text-foreground/70")} />
                       <span className={cn(
                         "text-[9px] font-black uppercase tracking-widest",
                         isActive ? "text-white" : "text-foreground/40"
                       )}>
                         {item.label}
                       </span>
                       {isActive && (
                          <motion.div 
                            layoutId="launch-active"
                            className="absolute inset-[-4px] border border-primary/40 rounded-[2.25rem] opacity-50"
                          />
                       )}
                     </motion.button>
                   )
                 })}
               </div>
            </div>

            {/* Quick Actions / Integration */}
            <div className="grid grid-cols-2 gap-4">
               <div className="glass-strong border-white/10 rounded-[2.5rem] p-6 flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-sm uppercase tracking-tighter">Bio-Stats</h4>
                  <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Protocol V4.2</p>
               </div>
               <div className="glass-strong border-white/10 rounded-[2.5rem] p-6 flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                    <ScanLine className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-sm uppercase tracking-tighter">AI Sync</h4>
                  <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Stabilized</p>
               </div>
            </div>
          </div>

          {/* Footer Blur Edge */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
