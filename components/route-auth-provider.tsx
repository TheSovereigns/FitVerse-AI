"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

// Marketing pages do not need to initialize the authenticated application.
const ApplicationAuth = dynamic(
  () => import("@/hooks/useAuth").then(module => module.AuthProvider),
  { ssr: false },
)

export function RouteAuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname === "/" || pathname === "/landing") return <>{children}</>
  return <ApplicationAuth>{children}</ApplicationAuth>
}
