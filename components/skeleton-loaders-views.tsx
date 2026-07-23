"use client"

import { motion } from "framer-motion"

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`bg-white/5 rounded-xl ${className || ""}`}
    />
  )
}

export function HomeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-safe-nav pt-4">
      <div className="space-y-2">
        <SkeletonPulse className="h-4 w-32" />
        <SkeletonPulse className="h-8 w-48" />
      </div>
      <SkeletonPulse className="h-16 w-full rounded-2xl" />
      <SkeletonPulse className="h-36 w-full rounded-2xl" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <SkeletonPulse key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <SkeletonPulse className="h-24 w-full rounded-2xl" />
    </div>
  )
}

export function TrainingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pt-4">
      <SkeletonPulse className="h-8 w-48" />
      <SkeletonPulse className="h-4 w-64" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 p-4 rounded-2xl bg-white/5">
            <SkeletonPulse className="h-12 w-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-3/4" />
              <SkeletonPulse className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RecipesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pt-4">
      <SkeletonPulse className="h-8 w-40" />
      <SkeletonPulse className="h-12 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/5 p-4 space-y-3">
            <SkeletonPulse className="h-24 w-full rounded-xl" />
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pt-4">
      <SkeletonPulse className="h-8 w-32" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <SkeletonPulse className={`h-12 ${i % 2 === 0 ? "w-3/4" : "w-1/2"} rounded-2xl`} />
          </div>
        ))}
      </div>
      <SkeletonPulse className="h-12 w-full rounded-xl" />
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pt-4">
      <SkeletonPulse className="h-8 w-32" />
      <SkeletonPulse className="h-16 w-full rounded-2xl" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5">
            <SkeletonPulse className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-1/3" />
              <SkeletonPulse className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pt-4">
      <div className="flex items-center gap-4">
        <SkeletonPulse className="h-16 w-16 rounded-full shrink-0" />
        <div className="space-y-2">
          <SkeletonPulse className="h-5 w-40" />
          <SkeletonPulse className="h-3 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <SkeletonPulse key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <SkeletonPulse className="h-40 w-full rounded-2xl" />
    </div>
  )
}

export function PlannerSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pt-4">
      <SkeletonPulse className="h-8 w-40" />
      <SkeletonPulse className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <SkeletonPulse key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
