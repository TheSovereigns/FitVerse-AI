"use client"

import { useState, useEffect } from "react"

interface LocationState {
  city: string | null
  loading: boolean
  error: string | null
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    city: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const cached = localStorage.getItem("fitverse-user-location")
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        const age = Date.now() - parsed.timestamp
        if (age < 3600000) {
          setState({ city: parsed.city, loading: false, error: null })
          return
        }
      } catch {}
    }

    if (!navigator.geolocation) {
      setState({ city: null, loading: false, error: "Geolocation not supported" })
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { "Accept-Language": "pt-BR" } }
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || null

          if (city) {
            localStorage.setItem("fitverse-user-location", JSON.stringify({ city, timestamp: Date.now() }))
          }
          setState({ city, loading: false, error: null })
        } catch {
          setState({ city: null, loading: false, error: "Failed to fetch location" })
        }
      },
      () => {
        setState({ city: null, loading: false, error: "Permission denied" })
      },
      { timeout: 10000, maximumAge: 600000 }
    )
  }, [])

  return state
}
