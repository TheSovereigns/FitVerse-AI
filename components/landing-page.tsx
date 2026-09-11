import { LandingExperience } from "./landing/experience"

export function LandingPage() {
  return <LandingExperience media={{
    hero: "/images/landing/hero.webp",
    video: "/videos/vysefit-track.mp4",
    nutrition: "/images/landing/nutrition.webp",
    training: "/images/landing/training.webp",
    recovery: "/images/landing/recovery.webp",
  }} />
}
