"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { Brain, Shield, Zap, Globe, Star, Quote } from "lucide-react"
import { cn } from "@/lib/utils"

interface CounterProps {
  value: number
  suffix?: string
  duration?: number
  inView: boolean
}

function AnimatedCounter({ value, suffix = "", duration = 1500, inView }: CounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return

    let startTime: number | null = null
    const startValue = 0
    const endValue = value

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easedProgress = easeOut(progress)
      setCount(Math.floor(startValue + (endValue - startValue) * easedProgress))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [inView, value, duration])

  return (
    <span>
      {count}
      {suffix}
    </span>
  )
}

interface TestimonialCardProps {
  initials: string
  name: string
  text: string
  result: string
  stars: number
  delay: number
  inView: boolean
}

function TestimonialCard({ initials, name, text, result, stars, delay, inView }: TestimonialCardProps) {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-orange-500",
    "bg-pink-500",
  ]
  const colorIndex = initials.charCodeAt(0) % colors.length
  const avatarColor = colors[colorIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      className="glass-strong border border-white/10 rounded-2xl p-6 lg:p-8 relative"
    >
      <Quote className="absolute top-4 left-4 w-6 h-6 text-primary/20" />

      <div className="flex items-center gap-4 mb-4">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-black", avatarColor)}>
          {initials}
        </div>
        <div>
          <h4 className="font-black text-foreground text-sm">{name}</h4>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
      </div>

      <p className="text-muted-foreground italic text-sm leading-relaxed mb-4">
        "{text}"
      </p>

      <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <span className="text-xs font-black text-emerald-400">{result}</span>
      </div>

      <p className="text-[10px] text-muted-foreground opacity-40 mt-4">
        *Resultado individual. Resultados podem variar. / *Individual result. Results may vary.
      </p>
    </motion.div>
  )
}

