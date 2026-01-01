import { Skeleton } from "@/components/ui/skeleton"

export function ProductSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 bg-black text-zinc-100 rounded-3xl border border-zinc-800/50 shadow-2xl animate-pulse">
      {/* Header Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900/30 border border-zinc-800 backdrop-blur-md p-6">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary opacity-80" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary opacity-80" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary opacity-80" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary opacity-80" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32 bg-zinc-800" />
            <Skeleton className="h-10 w-48 bg-zinc-800" />
            <Skeleton className="h-4 w-64 bg-zinc-800" />
          </div>
          <Skeleton className="w-24 h-24 rounded-full bg-zinc-800" />
        </div>
      </div>

      {/* Macros Skeleton */}
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-zinc-900/30 border border-zinc-800" />
        ))}
      </div>

      {/* Goal Alignment Skeleton */}
      <div className="space-y-3 bg-zinc-900/20 p-4 rounded-2xl border border-zinc-800/50">
        <div className="flex justify-between items-end">
          <Skeleton className="h-4 w-48 bg-zinc-800" />
          <Skeleton className="h-6 w-12 bg-zinc-800" />
        </div>
        <Skeleton className="h-3 w-full bg-zinc-900 rounded-full" />
      </div>

      {/* Grids Skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <div className="grid grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg bg-red-950/20 border border-red-900/30" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <div className="grid grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg bg-emerald-950/20 border border-emerald-900/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
