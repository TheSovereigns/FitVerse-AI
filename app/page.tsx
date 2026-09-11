import type { Metadata } from "next"
import { LandingPage } from "@/components/landing-page"

export const metadata: Metadata = {
  title: "VyseFit AI | Tudo no seu ritmo",
  description: "Organize seus treinos, acompanhe sua alimentação e veja sua evolução com o VyseFit AI. Seu próximo passo começa aqui.",
  openGraph: {
    title: "VyseFit AI | Tudo no seu ritmo",
    description: "Treino, alimentação e recuperação. Tudo no seu ritmo.",
    images: [{ url: "/images/landing/hero.webp", width: 1920, height: 1080, alt: "VyseFit AI: seu próximo passo começa aqui" }],
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "VyseFit AI | Tudo no seu ritmo",
    description: "Treino, alimentação e recuperação. Tudo no seu ritmo.",
    images: ["/images/landing/hero.webp"],
  },
}

export default function Home() {
  return <LandingPage />
}
