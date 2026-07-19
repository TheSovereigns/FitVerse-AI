"use client"

import { useRef, useCallback } from "react"
import { ScanLine } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface ScanButtonProps {
  onScan: (file: File) => void
  className?: string
}

export function ScanButton({ onScan, className }: ScanButtonProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onScan(file)
        e.target.value = ""
      }
    },
    [onScan]
  )

  return (
    <>
      <button
        onClick={handleClick}
        className={className || "mobile-fab-safe fixed right-4 z-50 w-14 h-14 rounded-2xl bg-brand text-brand-foreground shadow-lg shadow-brand/25 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-brand/30 active:scale-95 md:bottom-8 md:right-8"}
        aria-label={t("home_scan_product")}
      >
        <ScanLine className="w-6 h-6" />
      </button>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
      />
    </>
  )
}
