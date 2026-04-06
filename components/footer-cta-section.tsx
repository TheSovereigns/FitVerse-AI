"use client"

import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { CTAButton } from "@/components/cta-button"
import { useAuth } from "@/hooks/useAuth"

interface FooterCTASectionProps {
  id?: string
}

export function FooterCTASection({ id }: FooterCTASectionProps) {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <section id={id} className="py-20 px-4 md:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center glass-strong border border-primary/20 rounded-[3rem] p-8 md:p-12 relative overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/10" />
        
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/20 mb-6"
          >
            <span className="text-4xl">🚀</span>
          </motion.div>

          <h2 className="text-2xl md:text-4xl font-black text-foreground mb-4">
            {t("onboard_cta_title") || "Pronto para transformar sua saúde?"}
          </h2>
          <p className="text-muted-foreground opacity-60 max-w-xl mx-auto mb-8">
            {t("onboard_cta_subtitle") || "Junte-se a milhares de pessoas que já melhoraram sua qualidade de vida com FitVerse AI"}
          </p>

          <CTAButton
            label={t("cta_footer")}
            href={user ? "/?view=planner" : "/auth/login"}
            variant="primary"
            size="lg"
            dataCta="footer-final"
          />
          
          <p className="text-xs text-muted-foreground opacity-40 mt-4">
            ✓ Sem cartão de crédito • ✓ Plano 100% gratuito disponível
          </p>
        </div>
      </motion.div>
    </section>
  )
}