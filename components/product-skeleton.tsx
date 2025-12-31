import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProductSkeleton() {
  return (
    <div className="min-h-screen pb-24">
      {/* Header Skeleton */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>

      <div className="px-4 space-y-4 mt-4">
        {/* Product Card Skeleton */}
        <Card className="p-4">
          <div className="flex gap-4">
            <Skeleton className="w-24 h-24 rounded-lg" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        </Card>

        {/* Alerts Skeleton */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </Card>

        {/* Insights Skeleton */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </Card>
      </div>
    </div>
  )
}
