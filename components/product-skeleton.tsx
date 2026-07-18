import { Skeleton } from "@/components/ui/skeleton"

export function ProductSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 rounded-[2rem] border border-white/10 bg-black/50 p-4 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:p-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 p-6">
        <div className="absolute inset-0 z-20 overflow-hidden rounded-[inherit]">
          <div className="absolute left-0 right-0 h-[3px] animate-scan bg-foreground shadow-[0_0_25px_rgba(255,255,255,0.3)]" style={{ animationDuration: "3s" }} />
        </div>
        <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-white/40" />
        <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-white/40" />
        <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-white/40" />
        <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-white/40" />

        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-32 bg-white/10" />
            <Skeleton className="h-10 w-56 bg-white/10" />
            <Skeleton className="h-4 w-full max-w-md bg-white/10" />
          </div>
          <Skeleton className="h-28 w-28 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-24 rounded-2xl border border-white/10 bg-white/10" />
        ))}
      </div>

      <div className="space-y-3 rounded-[1.75rem] border border-white/10 bg-white/10 p-4">
        <div className="flex items-end justify-between">
          <Skeleton className="h-4 w-48 bg-white/10" />
          <Skeleton className="h-6 w-12 bg-white/10" />
        </div>
        <Skeleton className="h-3 w-full rounded-full bg-white/10" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((section) => (
          <div key={section} className="space-y-3">
            <Skeleton className="h-4 w-24 bg-white/10" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-20 rounded-2xl border border-white/10 bg-white/10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
