"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface QuickActionProps {
  icon: ReactNode
  label: string
  description?: string
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function QuickAction({ icon, label, description, onClick, className, disabled }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card text-center transition-all",
        "hover:bg-muted hover:border-border/80 active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center text-brand">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </button>
  )
}
