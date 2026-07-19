"use client"

import { useState, useEffect } from "react"
import { Palette, Check, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { logger } from "@/lib/logger"

const ACCENT_COLORS = [
  { id: "orange", label: "Laranja", color: "#FF9500", css: "rgba(255,149,0,1)" },
  { id: "blue", label: "Azul", color: "#0A84FF", css: "rgba(10,132,255,1)" },
  { id: "green", label: "Verde", color: "#30D158", css: "rgba(48,209,88,1)" },
  { id: "purple", label: "Roxo", color: "#BF5AF2", css: "rgba(191,90,242,1)" },
  { id: "pink", label: "Rosa", color: "#FF375F", css: "rgba(255,55,95,1)" },
  { id: "red", label: "Vermelho", color: "#FF453A", css: "rgba(255,69,58,1)" },
]

const FONT_SIZES = [
  { id: "small", label: "P", scale: 0.85 },
  { id: "medium", label: "M", scale: 1 },
  { id: "large", label: "G", scale: 1.15 },
]

export function ThemeCustomizer() {
  const { locale } = useTranslation()
  const isEnglish = locale === "en-US"
  const { theme, setTheme } = useTheme()
  const [accent, setAccent] = useState("orange")
  const [fontSize, setFontSize] = useState("medium")

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fitverse-accent")
      if (saved) setAccent(saved)
      const savedFont = localStorage.getItem("fitverse-font-size")
      if (savedFont) setFontSize(savedFont)
    } catch (e) {
      logger.error("[ThemeCustomizer] Failed to parse theme settings:", e)
    }
  }, [])

  const changeAccent = (id: string) => {
    setAccent(id)
    localStorage.setItem("fitverse-accent", id)
    const color = ACCENT_COLORS.find((c) => c.id === id)
    if (color) {
      document.documentElement.style.setProperty("--accent-color", color.css)
    }
  }

  const changeFontSize = (id: string) => {
    setFontSize(id)
    localStorage.setItem("fitverse-font-size", id)
    const scale = FONT_SIZES.find((f) => f.id === id)?.scale || 1
    document.documentElement.style.fontSize = `${scale * 16}px`
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
          <Palette className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {isEnglish ? "Appearance" : "Aparencia"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isEnglish ? "Customize your look" : "Personalize sua aparencia"}
          </p>
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs text-muted-foreground mb-3">
          {isEnglish ? "Theme" : "Tema"}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "dark", icon: Moon, label: isEnglish ? "Dark" : "Escuro" },
            { id: "light", icon: Sun, label: isEnglish ? "Light" : "Claro" },
            { id: "system", icon: Monitor, label: isEnglish ? "System" : "Sistema" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl p-3 transition-all border",
                theme === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs text-muted-foreground mb-3">
          {isEnglish ? "Accent Color" : "Cor de Destaque"}
        </p>
        <div className="flex gap-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => changeAccent(color.id)}
              className={cn(
                "relative h-10 w-10 rounded-xl transition-all border-2",
                accent === color.id
                  ? "border-foreground scale-110"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color.color }}
            >
              {accent === color.id && (
                <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-3">
          {isEnglish ? "Font Size" : "Tamanho da Fonte"}
        </p>
        <div className="flex gap-2">
          {FONT_SIZES.map((size) => (
            <button
              key={size.id}
              onClick={() => changeFontSize(size.id)}
              className={cn(
                "flex-1 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all border",
                fontSize === size.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}