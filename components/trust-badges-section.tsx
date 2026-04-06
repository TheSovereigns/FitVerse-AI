"use client"

import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { Brain, Shield, Zap, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

export function TrustBadgesSection() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const trustBadges = [
    { icon: Brain, label: isEnglish ? "Powered by AI" : "Desenvolvido com IA", color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: Shield, label: isEnglish ? "Data Protected" : "Dados protegidos", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: Zap, label: isEnglish ? "Plan in 30 seconds" : "Plano em 30 segundos", color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { icon: Globe, label: isEnglish ? "BR & US Support" : "PT & EN", color: "text-blue-400", bg: "bg-blue-500/10" },
  ]

  return (
    <section className="py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center items-center gap-4 md:gap-8"
        >
          {trustBadges.map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={cn("flex items-center gap-2 px-4 py-2 lg:px-6 lg:py-3 rounded-full", badge.bg)}
            >
              <badge.icon className={cn("w-5 h-5", badge.color)} />
              <span className="text-xs font-medium text-muted-foreground">{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}