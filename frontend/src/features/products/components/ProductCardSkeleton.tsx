export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      {/* Image skeleton */}
      <div className="aspect-video w-full animate-pulse bg-muted" />

      {/* Content skeleton */}
      <div className="space-y-3 p-4">
        {/* Badge skeleton */}
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />

        {/* Title skeleton */}
        <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />

        {/* Reference skeleton */}
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />

        {/* Tags skeleton */}
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>

        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
