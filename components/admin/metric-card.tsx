"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: "default" | "highlight" | "success" | "warning" | "danger"
  isLoading?: boolean
  pulse?: boolean
}

const variantStyles = {
  default: {
    bg: "bg-[#1f1100]/50",
    border: "border-orange-500/10",
    icon: "text-orange-400",
    iconBg: "bg-orange-500/10",
  },
  highlight: {
    bg: "bg-[#1f1100]/80",
    border: "border-orange-500/30",
    icon: "text-orange-400",
    iconBg: "bg-orange-500/20",
  },
  success: {
    bg: "bg-[#1f1100]/50",
    border: "border-green-500/10",
    icon: "text-green-400",
    iconBg: "bg-green-500/10",
  },
  warning: {
    bg: "bg-[#1f1100]/50",
    border: "border-yellow-500/10",
    icon: "text-yellow-400",
    iconBg: "bg-yellow-500/10",
  },
  danger: {
    bg: "bg-[#1f1100]/50",
    border: "border-red-500/10",
    icon: "text-red-400",
    iconBg: "bg-red-500/10",
  },
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  isLoading = false,
  pulse = false,
}: MetricCardProps) {
  const styles = variantStyles[variant]

  if (isLoading) {
    return (
      <div className={cn("glass-strong border rounded-2xl p-5", styles.bg, styles.border)}>
        <div className="animate-pulse space-y-3">
          <div className="w-10 h-10 rounded-xl bg-white/5" />
          <div className="h-8 bg-white/5 rounded w-24" />
          <div className="h-4 bg-white/5 rounded w-32" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-strong border rounded-2xl p-5 transition-all duration-300 hover:border-orange-500/20",
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", styles.iconBg)}>
          <Icon className={cn("w-6 h-6", styles.icon)} />
        </div>
        {pulse && (
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping opacity-75" />
          </div>
        )}
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.isPositive ? "text-green-400" : "text-red-400"
            )}
          >
            <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-neutral-400">{title}</p>
        {subtitle && (
          <p className="text-xs text-neutral-500 mt-2">{subtitle}</p>
        )}
      </div>
    </motion.div>
  )
}