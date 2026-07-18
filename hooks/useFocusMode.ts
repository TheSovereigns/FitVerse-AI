"use client"

import { useState, useCallback, useEffect } from "react"

interface FocusModeState {
  isActive: boolean
  type: "workout" | "recipe" | "general"
  title: string
}

export function useFocusMode() {
  const [state, setState] = useState<FocusModeState>({
    isActive: false,
    type: "general",
    title: "",
  })

  const activate = useCallback((type: FocusModeState["type"] = "general", title = "") => {
    setState({ isActive: true, type, title })
  }, [])

  const deactivate = useCallback(() => {
    setState({ isActive: false, type: "general", title: "" })
  }, [])

  const toggle = useCallback((type?: FocusModeState["type"], title?: string) => {
    setState((prev) => {
      if (prev.isActive) return { isActive: false, type: "general", title: "" }
      return { isActive: true, type: type || "general", title: title || "" }
    })
  }, [])

  useEffect(() => {
    if (state.isActive) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [state.isActive])

  return {
    isActive: state.isActive,
    type: state.type,
    title: state.title,
    activate,
    deactivate,
    toggle,
  }
}
