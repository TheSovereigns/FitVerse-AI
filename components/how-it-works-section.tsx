"use client"

import { motion } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { CTAButton } from "@/components/cta-button"
import { Zap, ScanLine, ChefHat, CheckCircle } from "lucide-react"

interface HowItWorksSectionProps {
  id?: string
}

export function HowItWorksSection({ id }: HowItWorksSectionProps) {
  const { t } = useTranslation()

  const steps = [
    {
      num: "01",
      title: t("onboard_step1_title") || "Responda algumas perguntas",
      desc: t("onboard_step1_desc") || "Conte-nos sobre seus objetivos, nível de atividade e preferências",
      icon: Zap,
    },
    {
      num: "02",
      title: t("onboard_step2_title") || "A IA cria seu plano",
      desc: t("onboard_step2_desc") || "Nosso algoritmo gera um plano personalizado de treino e nutrição",
      icon: ScanLine,
    },
    {
      num: "03",
      title: t("onboard_step3_title") || "Comece a transformar",
      desc: t("onboard_step3_desc") || "Siga o plano e acompanhe seus resultados com nossa IA",
      icon: ChefHat,
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
            {t("onboard_how_title") || "Como funciona"}
          </h2>
          <p className="text-muted-foreground opacity-60 max-w-xl mx-auto">
            three simples passos para sua transformação
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative glass-strong border border-white/10 rounded-2xl p-6"
            >
              <span className="text-4xl font-black text-primary/20 mb-4 block">{step.num}</span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground opacity-60">{step.desc}</p>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-primary/20">
                  →
                </div>
              )}
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
            label={t("cta_mid_how")}
            href="/auth/login"
            variant="primary"
            size="lg"
            dataCta="mid-how-it-works"
          />
        </motion.div>
      </div>
    </section>
  )
}