"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  labelEn?: string
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline"
  size?: "sm" | "md" | "lg" | "icon"
  loading?: boolean
  disabled?: boolean
  comingSoon?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

export function AppButton({
  label,
  labelEn,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  comingSoon = false,
  icon,
  iconPosition = "left",
  className,
  children,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading || comingSoon
  
  const baseStyles = "inline-flex items-center justify-center gap-2 font-black uppercase tracking-wider transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:pointer-events-none disabled:opacity-50"
  
  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30",
    secondary: "bg-white/10 text-foreground hover:bg-white/20 border border-white/20",
    ghost: "bg-transparent text-foreground hover:bg-white/10 border-transparent",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
    outline: "glass border-white/20 text-foreground hover:bg-white/10"
  }
  
  const sizeStyles = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
    icon: "p-3"
  }

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        comingSoon && "cursor-not-allowed opacity-60",
        className
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={props["aria-label"] || label}
      title={comingSoon ? "Em breve" : undefined}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {icon && iconPosition === "left" && !loading && icon}
      <span>{children || label}</span>
      {icon && iconPosition === "right" && !loading && icon}
      {comingSoon && (
        <span className="ml-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
          Em breve
        </span>
      )}
    </button>
  )
}

export default AppButton