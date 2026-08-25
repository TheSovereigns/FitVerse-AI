import dynamic from "next/dynamic"

const LandingPage = dynamic(() => import("@/components/landing-page").then(m => ({ default: m.LandingPage })), { ssr: false })

export default function LandingRoute() {
  return <LandingPage />
}
