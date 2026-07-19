"use client"

import { useEffect, useRef, useCallback } from "react"

export function useAutoSave<T>(
  key: string,
  data: T,
  options?: { debounceMs?: number }
) {
  const debounceMs = options?.debounceMs ?? 1000
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const save = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (e) {
      console.error(`[useAutoSave] Failed to save ${key}:`, e)
    }
  }, [key, data])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(save, debounceMs)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [data, save, debounceMs])

  return { save }
}
