"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

type CTAVariant = "primary" | "secondary" | "floating"
type CTASize = "sm" | "md" | "lg"

interface CTAButtonProps {
  label: string
  href?: string
  variant?: CTAVariant
  size?: CTASize
  className?: string
  dataCta?: string
  onClick?: () => void
  showArrow?: boolean
}

export function CTAButton({
  label,
  href = "/auth/login",
  variant = "primary",
  size = "md",
  className,
  dataCta,
  onClick,
  showArrow = true,
}: CTAButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push(href)
    }
  }

  const baseStyles = "relative inline-flex items-center justify-center font-black uppercase tracking-wider rounded-full transition-all duration-200 ease-out"

  const variantStyles = {
    primary: "bg-primary text-white hover:shadow-[0_15px_40px_rgba(255,140,0,0.35)] hover:scale-[1.03] active:scale-[0.98]",
    secondary: "bg-transparent border-2 border-white/20 text-foreground hover:bg-white/10 hover:border-white/40",
    floating: "bg-primary text-white shadow-[0_10px_30px_rgba(255,140,0,0.4)] hover:shadow-[0_15px_40px_rgba(255,140,0,0.5)] hover:scale-[1.03] active:scale-[0.98]",
  }

  const sizeStyles = {
    sm: "h-10 px-4 text-xs",
    md: "h-12 px-6 text-sm",
    lg: "h-14 px-8 text-base",
  }

  return (
    <motion.button
      data-cta={dataCta}
      onClick={handleClick}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <span>{label}</span>
      {variant === "primary" && showArrow && (
        <ArrowRight className="w-4 h-4 ml-2" />
      )}
      {variant === "floating" && showArrow && (
        <span className="ml-1">↑</span>
      )}
    </motion.button>
  )
}