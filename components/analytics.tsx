"use client"

import { useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

function AnalyticsContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()

  useEffect(() => {
    if (!window.plausible) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
    
    window.plausible("pageview", { u: url })

    if (user && profile) {
      window.plausible("identify", {
        email: user.email,
        plan: profile.plan,
      })
    }
  }, [pathname, searchParams, user, profile])

  return null
}

export function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  )
}

declare global {
  interface Window {
    plausible?: (event: string, options?: Record<string, unknown>) => void
  }
}

export function initPlausible(domain: string) {
  if (typeof window === "undefined") return

  const script = document.createElement("script")
  script.defer = true
  script.dataset.domain = domain
  script.src = "https://plausible.io/js/script.js"
  document.head.appendChild(script)
}
