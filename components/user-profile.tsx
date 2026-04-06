"use client"

import { motion } from "framer-motion"
import { User, Settings, Crown, ChevronRight, Shield, Bell, CreditCard, LogOut, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UserProfileProps {
    onNavigateToSettings?: () => void
    onNavigateToSubscription?: () => void
}

export function UserProfile({ onNavigateToSettings, onNavigateToSubscription }: UserProfileProps) {
    const settingsGroups = [
        {
            title: "Conta & Segurança",
            items: [
                { icon: Shield, label: "Privacidade e Segurança", color: "text-[#32D74B]" },
                { icon: Bell, label: "Notificações Biometricas", color: "text-[#FF453A]" },
                { icon: CreditCard, label: "Bio-Assinatura", color: "text-[#0A84FF]", action: onNavigateToSubscription }
            ]
        },
        {
            title: "Preferências",
            items: [
                { icon: Settings, label: "Configurações da IA", color: "text-[#BF5AF2]", action: onNavigateToSettings },
                { icon: Sparkles, label: "FitVerse AI Feed", color: "text-[#FFD60A]" }
            ]
        }
    ]

    return (
        <div className="space-y-12 pb-32 md:pb-16 lg:pb-12 max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto animate-in fade-in zoom-in duration-1000">
            {/* Apple ID Style Hero */}
            <div className="flex flex-col items-center text-center pt-8">
                <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="relative w-28 h-28 md:w-40 md:h-40 mb-6"
                >
                    <div className="absolute inset-0 mesh-gradient rounded-full blur-2xl opacity-40 animate-pulse" />
                    <div className="relative w-full h-full rounded-full glass-strong border-4 border-white/20 flex items-center justify-center shadow-2xl overflow-hidden group">
                        <User className="w-20 h-20 text-primary opacity-80 group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl border-4 border-background haptic-press">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                </motion.div>
                
                <h1 className="text-4xl font-black tracking-tighter text-foreground mb-1">Biohacker Alpha</h1>
                <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.4em] opacity-40">User ID: #2409-Z</p>

                <div className="mt-8 w-full glass-strong border-white/20 rounded-[2.5rem] p-6 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                            <Crown className="w-7 h-7" />
                        </div>
                        <div className="text-left">
                            <p className="font-black tracking-tight">Assinatura Premium</p>
                            <p className="text-xs font-bold text-muted-foreground opacity-60">Status: Bio-Ativo</p>
                        </div>
                    </div>
                    <Badge className="bg-primary text-white font-black px-4 py-2 rounded-full shadow-lg shadow-primary/20">LEVEL 26</Badge>
                </div>
            </div>

            {/* Apple Style Grouped Lists */}
            <div className="space-y-10">
                {settingsGroups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 ml-8">{group.title}</h3>
                        <div className="glass-strong border-white/20 rounded-[2.5rem] overflow-hidden shadow-xl">
                            {group.items.map((item, iIdx) => (
                                <motion.button
                                    key={iIdx}
                                    whileTap={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                                    onClick={item.action}
                                    className="w-full flex items-center justify-between p-6 border-b border-white/5 last:border-none transition-all group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center transition-all group-hover:scale-110 shadow-inner", item.color)}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-lg font-black tracking-tighter opacity-80 group-hover:opacity-100">{item.label}</span>
                                    </div>
                                    <ChevronRight className="w-6 h-6 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Logout Action */}
            <Button 
                variant="ghost" 
                className="w-full h-20 rounded-[2rem] text-red-500 font-black text-xl hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 shadow-none mt-8"
            >
                <LogOut className="w-8 h-8 mr-3" /> ENCERRAR BIO-SESSÃO
            </Button>
            
            <p className="text-center text-[10px] font-black opacity-20 uppercase tracking-[0.5em] pb-12">FitVerse AI v1.0.26 Liquid Glass</p>
        </div>
    )
}
