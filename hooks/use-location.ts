"use client"

import { useState, useEffect } from "react"

interface LocationState {
  city: string | null
  loading: boolean
  error: string | null
}

// Singleton cache: stale-while-revalidate 1h
const CACHE_KEY = "fitverse-user-location"
const CACHE_TTL = 3600000 // 1h

let memoryCache: { city: string | null; timestamp: number } | null = null
let pendingPromise: Promise<string | null> | null = null
let abortController: AbortController | null = null

function readCache(): { city: string | null; timestamp: number } | null {
  if (memoryCache) return memoryCache
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      memoryCache = parsed
      return parsed
    }
  } catch {}
  return null
}

function writeCache(city: string | null) {
  const entry = { city, timestamp: Date.now() }
  memoryCache = entry
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {}
}

async function fetchCityFromCoords(latitude: number, longitude: number, signal: AbortSignal): Promise<string | null> {
  // Try proxy first (adds proper User-Agent server-side, avoids Nominatim 403)
  try {
    const proxyRes = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`, { signal })
    if (proxyRes.ok) {
      const data = await proxyRes.json()
      const city = data.city || data.address?.city || data.address?.town || data.address?.village || data.address?.county || null
      if (city) return city
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e
    // fall through to direct Nominatim
  }

  // Direct Nominatim fallback (browser cannot set User-Agent, may be rate-limited)
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
    { headers: { "Accept-Language": "pt-BR" }, signal } as RequestInit
  )
  const data = await res.json()
  return data.address?.city || data.address?.town || data.address?.village || data.address?.county || null
}

function getCurrentPositionAsync(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

async function resolveLocation(signal: AbortSignal): Promise<string | null> {
  // Check permissions before prompting
  try {
    if (navigator.permissions?.query) {
      const status = await (navigator.permissions.query as any)({ name: 'geolocation' })
      if (status.state === 'denied') {
        throw new Error('Permission denied')
      }
    }
  } catch (e: any) {
    if (e?.message === 'Permission denied') throw e
    // ignore permission query errors (e.g. unsupported)
  }

  const position = await getCurrentPositionAsync({ timeout: 10000, maximumAge: 600000 })
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  const { latitude, longitude } = position.coords
  const city = await fetchCityFromCoords(latitude, longitude, signal)
  if (city) writeCache(city)
  return city
}

function getLocationSingleton(): Promise<string | null> {
  if (pendingPromise) return pendingPromise

  // Abort previous pending fetch if any
  if (abortController) abortController.abort()
  abortController = new AbortController()
  const signal = abortController.signal

  pendingPromise = resolveLocation(signal)
    .finally(() => {
      pendingPromise = null
    })
  return pendingPromise
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    city: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const cached = readCache()
    if (cached) {
      const age = Date.now() - cached.timestamp
      if (age < CACHE_TTL) {
        // Fresh cache — serve immediately, no revalidation
        setState({ city: cached.city, loading: false, error: null })
        return
      }
      // Stale-while-revalidate: serve stale immediately, revalidate in background
      setState({ city: cached.city, loading: false, error: null })
      getLocationSingleton()
        .then((city) => {
          if (city) setState({ city, loading: false, error: null })
        })
        .catch(() => {
          // Keep stale on error
        })
      return
    }

    if (!navigator.geolocation) {
      setState({ city: null, loading: false, error: "Geolocation not supported" })
      return
    }

    let cancelled = false
    setState((s) => ({ ...s, loading: true }))

    getLocationSingleton()
      .then((city) => {
        if (!cancelled) setState({ city, loading: false, error: null })
      })
      .catch((err: any) => {
        if (cancelled) return
        if (err?.name === 'AbortError') return
        const msg = err?.message === 'Permission denied' ? 'Permission denied' : 'Failed to fetch location'
        setState({ city: null, loading: false, error: msg })
      })

    return () => {
      cancelled = true
      // Do not abort singleton fetch here — other mounts may be awaiting it
    }
  }, [])

  return state
}
