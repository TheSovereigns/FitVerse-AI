"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/i18n"

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ onSearch, placeholder, className }: SearchBarProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setQuery(value)
      onSearch(value)
    },
    [onSearch]
  )

  const handleClear = useCallback(() => {
    setQuery("")
    onSearch("")
  }, [onSearch])

  return (
    <div className={`relative ${className || ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={query}
        onChange={handleChange}
        placeholder={placeholder || t("search_placeholder") || "Buscar..."}
        className="h-12 rounded-xl border-border bg-background pl-10 pr-10 text-foreground"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-accent"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
