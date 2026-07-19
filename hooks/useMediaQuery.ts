"use client"

import { useState, useEffect } from "react"

type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl"

const breakpointValues: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [query, matches])

  return matches
}

export function useBreakpoint(bp: Breakpoint) {
  return useMediaQuery(`(min-width: ${breakpointValues[bp]}px)`)
}

export function useIsMobile() {
  return !useBreakpoint("md")
}

export function useIsTablet() {
  const isMd = useBreakpoint("md")
  const isLg = useBreakpoint("lg")
  return isMd && !isLg
}

export function useIsDesktop() {
  return useBreakpoint("lg")
}
