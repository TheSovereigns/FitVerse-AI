import { LandingExperience } from "./landing/experience"

export function LandingPage() {
  return <LandingExperience media={{
    hero: "/images/landing/hero.webp",
    video: "https://d8j0ntlcm91z4.cloudfront.net/user_3JBvQMoQN1C1iELSTmI9wGIpX0Q/hf_20260912_162028_27460fcc-a961-4e84-a180-065d4a0d70d9.mp4",
    nutrition: "/images/landing/nutrition.webp",
    training: "/images/landing/training.webp",
    recovery: "/images/landing/recovery.webp",
  }} />
}
