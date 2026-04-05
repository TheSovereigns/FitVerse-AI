"use client"

import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { CTAButton } from "@/components/cta-button"
import { ScanLine, Dumbbell, ChefHat } from "lucide-react"

interface BenefitsSectionProps {
  id?: string
}

export function BenefitsSection({ id }: BenefitsSectionProps) {
  const { t } = useTranslation()

  const benefits = [
    {
      icon: ScanLine,
      title: t("onboard_benefit1_title") || "Bio-Scan IA",
      desc: t("onboard_benefit1_desc") || "Escaneie qualquer alimento e a IA analisa，立刻",
    },
    {
      icon: Dumbbell,
      title: t("onboard_benefit2_title") || "Treinos Personalizados",
      desc: t("onboard_benefit2_desc") || "Planos de treino adaptados ao seu corpo e objetivos",
    },
    {
      icon: ChefHat,
      title: t("onboard_benefit3_title") || "Receitas Inteligentes",
      desc: t("onboard_benefit3_desc") || "Receitas saudáveis geradas pela IA em segundos",
    },
  ]

  return (
    <section id={id} className="py-20 px-4 md:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-4xl font-black text-foreground mb-4">
            {t("onboard_benefits_title") || "Por que FitVerse AI?"}
          </h2>
          <p className="text-muted-foreground opacity-60 max-w-xl mx-auto">
            Tecnologia de ponta para transformar sua saúde
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-strong border border-white/10 rounded-2xl p-6 text-center hover:border-primary/30 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground opacity-60">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA Mid Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <CTAButton
            label={t("cta_mid_benefits")}
            href="/auth/login"
            variant="primary"
            size="lg"
            dataCta="mid-benefits"
          />
        </motion.div>
      </div>
    </section>
  )
}