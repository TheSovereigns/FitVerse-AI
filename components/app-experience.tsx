"use client"

import Image from "next/image"
import { ArrowUpRight, Dumbbell, Salad, Wind } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import type { View } from "@/lib/types"

const areas = {
  movement: { image: "training", pt: "Movimento", en: "Movement", description: "Treine no seu ritmo. Construa sua próxima conquista.", descriptionEn: "Train at your pace. Build your next achievement." },
  nutrition: { image: "nutrition", pt: "Nutrição", en: "Nutrition", description: "Mais clareza nas escolhas. Mais energia para o seu dia.", descriptionEn: "Clearer choices. More energy for your day." },
  recovery: { image: "recovery", pt: "Equilíbrio", en: "Balance", description: "Seu descanso também faz parte da evolução.", descriptionEn: "Recovery is part of your progress, too." },
  progress: { image: "hero", pt: "Sua evolução", en: "Your progress", description: "Cada pequeno passo conta. Acompanhe os seus.", descriptionEn: "Every small step counts. Keep track of yours." },
}

const movement = new Set(["training", "corrida", "mobility", "equipment", "periodization", "workout-feedback"])
const nutrition = new Set(["dashboard", "recipes", "planner", "meal-planner", "food-diary", "dietary", "micronutrients", "substitutions", "supplements", "fasting"])
const recovery = new Set(["sleep", "stress", "health-checkin", "mood", "habits", "meditation", "longevity", "biological-age", "health-integrations"])

export function AppSectionIntro({ view, title }: { view: View; title: string }) {
  const { locale } = useTranslation()
  const en = locale === "en-US"
  if (["home", "result", "corrida", "chatbot"].includes(view)) return null
  const area = movement.has(view) ? areas.movement : nutrition.has(view) ? areas.nutrition : recovery.has(view) ? areas.recovery : areas.progress
  return (
    <section className="app-section-intro" aria-label={title}>
      <div className="app-section-copy">
        <span>{en ? area.en : area.pt}</span>
        <h1>{title}</h1>
        <p>{en ? area.descriptionEn : area.description}</p>
      </div>
      <div className="app-section-photo"><Image src={`/images/landing/${area.image}.webp`} alt="" fill sizes="(max-width: 640px) 35vw, 320px" /></div>
    </section>
  )
}

export function DailyJourneys({ onNavigate }: { onNavigate: (view: View) => void }) {
  const { locale } = useTranslation()
  const en = locale === "en-US"
  const journeys = [
    { view: "training" as View, image: "training", icon: Dumbbell, title: en ? "Time to move" : "Hora de se mover", caption: en ? "Your next workout" : "Seu próximo treino" },
    { view: "food-diary" as View, image: "nutrition", icon: Salad, title: en ? "Fuel your day" : "Nutra o seu dia", caption: en ? "Food diary" : "Diário alimentar" },
    { view: "meditation" as View, image: "recovery", icon: Wind, title: en ? "Take a breath" : "Encontre sua pausa", caption: en ? "A moment for you" : "Um momento para você" },
  ]
  return <section className="daily-journeys" aria-label={en ? "Explore your routine" : "Explore sua rotina"}>
    {journeys.map(({ view, image, icon: Icon, title, caption }) => <button key={view} className="journey-card" onClick={() => onNavigate(view)}>
      <Image src={`/images/landing/${image}.webp`} alt="" fill sizes="(max-width: 640px) 70vw, 280px" />
      <span className="journey-icon"><Icon size={18} /></span>
      <span className="journey-copy"><small>{caption}</small><strong>{title}</strong></span>
      <ArrowUpRight className="journey-arrow" size={20} />
    </button>)}
  </section>
}

export function AuthVisual({ signup = false }: { signup?: boolean }) {
  const { locale } = useTranslation()
  const en = locale === "en-US"
  return <aside className="auth-visual">
    <Image src={`/images/landing/${signup ? "training" : "hero"}.webp`} alt="" fill priority sizes="50vw" />
    <a href="/landing" className="auth-visual-brand">VyseFit <span>AI</span></a>
    <div className="auth-visual-copy">
      <p>{en ? "A little better. Every day." : "Um pouco melhor. Todos os dias."}</p>
      <h2>{en ? "Your pace.\nYour evolution." : "Seu ritmo.\nSua evolução."}</h2>
      <span>{en ? "Movement, nutrition and balance, together in your routine." : "Movimento, nutrição e equilíbrio, juntos na sua rotina."}</span>
    </div>
    <div className="auth-visual-footer"><span>{en ? "Made for real life" : "Feito para a vida real"}</span><span>VyseFit © {new Date().getFullYear()}</span></div>
  </aside>
}
