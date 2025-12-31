"use client"

import { useEffect } from "react"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Desabilita o menu de contexto (botão direito)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    // Desabilita atalhos de teclado comuns para DevTools
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" || 
        (e.ctrlKey && e.shiftKey && e.key === "I") || 
        (e.ctrlKey && e.shiftKey && e.key === "J") || 
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault()
      }
    }

    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <div className="select-none">
      {children}
    </div>
  )
}