export function SocialProofSection() {
  const { t, locale } = useTranslation()
  const isEnglish = locale === "en-US"

  const sectionRef = useRef<HTMLDivElement>(null)
  const numbersRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const trustRef = useRef<HTMLDivElement>(null)
  const mockupRef = useRef<HTMLDivElement>(null)

  const numbersInView = useInView(numbersRef, { once: true, margin: "-100px" })
  const testimonialsInView = useInView(testimonialsRef, { once: true, margin: "-100px" })
  const trustInView = useInView(trustRef, { once: true, margin: "-100px" })
  const mockupInView = useInView(mockupRef, { once: true, margin: "-100px" })

  const metrics = [
    { value: 500, suffix: "+", label: isEnglish ? "Active users" : "Usuários ativos" },
    { value: 4.8, suffix: "★", label: isEnglish ? "Average rating" : "Avaliação média", isDecimal: true },
    { value: 92, suffix: "%", label: isEnglish ? "Reached their goals" : "Atingiram suas metas" },
    { value: 30, suffix: "s", label: isEnglish ? "To generate your plan" : "Para gerar seu plano" },
  ]

  const testimonials = [
    {
      initials: "CM",
      name: isEnglish ? "Carlos M., 28 — São Paulo, BR" : "Carlos M., 28 anos — São Paulo",
      text: isEnglish
        ? "Lost 15lbs in 2 months. The AI plan adapted to my work schedule and I never felt overwhelmed."
        : "Perdi 7kg em 2 meses. O plano da IA se adaptou à minha rotina de trabalho e nunca me senti sobrecarregado.",
      result: isEnglish ? "-15lbs in 60 days" : "-7kg em 60 dias",
      stars: 5,
    },
    {
      initials: "JT",
      name: isEnglish ? "Jessica T., 34 — Austin, TX" : "Jessica T., 34 anos — Austin, TX",
      text: isEnglish
        ? "As a busy mom of 3, I never thought I could meal prep. FitVerse made it so simple — the AI even accounts for my kids' picky eating!"
        : "Como mãe de 3, nunca pensei que conseguiria preparar refeições. O FitVerse tornou tudo simples — a IA considera até a preferência dos meus filhos!",
      result: isEnglish ? "-22lbs in 4 months" : "-10kg em 4 meses",
      stars: 5,
    },
    {
      initials: "MK",
      name: isEnglish ? "Marcus K., 26 — Miami, FL" : "Marcus K., 26 anos — Miami, FL",
      text: isEnglish
        ? "The food scanner is insane. I scanned a protein bar and it told me it had 3x more sugar than I thought. Game changer for my cutting phase."
        : "O scanner de alimentos é insano. Escaneei uma barra de proteína e descobri que tinha 3x mais açúcar do que eu pensava. Mudou meu cutting.",
      result: isEnglish ? "+12lbs lean mass" : "+5.5kg massa magra",
      stars: 5,
    },
    {
      initials: "AP",
      name: isEnglish ? "Ana P., 33 — Rio de Janeiro, BR" : "Ana P., 33 anos — Rio de Janeiro",
      text: isEnglish
        ? "First time I actually stuck to a diet. The suggestions are practical and fit into my daily life."
        : "Pela primeira vez consegui manter uma dieta. As sugestões são práticas e encaixam no meu dia a dia.",
      result: isEnglish ? "+9lbs lean mass" : "+4kg massa magra",
      stars: 5,
    },
    {
      initials: "DR",
      name: isEnglish ? "David R., 31 — New York, NY" : "David R., 31 anos — Nova York, NY",
      text: isEnglish
        ? "I've tried every fitness app out there. FitVerse is the first one that actually feels personalized. The AI coach knows my limits better than I do."
        : "Já tentei todos os apps de fitness. FitVerse é o primeiro que realmente parece personalizado. O coach IA conhece meus limites melhor que eu.",
      result: isEnglish ? "Running my first 5K!" : "Correndo meu primeiro 5K!",
      stars: 5,
    },
    {
      initials: "RS",
      name: isEnglish ? "Rafael S., 22 — Belo Horizonte, BR" : "Rafael S., 22 anos — Belo Horizonte",
      text: isEnglish
        ? "The AI Chat answers any question instantly. It's like having a personal trainer in my pocket 24/7."
        : "O Chat com IA responde qualquer dúvida na hora. É como ter um personal no bolso 24h.",
      result: isEnglish ? "Training 5x/week for 3 months" : "Treina 5x/semana há 3 meses",
      stars: 5,
    },
  ]

  const trustBadges = [
    { icon: Brain, label: isEnglish ? "AI Scanning" : "Escaneamento por IA", color: "text-purple-400" },
    { icon: Shield, label: isEnglish ? "Data Protected" : "Dados protegidos", color: "text-emerald-400" },
    { icon: Zap, label: isEnglish ? "Plan in 30 seconds" : "Plano em 30 segundos", color: "text-yellow-400" },
    { icon: Globe, label: isEnglish ? "BR & US Support" : "PT & EN", color: "text-blue-400" },
  ]

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Block 1: Impact Numbers */}
        <div ref={numbersRef} className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={numbersInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-8">
              {isEnglish ? "Numbers that speak for themselves" : "Números que falam por si"}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={numbersInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-black text-primary mb-2">
                  <AnimatedCounter
                    value={metric.value}
                    suffix={metric.suffix}
                    inView={numbersInView}
                  />
                </div>
                <p className="text-sm text-muted-foreground opacity-60">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Block 2: Testimonials */}
        <div ref={testimonialsRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2">
              {isEnglish ? "What our users say" : "O que nossos usuários dizem"}
            </h2>
            <p className="text-muted-foreground opacity-60">
              {isEnglish ? "Real stories, real results" : "Histórias reais, resultados reais"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                {...testimonial}
                delay={index * 0.15}
                inView={testimonialsInView}
              />
            ))}
          </div>
        </div>

        {/* Block 3: Trust Badges */}
        <div ref={trustRef} className="py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={trustInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
          >
            {trustBadges.map((badge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={trustInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex flex-col items-center text-center p-4 lg:p-6 rounded-xl bg-white/5"
              >
                <div className={cn("mb-3", badge.color)}>
                  <badge.icon className="w-8 h-8" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{badge.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Block 4: App Mockup */}
        <div ref={mockupRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mockupInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-xl md:text-2xl font-black text-foreground mb-8">
              {isEnglish ? "Your personalized dashboard" : "Seu dashboard personalizado"}
            </h2>

            {/* Phone Mockup */}
            <div className="flex justify-center">
              <div className="relative w-56 md:w-64 lg:w-72 xl:w-80 h-[440px] md:h-[480px] lg:h-[550px] xl:h-[640px] rounded-[3rem] border-4 border-white/20 bg-background overflow-hidden shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-background rounded-b-xl z-10" />

                {/* Screen Content */}
                <div className="h-full pt-10 px-4 pb-4 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20" />
                      <span className="text-xs font-black text-foreground">Olá, Carlos</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/10" />
                  </div>

                  {/* Calorie Card */}
                  <div className="glass-strong rounded-2xl p-4 border border-white/10">
                    <span className="text-[8px] font-black text-primary uppercase tracking-wider">CaloriasHoje</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-foreground">1,847</span>
                      <span className="text-xs text-muted-foreground">/ 2,400 kcal</span>
                    </div>
                    <div className="h-1.5 mt-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-[77%] bg-primary rounded-full" />
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-500/10 rounded-xl p-2 text-center border border-blue-500/20">
                      <span className="text-[8px] text-blue-400 font-black uppercase">Prot</span>
                      <span className="text-sm font-black text-foreground block">120g</span>
                    </div>
                    <div className="bg-yellow-500/10 rounded-xl p-2 text-center border border-yellow-500/20">
                      <span className="text-[8px] text-yellow-400 font-black uppercase">Carb</span>
                      <span className="text-sm font-black text-foreground block">180g</span>
                    </div>
                    <div className="bg-rose-500/10 rounded-xl p-2 text-center border border-rose-500/20">
                      <span className="text-[8px] text-rose-400 font-black uppercase">Gord</span>
                      <span className="text-sm font-black text-foreground block">55g</span>
                    </div>
                  </div>

                  {/* Next Workout */}
                  <div className="glass-strong rounded-2xl p-3 border border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <span className="text-lg">💪</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-black text-foreground block">Próximo treino</span>
                      <span className="text-[10px] text-muted-foreground">Hoje • 18:00 • Superior</span>
                    </div>
                    <span className="text-xs font-black text-primary">→</span>
                  </div>

                  {/* AI Suggestion */}
                  <div className="mt-auto glass-strong rounded-2xl p-3 border border-purple-500/20 bg-purple-500/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs">🤖</span>
                      <span className="text-[8px] font-black text-purple-400 uppercase">Sugestão IA</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {isEnglish ? "Great breakfast: oatmeal + banana + honey 🍯" : "Ótimo café da manhã: aveia + banana + mel"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}