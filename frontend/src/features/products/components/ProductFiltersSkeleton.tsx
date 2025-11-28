export function ProductFiltersSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      {/* Header skeleton */}
      <div className="h-6 w-20 animate-pulse rounded bg-muted" />

      {/* Filter items skeleton */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  )
}
