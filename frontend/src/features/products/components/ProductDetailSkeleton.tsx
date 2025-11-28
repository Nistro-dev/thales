export function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* Back button skeleton */}
      <div className="mb-6 h-10 w-24 animate-pulse rounded-md bg-muted" />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery skeleton */}
        <div className="space-y-4">
          <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-20 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>

        {/* Details skeleton */}
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          </div>

          {/* Price card */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-32 animate-pulse rounded bg-muted" />
          </div>

          {/* Details card */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Reserve button skeleton */}
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}
